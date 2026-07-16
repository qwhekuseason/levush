import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useRewards } from '@/context/RewardsContext';
import { api } from '@/lib/api';
import { classNames, formatPrice } from '@/lib/format';
import type { Order } from '@/types';
import { motion } from 'framer-motion';

export default function Account() {
  const { user, role, isAdmin, loading, logout, authHeader } = useAuth();
  const { points } = useRewards();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setOrdersLoading(true);
      try {
        const header = await authHeader();
        if (header) setOrders(await api.listMyOrders(header));
      } catch {
        /* ignore */
      } finally {
        setOrdersLoading(false);
      }
    })();
  }, [user, authHeader]);

  if (loading) {
    return (
      <div className="container-site flex h-[70vh] items-center justify-center text-bone/50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent mx-auto mb-4" />
          <p className="text-sm font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Redirect to Sign In if not logged in
  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <div className="container-site py-16 bg-grain min-h-[80vh]">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-wrap items-end justify-between gap-4 mb-12"
      >
        <div>
          <p className="eyebrow mb-2">Member Dashboard</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="heading-serif text-4xl text-bone sm:text-5xl">
              Welcome{user.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}.
            </h1>
            <span
              className={classNames(
                'rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider',
                isAdmin ? 'bg-gold text-ink' : 'border border-bone/15 text-bone/60'
              )}
            >
              {role}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <Link to="/settings" className="btn-outline px-5 py-2.5 text-xs uppercase tracking-wider font-semibold">
            Account Settings
          </Link>
          <button onClick={logout} className="btn-outline px-5 py-2.5 text-xs uppercase tracking-wider font-semibold hover:bg-red-500/5 hover:border-red-500/30 hover:text-red-500">
            Sign out
          </button>
        </div>
      </motion.div>

      {/* Main dashboard grid */}
      <div className="grid gap-8 md:grid-cols-3">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="card-surface p-7 md:col-span-1 border border-ink-600/30 flex flex-col justify-between"
        >
          <div>
            <h2 className="eyebrow mb-6">Profile Card</h2>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wider text-bone/45 mb-0.5">Name</dt>
                <dd className="font-medium text-bone text-base">{user.displayName ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-bone/45 mb-0.5">Email</dt>
                <dd className="font-medium text-bone">{user.email}</dd>
              </div>
              <div className="pt-2">
                <dt className="text-xs uppercase tracking-wider text-bone/45 mb-1">Levush Rewards</dt>
                <dd className="flex items-center gap-2">
                  <span className="text-3xl font-light text-gold font-serif">{points}</span>
                  <span className="text-xs uppercase tracking-wide text-bone/60">points</span>
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-8 space-y-3">
            {isAdmin && (
              <Link to="/admin" className="btn-primary w-full text-center text-xs py-3 font-semibold uppercase tracking-wider">
                Go to Admin Panel
              </Link>
            )}
            <Link to="/shop" className="btn-outline w-full text-center text-xs py-3 font-semibold uppercase tracking-wider block">
              Shop Collections
            </Link>
          </div>
        </motion.div>

        {/* Orders Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="card-surface p-7 md:col-span-2 border border-ink-600/30"
        >
          <h2 className="eyebrow mb-6">Order History</h2>
          
          {ordersLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-bone/15 text-center p-6">
              <p className="text-bone/55 text-sm">You haven't placed any orders yet.</p>
              <Link to="/shop" className="mt-4 text-xs font-semibold uppercase tracking-wider text-gold hover:underline">
                Browse Shop →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <ul className="divide-y divide-ink-600">
                {orders.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center justify-between gap-4 py-4 text-sm">
                    <div>
                      <p className="font-mono text-xs text-bone/80 font-bold">{o.id}</p>
                      <p className="text-xs text-bone/45 mt-0.5">
                        {o.items.length} item(s) · {new Date(o.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gold font-medium">{formatPrice(o.total)}</p>
                      <p className={classNames(
                        "text-[10px] font-bold uppercase tracking-wider mt-0.5",
                        o.status === 'paid' || o.status === 'shipped' ? 'text-green-600' : 
                        o.status === 'cancelled' ? 'text-red-500' : 'text-bone/40'
                      )}>
                        {o.status}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
