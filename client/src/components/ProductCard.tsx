import { Link } from 'react-router-dom';
import type { Product } from '@/types';
import { formatPrice, productImage } from '@/lib/format';

export default function ProductCard({ product }: { product: Product }) {
  const primary = productImage(product, product.defaultColor);
  const alt = product.colorways.find((c) => c.name !== product.defaultColor)?.image;

  return (
    <Link to={`/shop/${product.slug}`} className="group block relative">
      <div className="absolute -inset-1 rounded-3xl bg-gold/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" aria-hidden="true" />
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-ink-700 border border-bone/5 transition-all duration-500 group-hover:border-gold/30">
        <img
          src={primary}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-all duration-700 group-hover:scale-[1.04]"
        />
        {alt && (
          <img
            src={alt}
            alt=""
            aria-hidden
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}

        <div className="absolute left-3 top-3 flex gap-2">
          {product.isNew && (
            <span className="rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink">
              New
            </span>
          )}
          {product.tier === 'limited' && (
            <span className="rounded-full border border-bone/30 bg-ink/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-bone backdrop-blur">
              Limited
            </span>
          )}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-4 p-3 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="block rounded-xl bg-ink-800/60 backdrop-blur-md border border-bone/20 py-3 text-center text-sm font-semibold text-bone shadow-xl">
            View Piece
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium leading-tight text-bone">{product.name}</h3>
          <p className="mt-0.5 text-xs uppercase tracking-wide text-bone/40">
            {product.verse.reference}
          </p>
        </div>
        <p className="shrink-0 font-medium text-gold">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}
