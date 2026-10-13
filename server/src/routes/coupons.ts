import { Router } from 'express';
import { requireAdmin } from '../lib/auth.js';
import {
  CouponConflictError,
  couponStatus,
  createCoupon,
  customerRedemptions,
  deleteCoupon,
  evaluateCoupon,
  findCoupon,
  listAllCoupons,
  listPublicCoupons,
  normalizeCode,
  redemptionsOf,
  updateCoupon,
  type Coupon,
} from '../store/couponStore.js';

const router = Router();

/** Shopper-safe view of a coupon (no limits, counters or customer emails). */
const publicView = (c: Coupon) => ({
  code: c.code,
  label: c.label,
  kind: c.kind,
  value: c.value,
  minSubtotal: c.minSubtotal,
  maxDiscount: c.maxDiscount,
  expiresAt: c.expiresAt,
});

/** Public offers advertised at checkout. */
router.get('/public', async (_req, res) => {
  try {
    res.set('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300');
    res.json((await listPublicCoupons()).map(publicView));
  } catch {
    res.json([]);
  }
});

/**
 * Preview a code at checkout. The order endpoint re-checks everything inside a
 * transaction, so this is advisory only.
 */
router.post('/validate', async (req, res) => {
  const code = normalizeCode(String(req.body?.code ?? ''));
  if (!code) return res.status(400).json({ valid: false, error: 'Enter a code.' });
  const subtotal = Math.max(0, Number(req.body?.subtotal) || 0);
  const email = typeof req.body?.email === 'string' ? req.body.email : null;

  const coupon = await findCoupon(code);
  if (!coupon) return res.json({ valid: false, error: 'That code doesn’t exist.' });
  const customerUses = coupon.perCustomerLimit !== null ? await customerRedemptions(code, email) : 0;
  const result = evaluateCoupon(coupon, { subtotal, email, customerUses });
  if (!result.ok) return res.json({ valid: false, error: result.reason });
  res.json({ valid: true, ...publicView(coupon) });
});

// ── Admin ──
router.get('/', requireAdmin, async (_req, res) => {
  try {
    const now = Date.now();
    res.json((await listAllCoupons()).map((c) => ({ ...c, status: couponStatus(c, now) })));
  } catch {
    res.status(500).json({ error: 'Could not list coupons.' });
  }
});

router.get('/:code/redemptions', requireAdmin, async (req, res) => {
  const snap = await redemptionsOf(req.params.code).orderBy('at', 'desc').limit(200).get();
  res.json(snap.docs.map((d) => d.data()));
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const c = await createCoupon(req.body ?? {});
    res.status(201).json({ ...c, status: couponStatus(c) });
  } catch (e) {
    const status = e instanceof CouponConflictError ? 409 : 400;
    res.status(status).json({ error: e instanceof Error ? e.message : 'Could not create coupon.' });
  }
});

router.put('/:code', requireAdmin, async (req, res) => {
  try {
    const c = await updateCoupon(req.params.code, req.body ?? {});
    if (!c) return res.status(404).json({ error: 'Coupon not found.' });
    res.json({ ...c, status: couponStatus(c) });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Could not update coupon.' });
  }
});

router.delete('/:code', requireAdmin, async (req, res) => {
  try {
    const deleted = await deleteCoupon(req.params.code);
    if (!deleted) return res.status(404).json({ error: 'Coupon not found.' });
    res.json({ deleted: true });
  } catch {
    res.status(500).json({ error: 'Could not delete coupon.' });
  }
});

export default router;
