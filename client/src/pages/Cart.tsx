import { Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { MinusIcon, PlusIcon } from '@/components/icons';
import { formatPrice, toWebp } from '@/lib/format';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { usePageTitle } from '@/lib/usePageTitle';

export default function Cart() {
  usePageTitle('Your Bag');
  const { items, subtotal, changeQuantity, removeItem, maxQty, hasUnavailable } = useCart();
  const { user } = useAuth();
  const { settings, shippingFor } = useStoreSettings();
  const shipping = shippingFor(subtotal);
  const total = subtotal + shipping;
  const toFreeShipping =
    settings.freeShippingThreshold > 0 && shipping > 0 ? settings.freeShippingThreshold - subtotal : 0;

  if (items.length === 0) {
    return (
      <div className="container-site py-28 text-center">
        <h1 className="heading-serif text-4xl text-bone">Your bag is empty</h1>
        <p className="mt-4 text-bone/55">Find a word worth wearing.</p>
        <Link to="/shop" className="btn-primary mt-8">Browse the collection</Link>
      </div>
    );
  }

  return (
    <div className="container-site py-12 md:py-16">
      <h1 className="heading-serif mb-10 text-3xl text-bone sm:text-5xl">Your Bag</h1>

      <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <ul className="divide-y divide-bone/10">
          {items.map((item) => (
            <li key={item.id} className="flex gap-4 sm:gap-5 py-6">
              <img
                src={toWebp(item.image) || '/assets/Created_with_purpose.webp'}
                alt={item.name}
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/assets/Created_with_purpose.webp';
                }}
                className="h-28 sm:h-32 w-24 sm:w-28 rounded-xl object-cover"
              />
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-medium text-bone">{item.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-bone/45">
                      {item.colorLabel ?? item.color} · {item.size}
                    </p>
                    {item.soldOut && (
                      <p className="mt-1 text-xs font-semibold text-red-500" role="alert">Sold out. Please remove to continue.</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gold">{formatPrice(item.price * item.quantity)}</p>
                    {item.originalPrice && item.originalPrice > item.price && (
                      <p className="text-xs text-bone/40 line-through">
                        {formatPrice(item.originalPrice * item.quantity)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center gap-1 rounded-full border border-bone/15 px-1 py-0.5">
                    <button onClick={() => changeQuantity(item.id, -1)} aria-label="Decrease" className="grid h-8 w-8 place-items-center rounded-full text-bone/70 hover:bg-bone/5 hover:text-bone">
                      <MinusIcon width={15} height={15} />
                    </button>
                    <span className="w-5 text-center text-sm">{item.quantity}</span>
                    <button onClick={() => changeQuantity(item.id, 1)} disabled={item.quantity >= maxQty} aria-label="Increase" className="grid h-8 w-8 place-items-center rounded-full text-bone/70 hover:bg-bone/5 hover:text-bone disabled:opacity-30 disabled:cursor-not-allowed">
                      <PlusIcon width={15} height={15} />
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-sm text-bone/45 hover:text-bone/75">
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="card-surface p-7">
            <h2 className="heading-serif text-2xl text-bone">Summary</h2>

            {(() => {
              const totalSavings = items.reduce((sum, i) => {
                if (i.originalPrice && i.originalPrice > i.price) {
                  return sum + (i.originalPrice - i.price) * i.quantity;
                }
                return sum;
              }, 0);
              return (
                <dl className="mt-6 space-y-3 border-t border-bone/10 pt-5 text-sm">
                  {totalSavings > 0 && (
                    <div className="flex justify-between font-medium text-red-400">
                      <dt>Product Savings</dt>
                      <dd>-{formatPrice(totalSavings)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between text-bone/65">
                    <dt>Subtotal</dt>
                    <dd>{formatPrice(subtotal)}</dd>
                  </div>
                  <div className="flex justify-between text-bone/65">
                    <dt>Shipping</dt>
                    <dd>{shipping === 0 ? 'Free' : formatPrice(shipping)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-bone/10 pt-3 text-base font-medium text-bone">
                    <dt>Total</dt>
                    <dd className="font-serif text-xl">{formatPrice(total)}</dd>
                  </div>
                </dl>
              );
            })()}

            {toFreeShipping > 0 && (
              <p className="mt-4 rounded-lg bg-gold/10 px-3 py-2 text-center text-xs text-gold">
                Add {formatPrice(toFreeShipping)} more for free delivery
              </p>
            )}

            {hasUnavailable ? (
              <p className="mt-5 rounded-lg bg-red-500/10 px-4 py-3 text-center text-sm text-red-500">
                Remove sold-out items to continue to checkout.
              </p>
            ) : (
              <Link to="/checkout" className="btn-primary mt-5 w-full text-center py-4 text-lg">
                Proceed to Checkout
              </Link>
            )}
            <p className="mt-3 text-center text-xs text-bone/40">
              {user ? `Signed in as ${user.email}` : 'Checkout as guest or sign in for order history.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
