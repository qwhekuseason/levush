import { Router } from 'express';
import { requireAdmin } from '../lib/auth.js';
import { rateLimit } from '../lib/rateLimit.js';
import { getProductsByIds, isSoldOut } from '../store/productStore.js';
import { toWhatsAppDigits } from '../store/settingsStore.js';
import { deleteAlert, listAlerts, markAlertNotified, upsertAlert } from '../store/alertStore.js';

const router = Router();

const alertLimit = rateLimit({ max: 10, windowMs: 10 * 60_000, message: 'Too many requests — please try again in a few minutes.' });

/** "Notify me when it's back" (public). */
router.post('/', alertLimit, async (req, res) => {
  const productId = String(req.body?.productId ?? '');
  const color = String(req.body?.color ?? '');
  const size = String(req.body?.size ?? '');
  const phone = toWhatsAppDigits(String(req.body?.phone ?? ''));
  const name = String(req.body?.name ?? '').trim().slice(0, 60);
  if (phone.length < 10 || phone.length > 15) {
    return res.status(400).json({ error: 'Enter your WhatsApp number, e.g. 024 123 4567.' });
  }

  const product = (await getProductsByIds([productId])).get(productId);
  const colorway = product?.colorways.find((c) => c.name === color);
  if (!product || product.isHidden || !colorway || !product.sizes.includes(size)) {
    return res.status(400).json({ error: 'That item isn’t available.' });
  }
  if (!isSoldOut(product, color, size)) {
    return res.status(400).json({ error: 'Good news — this size is in stock, you can order it now.' });
  }

  await upsertAlert({ productId, productName: product.name, color, colorLabel: colorway.label, size, phone, name });
  res.status(201).json({ ok: true });
});

// ── Admin ──
router.get('/', requireAdmin, async (_req, res) => {
  res.json(await listAlerts());
});

router.patch('/:id', requireAdmin, async (req, res) => {
  const updated = await markAlertNotified(req.params.id, Boolean(req.body?.notified));
  if (!updated) return res.status(404).json({ error: 'Request not found.' });
  res.json(updated);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const ok = await deleteAlert(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Request not found.' });
  res.json({ deleted: true });
});

export default router;
