import { useState, type ChangeEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCatalog } from '@/context/CatalogContext';
import { api } from '@/lib/api';
import { classNames, formatPrice, getDiscountInfo, productImage, toWebp } from '@/lib/format';
import { compressImageToWebp, compressImageToDataUrl } from '@/lib/imageCompressor';
import { storage, uploadImageToStorage } from '@/lib/firebase';
import type { Colorway, Product, ProductTier } from '@/types';

const COLLECTIONS = ['Statement', 'Remix'];
const blankColorway = (): Colorway => ({ name: 'black', label: 'Raisin Black', swatch: '#242124', image: '' });

function emptyDraft(): Partial<Product> {
  return {
    name: '',
    tagline: '',
    price: 250,
    originalPrice: undefined,
    tier: 'core',
    collection: 'Statement',
    verse: { text: '', reference: '' },
    description: '',
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    colorways: [blankColorway()],
    defaultColor: 'black',
    isNew: false,
    isBestSeller: false,
    isHidden: false,
  };
}

export default function AdminProducts() {
  const { authHeader } = useAuth();
  const { allProducts: products, refresh } = useCatalog();
  const [draft, setDraft] = useState<Partial<Product> | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft());
    setError(null);
  };
  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setDraft(JSON.parse(JSON.stringify(p)));
    setError(null);
  };
  const cancel = () => {
    setDraft(null);
    setEditingId(null);
  };

  const set = <K extends keyof Product>(key: K, value: Product[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  const setColorway = (i: number, patch: Partial<Colorway>) =>
    setDraft((d) => {
      if (!d?.colorways) return d;
      const next = d.colorways.map((c, idx) => (idx === i ? { ...c, ...patch } : c));
      return { ...d, colorways: next };
    });

  const addColorway = () =>
    setDraft((d) => (d ? { ...d, colorways: [...(d.colorways ?? []), blankColorway()] } : d));
  const removeColorway = (i: number) =>
    setDraft((d) => (d ? { ...d, colorways: (d.colorways ?? []).filter((_, idx) => idx !== i) } : d));

  const onImageFile = async (i: number, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIndex(i);
    setError(null);
    try {
      try {
        // If Firebase Storage is provisioned, upload to Cloud Storage
        const blob = await compressImageToWebp(file, { maxWidth: 1200, quality: 0.85 });
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_');
        const path = `products/${Date.now()}_${cleanName}.webp`;
        const url = await uploadImageToStorage(blob, path);
        setColorway(i, { image: url });
      } catch (storageErr) {
        // Fallback: compress to ultra-light WebP base64 DataURL (<40KB) and save directly in Firestore
        console.log('[images] Storage upload bypassed, encoding WebP directly to Firestore:', storageErr);
        const dataUrl = await compressImageToDataUrl(file, { maxWidth: 1000, quality: 0.8 });
        setColorway(i, { image: dataUrl });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploadingIndex(null);
    }
  };

  const applyDiscountPercent = (percent: number) => {
    setDraft((d) => {
      if (!d) return d;
      if (percent <= 0) {
        // Clear discount
        return {
          ...d,
          price: d.originalPrice && d.originalPrice > 0 ? d.originalPrice : d.price,
          originalPrice: undefined,
        };
      }
      const base = (d.originalPrice && d.originalPrice > 0) ? d.originalPrice : (d.price ?? 250);
      const discounted = Math.round(base * (1 - percent / 100));
      return {
        ...d,
        originalPrice: base,
        price: discounted,
      };
    });
  };

  const save = async () => {
    if (!draft) return;
    setError(null);
    if (!draft.name?.trim()) return setError('Name is required.');
    setBusy(true);
    try {
      const header = await authHeader();
      if (!header) throw new Error('Not authorised.');
      const payload: Partial<Product> = {
        ...draft,
        defaultColor: draft.colorways?.[0]?.name ?? 'black',
        originalPrice: (draft.originalPrice && draft.originalPrice > (draft.price ?? 0)) ? draft.originalPrice : undefined,
      };
      if (editingId) await api.updateProduct(editingId, payload, header);
      else await api.createProduct(payload, header);
      await refresh();
      cancel();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  const toggleHide = async (p: Product) => {
    try {
      const header = await authHeader();
      if (!header) return;
      await api.updateProduct(p.id, { isHidden: !p.isHidden }, header);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update visibility.');
    }
  };

  const remove = async (p: Product) => {
    if (!confirm(`Delete “${p.name}”? This removes it from the buyer side.`)) return;
    try {
      const header = await authHeader();
      if (!header) return;
      await api.deleteProduct(p.id, header);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete.');
    }
  };

  const draftDiscount = draft ? getDiscountInfo(draft) : null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="heading-serif text-2xl text-bone">Products ({products.length})</h2>
        {!draft && <button onClick={startCreate} className="btn-primary">+ New product</button>}
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</p>}

      {/* Editor */}
      {draft && (
        <div className="card-surface mb-8 p-6">
          <h3 className="heading-serif mb-5 text-xl text-bone">
            {editingId ? `Editing: ${draft.name}` : 'New product'}
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input className="field" value={draft.name ?? ''} onChange={(e) => set('name', e.target.value)} />
            </Field>

            <Field label="Collection">
              <select className="field" value={draft.collection} onChange={(e) => set('collection', e.target.value)}>
                {COLLECTIONS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>

            <Field label="Selling / Discounted Price (GH₵)">
              <input type="number" className="field" value={draft.price ?? 0} onChange={(e) => set('price', Number(e.target.value))} />
            </Field>

            <Field label="Original / Regular Price (GH₵) — Optional for discount">
              <input
                type="number"
                className="field"
                placeholder="Leave blank if no discount"
                value={draft.originalPrice ?? ''}
                onChange={(e) => set('originalPrice', e.target.value ? Number(e.target.value) : undefined)}
              />
            </Field>
          </div>

          {/* Discount Presets & Status */}
          <div className="mt-4 rounded-xl border border-bone/15 bg-ink-700/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-bone/60">Discount Calculator</p>
                {draftDiscount?.hasDiscount ? (
                  <p className="mt-1 text-sm text-gold">
                    <span className="font-semibold">-{draftDiscount.percent}% OFF</span> · Buyer pays {formatPrice(draftDiscount.currentPrice)} (Save {formatPrice(draftDiscount.savings)})
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-bone/50">No discount applied. Item sells at full price ({formatPrice(draft.price ?? 0)}).</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-bone/60 mr-1">Quick presets:</span>
                {[10, 15, 20, 25, 30].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => applyDiscountPercent(pct)}
                    className="rounded-md border border-bone/20 bg-ink-800 px-2.5 py-1 text-xs font-medium text-bone hover:border-gold hover:text-gold"
                  >
                    -{pct}%
                  </button>
                ))}
                {draftDiscount?.hasDiscount && (
                  <button
                    type="button"
                    onClick={() => applyDiscountPercent(0)}
                    className="rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-500/20"
                  >
                    Clear discount
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Tier">
              <select className="field" value={draft.tier} onChange={(e) => set('tier', e.target.value as ProductTier)}>
                <option value="core">Core</option>
                <option value="limited">Limited</option>
              </select>
            </Field>
            <Field label="Tagline">
              <input className="field" value={draft.tagline ?? ''} onChange={(e) => set('tagline', e.target.value)} />
            </Field>
            <Field label="Available Sizes">
              <div className="flex flex-wrap items-center gap-1.5 mb-2 pt-1">
                {['S', 'M', 'L', 'XL', '2XL'].map((sz) => {
                  const activeSizes = draft.sizes ?? [];
                  const isSelected = activeSizes.includes(sz);
                  const toggleSize = () => {
                    const next = isSelected
                      ? activeSizes.filter((s) => s !== sz)
                      : [...activeSizes, sz];
                    set('sizes', next);
                  };
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={toggleSize}
                      className={classNames(
                        'h-8 min-w-[2.2rem] rounded-lg border text-xs font-semibold transition',
                        isSelected
                          ? 'border-gold bg-gold text-ink font-bold'
                          : 'border-bone/20 bg-ink-800 text-bone/60 hover:border-bone/40 hover:text-bone'
                      )}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
              <input
                className="field text-xs"
                placeholder="Or custom sizes (e.g. S, M, L, XL)"
                value={(draft.sizes ?? []).join(', ')}
                onChange={(e) => set('sizes', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
              />
            </Field>
            <Field label="Verse reference">
              <input
                className="field"
                value={draft.verse?.reference ?? ''}
                onChange={(e) => set('verse', { text: draft.verse?.text ?? '', reference: e.target.value })}
              />
            </Field>
            <Field label="Flags">
              <div className="flex items-center gap-4 pt-2 text-sm text-bone/70">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={!!draft.isNew} onChange={(e) => set('isNew', e.target.checked)} /> New
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={!!draft.isBestSeller} onChange={(e) => set('isBestSeller', e.target.checked)} /> Best seller
                </label>
                <label className="flex items-center gap-2 text-bone/50">
                  <input type="checkbox" checked={!!draft.isHidden} onChange={(e) => set('isHidden', e.target.checked)} />
                  <span className={draft.isHidden ? 'text-red-400 font-semibold' : ''}>Hidden from shop</span>
                </label>
              </div>
            </Field>
          </div>

          <Field label="Verse text" className="mt-4">
            <textarea
              className="field resize-none"
              rows={2}
              value={draft.verse?.text ?? ''}
              onChange={(e) => set('verse', { text: e.target.value, reference: draft.verse?.reference ?? '' })}
            />
          </Field>
          <Field label="Description" className="mt-4">
            <textarea className="field resize-none" rows={3} value={draft.description ?? ''} onChange={(e) => set('description', e.target.value)} />
          </Field>

          {/* Colourways */}
          <div className="mt-6">
            <p className="mb-2 text-sm font-medium text-bone">Colourways & photos</p>
            <div className="space-y-3">
              {(draft.colorways ?? []).map((c, i) => (
                <div key={i} className="flex flex-wrap items-center gap-3 rounded-lg border border-bone/10 p-3">
                  {c.image ? (
                    <img
                      src={toWebp(c.image)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-16 w-14 rounded object-cover"
                    />
                  ) : (
                    <div className="grid h-16 w-14 place-items-center rounded bg-ink-700 text-[10px] text-bone/40">no img</div>
                  )}
                  <input className="field w-28" placeholder="key (black)" value={c.name} onChange={(e) => setColorway(i, { name: e.target.value })} />
                  <input className="field w-36" placeholder="Label" value={c.label} onChange={(e) => setColorway(i, { label: e.target.value })} />
                  <input type="color" className="h-10 w-12 rounded border border-bone/15 bg-ink-700" value={c.swatch} onChange={(e) => setColorway(i, { swatch: e.target.value })} />
                  <label className="btn-outline cursor-pointer !py-2 !text-xs flex items-center gap-1.5">
                    {uploadingIndex === i ? (
                      <span className="flex items-center gap-1 text-gold">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-gold border-t-transparent" />
                        Optimizing…
                      </span>
                    ) : (
                      'Upload photo'
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingIndex === i}
                      className="hidden"
                      onChange={(e) => onImageFile(i, e)}
                    />
                  </label>
                  <input className="field min-w-[10rem] flex-1" placeholder="or image URL / path" value={c.image} onChange={(e) => setColorway(i, { image: e.target.value })} />
                  <button onClick={() => removeColorway(i)} className="text-sm text-bone/45 hover:text-red-400">Remove</button>
                </div>
              ))}
            </div>
            <button onClick={addColorway} className="mt-3 text-sm text-gold hover:underline">+ Add colourway</button>
          </div>

          <div className="mt-6 flex gap-3">
            <button onClick={save} disabled={busy} className="btn-primary">
              {busy ? 'Saving…' : editingId ? 'Save changes' : 'Create product'}
            </button>
            <button onClick={cancel} className="btn-outline">Cancel</button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {products.map((p) => {
          const discount = getDiscountInfo(p);
          return (
            <div key={p.id} className={classNames('card-surface flex items-center gap-4 p-3', editingId === p.id && 'ring-1 ring-gold', p.isHidden && 'opacity-50')}>
              <img
                src={productImage(p, p.defaultColor)}
                alt={p.name}
                loading="lazy"
                decoding="async"
                className="h-16 w-14 rounded object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-bone">{p.name}</p>
                  {discount.hasDiscount && (
                    <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-gold border border-gold/30">
                      -{discount.percent}% SALE
                    </span>
                  )}
                </div>
                <p className="text-xs text-bone/45">
                  {p.collection} · {p.tier} · {p.colorways.length} colour(s)
                  {p.isHidden && <span className="ml-2 rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-red-400">HIDDEN</span>}
                </p>
              </div>

              <div className="text-right">
                <p className="font-medium text-gold">{formatPrice(p.price)}</p>
                {discount.hasDiscount && (
                  <p className="text-xs text-bone/40 line-through">{formatPrice(discount.originalPrice)}</p>
                )}
              </div>

              <div className="flex gap-2">
                <button onClick={() => startEdit(p)} className="rounded-lg border border-bone/15 px-3 py-1.5 text-sm text-bone/75 hover:border-gold hover:text-gold">Edit</button>
                <button
                  onClick={() => toggleHide(p)}
                  title={p.isHidden ? 'Show in shop' : 'Hide from shop'}
                  className={classNames(
                    'rounded-lg border px-3 py-1.5 text-sm transition',
                    p.isHidden
                      ? 'border-green-500/40 text-green-400 hover:bg-green-500/10'
                      : 'border-bone/15 text-bone/75 hover:border-yellow-400/60 hover:text-yellow-400'
                  )}
                >
                  {p.isHidden ? 'Show' : 'Hide'}
                </button>
                <button onClick={() => remove(p)} className="rounded-lg border border-bone/15 px-3 py-1.5 text-sm text-bone/75 hover:border-red-400 hover:text-red-400">Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={classNames('block', className)}>
      <span className="mb-1.5 block text-sm font-medium text-bone/80">{label}</span>
      {children}
    </label>
  );
}
