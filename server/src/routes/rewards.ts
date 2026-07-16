import { Router } from 'express';
import { requireAuth } from '../lib/auth.js';
import {
  PRIZE_LABELS,
  findCoupon,
  getRewards,
  listCoupons,
  recordQuiz,
  spin,
} from '../store/rewardsStore.js';

const router = Router();

function callerEmail(req: { caller?: { email: string | null } }): string {
  return req.caller?.email ?? 'guest';
}

/** Wheel segment labels (so the client wheel matches the server prizes). */
router.get('/wheel', (_req, res) => {
  res.json({ segments: PRIZE_LABELS });
});

router.get('/me', requireAuth, async (req, res) => {
  const email = callerEmail(req);
  const [rewards, coupons] = await Promise.all([getRewards(email), listCoupons(email)]);
  res.json({ ...rewards, coupons });
});

router.post('/spin', requireAuth, async (req, res) => {
  const result = await spin(callerEmail(req));
  res.json(result);
});

router.post('/quiz', requireAuth, async (req, res) => {
  const correct = Math.max(0, Math.min(20, Number(req.body?.correct) || 0));
  const result = await recordQuiz(callerEmail(req), correct);
  res.json(result);
});

/** Validate a coupon code (used at checkout). */
router.post('/coupon/validate', async (req, res) => {
  const code = String(req.body?.code ?? '').trim().toUpperCase();
  if (!code) return res.status(400).json({ valid: false, error: 'Enter a code.' });
  const coupon = await findCoupon(code);
  if (!coupon || coupon.used) return res.json({ valid: false });
  res.json({ valid: true, code: coupon.code, kind: coupon.kind, value: coupon.value, label: coupon.label });
});

export default router;
