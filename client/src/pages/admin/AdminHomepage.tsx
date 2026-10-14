import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCatalog } from '@/context/CatalogContext';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { api } from '@/lib/api';
import { classNames, productImage } from '@/lib/format';
import type { HomeSectionKey, HomepageSettings } from '@/types';

const SECTION_INFO: Record<HomeSectionKey, { name: string; desc: string }> = {
  marquee: { name: 'Verse strip', desc: 'Scripture quotes under the hero' },
  light: { name: 'Light of the World', desc: 'Dark scene where a moving light reveals a photo and verse' },
  featured: { name: 'New & Noted', desc: 'Your picked products' },
  lookbook: { name: 'Studio Lookbook', desc: 'Model photo grid' },
  collections: { name: 'Collections', desc: 'Statement and Remix cards' },
  promise: { name: 'Promise band', desc: 'Premium cotton · Made with intention · Wear the Word' },
  testimonials: { name: 'Testimonials', desc: 'Customer quotes' },
  cta: { name: 'Closing banner', desc: '“Wear the Word with us” call to action' },
};

export default function AdminHomepage() {
  const { authHeader } = useAuth();
  const { products } = useCatalog();
  const { settings, refresh, setSettings } = useStoreSettings();
  const [form, setForm] = useState<HomepageSettings>(settings.homepage);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void refresh(true);
  }, [refresh]);
  useEffect(() => setForm(settings.homepage), [settings.homepage]);

  const dirty = JSON.stringify(form) !== JSON.stringify(settings.homepage);
  const edit = (patch: Partial<HomepageSettings>) => {
    setSaved(false);
    setForm((f) => ({ ...f, ...patch }));
  };
  const setHero = (k: keyof HomepageSettings['hero'], v: string) => edit({ hero: { ...form.hero, [k]: v } });
  const setIntro = (patch: Partial<HomepageSettings['intro']>) => edit({ intro: { ...form.intro, ...patch } });
  const setLight = (patch: Partial<HomepageSettings['light']>) => edit({ light: { ...form.light, ...patch } });

  // Photos the light can reveal: the studio shot plus the chosen product's images.
  const lightProduct = products.find((p) => p.id === form.light.productId);
  const lightImages: Array<{ ref: string; src: string; label: string }> = [
    { ref: 'studio', src: '/assets/models/IMG_2763-640.webp', label: 'Studio shot' },
    ...(lightProduct?.modelImage ? [{ ref: 'model', src: lightProduct.modelImage, label: 'On model' }] : []),
    ...(lightProduct?.colorways ?? []).map((c) => ({ ref: `color:${c.name}`, src: c.image, label: c.label })),
    ...(lightProduct?.gallery ?? []).map((g, i) => ({ ref: `gallery:${i}`, src: g, label: `Look ${i + 1}` })),
  ];

  const moveSection = (i: number, dir: -1 | 1) => {
    const next = [...form.sections];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    edit({ sections: next });
  };
  const toggleSection = (i: number) =>
    edit({ sections: form.sections.map((s, j) => (j === i ? { ...s, visible: !s.visible } : s)) });

  const picked = form.featuredIds.map((id) => products.find((p) => p.id === id)).filter((p) => p !== undefined);
  const movePick = (i: number, dir: -1 | 1) => {
    const next = [...form.featuredIds];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    edit({ featuredIds: next });
  };
  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products
      .filter((p) => !form.featuredIds.includes(p.id))
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.verse.reference.toLowerCase().includes(q))
      .slice(0, 12);
  }, [products, form.featuredIds, search]);

  const save = async () => {
    setError(null);
    setBusy(true);
    try {
      const h = await authHeader();
      if (!h) throw new Error('Your session expired — sign in again.');
      setSettings(await api.updateSettings({ homepage: form }, h));
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the homepage.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="heading-serif text-2xl text-bone">Homepage</h2>
        <div className="flex items-center gap-3">
          <a href="/" target="_blank" rel="noopener noreferrer" className="text-xs text-bone/55 hover:text-gold">View homepage ↗</a>
          <button onClick={save} disabled={busy || !dirty} className="btn-primary">
            {busy ? 'Saving…' : saved && !dirty ? 'Saved ✓' : 'Save changes'}
          </button>
        </div>
      </div>
      {error && <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400" role="alert">{error}</p>}

      {/* Hero */}
      <section className="card-surface p-6">
        <h3 className="heading-serif mb-1 text-lg text-bone">Hero text</h3>
        <p className="mb-5 text-xs text-bone/45">The headline beside the video at the top of the homepage.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {([
            ['eyebrow', 'Small line above', 'Faith, worn.', 40],
            ['title', 'Headline (line 1)', 'Wear What', 40],
            ['accent', 'Line 2 (last word highlighted)', 'You Believe', 30],
          ] as const).map(([k, label, ph, max]) => (
            <div key={k}>
              <label htmlFor={`hp-${k}`} className="mb-1.5 block text-xs font-medium text-bone/70">{label}</label>
              <input id={`hp-${k}`} className="field" placeholder={ph} maxLength={max} value={form.hero[k]} onChange={(e) => setHero(k, e.target.value)} />
            </div>
          ))}
          <div className="sm:col-span-2">
            <label htmlFor="hp-subtitle" className="mb-1.5 block text-xs font-medium text-bone/70">Sub-text</label>
            <textarea id="hp-subtitle" rows={2} maxLength={200} className="field resize-none" value={form.hero.subtitle} onChange={(e) => setHero('subtitle', e.target.value)} />
          </div>
        </div>
        <div className="mt-5 rounded-xl bg-ink-800 p-5">
          <p className="mb-2 text-[11px] uppercase tracking-widest text-bone/35">Preview</p>
          {form.hero.eyebrow && <p className="eyebrow mb-2">{form.hero.eyebrow}</p>}
          <p className="font-display text-3xl font-black uppercase leading-none text-bone">{form.hero.title}</p>
          <p className="mt-1 text-xl font-light uppercase tracking-[0.12em] text-bone/80">
            {form.hero.accent.trim().split(/\s+/).slice(0, -1).join(' ')}{' '}
            <span className="font-display font-bold italic tracking-normal text-gold">{form.hero.accent.trim().split(/\s+/).pop()}</span>
          </p>
        </div>
      </section>

      {/* Opening title */}
      <section className="card-surface p-6">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
          <h3 className="heading-serif text-lg text-bone">Opening title</h3>
          <label className="flex items-center gap-2 text-sm text-bone/80">
            <input type="checkbox" checked={form.intro.enabled} onChange={(e) => setIntro({ enabled: e.target.checked })} className="h-4 w-4 accent-gold" />
            Show on homepage
          </label>
        </div>
        <p className="mb-5 text-xs text-bone/45">
          A 4-second film: quick cuts through your model photos, then a giant word filled with a photo that rushes toward the camera into the homepage. Shown once a week per visitor, with a Skip button.
        </p>
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <div>
            <label htmlFor="hp-intro-text" className="mb-1.5 block text-xs font-medium text-bone/70">Big word (short works best)</label>
            <input id="hp-intro-text" className="field uppercase" maxLength={12} placeholder="LEVUSH" value={form.intro.text} onChange={(e) => setIntro({ text: e.target.value })} />
          </div>
          <div>
            <label htmlFor="hp-intro-ref" className="mb-1.5 block text-xs font-medium text-bone/70">Line underneath</label>
            <input id="hp-intro-ref" className="field" maxLength={40} value={form.intro.reference} onChange={(e) => setIntro({ reference: e.target.value })} />
          </div>
        </div>
        <a href="/?intro=1" target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-xs text-gold hover:underline">
          Preview the opening (save first) ↗
        </a>
      </section>

      {/* Light of the World */}
      <section className="card-surface p-6">
        <h3 className="heading-serif mb-1 text-lg text-bone">Light of the World</h3>
        <p className="mb-5 text-xs text-bone/45">
          A dark section where the visitor’s cursor or finger is a light revealing the photo and verse. Move it in the list below; untick it to hide.
        </p>
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <div>
            <label htmlFor="hp-light-verse" className="mb-1.5 block text-xs font-medium text-bone/70">Verse (shown large)</label>
            <input id="hp-light-verse" className="field" maxLength={120} value={form.light.verse} onChange={(e) => setLight({ verse: e.target.value })} />
          </div>
          <div>
            <label htmlFor="hp-light-ref" className="mb-1.5 block text-xs font-medium text-bone/70">Reference</label>
            <input id="hp-light-ref" className="field" maxLength={40} value={form.light.reference} onChange={(e) => setLight({ reference: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="hp-light-product" className="mb-1.5 block text-xs font-medium text-bone/70">Product the “Shop” button links to</label>
            <select id="hp-light-product" className="field" value={form.light.productId} onChange={(e) => setLight({ productId: e.target.value, imageRef: 'studio' })}>
              <option value="">No button</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="mb-2 mt-5 text-xs font-medium text-bone/70">Photo revealed by the light</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Photo revealed by the light">
          {lightImages.map((img) => (
            <button
              key={img.ref}
              type="button"
              role="radio"
              aria-checked={form.light.imageRef === img.ref}
              onClick={() => setLight({ imageRef: img.ref })}
              className={classNames(
                'w-20 overflow-hidden rounded-lg border-2 text-left transition',
                form.light.imageRef === img.ref ? 'border-gold' : 'border-transparent hover:border-bone/30'
              )}
            >
              <img src={img.src} alt="" className="h-24 w-full object-cover object-top" />
              <span className="block truncate px-1 py-0.5 text-[10px] text-bone/60">{img.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="card-surface p-6">
        <h3 className="heading-serif mb-1 text-lg text-bone">New &amp; Noted</h3>
        <p className="mb-5 text-xs text-bone/45">Pick up to 8 pieces, in the order shown. With none picked, the first four products appear.</p>
        {picked.length > 0 ? (
          <ol className="mb-5 space-y-2">
            {picked.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3 rounded-xl border border-bone/10 p-2">
                <span className="w-5 text-center text-xs text-bone/40">{i + 1}</span>
                <img src={productImage(p, p.defaultColor)} alt="" className="h-12 w-10 rounded object-cover" />
                <span className="flex-1 text-sm text-bone">{p.name}</span>
                <button type="button" disabled={i === 0} onClick={() => movePick(i, -1)} className="px-1 text-bone/50 hover:text-bone disabled:opacity-30" aria-label={`Move ${p.name} up`}>↑</button>
                <button type="button" disabled={i === picked.length - 1} onClick={() => movePick(i, 1)} className="px-1 text-bone/50 hover:text-bone disabled:opacity-30" aria-label={`Move ${p.name} down`}>↓</button>
                <button type="button" onClick={() => edit({ featuredIds: form.featuredIds.filter((id) => id !== p.id) })} className="px-2 text-xs text-red-400 hover:text-red-300">Remove</button>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mb-5 text-sm text-bone/45">Nothing picked yet: the homepage shows the first four products.</p>
        )}
        {form.featuredIds.length < 8 && (
          <>
            <input className="field mb-3 max-w-sm" placeholder="Search products to add…" aria-label="Search products to feature" value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {candidates.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => edit({ featuredIds: [...form.featuredIds, p.id] })}
                  className="flex items-center gap-2 rounded-xl border border-bone/10 p-2 text-left transition hover:border-gold"
                >
                  <img src={productImage(p, p.defaultColor)} alt="" className="h-10 w-8 rounded object-cover" />
                  <span className="text-xs text-bone">{p.name}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Sections */}
      <section className="card-surface p-6">
        <h3 className="heading-serif mb-1 text-lg text-bone">Sections</h3>
        <p className="mb-5 text-xs text-bone/45">Arrange the homepage below the hero. Hidden sections stay saved and can be switched back on.</p>
        <ol className="space-y-2">
          {form.sections.map((sec, i) => (
            <li key={sec.key} className={classNames('flex items-center gap-3 rounded-xl border border-bone/10 p-3', !sec.visible && 'opacity-50')}>
              <span className="w-5 text-center text-xs text-bone/40">{i + 1}</span>
              <span className="flex-1">
                <span className="block text-sm font-medium text-bone">{SECTION_INFO[sec.key].name}</span>
                <span className="block text-xs text-bone/45">{SECTION_INFO[sec.key].desc}</span>
              </span>
              <button type="button" disabled={i === 0} onClick={() => moveSection(i, -1)} className="px-1 text-bone/50 hover:text-bone disabled:opacity-30" aria-label={`Move ${SECTION_INFO[sec.key].name} up`}>↑</button>
              <button type="button" disabled={i === form.sections.length - 1} onClick={() => moveSection(i, 1)} className="px-1 text-bone/50 hover:text-bone disabled:opacity-30" aria-label={`Move ${SECTION_INFO[sec.key].name} down`}>↓</button>
              <label className="flex items-center gap-2 text-xs text-bone/70">
                <input type="checkbox" checked={sec.visible} onChange={() => toggleSection(i)} className="h-4 w-4 accent-gold" />
                Show
              </label>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
