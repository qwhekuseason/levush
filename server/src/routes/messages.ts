import { Router } from 'express';
import { requireAdmin } from '../lib/auth.js';
import { rateLimit } from '../lib/rateLimit.js';
import { createMessage, deleteMessage, listMessages, setMessageRead } from '../store/messageStore.js';

const router = Router();

const contactLimit = rateLimit({
  max: 5,
  windowMs: 10 * 60_000,
  message: 'You’ve sent a few messages already — please wait a little, or reach us on WhatsApp.',
});

/** Contact form submission (public). */
router.post('/', contactLimit, async (req, res) => {
  const { name, email, phone, message, website } = req.body ?? {};
  // Honeypot: real visitors never see or fill this field; bots usually do.
  if (website) return res.status(201).json({ ok: true });

  const clean = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);
  const msg = {
    name: clean(name, 100),
    email: clean(email, 200).toLowerCase(),
    phone: clean(phone, 30),
    message: clean(message, 3000),
  };
  if (!msg.name) return res.status(400).json({ error: 'Please tell us your name.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(msg.email)) return res.status(400).json({ error: 'Please enter a valid email so we can reply.' });
  if (msg.message.length < 5) return res.status(400).json({ error: 'Please write a short message.' });

  try {
    await createMessage(msg);
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error('[messages] save failed:', e);
    res.status(500).json({ error: 'Could not send your message. Please try again or reach us on WhatsApp.' });
  }
});

// ── Admin inbox ──
router.get('/', requireAdmin, async (_req, res) => {
  res.json(await listMessages());
});

router.patch('/:id', requireAdmin, async (req, res) => {
  const updated = await setMessageRead(req.params.id, Boolean(req.body?.read));
  if (!updated) return res.status(404).json({ error: 'Message not found.' });
  res.json(updated);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const ok = await deleteMessage(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Message not found.' });
  res.json({ deleted: true });
});

export default router;
