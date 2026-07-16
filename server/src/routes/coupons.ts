import { Router } from 'express';
import { requireAdmin } from '../lib/auth.js';
import {
  listAllCoupons,
  createCustomCoupon,
  deleteCoupon,
} from '../store/rewardsStore.js';

const router = Router();

router.get('/', requireAdmin, async (_req, res) => {
  try {
    res.json(await listAllCoupons());
  } catch {
    res.status(500).json({ error: 'Could not list coupons.' });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  const { code, label, kind, value, email } = req.body ?? {};
  if (!code || typeof code !== 'string') return res.status(400).json({ error: 'Code is required.' });
  if (!label || typeof label !== 'string') return res.status(400).json({ error: 'Label is required.' });
  if (kind !== 'percent' && kind !== 'shipping') return res.status(400).json({ error: 'Kind must be percent or shipping.' });
  try {
    res.status(201).json(await createCustomCoupon({ code, label, kind, value, email }));
  } catch {
    res.status(500).json({ error: 'Could not create coupon.' });
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
