import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { classNames, formatPrice } from '@/lib/format';
import { downloadCsv, ordersToCsv } from '@/lib/csv';
import type { Order } from '@/types';

type Preset = 'today' | '7d' | '30d' | 'month' | 'all' | 'custom';
const PRESETS: Array<{ key: Preset; label: string }> = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: 'month', label: 'This month' },
  { key: 'all', label: 'All time' },
  { key: 'custom', label: 'Custom' },
];

const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const toInput = (ts: number) => new Date(ts - new Date(ts).getTimezoneOffset() * 60_000).toISOString().slice(0, 10);

function rangeFor(p: Preset, from: string, to: string): [number, number] {
  const now = new Date();
  const end = dayStart(now) + 86_400_000;
  switch (p) {
    case 'today': return [dayStart(now), end];
    case '7d': return [end - 7 * 86_400_000, end];
    case '30d': return [end - 30 * 86_400_000, end];
    case 'month': return [new Date(now.getFullYear(), now.getMonth(), 1).getTime(), end];
    case 'all': return [0, Infinity];
    case 'custom': return [from ? new Date(`${from}T00:00`).getTime() : 0, to ? new Date(`${to}T00:00`).getTime() + 86_400_000 : Infinity];
  }
}

/** Sum units and money by a key, biggest first. */
function tally<T extends string>(rows: Array<{ key: T; units: number; amount: number }>) {
  const map = new Map<T, { units: number; amount: number }>();
  for (const r of rows) {
    const cur = map.get(r.key) ?? { units: 0, amount: 0 };
    map.set(r.key, { units: cur.units + r.units, amount: cur.amount + r.amount });
  }
  return [...map.entries()].map(([key, v]) => ({ key, ...v })).sort((a, b) => b.units - a.units || b.amount - a.amount);
}

function Table({ title, rows, unitLabel = 'Units', money = true }: { title: string; rows: Array<{ key: string; units: number; amount: number }>; unitLabel?: string; money?: boolean }) {
  return (
    <section className="card-surface p-5">
      <h3 className="heading-serif mb-3 text-lg text-bone">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-bone/45">No sales in this period.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-bone/45">
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 text-right font-medium">{unitLabel}</th>
              {money && <th className="pb-2 text-right font-medium">Amount</th>}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 10).map((r) => (
              <tr key={r.key} className="border-t border-bone/5">
                <td className="py-1.5 text-bone/85">{r.key || '—'}</td>
                <td className="py-1.5 text-right text-bone">{r.units}</td>
                {money && <td className="py-1.5 text-right text-bone/70">{formatPrice(r.amount)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default function AdminReports() {
  const { authHeader } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<Preset>('30d');
  const [from, setFrom] = useState(toInput(Date.now() - 29 * 86_400_000));
  const [to, setTo] = useState(toInput(Date.now()));

  useEffect(() => {
    (async () => {
      try {
        const h = await authHeader();
        if (!h) throw new Error('Your session expired — sign in again.');
        setOrders(await api.listAllOrders(h));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load orders.');
      } finally {
        setLoaded(true);
      }
    })();
  }, [authHeader]);

  const [start, end] = rangeFor(preset, from, to);
  const inRange = useMemo(() => orders.filter((o) => o.createdAt >= start && o.createdAt < end), [orders, start, end]);
  // Sales = money actually received (Paid or Shipped).
  const sold = inRange.filter((o) => o.status === 'paid' || o.status === 'shipped');
  const revenue = sold.reduce((n, o) => n + o.total, 0);
  const awaiting = inRange.filter((o) => o.status === 'received');
  const units = sold.reduce((n, o) => n + o.items.reduce((m, i) => m + i.quantity, 0), 0);
  const lines = sold.flatMap((o) => o.items);

  const byProduct = tally(lines.map((i) => ({ key: i.name, units: i.quantity, amount: i.price * i.quantity })));
  const bySize = tally(lines.map((i) => ({ key: i.size ?? '', units: i.quantity, amount: i.price * i.quantity })));
  const byColour = tally(lines.map((i) => ({ key: i.color ?? '', units: i.quantity, amount: i.price * i.quantity })));
  const byDelivery = tally(sold.map((o) => ({ key: o.delivery?.name ?? 'Standard', units: 1, amount: o.shipping })));
  const byCoupon = tally(sold.filter((o) => o.couponCode).map((o) => ({ key: o.couponCode!, units: 1, amount: o.discount })));

  const label = PRESETS.find((p) => p.key === preset)?.label ?? '';
  const exportCsv = () => {
    const stamp = toInput(Date.now());
    downloadCsv(`levush-orders-${preset === 'all' ? 'all' : `${toInput(start)}-to-${toInput(Math.min(end, Date.now()) - 1)}`}-${stamp}.csv`, ordersToCsv(inRange));
  };

  const stats = [
    { label: 'Sales (paid)', value: formatPrice(revenue), sub: `${sold.length} paid order${sold.length === 1 ? '' : 's'}` },
    { label: 'Awaiting payment', value: formatPrice(awaiting.reduce((n, o) => n + o.total, 0)), sub: `${awaiting.length} order${awaiting.length === 1 ? '' : 's'}` },
    { label: 'Pieces sold', value: String(units), sub: sold.length ? `${(units / sold.length).toFixed(1)} per order` : '—' },
    { label: 'Average order', value: formatPrice(sold.length ? revenue / sold.length : 0), sub: `${inRange.filter((o) => o.status === 'cancelled').length} cancelled` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="heading-serif text-2xl text-bone">Reports</h2>
        <button onClick={exportCsv} disabled={!inRange.length} className="btn-outline text-sm disabled:opacity-40">
          Download orders (CSV) · {inRange.length}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPreset(p.key)}
            className={classNames('rounded-full px-3 py-1.5 text-xs font-medium transition', preset === p.key ? 'bg-gold text-ink' : 'border border-bone/15 text-bone/60 hover:text-bone')}
          >
            {p.label}
          </button>
        ))}
        {preset === 'custom' && (
          <span className="ml-2 flex items-center gap-2 text-xs text-bone/60">
            <label htmlFor="rep-from" className="sr-only">From</label>
            <input id="rep-from" type="date" className="field !py-1.5 text-xs" value={from} onChange={(e) => setFrom(e.target.value)} />
            to
            <label htmlFor="rep-to" className="sr-only">To</label>
            <input id="rep-to" type="date" className="field !py-1.5 text-xs" value={to} onChange={(e) => setTo(e.target.value)} />
          </span>
        )}
      </div>

      {error && <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400" role="alert">{error}</p>}
      {!loaded ? (
        <p className="text-sm text-bone/45">Loading orders…</p>
      ) : (
        <>
          <p className="text-xs text-bone/45">
            {label}: {inRange.length} order{inRange.length === 1 ? '' : 's'} placed. Sales count only Paid and Shipped orders.
            {orders.length >= 500 && ' Showing the latest 500 orders.'}
          </p>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="card-surface p-4">
                <p className="text-xs text-bone/50">{s.label}</p>
                <p className="mt-1 text-2xl font-semibold text-bone">{s.value}</p>
                <p className="text-xs text-bone/45">{s.sub}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Table title="Best sellers" rows={byProduct} />
            <Table title="Sizes" rows={bySize} />
            <Table title="Colours" rows={byColour} />
            <Table title="Delivery options" rows={byDelivery} unitLabel="Orders" />
            <Table title="Coupons used" rows={byCoupon} unitLabel="Uses" />
          </div>
        </>
      )}
    </div>
  );
}
