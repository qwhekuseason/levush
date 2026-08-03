import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { classNames, formatPrice } from '@/lib/format';
import type { Order, OrderStatus } from '@/types';

const ALL_STATUSES: Array<OrderStatus | 'all'> = ['all', 'received', 'paid', 'shipped', 'cancelled'];

const statusStyle: Record<OrderStatus, string> = {
  received: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  paid: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  shipped: 'bg-green-500/20 text-green-400 border border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

const statusLabel: Record<OrderStatus, string> = {
  received: 'Received / Awaiting',
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
      if (header) {
        const fetched = await api.listAllOrders(header);
        setOrders(fetched);
        // Expand first order by default if available
        if (fetched.length > 0 && !expanded) {
          setExpanded(fetched[0].id);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load orders.');
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    void load();
  }, []);

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
    const q = search.toLowerCase().trim();
    return orders.filter((o) => {
      const matchStatus = filterStatus === 'all' || o.status === filterStatus;
      const addr = o.shippingAddress;
      const fullName = addr ? `${addr.firstName} ${addr.lastName}`.toLowerCase() : '';
      const phone = addr ? addr.phone.toLowerCase() : '';
      const city = addr ? addr.city.toLowerCase() : '';
      const matchSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q) ||
        fullName.includes(q) ||
        phone.includes(q) ||
        city.includes(q);
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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-bone/10 pb-4">
        <div>
          <h2 className="heading-serif text-2xl text-bone">Order Management ({orders.length})</h2>
          <p className="text-xs text-bone/50">View, track, and update complete order details in real-time</p>
        </div>
        <input
          className="field max-w-xs text-sm"
          placeholder="Search by ID, email, name, phone, city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={classNames(
              'rounded-full px-4 py-1.5 text-xs font-semibold transition',
              filterStatus === s
                ? 'bg-gold text-ink'
                : 'border border-bone/15 text-bone/60 hover:border-gold hover:text-gold'
            )}
          >
            {s === 'all' ? 'All Orders' : statusLabel[s]}
            <span className="ml-1.5 opacity-75">({counts[s] ?? 0})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card-surface p-12 text-center">
          <p className="text-bone/60 font-medium">No orders found matching your search.</p>
          <p className="mt-1 text-xs text-bone/40">Try adjusting your status filter or search keywords.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((o) => {
            const isOpen = expanded === o.id;
            const addr = o.shippingAddress;
            const customerName = addr ? `${addr.firstName} ${addr.lastName}`.trim() : o.email;

            return (
              <div
                key={o.id}
                className={classNames(
                  'card-surface overflow-hidden transition-all border',
                  isOpen ? 'border-gold/40 ring-1 ring-gold/20' : 'border-bone/10 hover:border-bone/20'
                )}
              >
                {/* Header Row — Click to Expand/Collapse */}
                <button
                  onClick={() => setExpanded(isOpen ? null : o.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-4 p-5 text-left bg-ink-800/40 hover:bg-ink-800/70 transition"
                >
                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <span className="font-mono text-base font-bold text-gold">{o.id}</span>
                      <p className="text-xs text-bone/50 mt-0.5">
                        Placed on {new Date(o.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>

                    <div className="hidden sm:block border-l border-bone/15 pl-4">
                      <p className="text-sm font-semibold text-bone">{customerName}</p>
                      <p className="text-xs text-bone/50">{o.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={classNames('rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider', statusStyle[o.status])}>
                      {o.status}
                    </span>

                    <div className="text-right">
                      <p className="font-serif text-lg font-bold text-gold">{formatPrice(o.total)}</p>
                      <p className="text-[10px] text-bone/45">{o.items.reduce((acc, it) => acc + it.quantity, 0)} item(s)</p>
                    </div>

                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={classNames('text-bone/40 transition-transform duration-200', isOpen ? 'rotate-180 text-gold' : '')}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </button>

                {/* Expanded Full Order Details */}
                {isOpen && (
                  <div className="border-t border-bone/10 p-5 space-y-6 bg-ink-900/30">

                    {/* Section 1: Customer & Shipping Information */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {/* Customer Details */}
                      <div className="rounded-xl border border-bone/10 bg-ink-800/50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gold mb-2 flex items-center gap-1.5">
                          <span>👤</span> Customer Contact
                        </p>
                        <p className="text-sm font-semibold text-bone">{customerName}</p>
                        <p className="text-xs text-bone/70 mt-1">📧 {o.email}</p>
                        {addr?.phone && (
                          <p className="text-xs text-bone/70 mt-1 font-mono">📞 {addr.phone}</p>
                        )}
                        {o.uid && (
                          <p className="text-[10px] text-bone/40 mt-2 font-mono truncate">UID: {o.uid}</p>
                        )}
                      </div>

                      {/* Delivery Location */}
                      <div className="rounded-xl border border-bone/10 bg-ink-800/50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gold mb-2 flex items-center gap-1.5">
                          <span>📍</span> Delivery Location
                        </p>
                        {addr ? (
                          <>
                            <p className="text-sm text-bone font-medium">{addr.address}</p>
                            <p className="text-xs text-bone/70 mt-1">{addr.city}</p>
                          </>
                        ) : (
                          <p className="text-xs text-bone/45 italic">No address recorded</p>
                        )}
                      </div>

                      {/* Payment & Status */}
                      <div className="rounded-xl border border-bone/10 bg-ink-800/50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gold mb-2 flex items-center gap-1.5">
                          <span>💳</span> Payment & Status
                        </p>
                        <p className="text-xs text-bone/70">
                          Method: <span className="font-semibold text-bone">{o.paymentMethod ?? 'Mobile Money / Card'}</span>
                        </p>
                        <p className="text-xs text-bone/70 mt-1">
                          Current Status:{' '}
                          <span className={classNames('inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase ml-1', statusStyle[o.status])}>
                            {o.status}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Section 2: Items Ordered */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-bone/60 mb-3">
                        Ordered Items ({o.items.length})
                      </p>
                      <div className="space-y-2.5">
                        {o.items.map((it, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-4 rounded-xl border border-bone/10 bg-ink-800/40 p-3"
                          >
                            {/* Product Thumbnail */}
                            {it.image ? (
                              <img
                                src={it.image}
                                alt={it.name}
                                className="h-14 w-12 rounded-lg object-cover border border-bone/15"
                              />
                            ) : (
                              <div className="grid h-14 w-12 place-items-center rounded-lg bg-ink-700 text-[10px] text-bone/40">
                                tee
                              </div>
                            )}

                            {/* Item info */}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-bone truncate">{it.name}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                {it.color && (
                                  <span className="rounded bg-bone/10 px-2 py-0.5 text-[11px] text-bone/80 capitalize">
                                    Colour: {it.color}
                                  </span>
                                )}
                                {it.size && (
                                  <span className="rounded bg-gold/15 text-gold px-2 py-0.5 text-[11px] font-semibold">
                                    Size: {it.size}
                                  </span>
                                )}
                                <span className="text-xs text-bone/50">
                                  {formatPrice(it.price)} each
                                </span>
                              </div>
                            </div>

                            {/* Quantity & Line Total */}
                            <div className="text-right shrink-0">
                              <p className="text-sm font-semibold text-bone">
                                {it.quantity} × {formatPrice(it.price)}
                              </p>
                              <p className="text-xs font-bold text-gold mt-0.5">
                                {formatPrice(it.price * it.quantity)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section 3: Financial Summary & Discount Breakdown */}
                    <div className="rounded-xl border border-bone/15 bg-ink-800/60 p-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-bone/70">
                          <span>Subtotal</span>
                          <span className="font-medium text-bone">{formatPrice(o.subtotal ?? o.total)}</span>
                        </div>

                        {o.discount > 0 && (
                          <div className="flex justify-between text-gold">
                            <span className="flex items-center gap-1.5">
                              <span>🏷️</span> Discount Applied {o.couponCode ? `(${o.couponCode})` : ''}
                            </span>
                            <span className="font-semibold">−{formatPrice(o.discount)}</span>
                          </div>
                        )}

                        <div className="flex justify-between text-bone/70">
                          <span>Shipping Fee</span>
                          <span className="font-medium text-bone">
                            {o.shipping === 0 ? <span className="text-green-400 font-semibold">FREE</span> : formatPrice(o.shipping ?? 30)}
                          </span>
                        </div>

                        <div className="flex justify-between border-t border-bone/15 pt-2 text-base font-bold text-bone">
                          <span>Total Amount Paid / Payable</span>
                          <span className="text-gold font-serif text-lg">{formatPrice(o.total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Admin Action — Status Change */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-bone/10 pt-4">
                      <span className="text-xs font-semibold uppercase tracking-wider text-bone/60">
                        Update Order Status:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {(['received', 'paid', 'shipped', 'cancelled'] as OrderStatus[]).map((s) => (
                          <button
                            key={s}
                            onClick={() => changeStatus(o.id, s)}
                            disabled={o.status === s}
                            className={classNames(
                              'rounded-lg px-3.5 py-1.5 text-xs font-semibold transition',
                              o.status === s
                                ? 'bg-gold text-ink cursor-default font-bold shadow'
                                : 'border border-bone/20 text-bone/75 hover:border-gold hover:text-gold bg-ink-800'
                            )}
                          >
                            Mark as {s}
                          </button>
                        ))}
                      </div>
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
