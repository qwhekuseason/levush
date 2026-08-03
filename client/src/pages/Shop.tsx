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

  // Colour and Size filter states (dropdown selection)
  const [selectedColor, setSelectedColor] = useState<string>('All');
  const [selectedSize, setSelectedSize] = useState<string>('All');

  const setCollection = (c: string) => {
    if (c === 'All') params.delete('collection');
    else params.set('collection', c);
    setParams(params, { replace: true });
  };

  // Only show colours that actually have products in the catalog
  const availableColours = useMemo(
    () => COLOUR_PALETTE.filter((col) => products.some((p) => productMatchesColor(p, col.key))),
    [products]
  );

  // Sizes that exist in the catalog (in standard order, extras appended)
  const availableSizes = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => (p.sizes ?? []).forEach((s) => set.add(s.toUpperCase())));
    const custom = Array.from(set).filter((s) => !ALL_SIZES.includes(s));
    return [...ALL_SIZES.filter((s) => set.has(s)), ...custom];
  }, [products]);

  // Filter products by Collection, Colour, and Size
  const visible = useMemo(() => {
    let list =
      active === 'All'
        ? products
        : active === 'On Sale'
        ? products.filter((p) => getDiscountInfo(p).hasDiscount)
        : products.filter((p) => p.collection === active);

    if (selectedColor !== 'All') {
      list = list.filter((p) => productMatchesColor(p, selectedColor));
    }

    if (selectedSize !== 'All') {
      const targetSize = selectedSize.toUpperCase();
      list = list.filter((p) =>
        (p.sizes ?? []).some((s) => s.toUpperCase() === targetSize)
      );
    }

    return list;
  }, [active, selectedColor, selectedSize, products]);

  const saleCount = useMemo(
    () => products.filter((p) => getDiscountInfo(p).hasDiscount).length,
    [products]
  );

  const isFiltered = selectedColor !== 'All' || selectedSize !== 'All' || active !== 'All';

  const resetFilters = () => {
    setCollection('All');
    setSelectedColor('All');
    setSelectedSize('All');
  };

  return (
    <div className="container-site py-12 md:py-16">
      <header className="mb-10 max-w-2xl">
        <p className="eyebrow mb-3">The Shop</p>
        <h1 className="heading-serif text-3xl text-bone sm:text-5xl">Every piece, a word.</h1>
        <p className="mt-4 text-bone/55">
          Heavyweight scripture tees in Magnolia and Raisin Black. Choose your statement.
        </p>
      </header>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-bone/10 pb-5">
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

        {/* Colour & Size Dropdowns */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Colour Dropdown */}
          <label className="flex items-center gap-2 text-sm font-medium text-bone/70">
            Colour
            <select
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="rounded-lg border border-bone/15 bg-ink-700 px-3 py-2 text-sm text-bone outline-none focus:border-gold/60 cursor-pointer"
            >
              <option value="All">All Colours</option>
              {COLOUR_PALETTE.map((col) => {
                const available = availableColours.some((a) => a.key === col.key);
                return (
                  <option key={col.key} value={col.key} disabled={!available}>
                    {col.label} {!available ? '(Unavailable)' : ''}
                  </option>
                );
              })}
            </select>
          </label>

          {/* Size Dropdown */}
          <label className="flex items-center gap-2 text-sm font-medium text-bone/70">
            Size
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="rounded-lg border border-bone/15 bg-ink-700 px-3 py-2 text-sm text-bone outline-none focus:border-gold/60 cursor-pointer"
            >
              <option value="All">All Sizes</option>
              {availableSizes.map((s) => (
                <option key={s} value={s}>
                  Size {s}
                </option>
              ))}
            </select>
          </label>

          {/* Reset Filters */}
          {isFiltered && (
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-gold hover:underline underline-offset-4"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3">
        {visible.map((p, i) => (
          <Reveal key={p.id} delay={(i % 3) * 80}>
            <ProductCard
              product={p}
              preferredColor={selectedColor !== 'All' ? selectedColor : undefined}
            />
          </Reveal>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-lg font-medium text-bone">No shirts match your selected filters.</p>
          <p className="mt-2 text-sm text-bone/45">Try choosing a different colour or size filter.</p>
          <button onClick={resetFilters} className="btn-outline mt-5">
            Reset all filters
          </button>
        </div>
      )}
    </div>
  );
}
