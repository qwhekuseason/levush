import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCatalog } from '@/context/CatalogContext';
import { useCart } from '@/context/CartContext';
import ProductCard from '@/components/ProductCard';
import Reveal from '@/components/Reveal';
import SizeGuideModal from '@/components/SizeGuideModal';
import { CheckIcon } from '@/components/icons';
import { classNames, formatPrice, getDiscountInfo, productImage } from '@/lib/format';
import type { ColorwayName } from '@/types';

export default function ProductDetail() {
  const { slug } = useParams();
  const { products, getProduct } = useCatalog();
  const product = slug ? getProduct(slug) : undefined;
  const { addItem } = useCart();

  const [color, setColor] = useState<ColorwayName>(product?.defaultColor ?? 'black');
  const [size, setSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [sizeModalOpen, setSizeModalOpen] = useState(false);

  if (!product) {
    return (
      <div className="container-site py-32 text-center">
        <h1 className="heading-serif text-3xl text-bone">Piece not found</h1>
        <Link to="/shop" className="btn-outline mt-6">Back to shop</Link>
      </div>
    );
  }

  const related = products.filter((p) => p.id !== product.id && p.collection === product.collection);
  const fallback = products.filter((p) => p.id !== product.id).slice(0, 3);
  const recommendations = related.length ? related.slice(0, 3) : fallback;

  const handleAdd = () => {
    if (!size) return;
    addItem(product, color, size, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="container-site py-10 md:py-14">
      <nav className="mb-8 text-sm text-bone/45">
        <Link to="/shop" className="hover:text-bone">Shop</Link>
        <span className="mx-2">/</span>
        <span className="text-bone/70">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Gallery */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-ink-700">
            <img
              src={productImage(product, color)}
              alt={`${product.name} — ${color}`}
              fetchPriority="high"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
          {product.colorways.length > 1 && (
            <div className="mt-4 flex gap-3">
              {product.colorways.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setColor(c.name)}
                  className={classNames(
                    'aspect-[4/5] w-20 overflow-hidden rounded-lg border-2 transition',
                    color === c.name ? 'border-gold' : 'border-transparent opacity-70 hover:opacity-100'
                  )}
                >
                  <img
                    src={productImage(product, c.name)}
                    alt={c.label}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2">
            <span className="eyebrow">{product.collection}</span>
            {product.tier === 'limited' && (
              <span className="rounded-full border border-bone/25 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-bone/80">
                Limited
              </span>
            )}
          </div>
          <h1 className="heading-serif mt-3 text-3xl text-bone sm:text-5xl">{product.name}</h1>
          <p className="mt-2 font-serif text-base sm:text-lg italic text-bone/60">{product.tagline}</p>
          {(() => {
            const discount = getDiscountInfo(product);
            return (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="text-3xl font-medium text-gold">{formatPrice(product.price)}</span>
                {discount.hasDiscount && (
                  <>
                    <span className="text-xl text-bone/45 line-through">{formatPrice(discount.originalPrice)}</span>
                    <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-400 border border-red-500/30">
                      Save {formatPrice(discount.savings)} ({discount.percent}% OFF)
                    </span>
                  </>
                )}
              </div>
            );
          })()}

          <p className="mt-6 leading-relaxed text-bone/65">{product.description}</p>

          {/* Verse callout */}
          <blockquote className="mt-7 rounded-xl border-l-2 border-gold bg-ink-800 p-5">
            <p className="font-serif text-lg italic leading-relaxed text-bone/90">{product.verse.text}</p>
            <cite className="mt-2 block text-sm not-italic text-gold">— {product.verse.reference}</cite>
          </blockquote>

          {/* Colour */}
          <div className="mt-8">
            <p className="mb-3 text-sm font-medium text-bone">
              Colour: <span className="text-bone/55">{product.colorways.find((c) => c.name === color)?.label}</span>
            </p>
            <div className="flex gap-3">
              {product.colorways.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setColor(c.name)}
                  aria-label={c.label}
                  className={classNames(
                    'h-9 w-9 rounded-full border transition',
                    color === c.name ? 'ring-2 ring-gold ring-offset-2 ring-offset-ink' : 'border-bone/20'
                  )}
                  style={{ backgroundColor: c.swatch }}
                />
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-bone">Size</p>
              <button onClick={() => setSizeModalOpen(true)} className="text-sm text-bone/60 hover:text-gold hover:underline underline-offset-4 transition-colors">
                Size Guide
              </button>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={classNames(
                    'h-11 min-w-[3rem] rounded-lg border px-3 text-sm font-medium transition',
                    size === s
                      ? 'border-gold bg-gold text-ink'
                      : 'border-bone/15 text-bone/75 hover:border-bone/40'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="mt-7">
            <p className="mb-3 text-sm font-medium text-bone">Quantity</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-lg border border-bone/20 bg-ink-800/80">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-11 w-11 items-center justify-center text-bone/70 transition hover:text-bone disabled:opacity-30"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="w-10 text-center font-mono text-sm font-bold text-bone">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                  className="flex h-11 w-11 items-center justify-center text-bone/70 transition hover:text-bone"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-bone/40">Max 10 per order</span>
            </div>
          </div>

          {/* Add to cart */}
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button onClick={handleAdd} disabled={!size} className="btn-primary flex-1">
              {added ? (
                <>
                  <CheckIcon width={18} height={18} /> Added {quantity} to bag
                </>
              ) : size ? (
                `Add ${quantity > 1 ? `(${quantity}) ` : ''}to Bag`
              ) : (
                'Select a size'
              )}
            </button>
            <Link to="/cart" className="btn-outline">View Bag</Link>
          </div>

          <ul className="mt-8 space-y-2 border-t border-bone/10 pt-6 text-sm text-bone/55">
            <li>• 100% premium ringspun cotton, 220gsm</li>
            <li>• Soft hand-feel print, made to last</li>
            <li>• Free delivery on orders over GH₵400</li>
          </ul>
        </div>
      </div>

      {/* Related */}
      <section className="mt-24">
        <Reveal className="mb-8">
          <h2 className="heading-serif text-2xl text-bone sm:text-3xl">You may also like</h2>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3">
          {recommendations.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <SizeGuideModal 
        isOpen={sizeModalOpen} 
        onClose={() => setSizeModalOpen(false)} 
        category={product.category ?? 't-shirt'} 
      />
    </div>
  );
}
