import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '@/lib/api';
import { classNames, formatPrice } from '@/lib/format';
import { getRecentOrders, type RecentOrder } from '@/lib/recentOrders';
import { whatsappLink } from '@/lib/whatsapp';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import OrderReviews from '@/components/OrderReviews';
import type { OrderStatus, TrackedOrder } from '@/types';
import { usePageTitle } from '@/lib/usePageTitle';

const STEPS: Array<{ status: OrderStatus; title: string; hint: string }> = [
  { status: 'received', title: 'Order received', hint: 'Waiting for your Mobile Money payment.' },
  { status: 'paid', title: 'Payment confirmed', hint: 'We’re packing your order.' },
  { status: 'shipped', title: 'On its way', hint: 'Your order has been dispatched.' },
];

const fmt = (ts: number) =>
  new Date(ts).toLocaleString('en-GH', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

function Timeline({ order }: { order: TrackedOrder }) {
  if (order.status === 'cancelled') {
    const at = order.statusHistory.find((h) => h.status === 'cancelled')?.at;
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5">
        <p className="font-medium text-red-500">This order was cancelled{at ? ` on ${fmt(at)}` : ''}.</p>
        <p className="mt-1 text-sm text-bone/60">If you think this is a mistake, message us and we’ll sort it out.</p>
      </div>
    );
  }
  const reached = STEPS.findIndex((s) => s.status === order.status);
  return (
    <ol className="relative space-y-6 pl-8">
      <span className="absolute left-[11px] top-2 bottom-2 w-px bg-bone/15" aria-hidden="true" />
      {STEPS.map((step, i) => {
        const done = i <= reached;
        const current = i === reached;
        const at = order.statusHistory.find((h) => h.status === step.status)?.at;
        return (
          <li key={step.status} className="relative">
            <span
              className={classNames(
                'absolute -left-8 top-0.5 grid h-6 w-6 place-items-center rounded-full border-2 text-[11px] font-bold',
                done ? 'border-gold bg-gold text-ink' : 'border-bone/20 bg-ink text-bone/30'
              )}
              aria-hidden="true"
            >
              {done ? '✓' : i + 1}
            </span>
            <p className={classNames('font-medium', done ? 'text-bone' : 'text-bone/40')}>
              {step.title}
              {current && <span className="ml-2 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold">Now</span>}
            </p>
            <p className={classNames('text-sm', done ? 'text-bone/55' : 'text-bone/30')}>
              {done && at ? fmt(at) : step.hint}
              {current && at ? ` · ${step.hint}` : ''}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

export default function TrackOrder() {
  usePageTitle('Track Your Order');
  const { settings } = useStoreSettings();
  // Arriving from the order confirmation screen pre-fills via router state.
  const prefill = (useLocation().state ?? {}) as { id?: string; phone?: string };
  const [id, setId] = useState(prefill.id ?? '');
  const [phone, setPhone] = useState(prefill.phone ?? '');
  const [recent] = useState<RecentOrder[]>(getRecentOrders);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const lookup = async (orderId: string, orderPhone: string) => {
    setError(null);
    setLoading(true);
    try {
      setOrder(await api.trackOrder(orderId.trim().toUpperCase(), orderPhone));
    } catch (e) {
      setOrder(null);
      setError(e instanceof Error ? e.message : 'Could not look up that order.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (prefill.id && prefill.phone) void lookup(prefill.id, prefill.phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container-site max-w-2xl py-14 md:py-20">
      <p className="eyebrow mb-3">Order Status</p>
      <h1 className="heading-serif text-3xl text-bone sm:text-4xl">Track your order</h1>
      <p className="mt-3 text-bone/55">Enter the order number from your confirmation and the phone number you ordered with.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void lookup(id, phone);
        }}
        className="card-surface mt-8 grid gap-4 p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <div>
          <label htmlFor="track-id" className="mb-1.5 block text-xs font-medium text-bone/70">Order number</label>
          <input
            id="track-id"
            className="field font-mono uppercase"
            placeholder="LV-1A2B3C4D"
            value={id}
            onChange={(e) => setId(e.target.value.toUpperCase())}
            autoComplete="off"
            required
          />
        </div>
        <div>
          <label htmlFor="track-phone" className="mb-1.5 block text-xs font-medium text-bone/70">Phone number</label>
          <input
            id="track-phone"
            type="tel"
            className="field"
            placeholder="024 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            required
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Checking…' : 'Track'}
        </button>
      </form>

      {recent.length > 0 && !order && (
        <div className="mt-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-bone/40">Orders from this device</p>
          <div className="flex flex-wrap gap-2">
            {recent.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setId(r.id);
                  setPhone(r.phone);
                  void lookup(r.id, r.phone);
                }}
                className="rounded-full border border-bone/15 px-3 py-1.5 text-xs text-bone/70 transition hover:border-gold hover:text-gold"
              >
                <span className="font-mono font-semibold">{r.id}</span> · {formatPrice(r.total)}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="mt-6 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-500" role="alert">{error}</p>}

      {order && (
        <div className="mt-8 space-y-5" aria-live="polite">
          <section className="card-surface p-6">
            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-mono text-lg font-bold text-gold">{order.id}</h2>
              <p className="text-xs text-bone/45">Placed {fmt(order.createdAt)}{order.city ? ` · delivering to ${order.city}` : ''}{order.delivery ? ` · ${order.delivery}` : ''}</p>
            </div>
            <Timeline order={order} />
          </section>

          {order.customerNote && (
            <section className="rounded-xl border-l-2 border-gold bg-ink-800 p-5">
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gold">Message from Levush</p>
              <p className="whitespace-pre-line text-sm text-bone/80">{order.customerNote}</p>
            </section>
          )}

          <section className="card-surface p-6">
            <ul className="divide-y divide-bone/10 text-sm">
              {order.items.map((i, idx) => (
                <li key={idx} className="flex justify-between gap-3 py-2.5">
                  <span className="text-bone/80">
                    {i.name}
                    <span className="text-bone/45"> · {[i.color, i.size].filter(Boolean).join(', ')} × {i.quantity}</span>
                  </span>
                  <span className="text-bone">{formatPrice(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1.5 border-t border-bone/10 pt-3 text-sm">
              {order.discount > 0 && (
                <div className="flex justify-between text-gold"><dt>Discount</dt><dd>-{formatPrice(order.discount)}</dd></div>
              )}
              <div className="flex justify-between text-bone/60"><dt>Delivery</dt><dd>{order.shipping ? formatPrice(order.shipping) : 'Free'}</dd></div>
              <div className="flex justify-between font-medium text-bone"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
            </dl>
          </section>

          <OrderReviews order={order} phone={phone} />

          {settings.whatsappNumber && (
            <a
              href={whatsappLink(settings.whatsappNumber, `Hi Levush, I have a question about my order ${order.id}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full border border-[#25D366] px-6 py-3 text-sm font-semibold text-[#1a9e4b] transition hover:bg-[#25D366]/10"
            >
              Questions? Chat with us on WhatsApp
            </a>
          )}
        </div>
      )}

      <p className="mt-10 text-center text-sm text-bone/45">
        <Link to="/shop" className="hover:text-gold">← Back to the shop</Link>
      </p>
    </div>
  );
}
