import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { useCatalog } from '@/context/CatalogContext';
import { api } from '@/lib/api';
import { formatPrice, toWebp } from '@/lib/format';
import { ArrowRight } from '@/components/icons';
import OrderPayment, { LAST_ORDER_KEY, type PlacedOrder } from '@/components/OrderPayment';
import { rememberOrder } from '@/lib/recentOrders';
import type { PublicCoupon } from '@/types';

/** Mirror of the server's coupon maths, for the live order summary. */
function couponDiscount(c: PublicCoupon, subtotal: number): number {
  if (c.kind === 'shipping' || subtotal < c.minSubtotal) return 0;
  let d = c.kind === 'percent' ? Math.round((subtotal * c.value) / 100) : c.value;
  if (c.kind === 'percent' && c.maxDiscount !== null) d = Math.min(d, c.maxDiscount);
  return Math.max(0, Math.min(d, subtotal));
}

function describeOffer(c: PublicCoupon): string {
  const what =
    c.kind === 'percent'
      ? `${c.value}% off${c.maxDiscount ? ` (up to ${formatPrice(c.maxDiscount)})` : ''}`
      : c.kind === 'fixed'
      ? `${formatPrice(c.value)} off`
      : 'Free delivery';
  return c.minSubtotal > 0 ? `${what} on orders over ${formatPrice(c.minSubtotal)}` : what;
}

export default function Checkout() {
  const { items, subtotal, clear, hasUnavailable, removeItem } = useCart();
  const { user, authHeader } = useAuth();
  const { settings, shippingFor } = useStoreSettings();
  const { refresh: refreshCatalog } = useCatalog();

  const [email, setEmail] = useState(user?.email ?? '');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState<PublicCoupon | null>(null);
  const [offers, setOffers] = useState<PublicCoupon[]>([]);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [placing, setPlacing] = useState(false);
  // Survives a refresh of the confirmation screen (payment details stay visible).
  const [placed, setPlaced] = useState<PlacedOrder | null>(() => {
    // Only restore it if the bag is empty; a new bag means a new checkout.
    if (items.length > 0) return null;
    try {
      const raw = sessionStorage.getItem(LAST_ORDER_KEY);
      return raw ? (JSON.parse(raw) as PlacedOrder) : null;
    } catch {
      return null;
    }
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.publicCoupons().then(setOffers).catch(() => setOffers([]));
  }, []);

  const baseShipping = shippingFor(subtotal);
  const couponMeetsMinimum = !couponApplied || subtotal >= couponApplied.minSubtotal;
  const freeShippingPromo = couponApplied?.kind === 'shipping' && couponMeetsMinimum;
  const shipping = freeShippingPromo ? 0 : baseShipping;
  const discount = couponApplied ? couponDiscount(couponApplied, subtotal) : 0;
  const total = Math.max(0, subtotal - discount) + shipping;

  const applyCoupon = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setValidatingCoupon(true);
    setCouponError(null);
    try {
      const res = await api.validateCoupon(trimmed, { subtotal, email: email || undefined });
      if (res.valid) {
        const { valid: _valid, ...coupon } = res;
        setCouponApplied(coupon);
        setCouponInput('');
      } else {
        setCouponError(res.error ?? 'Invalid or expired coupon code.');
      }
    } catch {
      setCouponError('Could not check that code. Try again.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCouponApplied(null);
    setCouponError(null);
  };

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !firstName || !lastName || !address || !city || !phone) {
      setError('Please fill out all required fields.');
      return;
    }
    if (!settings.ordersOpen) {
      setError(settings.closedMessage);
      return;
    }

    setPlacing(true);
    try {
      const header = await authHeader();
      const res = await api.createOrder(
        {
          email,
          couponCode: couponApplied?.code ?? null,
          shippingAddress: {
            firstName,
            lastName,
            address,
            city,
            phone,
          },
          paymentMethod: 'Mobile Money',
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            image: i.image.startsWith('data:') ? undefined : i.image,
            color: i.colorLabel ?? i.color,
            colorKey: i.color,
            size: i.size,
            quantity: i.quantity,
            price: i.price,
          })),
        },
        header
      );
      const order: PlacedOrder = {
        id: res.id,
        items: items.map((i) => ({
          name: i.name,
          color: i.colorLabel ?? i.color,
          size: i.size,
          quantity: i.quantity,
          price: i.price,
        })),
        subtotal,
        discount: res.discount,
        couponCode: res.discount > 0 || freeShippingPromo ? couponApplied?.code ?? null : null,
        shipping: res.shipping,
        total: res.total,
        customer: { firstName, lastName, phone, email, address, city },
      };
      try {
        sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
      } catch {
        /* non-critical */
      }
      rememberOrder({ id: res.id, phone, total: res.total, at: Date.now() });
      setPlaced(order);
      clear();
      window.scrollTo({ top: 0 });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not place order.';
      // A coupon that stopped applying (limit hit, wrong email...) shouldn't
      // block the order: drop it and let the shopper review and retry.
      if (couponApplied && /code/i.test(message)) {
        setCouponApplied(null);
        setCouponError(message);
        setError(`${message} We removed the code. Check your new total and place the order again.`);
      } else {
        setError(`Could not place order: ${message}`);
        // Pull fresh stock so the sold-out line gets flagged in the bag.
        if (/sold out|no longer available/i.test(message)) void refreshCatalog(true);
      }
    } finally {
      setPlacing(false);
    }
  };

  if (placed) {
    return (
      <OrderPayment
        order={placed}
        onDone={() => {
          sessionStorage.removeItem(LAST_ORDER_KEY);
          setPlaced(null);
        }}
      />
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-site py-28 text-center">
        <h1 className="heading-serif text-4xl text-bone">Your bag is empty</h1>
        <p className="mt-4 text-bone/55">You need items in your cart to checkout.</p>
        <Link to="/shop" className="btn-primary mt-8">Browse the collection</Link>
      </div>
    );
  }

  return (
    <div className="container-site py-12 md:py-16">
      <div className="mb-10">
        <Link to="/cart" className="text-sm font-medium text-bone/60 hover:text-bone transition-colors inline-flex items-center gap-2">
          <ArrowRight width={14} height={14} className="rotate-180" /> Back to Cart
        </Link>
        <h1 className="heading-serif mt-4 text-3xl text-bone sm:text-4xl">Checkout</h1>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        {/* Left Side: Forms */}
        <form onSubmit={placeOrder} className="space-y-10">
          {/* Contact */}
          <section className="card-surface p-6 sm:p-8">
            <h2 className="heading-serif text-xl text-bone mb-6">Contact Information</h2>
            <div>
              <label htmlFor="checkout-email" className="mb-2 block text-sm font-medium text-bone/80">Email Address *</label>
              <input
                id="checkout-email"
                autoComplete="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="field"
                required
              />
            </div>
            {!user && (
              <p className="mt-3 text-sm text-bone/50">
                Already have an account? <Link to="/account" className="text-gold hover:underline">Log in</Link>
              </p>
            )}
          </section>

          {/* Shipping */}
          <section className="card-surface p-6 sm:p-8">
            <h2 className="heading-serif text-xl text-bone mb-6">Delivery Location</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="checkout-firstName" className="mb-2 block text-sm font-medium text-bone/80">First Name *</label>
                <input
                  id="checkout-firstName"
                  autoComplete="given-name"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="field"
                  required
                />
              </div>
              <div>
                <label htmlFor="checkout-lastName" className="mb-2 block text-sm font-medium text-bone/80">Last Name *</label>
                <input
                  id="checkout-lastName"
                  autoComplete="family-name"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="field"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="checkout-address" className="mb-2 block text-sm font-medium text-bone/80">Address *</label>
                <input
                  id="checkout-address"
                  autoComplete="street-address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address, P.O. box, etc."
                  className="field"
                  required
                />
              </div>
              <div>
                <label htmlFor="checkout-city" className="mb-2 block text-sm font-medium text-bone/80">City *</label>
                <input
                  id="checkout-city"
                  autoComplete="address-level2"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="field"
                  required
                />
              </div>
              <div>
                <label htmlFor="checkout-phone" className="mb-2 block text-sm font-medium text-bone/80">Phone Number *</label>
                <input
                  id="checkout-phone"
                  autoComplete="tel"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="field"
                  required
                />
              </div>
            </div>
          </section>

          {/* Payment */}
          <section className="card-surface p-6 sm:p-8">
            <h2 className="heading-serif text-xl text-bone mb-6">Payment</h2>
            <div className="flex items-start gap-4 rounded-xl border border-gold bg-gold/5 p-4">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold text-sm font-bold text-ink">₵</span>
              <div>
                <p className="font-medium text-bone">Mobile Money (MoMo)</p>
                <p className="mt-1 text-sm text-bone/60">
                  After you place your order, you’ll get our MoMo number and can send us your order on WhatsApp
                  {settings.whatsappNumber ? '' : ' or by phone'}. We confirm every payment before dispatch.
                </p>
              </div>
            </div>

            {error && <p className="mt-5 text-sm text-red-400 p-4 bg-red-400/10 rounded-lg">{error}</p>}

            {!settings.ordersOpen && (
              <p className="mt-5 rounded-lg bg-gold/10 p-4 text-sm text-gold">{settings.closedMessage}</p>
            )}

            {hasUnavailable && (
              <div className="mt-5 rounded-lg bg-red-500/10 p-4 text-sm text-red-500" role="alert">
                Some items in your bag just sold out.{' '}
                <button
                  type="button"
                  onClick={() => items.filter((i) => i.soldOut).forEach((i) => removeItem(i.id))}
                  className="font-semibold underline"
                >
                  Remove them
                </button>{' '}
                to continue.
              </div>
            )}

            <button type="submit" disabled={placing || !settings.ordersOpen || hasUnavailable} className="btn-primary mt-8 w-full py-4 text-lg">
              {placing ? 'Placing order…' : `Place Order · ${formatPrice(total)}`}
            </button>
          </section>
        </form>

        {/* Right Side: Order Summary */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="card-surface p-7">
            <h2 className="heading-serif text-xl text-bone mb-6">Order Summary</h2>
            
            <ul className="divide-y divide-bone/10 mb-6">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 py-4">
                  <div className="relative">
                    <img
                      src={toWebp(item.image) || '/assets/Created_with_purpose.webp'}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/assets/Created_with_purpose.webp';
                      }}
                      className="h-16 w-16 rounded-md object-cover border border-bone/10"
                    />
                    <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-bone text-[10px] font-bold text-ink">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col justify-center">
                    <p className="text-sm font-medium text-bone">{item.name}</p>
                    <p className="text-xs text-bone/50">{item.colorLabel ?? item.color} · {item.size}</p>
                    {item.soldOut && <p className="text-xs font-semibold text-red-500">Sold out</p>}
                  </div>
                  <p className="text-sm font-medium text-gold self-center">{formatPrice(item.price * item.quantity)}</p>
                </li>
              ))}
            </ul>

            {/* Coupon Code Section */}
            <div className="my-6 border-y border-bone/10 py-5">
              {couponApplied ? (
                <div className="rounded-xl border border-gold/40 bg-gold/10 p-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-mono text-xs font-bold text-gold uppercase tracking-wider">
                        {couponApplied.code}
                      </span>
                      <span className="text-xs text-bone/60">{couponApplied.label || describeOffer(couponApplied)}</span>
                    </div>
                    <button type="button" onClick={removeCoupon} className="text-xs text-bone/50 hover:text-bone underline">
                      Remove
                    </button>
                  </div>
                  {!couponMeetsMinimum && (
                    <p className="mt-2 text-xs text-red-400">
                      Add {formatPrice(couponApplied.minSubtotal - subtotal)} more to use this code.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <label htmlFor="checkout-coupon" className="sr-only">Discount code</label>
                  <div className="flex gap-2">
                    <input
                      id="checkout-coupon"
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        // Enter here must apply the code, not submit the order form.
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void applyCoupon(couponInput);
                        }
                      }}
                      placeholder="Discount code"
                      autoComplete="off"
                      className="flex-1 rounded-xl border border-bone/20 bg-ink-800/80 px-4 py-2.5 text-sm uppercase text-bone placeholder-bone/40 outline-none focus:border-gold"
                    />
                    <button
                      type="button"
                      onClick={() => void applyCoupon(couponInput)}
                      disabled={validatingCoupon || !couponInput.trim()}
                      className="rounded-xl border border-bone/20 bg-ink-700 px-4 py-2.5 text-sm font-semibold text-bone hover:border-gold hover:text-gold transition disabled:opacity-40"
                    >
                      {validatingCoupon ? 'Checking...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && <p className="text-xs text-red-400" role="alert">{couponError}</p>}

                  {offers.length > 0 && (
                    <div className="pt-2">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-bone/40">Available offers</p>
                      <ul className="space-y-2">
                        {offers.map((o) => (
                          <li key={o.code}>
                            <button
                              type="button"
                              onClick={() => void applyCoupon(o.code)}
                              disabled={validatingCoupon}
                              className="flex w-full items-center justify-between gap-3 rounded-lg border border-dashed border-gold/40 px-3 py-2 text-left transition hover:bg-gold/5 disabled:opacity-50"
                            >
                              <span>
                                <span className="block font-mono text-xs font-bold text-gold">{o.code}</span>
                                <span className="block text-xs text-bone/55">{o.label || describeOffer(o)}</span>
                              </span>
                              <span className="text-xs font-semibold text-gold">Apply</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between text-bone/65">
                <dt>Subtotal</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
              {couponApplied && discount > 0 && (
                <div className="flex justify-between text-gold">
                  <dt>Discount{couponApplied.kind === 'percent' ? ` (${couponApplied.value}%)` : ''}</dt>
                  <dd>-{formatPrice(discount)}</dd>
                </div>
              )}
              {freeShippingPromo && baseShipping > 0 && (
                <div className="flex justify-between text-gold">
                  <dt>Free Delivery Promo</dt>
                  <dd>-{formatPrice(baseShipping)}</dd>
                </div>
              )}
              <div className="flex justify-between text-bone/65">
                <dt>Shipping</dt>
                <dd>{shipping === 0 ? 'Free' : formatPrice(shipping)}</dd>
              </div>
              <div className="flex justify-between border-t border-bone/10 pt-4 mt-4 text-base font-medium text-bone">
                <dt>Total</dt>
                <dd className="font-serif text-xl text-gold">{formatPrice(total)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
