import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '@/types';
import { formatPrice, getDiscountInfo, toWebp } from '@/lib/format';
import { productSoldOut } from '@/lib/stock';
import SaveButton from '@/components/SaveButton';
import { modelSrcSet } from '@/lib/img';

export default function ProductCard({ product, preferredColor }: { product: Product; preferredColor?: string }) {
  const matchingColor = preferredColor
    ? product.colorways.find((c) => c.name.toLowerCase() === preferredColor.toLowerCase() || c.label.toLowerCase().includes(preferredColor.toLowerCase()))?.name
    : undefined;

  const [selectedColor, setSelectedColor] = useState(matchingColor ?? product.defaultColor);
  const [isHovered, setIsHovered] = useState(false);
  // Once a shopper picks a colour (or filters by one), show that shirt rather than the model photo.
  const [pickedColour, setPickedColour] = useState(false);

  useEffect(() => {
    if (matchingColor) {
      setSelectedColor(matchingColor);
    }
  }, [matchingColor]);

  const activeColorway =
    product.colorways.find((c) => c.name === selectedColor) ?? product.colorways[0];
  const altColorway = product.colorways.find((c) => c.name !== activeColorway.name);
  const discount = getDiscountInfo(product);

  // Studio model photo leads when we have one; the flat shirt shows on hover.
  const showModel = Boolean(product.modelImage) && !pickedColour && !matchingColor;
  const mainImageUrl = showModel ? toWebp(product.modelImage!) : toWebp(activeColorway.image);
  const hoverImageUrl = showModel
    ? toWebp(activeColorway.image)
    : product.modelImage ? toWebp(product.modelImage) : altColorway ? toWebp(altColorway.image) : null;
  const cardSizes = '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw';

  return (
    <div
      className="group relative block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="absolute -inset-1 rounded-3xl bg-gold/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden="true"
      />

      <Link to={`/shop/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-bone/5 bg-ink-700 transition-all duration-500 group-hover:border-gold/30">
          <img
            src={mainImageUrl}
            srcSet={showModel ? modelSrcSet(product.modelImage) : undefined}
            sizes={cardSizes}
            alt={showModel ? `${product.name} worn by a model` : `${product.name} - ${activeColorway.label}`}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              if (activeColorway.image && !e.currentTarget.src.endsWith(activeColorway.image)) {
                e.currentTarget.removeAttribute('srcset');
                e.currentTarget.src = activeColorway.image;
              }
            }}
            className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-[1.04] ${showModel ? 'object-top' : ''}`}
          />

          {hoverImageUrl && isHovered && (
            <img
              src={hoverImageUrl}
              srcSet={!showModel && product.modelImage ? modelSrcSet(product.modelImage) : undefined}
              sizes={cardSizes}
              alt=""
              aria-hidden
              loading="lazy"
              decoding="async"
              onError={(e) => {
                if (product.modelImage && !e.currentTarget.src.endsWith(product.modelImage)) {
                  e.currentTarget.src = product.modelImage;
                } else if (altColorway?.image && !e.currentTarget.src.endsWith(altColorway.image)) {
                  e.currentTarget.src = altColorway.image;
                }
              }}
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}

          {/* Badges */}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 z-10">
            {productSoldOut(product) && (
              <span className="rounded-full bg-bone px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink shadow-lg">
                Sold out
              </span>
            )}
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
            <div className="absolute right-14 top-3.5 z-10">
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

      {/* Save — outside the link so it's its own control, positioned over the image corner */}
      <SaveButton
        productId={product.id}
        productName={product.name}
        className="absolute right-3 top-3 z-20 h-9 w-9 bg-ink/85 shadow-md backdrop-blur"
      />

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
                    setPickedColour(true);
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
