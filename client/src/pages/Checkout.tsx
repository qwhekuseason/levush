import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { formatPrice, toWebp } from '@/lib/format';
import { ArrowRight } from '@/components/icons';

const FREE_SHIPPING_THRESHOLD = 400;
const SHIPPING_FEE = 30;

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { user, authHeader } = useAuth();

  const [email, setEmail] = useState(user?.email ?? '');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'card'>('paystack');

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState<{
    code: string;
    kind: 'percent' | 'shipping';
    value: number;
    label: string;
  } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const baseShipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const shipping = couponApplied?.kind === 'shipping' ? 0 : baseShipping;
  const percentDiscount = couponApplied?.kind === 'percent' ? Math.round(subtotal * (couponApplied.value / 100)) : 0;
  const total = Math.max(0, subtotal - percentDiscount) + shipping;

  const applyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setValidatingCoupon(true);
    setCouponError(null);
    try {
      const res = await api.validateCoupon(couponInput.trim());
      if (res.valid && res.kind && res.value !== undefined) {
        setCouponApplied({
          code: res.code ?? couponInput.trim().toUpperCase(),
          kind: res.kind as 'percent' | 'shipping',
          value: res.value,
          label: res.label ?? 'Discount Applied',
        });
        setCouponInput('');
      } else {
        setCouponError('Invalid or expired coupon code.');
      }
    } catch {
      setCouponError('Could not validate coupon. Try again.');
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
          paymentMethod: paymentMethod === 'paystack' ? 'Mobile Money / Paystack' : paymentMethod === 'card' ? 'Debit/Credit Card' : 'Cash on Delivery',
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            image: i.image,
            color: i.color,
            size: i.size,
            quantity: i.quantity,
            price: i.price,
          })),
        },
        header
      );
      setOrderId(res.id);
      clear();
    } catch (err) {
      setError(
        err instanceof Error
          ? `Could not place order: ${err.message}.`
          : 'Could not place order.'
      );
    } finally {
      setPlacing(false);
    }
  };

  if (orderId) {
    return (
      <div className="container-site py-28 text-center">
        <p className="eyebrow mb-4">Order Confirmed</p>
        <h1 className="heading-serif text-4xl text-bone">Thank you, {firstName}. 🙏</h1>
        <p className="mx-auto mt-4 max-w-md text-bone/60">
          Your order <span className="font-mono text-gold">{orderId}</span> is being processed. We’ve sent a
          confirmation to <span className="text-bone">{email}</span>.
        </p>
        <Link to="/shop" className="btn-primary mt-8">Keep shopping</Link>
      </div>
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
              <label className="mb-2 block text-sm font-medium text-bone/80">Email Address *</label>
              <input
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
                <label className="mb-2 block text-sm font-medium text-bone/80">First Name *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="field"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-bone/80">Last Name *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="field"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-bone/80">Address *</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address, P.O. box, etc."
                  className="field"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-bone/80">City *</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="field"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-bone/80">Phone Number *</label>
                <input
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
            <p className="text-sm text-bone/60 mb-5">All transactions are secure and encrypted.</p>
            
            <div className="space-y-4">
              <label className={`flex items-center justify-between cursor-pointer rounded-xl border p-4 transition-colors ${paymentMethod === 'paystack' ? 'border-gold bg-gold/5' : 'border-bone/10 hover:border-bone/30'}`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="paystack"
                    checked={paymentMethod === 'paystack'}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="h-4 w-4 accent-gold"
                  />
                  <span className="font-medium text-bone">Mobile Money / Paystack</span>
                </div>
              </label>

              <label className={`flex items-center justify-between cursor-pointer rounded-xl border p-4 transition-colors ${paymentMethod === 'card' ? 'border-gold bg-gold/5' : 'border-bone/10 hover:border-bone/30'}`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="h-4 w-4 accent-gold"
                  />
                  <span className="font-medium text-bone">Credit/Debit Card</span>
                </div>
              </label>
            </div>

            {error && <p className="mt-5 text-sm text-red-400 p-4 bg-red-400/10 rounded-lg">{error}</p>}

            <button type="submit" disabled={placing} className="btn-primary mt-8 w-full py-4 text-lg">
              {placing ? 'Processing...' : `Pay ${formatPrice(total)}`}
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
                      src={toWebp(item.image) || '/assets/hero-poster.webp'}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/assets/hero-poster.webp';
                      }}
                      className="h-16 w-16 rounded-md object-cover border border-bone/10"
                    />
                    <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-bone text-[10px] font-bold text-ink">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col justify-center">
                    <p className="text-sm font-medium text-bone">{item.name}</p>
                    <p className="text-xs text-bone/50">{item.color} · {item.size}</p>
                  </div>
                  <p className="text-sm font-medium text-gold self-center">{formatPrice(item.price * item.quantity)}</p>
                </li>
              ))}
            </ul>

            {/* Coupon Code Section */}
            <div className="my-6 border-y border-bone/10 py-5">
              {couponApplied ? (
                <div className="flex items-center justify-between rounded-xl border border-gold/40 bg-gold/10 p-3.5">
                  <div className="flex flex-col">
                    <span className="font-mono text-xs font-bold text-gold uppercase tracking-wider">
                      {couponApplied.code}
                    </span>
                    <span className="text-xs text-bone/60">{couponApplied.label}</span>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-xs text-bone/50 hover:text-bone underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Discount code"
                      className="flex-1 rounded-xl border border-bone/20 bg-ink-800/80 px-4 py-2.5 text-sm uppercase text-bone placeholder-bone/40 outline-none focus:border-gold"
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={validatingCoupon || !couponInput.trim()}
                      className="rounded-xl border border-bone/20 bg-ink-700 px-4 py-2.5 text-sm font-semibold text-bone hover:border-gold hover:text-gold transition disabled:opacity-40"
                    >
                      {validatingCoupon ? 'Checking...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && <p className="text-xs text-red-400">{couponError}</p>}
                </div>
              )}
            </div>

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between text-bone/65">
                <dt>Subtotal</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
              {couponApplied && percentDiscount > 0 && (
                <div className="flex justify-between text-gold">
                  <dt>Discount ({couponApplied.value}%)</dt>
                  <dd>-{formatPrice(percentDiscount)}</dd>
                </div>
              )}
              {couponApplied && couponApplied.kind === 'shipping' && (
                <div className="flex justify-between text-gold">
                  <dt>Free Shipping Promo</dt>
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
