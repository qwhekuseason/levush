import { Router } from 'express';
import { requireAdmin, resolveCaller } from '../lib/auth.js';
import { getProductsByIds, isSoldOut } from '../store/productStore.js';
import { getSettings, shippingFor } from '../store/settingsStore.js';
import {
  CouponRejectedError,
  ORDER_STATUSES,
  placeOrder,
  listAllOrders,
  listOrdersForUser,
  trackOrder,
  updateOrder,
  type OrderItem,
  type OrderStatus,
} from '../store/orderStore.js';

const router = Router();

router.post('/', async (req, res) => {
  const { items, email, couponCode, shippingAddress, paymentMethod } = req.body ?? {};
  const settings = await getSettings();

  if (!settings.ordersOpen) {
    return res.status(503).json({ error: settings.closedMessage || 'Orders are paused right now.' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must contain at least one item.' });
  }
  if (items.length > 50) {
    return res.status(400).json({ error: 'Too many line items in one order.' });
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'A valid email is required.' });
  }
  const addr = shippingAddress && typeof shippingAddress === 'object' ? shippingAddress : null;
  const field = (v: unknown) => String(v ?? '').trim().slice(0, 200);
  if (!addr || !field(addr.firstName) || !field(addr.address) || !field(addr.city) || !field(addr.phone)) {
    return res.status(400).json({ error: 'Delivery name, address, city and phone are required.' });
  }

  // Price, name and availability always come from the trusted catalogue —
  // never from the request.
  const catalogue = await getProductsByIds((items as OrderItem[]).map((i) => String(i?.productId)));
  const validItems: OrderItem[] = [];
  let subtotal = 0;
  for (const raw of items as OrderItem[]) {
    const product = catalogue.get(String(raw?.productId));
    if (!product || product.isHidden) {
      return res.status(400).json({ error: `“${String(raw?.name ?? raw?.productId)}” is no longer available.` });
    }
    const quantity = Math.floor(Number(raw.quantity) || 0);
    if (quantity < 1 || quantity > settings.maxQtyPerItem) {
      return res.status(400).json({ error: `Quantity for ${product.name} must be between 1 and ${settings.maxQtyPerItem}.` });
    }
    const size = raw.size ? String(raw.size) : undefined;
    if (product.sizes?.length && (!size || !product.sizes.includes(size))) {
      return res.status(400).json({ error: `Please choose a valid size for ${product.name}.` });
    }
    // colorKey is the colourway id; `color` is the human label kept on the order.
    const colorKey = String((raw as OrderItem & { colorKey?: string }).colorKey ?? '');
    const colorway = product.colorways.find((c) => c.name === colorKey || c.label === raw.color);
    if (colorway && size && isSoldOut(product, colorway.name, size)) {
      return res.status(409).json({
        error: `${product.name} (${colorway.label}, ${size}) just sold out. Please remove it from your bag.`,
        soldOut: true,
      });
    }
    subtotal += product.price * quantity;
    // Inline data-URL images can be tens of KB each; keep orders lean.
    const image = raw.image && !String(raw.image).startsWith('data:') ? String(raw.image) : undefined;
    validItems.push({
      productId: product.id,
      name: product.name,
      ...(image ? { image } : {}),
      ...(raw.color ? { color: String(raw.color).slice(0, 60) } : {}),
      ...(size ? { size } : {}),
      quantity,
      price: product.price,
    });
  }

  const caller = await resolveCaller(req);
  try {
    const order = await placeOrder(
      {
        email,
        uid: caller?.uid ?? null,
        shippingAddress: {
          firstName: field(addr.firstName),
          lastName: field(addr.lastName),
          address: field(addr.address),
          city: field(addr.city),
          phone: field(addr.phone),
        },
        // Firestore rejects `undefined` fields, so omit rather than set them.
        ...(paymentMethod ? { paymentMethod: String(paymentMethod).slice(0, 60) } : {}),
        items: validItems,
        subtotal,
        shipping: shippingFor(subtotal, settings),
      },
      couponCode ? String(couponCode) : null
    );
    res.status(201).json({
      id: order.id,
      status: order.status,
      total: order.total,
      discount: order.discount,
      shipping: order.shipping,
    });
  } catch (e) {
    if (e instanceof CouponRejectedError) return res.status(409).json({ error: e.message, coupon: true });
    console.error('[orders] create failed:', e);
    res.status(500).json({ error: 'Could not place your order. Please try again.' });
  }
});

// Basic brake on guessing order numbers: per-IP attempts per window. (Per
// serverless instance, so it's a speed bump, not a wall — the phone check is
// the real protection.)
const trackAttempts = new Map<string, { n: number; reset: number }>();
const TRACK_LIMIT = 20;
const TRACK_WINDOW_MS = 10 * 60_000;

router.post('/track', async (req, res) => {
  const ip = String(req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? '').split(',')[0].trim();
  const now = Date.now();
  const entry = trackAttempts.get(ip);
  if (entry && entry.reset > now && entry.n >= TRACK_LIMIT) {
    return res.status(429).json({ error: 'Too many attempts. Please wait a few minutes and try again.' });
  }
  trackAttempts.set(ip, entry && entry.reset > now ? { n: entry.n + 1, reset: entry.reset } : { n: 1, reset: now + TRACK_WINDOW_MS });

  const id = String(req.body?.id ?? '').trim();
  const phone = String(req.body?.phone ?? '');
  if (!/^LV-[A-Z0-9]{8}$/i.test(id) || !phone.trim()) {
    return res.status(400).json({ error: 'Enter your order number (e.g. LV-1A2B3C4D) and the phone number you ordered with.' });
  }
  const order = await trackOrder(id, phone);
  // Same message whether the order doesn't exist or the phone is wrong.
  if (!order) return res.status(404).json({ error: 'We couldn’t find an order with that number and phone. Check both and try again.' });
  res.set('Cache-Control', 'no-store');
  res.json(order);
});

router.get('/mine', async (req, res) => {
  const caller = await resolveCaller(req);
  if (!caller) return res.status(401).json({ error: 'Sign in to view your orders.' });
  res.json(await listOrdersForUser(caller.uid));
});

// ── Admin ──
router.get('/', requireAdmin, async (_req, res) => {
  res.json(await listAllOrders());
});

router.patch('/:id', requireAdmin, async (req, res) => {
  const status = req.body?.status === undefined ? undefined : (String(req.body.status) as OrderStatus);
  if (status !== undefined && !ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${ORDER_STATUSES.join(', ')}` });
  }
  const customerNote = typeof req.body?.customerNote === 'string' ? req.body.customerNote : undefined;
  const updated = await updateOrder(req.params.id, { status, customerNote });
  if (!updated) return res.status(404).json({ error: 'Order not found.' });
  res.json(updated);
});

export default router;
