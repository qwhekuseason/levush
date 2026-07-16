import { useState, type ChangeEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCatalog } from '@/context/CatalogContext';
import { api } from '@/lib/api';
import { classNames, formatPrice, productImage } from '@/lib/format';
import type { Colorway, Product, ProductTier } from '@/types';

const COLLECTIONS = ['Statement', 'Remix'];
const blankColorway = (): Colorway => ({ name: 'black', label: 'Raisin Black', swatch: '#242124', image: '' });

function emptyDraft(): Partial<Product> {
  return {
    name: '',
    tagline: '',
    price: 250,
    tier: 'core',
    collection: 'Statement',
    verse: { text: '', reference: '' },
    description: '',
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    colorways: [blankColorway()],
    defaultColor: 'black',
    isNew: false,
    isBestSeller: false,
  };
}

export default function AdminProducts() {
  const { authHeader } = useAuth();
  const { products, refresh } = useCatalog();
  const [draft, setDraft] = useState<Partial<Product> | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
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

  const onImageFile = (i: number, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setColorway(i, { image: String(reader.result) });
    reader.readAsDataURL(file);
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
            <Field label="Price (GH₵)">
              <input type="number" className="field" value={draft.price ?? 0} onChange={(e) => set('price', Number(e.target.value))} />
            </Field>
            <Field label="Collection">
              <select className="field" value={draft.collection} onChange={(e) => set('collection', e.target.value)}>
                {COLLECTIONS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Tier">
              <select className="field" value={draft.tier} onChange={(e) => set('tier', e.target.value as ProductTier)}>
                <option value="core">Core</option>
                <option value="limited">Limited</option>
              </select>
            </Field>
            <Field label="Tagline">
              <input className="field" value={draft.tagline ?? ''} onChange={(e) => set('tagline', e.target.value)} />
            </Field>
            <Field label="Sizes (comma-separated)">
              <input
                className="field"
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
                    <img src={c.image} alt="" className="h-16 w-14 rounded object-cover" />
                  ) : (
                    <div className="grid h-16 w-14 place-items-center rounded bg-ink-700 text-[10px] text-bone/40">no img</div>
                  )}
                  <input className="field w-28" placeholder="key (black)" value={c.name} onChange={(e) => setColorway(i, { name: e.target.value })} />
                  <input className="field w-36" placeholder="Label" value={c.label} onChange={(e) => setColorway(i, { label: e.target.value })} />
                  <input type="color" className="h-10 w-12 rounded border border-bone/15 bg-ink-700" value={c.swatch} onChange={(e) => setColorway(i, { swatch: e.target.value })} />
                  <label className="btn-outline cursor-pointer !py-2 !text-xs">
                    Upload photo
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => onImageFile(i, e)} />
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
        {products.map((p) => (
          <div key={p.id} className={classNames('card-surface flex items-center gap-4 p-3', editingId === p.id && 'ring-1 ring-gold')}>
            <img src={productImage(p, p.defaultColor)} alt={p.name} className="h-16 w-14 rounded object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-bone">{p.name}</p>
              <p className="text-xs text-bone/45">{p.collection} · {p.tier} · {p.colorways.length} colour(s)</p>
            </div>
            <p className="font-medium text-gold">{formatPrice(p.price)}</p>
            <div className="flex gap-2">
              <button onClick={() => startEdit(p)} className="rounded-lg border border-bone/15 px-3 py-1.5 text-sm text-bone/75 hover:border-gold hover:text-gold">Edit</button>
              <button onClick={() => remove(p)} className="rounded-lg border border-bone/15 px-3 py-1.5 text-sm text-bone/75 hover:border-red-400 hover:text-red-400">Delete</button>
            </div>
          </div>
        ))}
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
