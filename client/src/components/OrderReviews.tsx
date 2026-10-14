import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { StarPicker } from '@/components/StarRating';
import type { TrackedOrder } from '@/types';

/** On a delivered order's tracking page: let the buyer review each piece once. */
export default function OrderReviews({ order, phone }: { order: TrackedOrder; phone: string }) {
  const [reviewed, setReviewed] = useState<string[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thanks, setThanks] = useState(false);

  useEffect(() => {
    api.reviewStatus(order.id, phone).then((r) => setReviewed(r.reviewed)).catch(() => setReviewed([]));
  }, [order.id, phone]);

  // One entry per product even if it was bought in two sizes.
  const items = order.items.filter((i, idx) => order.items.findIndex((j) => j.productId === i.productId) === idx);
  const pending = items.filter((i) => !reviewed?.includes(i.productId));
  if (order.status !== 'shipped' || reviewed === null || (pending.length === 0 && !thanks)) return null;

  const submit = async (productId: string) => {
    setError(null);
    setBusy(true);
    try {
      await api.submitReview({ orderId: order.id, phone, productId, rating, text });
      setReviewed((r) => [...(r ?? []), productId]);
      setOpenId(null);
      setText('');
      setRating(5);
      setThanks(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send your review.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card-surface p-6">
      <h3 className="heading-serif text-lg text-bone">How are you finding your pieces?</h3>
      {thanks && (
        <p className="mt-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">
          Thank you! Your review will appear on the product page once we’ve approved it.
        </p>
      )}
      <ul className="mt-4 space-y-3">
        {pending.map((i) => (
          <li key={i.productId} className="rounded-xl border border-bone/10 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-bone">{i.name}</span>
              {openId !== i.productId && (
                <button type="button" onClick={() => { setOpenId(i.productId); setError(null); }} className="text-sm font-semibold text-gold hover:underline">
                  Write a review
                </button>
              )}
            </div>
            {openId === i.productId && (
              <form
                className="mt-3 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit(i.productId);
                }}
              >
                <StarPicker name={`rating-${i.productId}`} value={rating} onChange={setRating} />
                <label htmlFor={`review-${i.productId}`} className="sr-only">Your review</label>
                <textarea
                  id={`review-${i.productId}`}
                  rows={3}
                  maxLength={1000}
                  required
                  className="field resize-none text-sm"
                  placeholder="Fit, fabric, the print, the verse — what would you tell a friend?"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                {error && <p className="text-xs text-red-500" role="alert">{error}</p>}
                <div className="flex gap-3">
                  <button type="submit" disabled={busy} className="btn-primary text-sm">{busy ? 'Sending…' : 'Post review'}</button>
                  <button type="button" onClick={() => setOpenId(null)} className="btn-outline text-sm">Cancel</button>
                </div>
                <p className="text-xs text-bone/45">Shown with your first name and last initial.</p>
              </form>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
