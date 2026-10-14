import { Router } from 'express';
import { requireAdmin } from '../lib/auth.js';
import { rateLimit } from '../lib/rateLimit.js';
import { getOrderForCustomer } from '../store/orderStore.js';
import {
  DuplicateReviewError,
  approvedReviewsFor,
  createReview,
  deleteReview,
  listReviews,
  reviewedProductIds,
  setReviewStatus,
  type ReviewStatus,
} from '../store/reviewStore.js';

const router = Router();

const reviewLimit = rateLimit({ max: 10, windowMs: 10 * 60_000, message: 'Too many attempts — please try again in a few minutes.' });

/** Approved reviews + average rating for a product (public). */
router.get('/', async (req, res) => {
  const productId = String(req.query.productId ?? '');
  if (!productId) return res.status(400).json({ error: 'productId is required.' });
  res.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=600');
  res.json(await approvedReviewsFor(productId));
});

/** Which items of an order the customer has already reviewed (needs the order's phone). */
router.post('/status', reviewLimit, async (req, res) => {
  const order = await getOrderForCustomer(String(req.body?.orderId ?? ''), String(req.body?.phone ?? ''));
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  res.set('Cache-Control', 'no-store');
  res.json({ canReview: order.status === 'shipped', reviewed: await reviewedProductIds(order.id) });
});

/**
 * Leave a review. Only verified buyers: the order number + its phone must
 * match, the order must be shipped, and the product must be in it.
 */
router.post('/', reviewLimit, async (req, res) => {
  const order = await getOrderForCustomer(String(req.body?.orderId ?? ''), String(req.body?.phone ?? ''));
  if (!order) return res.status(404).json({ error: 'We couldn’t find that order with this phone number.' });
  if (order.status !== 'shipped') return res.status(400).json({ error: 'You can review items once your order has been delivered.' });

  const productId = String(req.body?.productId ?? '');
  const item = order.items.find((i) => i.productId === productId);
  if (!item) return res.status(400).json({ error: 'That item isn’t part of this order.' });

  const rating = Math.round(Number(req.body?.rating));
  if (!(rating >= 1 && rating <= 5)) return res.status(400).json({ error: 'Choose a rating from 1 to 5 stars.' });
  const text = String(req.body?.text ?? '').trim().slice(0, 1000);
  if (text.length < 3) return res.status(400).json({ error: 'Please write a few words about the piece.' });

  // Public name: first name + last initial, from the order (not free text).
  const first = order.shippingAddress?.firstName?.trim() ?? 'Customer';
  const lastInitial = order.shippingAddress?.lastName?.trim().charAt(0);
  try {
    await createReview({
      id: `${order.id}_${productId}`,
      productId,
      productName: item.name,
      orderId: order.id,
      name: lastInitial ? `${first} ${lastInitial.toUpperCase()}.` : first,
      city: order.shippingAddress?.city ?? '',
      rating,
      text,
      status: 'pending',
      createdAt: Date.now(),
    });
    res.status(201).json({ ok: true });
  } catch (e) {
    if (e instanceof DuplicateReviewError) return res.status(409).json({ error: e.message });
    console.error('[reviews] create failed:', e);
    res.status(500).json({ error: 'Could not save your review. Please try again.' });
  }
});

// ── Admin moderation ──
router.get('/all', requireAdmin, async (_req, res) => {
  res.json(await listReviews());
});

router.patch('/:id', requireAdmin, async (req, res) => {
  const status = String(req.body?.status) as ReviewStatus;
  if (!['pending', 'approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status.' });
  const updated = await setReviewStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ error: 'Review not found.' });
  res.json(updated);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const ok = await deleteReview(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Review not found.' });
  res.json({ deleted: true });
});

export default router;
