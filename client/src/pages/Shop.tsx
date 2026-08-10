import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collections } from '@/data/products';
import { useCatalog } from '@/context/CatalogContext';
import ProductCard from '@/components/ProductCard';
import Reveal from '@/components/Reveal';
import { classNames, getDiscountInfo } from '@/lib/format';

// Fixed colour palette for the shop filter
const COLOUR_PALETTE = [
  { key: 'white',    label: 'White',    hex: '#f5f5f5', aliases: ['white', 'magnolia', 'cream white', 'off white', 'offwhite'] },
  { key: 'cream',    label: 'Cream',    hex: '#FFFDD0', aliases: ['cream', 'ivory', 'sand', 'beige', 'ecru'] },
  { key: 'brown',    label: 'Brown',    hex: '#7B5230', aliases: ['brown', 'chocolate', 'tan', 'caramel', 'mocha', 'coffee', 'earth'] },
  { key: 'red',      label: 'Red',      hex: '#C0392B', aliases: ['red', 'scarlet', 'crimson', 'tomato'] },
  { key: 'wine',     label: 'Wine',     hex: '#722F37', aliases: ['wine', 'burgundy', 'maroon', 'plum', 'merlot', 'bordeaux'] },
  { key: 'hot-pink', label: 'Hot Pink', hex: '#FF69B4', aliases: ['hot pink', 'hotpink', 'pink', 'fuchsia', 'rose', 'dusty pink'] },
] as const;

const ALL_SIZES = ['S', 'M', 'L', 'XL', '2XL'];

function productMatchesColor(
  product: { colorways: Array<{ name: string; label: string }> },
  paletteKey: string
): boolean {
  const entry = COLOUR_PALETTE.find((c) => c.key === paletteKey);
  if (!entry) return false;
  return product.colorways.some((cw) => {
    const n = cw.name.toLowerCase().replace(/[-_]/g, ' ');
    const l = cw.label.toLowerCase().replace(/[-_]/g, ' ');
    return entry.aliases.some((alias) => n.includes(alias) || l.includes(alias));
  });
}

export default function Shop() {
  const { products } = useCatalog();
  const [params, setParams] = useSearchParams();
  const active = params.get('collection') ?? 'All';

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Multi-select states
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(new Set());

  const [showColorPanel, setShowColorPanel] = useState(false);
  const [showSizePanel, setShowSizePanel] = useState(false);

  const setCollection = (c: string) => {
    if (c === 'All') params.delete('collection');
    else params.set('collection', c);
    setParams(params, { replace: true });
  };

  // Toggle helpers
  const toggleColor = (key: string) => {
    setSelectedColors((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleSize = (s: string) => {
    setSelectedSizes((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  };

  // Only show colours that actually have products in the catalog
  const availableColours = useMemo(
    () => COLOUR_PALETTE.filter((col) => products.some((p) => productMatchesColor(p, col.key))),
    [products]
  );

  // Sizes that exist in the catalog
  const availableSizes = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => (p.sizes ?? []).forEach((s) => set.add(s.toUpperCase())));
    const custom = Array.from(set).filter((s) => !ALL_SIZES.includes(s));
    return [...ALL_SIZES.filter((s) => set.has(s)), ...custom];
  }, [products]);

  // Filter products
  const visible = useMemo(() => {
    let list =
      active === 'All'
        ? products
        : active === 'On Sale'
        ? products.filter((p) => getDiscountInfo(p).hasDiscount)
        : products.filter((p) => p.collection === active);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tagline?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.verse?.text?.toLowerCase().includes(q) ||
          p.verse?.reference?.toLowerCase().includes(q) ||
          p.collection?.toLowerCase().includes(q)
      );
    }

    if (selectedColors.size > 0) {
      list = list.filter((p) => [...selectedColors].some((key) => productMatchesColor(p, key)));
    }

    if (selectedSizes.size > 0) {
      list = list.filter((p) =>
        (p.sizes ?? []).some((s) => selectedSizes.has(s.toUpperCase()))
      );
    }

    return list;
  }, [active, searchQuery, selectedColors, selectedSizes, products]);

  const saleCount = useMemo(
    () => products.filter((p) => getDiscountInfo(p).hasDiscount).length,
    [products]
  );

  const isFiltered = selectedColors.size > 0 || selectedSizes.size > 0 || active !== 'All' || Boolean(searchQuery);

  const resetFilters = () => {
    setCollection('All');
    setSearchQuery('');
    setSelectedColors(new Set());
    setSelectedSizes(new Set());
  };

  // Preferred color for ProductCard (first selected, or undefined)
  const preferredColor = selectedColors.size === 1 ? [...selectedColors][0] : undefined;

  return (
    <div className="container-site py-12 md:py-16">
      <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="eyebrow mb-3">The Shop</p>
          <h1 className="heading-serif text-3xl text-bone sm:text-5xl">Every piece, a word.</h1>
          <p className="mt-4 text-bone/55">
            Heavyweight scripture streetwear in premium colorways. Choose your statement.
          </p>
        </div>

        {/* Search Input Bar */}
        <div className="relative w-full max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search designs, verses, or drops..."
            className="w-full rounded-full border border-bone/20 bg-ink-800/80 px-5 py-3 pl-11 text-sm text-bone placeholder-bone/40 outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
          />
          <svg
            className="absolute left-4 top-3.5 h-4 w-4 text-bone/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-3 text-xs text-bone/40 hover:text-bone"
            >
              Clear
            </button>
          )}
        </div>
      </header>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-6 border-b border-bone/10 pb-6">
        {/* Collection Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {collections.map((c) => (
            <button
              key={c}
              onClick={() => setCollection(c)}
              className={classNames(
                'rounded-full px-4 py-2 text-sm font-medium transition',
                active === c
                  ? 'bg-gold text-ink'
                  : 'border border-bone/15 text-bone/65 hover:border-bone/35 hover:text-bone'
              )}
            >
              {c}
            </button>
          ))}

          {/* On Sale Filter Tag */}
          <button
            onClick={() => setCollection('On Sale')}
            className={classNames(
              'rounded-full px-4 py-2 text-sm font-medium transition flex items-center gap-1.5',
              active === 'On Sale'
                ? 'bg-red-500 text-white font-semibold'
                : 'border border-red-500/30 text-red-400 hover:border-red-500/60 hover:text-red-300 bg-red-500/10'
            )}
          >
            🔥 On Sale {saleCount > 0 && `(${saleCount})`}
          </button>
        </div>

        {/* Colour & Size Checkbox Panels */}
        <div className="flex flex-wrap items-start gap-4">

          {/* ── Colour Checkbox Group ── */}
          <div className="relative">
            <button
              onClick={() => { setShowColorPanel((v) => !v); setShowSizePanel(false); }}
              className={classNames(
                'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition',
                selectedColors.size > 0
                  ? 'border-gold/60 bg-gold/10 text-gold'
                  : 'border-bone/15 text-bone/70 hover:border-bone/35 hover:text-bone'
              )}
            >
              Colour
              {selectedColors.size > 0 && (
                <span className="rounded-full bg-gold text-ink text-xs w-5 h-5 flex items-center justify-center font-bold">
                  {selectedColors.size}
                </span>
              )}
              <svg className={classNames('w-3 h-3 transition-transform', showColorPanel ? 'rotate-180' : '')} viewBox="0 0 12 8" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 1l5 5 5-5"/>
              </svg>
            </button>

            {showColorPanel && (
              <div className="absolute left-0 top-full z-30 mt-2 min-w-[200px] rounded-xl border border-bone/15 bg-[#161616] p-4 shadow-2xl">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-bone/40">Colour</p>
                <div className="flex flex-col gap-2.5">
                  {COLOUR_PALETTE.map((col) => {
                    const available = availableColours.some((a) => a.key === col.key);
                    const checked = selectedColors.has(col.key);
                    return (
                      <label
                        key={col.key}
                        className={classNames(
                          'flex items-center gap-3 cursor-pointer select-none',
                          !available && 'opacity-35 cursor-not-allowed'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!available}
                          onChange={() => available && toggleColor(col.key)}
                          className="sr-only"
                        />
                        {/* Custom checkbox */}
                        <span
                          className={classNames(
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition',
                            checked
                              ? 'border-gold bg-gold'
                              : 'border-bone/25 bg-transparent hover:border-gold/50'
                          )}
                        >
                          {checked && (
                            <svg className="w-2.5 h-2.5 text-ink" viewBox="0 0 10 8" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 4l3 3 5-6"/>
                            </svg>
                          )}
                        </span>
                        {/* Colour swatch */}
                        <span
                          className="h-4 w-4 rounded-full border border-white/10 shrink-0"
                          style={{ backgroundColor: col.hex }}
                        />
                        <span className="text-sm text-bone/80">{col.label}</span>
                        {!available && <span className="text-xs text-bone/30 ml-auto">–</span>}
                      </label>
                    );
                  })}
                </div>
                {selectedColors.size > 0 && (
                  <button
                    onClick={() => setSelectedColors(new Set())}
                    className="mt-4 w-full text-center text-xs text-bone/40 hover:text-gold transition"
                  >
                    Clear colours
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Size Checkbox Group ── */}
          <div className="relative">
            <button
              onClick={() => { setShowSizePanel((v) => !v); setShowColorPanel(false); }}
              className={classNames(
                'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition',
                selectedSizes.size > 0
                  ? 'border-gold/60 bg-gold/10 text-gold'
                  : 'border-bone/15 text-bone/70 hover:border-bone/35 hover:text-bone'
              )}
            >
              Size
              {selectedSizes.size > 0 && (
                <span className="rounded-full bg-gold text-ink text-xs w-5 h-5 flex items-center justify-center font-bold">
                  {selectedSizes.size}
                </span>
              )}
              <svg className={classNames('w-3 h-3 transition-transform', showSizePanel ? 'rotate-180' : '')} viewBox="0 0 12 8" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 1l5 5 5-5"/>
              </svg>
            </button>

            {showSizePanel && (
              <div className="absolute left-0 top-full z-30 mt-2 min-w-[160px] rounded-xl border border-bone/15 bg-[#161616] p-4 shadow-2xl">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-bone/40">Size</p>
                <div className="flex flex-col gap-2.5">
                  {availableSizes.map((s) => {
                    const checked = selectedSizes.has(s);
                    return (
                      <label key={s} className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSize(s)}
                          className="sr-only"
                        />
                        {/* Custom checkbox */}
                        <span
                          className={classNames(
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition',
                            checked
                              ? 'border-gold bg-gold'
                              : 'border-bone/25 bg-transparent hover:border-gold/50'
                          )}
                        >
                          {checked && (
                            <svg className="w-2.5 h-2.5 text-ink" viewBox="0 0 10 8" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 4l3 3 5-6"/>
                            </svg>
                          )}
                        </span>
                        <span className="text-sm font-medium text-bone/80">{s}</span>
                      </label>
                    );
                  })}
                </div>
                {selectedSizes.size > 0 && (
                  <button
                    onClick={() => setSelectedSizes(new Set())}
                    className="mt-4 w-full text-center text-xs text-bone/40 hover:text-gold transition"
                  >
                    Clear sizes
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Reset all filters */}
          {isFiltered && (
            <button
              onClick={resetFilters}
              className="mt-1 text-xs font-semibold text-gold hover:underline underline-offset-4"
            >
              Reset all
            </button>
          )}
        </div>
      </div>

      {/* Active filter chips */}
      {(selectedColors.size > 0 || selectedSizes.size > 0) && (
        <div className="mb-6 flex flex-wrap gap-2">
          {[...selectedColors].map((key) => {
            const col = COLOUR_PALETTE.find((c) => c.key === key);
            return col ? (
              <span key={key} className="flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs text-gold">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: col.hex }} />
                {col.label}
                <button onClick={() => toggleColor(key)} className="ml-1 opacity-60 hover:opacity-100">✕</button>
              </span>
            ) : null;
          })}
          {[...selectedSizes].map((s) => (
            <span key={s} className="flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs text-gold">
              Size {s}
              <button onClick={() => toggleSize(s)} className="ml-1 opacity-60 hover:opacity-100">✕</button>
            </span>
          ))}
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3">
        {visible.map((p, i) => (
          <Reveal key={p.id} delay={(i % 3) * 80}>
            <ProductCard
              product={p}
              preferredColor={preferredColor}
            />
          </Reveal>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-lg font-medium text-bone">No shirts match your selected filters.</p>
          <p className="mt-2 text-sm text-bone/45">Try choosing a different colour or size.</p>
          <button onClick={resetFilters} className="btn-outline mt-5">
            Reset all filters
          </button>
        </div>
      )}
    </div>
  );
}
