import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collections } from '@/data/products';
import { useCatalog } from '@/context/CatalogContext';
import ProductCard from '@/components/ProductCard';
import Reveal from '@/components/Reveal';
import { classNames } from '@/lib/format';

type SortKey = 'featured' | 'price-asc' | 'price-desc';

export default function Shop() {
  const { products } = useCatalog();
  const [params, setParams] = useSearchParams();
  const active = params.get('collection') ?? 'All';
  const [sort, setSort] = useState<SortKey>('featured');

  const setCollection = (c: string) => {
    if (c === 'All') params.delete('collection');
    else params.set('collection', c);
    setParams(params, { replace: true });
  };

  const visible = useMemo(() => {
    let list = active === 'All' ? products : products.filter((p) => p.collection === active);
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [active, sort, products]);

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
        </div>

        <label className="flex items-center gap-2 text-sm text-bone/55">
          Sort
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg border border-bone/15 bg-ink-700 px-3 py-2 text-sm text-bone outline-none focus:border-gold/60"
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3">
        {visible.map((p, i) => (
          <Reveal key={p.id} delay={(i % 3) * 80}>
            <ProductCard product={p} />
          </Reveal>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="py-20 text-center text-bone/45">No pieces in this collection yet.</p>
      )}
    </div>
  );
}
