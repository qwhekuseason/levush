import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCatalog } from '@/context/CatalogContext';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import type { Order } from '@/types';

function SparkLine({ data, color = '#b8923a' }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 160;
  const h = 48;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`)
    .join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points={`0,${h} ${pts} ${w},${h}`}
        fill={color}
        fillOpacity="0.08"
        stroke="none"
      />
    </svg>
  );
}

function RevenueChart({ orders }: { orders: Order[] }) {
  // Group daily revenue for the last 14 days
  const days = useMemo(() => {
    const now = Date.now();
    const map: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * 86_400_000).toISOString().slice(0, 10);
      map[d] = 0;
    }
    for (const o of orders) {
      if (o.status === 'cancelled') continue;
      const d = new Date(o.createdAt).toISOString().slice(0, 10);
      if (d in map) map[d] += o.total;
    }
    return Object.entries(map);
  }, [orders]);

  const max = Math.max(...days.map(([, v]) => v), 1);
  const w = 600;
  const h = 120;
  const pad = { t: 12, r: 12, b: 28, l: 52 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;

  const points = days.map(([, v], i) => [
    pad.l + (i / (days.length - 1)) * innerW,
    pad.t + innerH - (v / max) * innerH,
  ]);
  const pathD = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  const fillD = `M${pad.l},${pad.t + innerH} ${pathD.slice(1)} L${pad.l + innerW},${pad.t + innerH}Z`;

  const ticks = [0, max * 0.5, max].map((v) => Math.round(v));

  return (
    <div className="overflow-x-auto">
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="min-w-[320px]">
        {/* grid lines */}
        {ticks.map((t) => {
          const y = pad.t + innerH - (t / max) * innerH;
          return (
            <g key={t}>
              <line x1={pad.l} y1={y} x2={pad.l + innerW} y2={y} stroke="currentColor" strokeOpacity="0.07" />
              <text x={pad.l - 6} y={y + 4} fontSize="9" textAnchor="end" fill="currentColor" fillOpacity="0.4">
                {t === 0 ? '' : formatPrice(t).replace('GH₵ ', '₵')}
              </text>
            </g>
          );
        })}
        {/* x labels — every other day */}
        {days.map(([d], i) =>
          i % 2 === 0 ? (
            <text key={d} x={points[i][0]} y={h - 4} fontSize="8" textAnchor="middle" fill="currentColor" fillOpacity="0.4">
              {d.slice(5)}
            </text>
          ) : null
        )}
        {/* area fill */}
        <path d={fillD} fill="#b8923a" fillOpacity="0.1" />
        {/* line */}
        <path d={pathD} fill="none" stroke="#b8923a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* dots */}
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill="#b8923a" />
        ))}
      </svg>
      <p className="mt-1 text-right text-xs text-bone/35">Last 14 days</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { authHeader } = useAuth();
  const { products } = useCatalog();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const header = await authHeader();
        if (header) setOrders(await api.listAllOrders(header));
      } catch { /* ignore */ } finally {
        setLoaded(true);
      }
    })();
  }, [authHeader]);

  const activeOrders = orders.filter((o) => o.status !== 'cancelled');
  const revenue = activeOrders.reduce((n, o) => n + o.total, 0);
  const aov = activeOrders.length ? revenue / activeOrders.length : 0;
  const pending = orders.filter((o) => o.status === 'received').length;
  const shipped = orders.filter((o) => o.status === 'shipped').length;

  // Best selling products by revenue
  const productRevenue = useMemo(() => {
    const map: Record<string, { name: string; qty: number; rev: number }> = {};
    for (const o of activeOrders) {
      for (const item of o.items) {
        if (!map[item.productId]) map[item.productId] = { name: item.name, qty: 0, rev: 0 };
        map[item.productId].qty += item.quantity;
        map[item.productId].rev += item.price * item.quantity;
      }
    }
    return Object.values(map).sort((a, b) => b.rev - a.rev).slice(0, 5);
  }, [activeOrders]);

  // Sparkline data — last 7 days of revenue
  const sparkData = useMemo(() => {
    const now = Date.now();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now - (6 - i) * 86_400_000).toISOString().slice(0, 10);
      return activeOrders.filter((o) => new Date(o.createdAt).toISOString().slice(0, 10) === d).reduce((s, o) => s + o.total, 0);
    });
  }, [activeOrders]);

  const stats = [
    { label: 'Total Revenue', value: loaded ? formatPrice(revenue) : '…', sub: 'excl. cancelled', to: '/admin/orders', spark: sparkData },
    { label: 'Total Orders', value: loaded ? orders.length : '…', sub: `${pending} awaiting fulfilment`, to: '/admin/orders', spark: null },
    { label: 'Avg Order Value', value: loaded ? formatPrice(aov) : '…', sub: 'active orders only', to: '/admin/orders', spark: null },
    { label: 'Products', value: products.length, sub: `${shipped} orders shipped`, to: '/admin/products', spark: null },
  ];

  return (
    <div className="space-y-8">
      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="card-surface group p-5 transition hover:border-gold/40">
            <p className="text-xs text-bone/50">{s.label}</p>
            <p className="mt-2 font-serif text-3xl text-bone">{s.value}</p>
            <p className="mt-1 text-xs text-bone/35">{s.sub}</p>
            {s.spark && (
              <div className="mt-3 opacity-70 group-hover:opacity-100 transition-opacity">
                <SparkLine data={s.spark} />
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="card-surface p-6">
        <h2 className="heading-serif mb-5 text-xl text-bone">Revenue — last 14 days</h2>
        {!loaded ? (
          <p className="text-sm text-bone/45">Loading…</p>
        ) : (
          <RevenueChart orders={orders} />
        )}
      </div>

      {/* Best sellers + Recent orders side by side */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Best sellers */}
        <div className="card-surface p-6">
          <h2 className="heading-serif mb-4 text-xl text-bone">Best Sellers</h2>
          {!loaded ? (
            <p className="text-sm text-bone/45">Loading…</p>
          ) : productRevenue.length === 0 ? (
            <p className="text-sm text-bone/45">No sales yet.</p>
          ) : (
            <ul className="space-y-3">
              {productRevenue.map((p, idx) => (
                <li key={p.name} className="flex items-center gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-gold">
                    {idx + 1}
                  </span>
                  <span className="flex-1 truncate text-bone/80">{p.name}</span>
                  <span className="text-bone/50">{p.qty} sold</span>
                  <span className="font-medium text-gold">{formatPrice(p.rev)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent orders */}
        <div className="card-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="heading-serif text-xl text-bone">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs text-gold hover:underline">View all</Link>
          </div>
          {!loaded ? (
            <p className="text-sm text-bone/45">Loading…</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-bone/45">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-bone/10">
              {orders.slice(0, 6).map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs text-bone/70">{o.id}</p>
                    <p className="truncate text-xs text-bone/45">{o.email}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    o.status === 'shipped' ? 'bg-gold/20 text-gold' :
                    o.status === 'paid' ? 'bg-royal/30 text-bone' :
                    o.status === 'cancelled' ? 'bg-red-500/15 text-red-400' :
                    'bg-bone/10 text-bone/70'
                  }`}>{o.status}</span>
                  <span className="shrink-0 font-medium text-gold">{formatPrice(o.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link to="/admin/products" className="btn-primary">+ New product</Link>
        <Link to="/admin/orders" className="btn-outline">Manage orders</Link>
        <Link to="/admin/coupons" className="btn-outline">Promo coupons</Link>
      </div>
    </div>
  );
}
