import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { classNames, formatPrice } from '@/lib/format';
import type { Order, OrderStatus } from '@/types';

const ALL_STATUSES: Array<OrderStatus | 'all'> = ['all', 'received', 'paid', 'shipped', 'cancelled'];

const statusStyle: Record<OrderStatus, string> = {
  received: 'bg-bone/10 text-bone/80',
  paid: 'bg-royal/30 text-bone',
  shipped: 'bg-gold/20 text-gold',
  cancelled: 'bg-red-500/15 text-red-300',
};

const statusLabel: Record<OrderStatus, string> = {
  received: 'Awaiting',
  paid: 'Paid',
  shipped: 'Shipped',
  cancelled: 'Cancelled',
};

export default function AdminOrders() {
  const { authHeader } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    try {
      const header = await authHeader();
      if (header) setOrders(await api.listAllOrders(header));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load orders.');
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => { void load(); }, []);

  const changeStatus = async (id: string, status: OrderStatus) => {
    const header = await authHeader();
    if (!header) return;
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    try {
      await api.updateOrderStatus(id, status, header);
    } catch {
      void load();
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter((o) => {
      const matchStatus = filterStatus === 'all' || o.status === filterStatus;
      const matchSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [orders, search, filterStatus]);

  // Status tab counts
  const counts = useMemo(() => {
    const m: Record<string, number> = { all: orders.length };
    for (const o of orders) m[o.status] = (m[o.status] ?? 0) + 1;
    return m;
  }, [orders]);

  if (!loaded) return <p className="text-bone/45">Loading orders…</p>;
  if (error) return <p className="text-red-400">{error}</p>;

  return (
    <div>
      {/* Header row */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="heading-serif text-2xl text-bone">Orders ({orders.length})</h2>
        <input
          className="field max-w-xs"
          placeholder="Search by ID or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Status filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={classNames(
              'rounded-full px-4 py-1.5 text-xs font-medium transition',
              filterStatus === s
                ? 'bg-gold text-ink'
                : 'border border-bone/15 text-bone/60 hover:border-gold hover:text-gold'
            )}
          >
            {s === 'all' ? 'All' : statusLabel[s]}
            <span className="ml-1.5 opacity-60">({counts[s] ?? 0})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-bone/45 text-sm">No orders match your filters.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => {
            const isOpen = expanded === o.id;
            return (
              <div key={o.id} className="card-surface overflow-hidden">
                {/* Order row — click to expand */}
                <button
                  onClick={() => setExpanded(isOpen ? null : o.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-3 p-5 text-left"
                >
                  <div>
                    <p className="font-mono text-sm text-bone">{o.id}</p>
                    <p className="mt-0.5 text-xs text-bone/50">
                      {o.email} · {new Date(o.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={classNames('rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider', statusStyle[o.status])}>
                      {o.status}
                    </span>
                    <p className="font-serif text-lg text-gold">{formatPrice(o.total)}</p>
                    <svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className={classNames('text-bone/40 transition-transform', isOpen ? 'rotate-180' : '')}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-bone/10 px-5 pb-5 pt-4">
                    {/* Items */}
                    <ul className="mb-4 space-y-1.5 text-sm text-bone/65">
                      {o.items.map((it, idx) => (
                        <li key={idx} className="flex justify-between">
                          <span>{it.quantity}× {it.name}</span>
                          <span>{formatPrice(it.price * it.quantity)}</span>
                        </li>
                      ))}
                      {o.discount > 0 && (
                        <li className="flex justify-between text-gold">
                          <span>Discount {o.couponCode ? `(${o.couponCode})` : ''}</span>
                          <span>−{formatPrice(o.discount)}</span>
                        </li>
                      )}
                      <li className="flex justify-between border-t border-bone/10 pt-2 font-medium text-bone">
                        <span>Total</span>
                        <span className="text-gold">{formatPrice(o.total)}</span>
                      </li>
                    </ul>

                    {/* Status updater */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-bone/45">Update status:</span>
                      {(['received', 'paid', 'shipped', 'cancelled'] as OrderStatus[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => changeStatus(o.id, s)}
                          disabled={o.status === s}
                          className={classNames(
                            'rounded-full px-3 py-1 text-xs font-medium transition',
                            o.status === s
                              ? 'bg-gold text-ink'
                              : 'border border-bone/15 text-bone/65 hover:border-gold hover:text-gold'
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
