import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '@/types';
import { formatPrice, getDiscountInfo, toWebp } from '@/lib/format';

export default function ProductCard({ product, preferredColor }: { product: Product; preferredColor?: string }) {
  const matchingColor = preferredColor
    ? product.colorways.find((c) => c.name.toLowerCase() === preferredColor.toLowerCase() || c.label.toLowerCase().includes(preferredColor.toLowerCase()))?.name
    : undefined;

  const [selectedColor, setSelectedColor] = useState(matchingColor ?? product.defaultColor);
  const [loaded, setLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (matchingColor) {
      setSelectedColor(matchingColor);
    }
  }, [matchingColor]);

  const activeColorway =
    product.colorways.find((c) => c.name === selectedColor) ?? product.colorways[0];
  const altColorway = product.colorways.find((c) => c.name !== activeColorway.name);
  const discount = getDiscountInfo(product);

  const mainImageUrl = toWebp(activeColorway.image);
  const altImageUrl = altColorway ? toWebp(altColorway.image) : null;

  return (
    <div
      className="group relative block"
      onMouseEnter={() => setIsHovered(true)}
    >
      <div
        className="absolute -inset-1 rounded-3xl bg-gold/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden="true"
      />

      <Link to={`/shop/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-bone/5 bg-ink-700 transition-all duration-500 group-hover:border-gold/30">
          {/* Skeleton Placeholder */}
          {!loaded && (
            <div className="absolute inset-0 animate-pulse bg-ink-600/50" />
          )}

          <img
            src={mainImageUrl}
            alt={`${product.name} - ${activeColorway.label}`}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-[1.04] ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {altImageUrl && isHovered && (
            <img
              src={altImageUrl}
              alt=""
              aria-hidden
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}

          {/* Badges */}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 z-10">
            {discount.hasDiscount && (
              <span className="rounded-full bg-red-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur">
                -{discount.percent}% OFF
              </span>
            )}
            {product.isNew && (
              <span className="rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink shadow-md">
                New
              </span>
            )}
            {product.tier === 'limited' && (
              <span className="rounded-full border border-bone/30 bg-ink/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-bone backdrop-blur">
                Limited
              </span>
            )}
          </div>

          {/* Colour count badge */}
          {product.colorways.length > 1 && (
            <div className="absolute right-3 top-3 z-10">
              <span className="rounded-full border border-bone/20 bg-ink-900/80 px-2.5 py-1 text-[10px] font-semibold text-bone/80 backdrop-blur-md shadow-md">
                {product.colorways.length} Colours
              </span>
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-4 p-3 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 z-10">
            <span className="block rounded-xl border border-bone/20 bg-ink-800/60 py-3 text-center text-sm font-semibold text-bone shadow-xl backdrop-blur-md">
              View Piece
            </span>
          </div>
        </div>
      </Link>

      {/* Info & Swatches */}
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <Link to={`/shop/${product.slug}`}>
            <h3 className="font-medium leading-tight text-bone hover:text-gold transition-colors">
              {product.name}
            </h3>
          </Link>
          <p className="mt-0.5 text-xs uppercase tracking-wide text-bone/40">
            {product.verse.reference}
          </p>

          {/* Colorway Swatches */}
          {product.colorways.length > 1 && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {product.colorways.map((c) => (
                <button
                  key={c.name}
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedColor(c.name);
                  }}
                  title={c.label}
                  className={`h-4 w-4 rounded-full border transition-all ${
                    selectedColor === c.name
                      ? 'scale-125 border-gold ring-1 ring-gold/50'
                      : 'border-bone/20 hover:scale-110 hover:border-bone/50'
                  }`}
                  style={{ backgroundColor: c.swatch }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className="font-medium text-gold">{formatPrice(product.price)}</p>
          {discount.hasDiscount && (
            <p className="text-xs text-bone/40 line-through">{formatPrice(discount.originalPrice)}</p>
          )}
        </div>
      </div>
    </div>
  );
}
