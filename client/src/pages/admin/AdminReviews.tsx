import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { classNames } from '@/lib/format';
import { Stars } from '@/components/StarRating';
import type { Review, ReviewStatus } from '@/types';

const TABS: Array<{ key: ReviewStatus; label: string }> = [
  { key: 'pending', label: 'Waiting for approval' },
  { key: 'approved', label: 'Published' },
  { key: 'rejected', label: 'Hidden' },
];

export default function AdminReviews() {
  const { authHeader } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<ReviewStatus>('pending');

  const withAuth = async () => {
    const h = await authHeader();
    if (!h) throw new Error('Your session expired — sign in again.');
    return h;
  };

  useEffect(() => {
    (async () => {
      try {
        setReviews(await api.listReviews(await withAuth()));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load reviews.');
      } finally {
        setLoaded(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setStatus = async (r: Review, status: ReviewStatus) => {
    setReviews((prev) => prev.map((x) => (x.id === r.id ? { ...x, status } : x)));
    try {
      await api.setReviewStatus(r.id, status, await withAuth());
    } catch (e) {
      setReviews((prev) => prev.map((x) => (x.id === r.id ? r : x)));
      setError(e instanceof Error ? e.message : 'Could not update review.');
    }
  };

  const remove = async (r: Review) => {
    if (!confirm(`Delete ${r.name}'s review permanently?`)) return;
    try {
      await api.deleteReview(r.id, await withAuth());
      setReviews((prev) => prev.filter((x) => x.id !== r.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete review.');
    }
  };

  const shown = reviews.filter((r) => r.status === tab);

  return (
    <div>
      <h2 className="heading-serif mb-2 text-2xl text-bone">Reviews</h2>
      <p className="mb-6 text-sm text-bone/55">
        Only customers with a delivered (Shipped) order can review, from their order tracking page. Nothing shows on the site until you publish it.
      </p>
      <div className="mb-5 flex flex-wrap gap-1.5">
        {TABS.map((t) => {
          const n = reviews.filter((r) => r.status === t.key).length;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={classNames('rounded-full px-3 py-1.5 text-xs font-medium transition', tab === t.key ? 'bg-gold text-ink' : 'border border-bone/15 text-bone/60 hover:text-bone')}
            >
              {t.label} ({n})
            </button>
          );
        })}
      </div>
      {error && <p className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400" role="alert">{error}</p>}
      {!loaded ? (
        <p className="text-sm text-bone/45">Loading reviews…</p>
      ) : shown.length === 0 ? (
        <p className="text-sm text-bone/45">Nothing here.</p>
      ) : (
        <ul className="space-y-3">
          {shown.map((r) => (
            <li key={r.id} className="card-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-bone">{r.productName}</p>
                <span className="text-xs text-bone/40">{new Date(r.createdAt).toLocaleString()}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <Stars value={r.rating} size={14} />
                <span className="text-xs text-bone/55">{r.name}{r.city ? ` · ${r.city}` : ''} · order <span className="font-mono">{r.orderId}</span></span>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-bone/85">{r.text}</p>
              <div className="mt-3 flex flex-wrap gap-4 border-t border-bone/10 pt-3 text-xs">
                {r.status !== 'approved' && <button onClick={() => setStatus(r, 'approved')} className="font-semibold text-emerald-600 hover:text-emerald-500">Publish</button>}
                {r.status !== 'rejected' && <button onClick={() => setStatus(r, 'rejected')} className="text-bone/60 hover:text-gold">Hide</button>}
                {r.status !== 'pending' && <button onClick={() => setStatus(r, 'pending')} className="text-bone/60 hover:text-gold">Move back to waiting</button>}
                <button onClick={() => remove(r)} className="ml-auto text-red-400 hover:text-red-300">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
