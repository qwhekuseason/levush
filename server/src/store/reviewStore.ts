import { db } from '../lib/firebaseAdmin.js';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Review {
  /** `${orderId}_${productId}` — one review per product per order */
  id: string;
  productId: string;
  productName: string;
  orderId: string;
  /** first name + last initial, as shown publicly */
  name: string;
  city: string;
  rating: number;
  text: string;
  status: ReviewStatus;
  createdAt: number;
}

/** What shoppers see on a product page. */
export type PublicReview = Pick<Review, 'id' | 'name' | 'city' | 'rating' | 'text' | 'createdAt'>;

const COLLECTION = 'reviews';

export class DuplicateReviewError extends Error {}

export async function createReview(r: Review): Promise<Review> {
  try {
    await db.collection(COLLECTION).doc(r.id).create(r);
  } catch (e) {
    if ((e as { code?: number }).code === 6) throw new DuplicateReviewError('You’ve already reviewed this item from this order.');
    throw e;
  }
  return r;
}

export async function approvedReviewsFor(productId: string): Promise<{ reviews: PublicReview[]; average: number; count: number }> {
  const snap = await db.collection(COLLECTION).where('productId', '==', productId).get();
  const approved = snap.docs
    .map((d) => d.data() as Review)
    .filter((r) => r.status === 'approved')
    .sort((a, b) => b.createdAt - a.createdAt);
  const count = approved.length;
  const average = count ? Math.round((approved.reduce((n, r) => n + r.rating, 0) / count) * 10) / 10 : 0;
  return {
    reviews: approved.slice(0, 50).map(({ id, name, city, rating, text, createdAt }) => ({ id, name, city, rating, text, createdAt })),
    average,
    count,
  };
}

/** Review ids already written for an order (so the tracking page can hide done items). */
export async function reviewedProductIds(orderId: string): Promise<string[]> {
  const snap = await db.collection(COLLECTION).where('orderId', '==', orderId).get();
  return snap.docs.map((d) => (d.data() as Review).productId);
}

export async function listReviews(): Promise<Review[]> {
  const snap = await db.collection(COLLECTION).orderBy('createdAt', 'desc').limit(500).get();
  return snap.docs.map((d) => d.data() as Review);
}

export async function setReviewStatus(id: string, status: ReviewStatus): Promise<Review | null> {
  const ref = db.collection(COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  await ref.update({ status });
  return { ...(snap.data() as Review), status };
}

export async function deleteReview(id: string): Promise<boolean> {
  const ref = db.collection(COLLECTION).doc(id);
  if (!(await ref.get()).exists) return false;
  await ref.delete();
  return true;
}
