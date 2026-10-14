import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Stars } from '@/components/StarRating';
import type { PublicReview } from '@/types';

/** Approved customer reviews for a product, with the average rating. */
export default function ProductReviews({ productId }: { productId: string }) {
  const [data, setData] = useState<{ reviews: PublicReview[]; average: number; count: number } | null>(null);

  useEffect(() => {
    api.productReviews(productId).then(setData).catch(() => setData({ reviews: [], average: 0, count: 0 }));
  }, [productId]);

  if (!data) return null;
  return (
    <section className="mt-24" aria-labelledby="reviews-heading">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="reviews-heading" className="heading-serif text-2xl text-bone sm:text-3xl">Reviews</h2>
          {data.count > 0 ? (
            <p className="mt-2 flex items-center gap-2 text-sm text-bone/60">
              <Stars value={data.average} /> {data.average.toFixed(1)} from {data.count} verified buyer{data.count === 1 ? '' : 's'}
            </p>
          ) : (
            <p className="mt-2 text-sm text-bone/55">No reviews yet. Be the first to share how it wears.</p>
          )}
        </div>
        <p className="text-xs text-bone/45">
          Bought this? Review it from <Link to="/track" className="text-gold hover:underline">your order page</Link> once it’s delivered.
        </p>
      </div>
      {data.reviews.length > 0 && (
        <ul className="grid gap-4 md:grid-cols-2">
          {data.reviews.map((r) => (
            <li key={r.id} className="card-surface p-5">
              <div className="flex items-center justify-between gap-3">
                <Stars value={r.rating} size={14} />
                <span className="text-xs text-bone/40">{new Date(r.createdAt).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-bone/80">{r.text}</p>
              <p className="mt-3 text-xs font-medium text-bone/55">
                {r.name}{r.city ? ` · ${r.city}` : ''} · <span className="text-gold">Verified buyer</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
