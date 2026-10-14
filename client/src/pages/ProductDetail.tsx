import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCatalog } from '@/context/CatalogContext';
import { useCart } from '@/context/CartContext';
import ProductCard from '@/components/ProductCard';
import Reveal from '@/components/Reveal';
import SizeGuideModal from '@/components/SizeGuideModal';
import { CheckIcon } from '@/components/icons';
import { classNames, formatPrice, getDiscountInfo, productImage, toWebp } from '@/lib/format';
import type { ColorwayName } from '@/types';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { usePageTitle } from '@/lib/usePageTitle';
import { modelSrcSet } from '@/lib/img';
import { colorSoldOut, isSoldOut, productSoldOut } from '@/lib/stock';
import { useWishlist } from '@/context/WishlistContext';
import SaveButton from '@/components/SaveButton';
import ShareButton from '@/components/ShareButton';
import NotifyMe from '@/components/NotifyMe';
import ProductReviews from '@/components/ProductReviews';

// Keyed by slug so moving between products (e.g. via "You may also like")
// starts fresh instead of carrying over the previous piece's colour/size/image.
export default function ProductDetailRoute() {
  const { slug } = useParams();
  return <ProductDetail key={slug} slug={slug} />;
}

function ProductDetail({ slug }: { slug?: string }) {
  const { products, getProduct } = useCatalog();
  const product = slug ? getProduct(slug) : undefined;
  usePageTitle(product ? product.name : 'Piece not found');
  const { addItem } = useCart();
  const { settings } = useStoreSettings();
  const maxQty = settings.maxQtyPerItem;

  const [selectedColor, setColor] = useState<ColorwayName>(product?.defaultColor ?? 'black');
  // Open on the studio model photo when there is one; swatches switch to the shirts.
  const [activeImage, setActiveImage] = useState<string>(
    product ? (product.modelImage ? toWebp(product.modelImage) : productImage(product, product.defaultColor)) : ''
  );
  const [size, setSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [sizeModalOpen, setSizeModalOpen] = useState(false);
  // A sold-out size the shopper tapped: shows the "notify me" form for it.
  const [alertSize, setAlertSize] = useState<string | null>(null);
  const { recent, markViewed } = useWishlist();

  useEffect(() => {
    if (product) markViewed(product.id);
  }, [product?.id, markViewed]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync active image when color selection changes
  const handleColorChange = (newColor: ColorwayName) => {
    setColor(newColor);
    if (product) {
      setActiveImage(productImage(product, newColor));
      // Don't keep a size that isn't available in the newly chosen colour.
      if (size && isSoldOut(product, newColor, size)) setSize('');
    }
  };

  if (!product) {
    return (
      <div className="container-site py-32 text-center">
        <h1 className="heading-serif text-3xl text-bone">Piece not found</h1>
        <Link to="/shop" className="btn-outline mt-6">Back to shop</Link>
      </div>
    );
  }

  // Construct unique gallery items: all colorways + model shot + gallery shots
  const allMedia: Array<{ url: string; label: string; isModel?: boolean; colorMatch?: ColorwayName }> = [];
  
  // 1. Colorway garments
  product.colorways.forEach((c) => {
    const url = productImage(product, c.name);
    if (!allMedia.some((m) => m.url === url)) {
      allMedia.push({ url, label: c.label, colorMatch: c.name });
    }
  });

  // 2. Model photoshoot shot
  if (product.modelImage) {
    const url = toWebp(product.modelImage);
    if (!allMedia.some((m) => m.url === url)) {
      allMedia.push({ url, label: 'On Model', isModel: true });
    }
  }

  // 3. Additional photoshoot gallery shots
  if (product.gallery) {
    product.gallery.forEach((g, idx) => {
      const url = toWebp(g);
      if (!allMedia.some((m) => m.url === url)) {
        allMedia.push({ url, label: `Look ${idx + 1}`, isModel: true });
      }
    });
  }

  // The product may arrive after first render (catalogue sync), so fall back to
  // its default colour if the selected one doesn't belong to it.
  const color = product.colorways.some((c) => c.name === selectedColor) ? selectedColor : product.defaultColor;
  const colorLabel = product.colorways.find((c) => c.name === color)?.label ?? color;
  const currentDisplayedImage = activeImage || productImage(product, color);
  const isViewingModel = allMedia.find((m) => m.url === currentDisplayedImage)?.isModel;

  const related = products.filter((p) => p.id !== product.id && p.collection === product.collection);
  const fallback = products.filter((p) => p.id !== product.id).slice(0, 3);
  const recommendations = related.length ? related.slice(0, 3) : fallback;

  const allSoldOut = productSoldOut(product);
  const thisColorSoldOut = colorSoldOut(product, color);

  const recentlyViewed = recent
    .filter((id) => id !== product.id)
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 4);

  const handleAdd = () => {
    if (!size || isSoldOut(product, color, size)) return;
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
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-ink-700 border border-bone/10 shadow-2xl">
            <img
              src={currentDisplayedImage}
              srcSet={modelSrcSet(currentDisplayedImage)}
              sizes="(min-width: 1024px) 50vw, 100vw"
              alt={`${product.name} — ${colorLabel}`}
              {...{ fetchpriority: 'high' }}
              decoding="async"
              onError={(e) => {
                const match = product.colorways.find((c) => c.name === color);
                if (match?.image && !e.currentTarget.src.endsWith(match.image)) {
                  e.currentTarget.src = match.image;
                }
              }}
              className="h-full w-full object-cover object-top transition-all duration-300"
            />
            {isViewingModel && (
              <span className="absolute top-4 left-4 rounded-full bg-ink/80 backdrop-blur border border-gold/40 px-3 py-1 text-xs font-semibold text-gold shadow-lg">
                Studio Model View
              </span>
            )}
          </div>

          {/* Interactive Thumbnail Gallery Strip */}
          {allMedia.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {allMedia.map((m, idx) => {
                const isSelected = currentDisplayedImage === m.url;
                return (
                  <button
                    key={`${m.url}-${idx}`}
                    onClick={() => {
                      setActiveImage(m.url);
                      if (m.colorMatch) {
                        setColor(m.colorMatch);
                      }
                    }}
                    title={m.label}
                    className={classNames(
                      'relative aspect-[4/5] w-20 overflow-hidden rounded-xl border-2 transition-all duration-300 group',
                      isSelected
                        ? 'border-gold ring-2 ring-gold/30 shadow-lg scale-105 opacity-100'
                        : 'border-bone/15 opacity-65 hover:opacity-100 hover:border-bone/40'
                    )}
                  >
                    <img
                      src={m.url}
                      alt={m.label}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover object-top"
                    />
                    {m.isModel && (
                      <span className="absolute bottom-1 right-1 rounded bg-ink-950/80 px-1 py-0.5 text-[9px] font-bold uppercase text-gold">
                        Model
                      </span>
                    )}
                  </button>
                );
              })}
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
              {thisColorSoldOut && <span className="ml-2 text-xs font-semibold text-red-500">Sold out</span>}
            </p>
            <div className="flex gap-3">
              {product.colorways.map((c) => {
                const gone = colorSoldOut(product, c.name);
                return (
                  <button
                    key={c.name}
                    onClick={() => handleColorChange(c.name)}
                    aria-label={gone ? `${c.label} (sold out)` : c.label}
                    title={gone ? `${c.label} — sold out` : c.label}
                    className={classNames(
                      'relative h-9 w-9 overflow-hidden rounded-full border transition',
                      color === c.name ? 'ring-2 ring-gold ring-offset-2 ring-offset-ink' : 'border-bone/20',
                      gone && 'opacity-40'
                    )}
                    style={{ backgroundColor: c.swatch }}
                  >
                    {gone && <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 rotate-45 bg-bone/70" aria-hidden="true" />}
                  </button>
                );
              })}
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
              {product.sizes.map((s) => {
                const gone = isSoldOut(product, color, s);
                return (
                  <button
                    key={s}
                    onClick={() => {
                      if (gone) {
                        // Sold out: offer a back-in-stock alert instead of selecting it.
                        setAlertSize(s);
                        if (size === s) setSize('');
                      } else {
                        setSize(s);
                        setAlertSize(null);
                      }
                    }}
                    aria-label={gone ? `${s} (sold out — get notified)` : s}
                    title={gone ? 'Sold out — tap to get notified' : undefined}
                    className={classNames(
                      'h-11 min-w-[3rem] rounded-lg border px-3 text-sm font-medium transition',
                      gone
                        ? 'border-dashed border-bone/20 text-bone/35 line-through hover:border-gold/50'
                        : size === s
                        ? 'border-gold bg-gold text-ink'
                        : 'border-bone/15 text-bone/75 hover:border-bone/40'
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            {product.sizes.some((s) => isSoldOut(product, color, s)) && !alertSize && (
              <p className="mt-2 text-xs text-bone/45">Crossed-out sizes are sold out. Tap one to get a WhatsApp alert when it’s back.</p>
            )}
            {alertSize && isSoldOut(product, color, alertSize) && (
              <NotifyMe
                key={`${color}-${alertSize}`}
                productId={product.id}
                color={color}
                colorLabel={colorLabel}
                size={alertSize}
                onClose={() => setAlertSize(null)}
              />
            )}
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
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="w-10 text-center font-mono text-sm font-bold text-bone">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                  className="flex h-11 w-11 items-center justify-center text-bone/70 transition hover:text-bone disabled:opacity-30"
                  disabled={quantity >= maxQty}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-bone/40">Max {maxQty} per order</span>
            </div>
          </div>

          {/* Add to cart */}
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button onClick={handleAdd} disabled={!size || allSoldOut || thisColorSoldOut} className="btn-primary flex-1">
              {allSoldOut ? (
                'Sold out'
              ) : thisColorSoldOut ? (
                'Sold out in this colour'
              ) : added ? (
                <>
                  <CheckIcon width={18} height={18} /> Added {quantity} to bag
                </>
              ) : size ? (
                `Add ${quantity > 1 ? `(${quantity}) ` : ''}to Bag`
              ) : (
                'Select a size'
              )}
            </button>
            <div className="flex gap-3">
              <Link to="/cart" className="btn-outline flex-1 sm:flex-none">View Bag</Link>
              <SaveButton productId={product.id} productName={product.name} className="h-12 w-12 shrink-0 border border-bone/20" size={20} />
              <ShareButton
                title={`${product.name} — Levush`}
                text={`${product.name} · ${product.verse.reference}`}
                url={`${window.location.origin}/shop/${product.slug}`}
              />
            </div>
          </div>

          <ul className="mt-8 space-y-2 border-t border-bone/10 pt-6 text-sm text-bone/55">
            <li>• 100% premium ringspun cotton, 220gsm</li>
            <li>• Soft hand-feel print, made to last</li>
            {settings.freeShippingThreshold > 0 && (
              <li>• Free delivery on orders over {formatPrice(settings.freeShippingThreshold)}</li>
            )}
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

      <ProductReviews productId={product.id} />

      {recentlyViewed.length > 0 && (
        <section className="mt-24">
          <h2 className="heading-serif mb-8 text-2xl text-bone sm:text-3xl">Recently viewed</h2>
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {recentlyViewed.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <SizeGuideModal 
        isOpen={sizeModalOpen} 
        onClose={() => setSizeModalOpen(false)} 
        category={product.category ?? 't-shirt'} 
      />
    </div>
  );
}
