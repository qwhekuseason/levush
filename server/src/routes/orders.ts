import { Router } from 'express';
import { requireAdmin, resolveCaller } from '../lib/auth.js';
import { priceOf } from '../store/productStore.js';
import {
  ORDER_STATUSES,
  createOrder,
  listAllOrders,
  listOrdersForUser,
  updateOrderStatus,
  type OrderItem,
  type OrderStatus,
} from '../store/orderStore.js';
import { findCoupon, redeemCoupon } from '../store/rewardsStore.js';

const router = Router();

const FREE_SHIPPING_THRESHOLD = 400;
const SHIPPING_FEE = 30;

router.post('/', async (req, res) => {
  const { items, email, couponCode, shippingAddress, paymentMethod } = req.body ?? {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must contain at least one item.' });
  }
  if (typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email is required.' });
  }

  // Recompute pricing server-side from the trusted catalogue.
  const validItems: OrderItem[] = [];
  let subtotal = 0;
  for (const raw of items as OrderItem[]) {
    const quantity = Math.max(1, Math.min(20, Number(raw.quantity) || 1));
    const catalogPrice = await priceOf(String(raw.productId));
    const price = catalogPrice ?? (Number(raw.price) || 0);
    subtotal += price * quantity;
    validItems.push({
      productId: String(raw.productId),
      name: String(raw.name ?? 'Item'),
      image: raw.image ? String(raw.image) : undefined,
      color: raw.color ? String(raw.color) : undefined,
      size: raw.size ? String(raw.size) : undefined,
      quantity,
      price,
    });
  }

  let shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  let discount = 0;
  let appliedCode: string | null = null;

  if (couponCode) {
    const coupon = await findCoupon(String(couponCode).trim().toUpperCase());
    if (coupon && !coupon.used) {
      appliedCode = coupon.code;
      if (coupon.kind === 'shipping') shipping = 0;
      else discount = Math.round((subtotal * coupon.value) / 100);
      await redeemCoupon(coupon.code);
    }
  }

  const total = Math.max(0, subtotal - discount) + shipping;
  const caller = await resolveCaller(req);

  const order = await createOrder({
    email,
    uid: caller?.uid ?? null,
    shippingAddress: shippingAddress && typeof shippingAddress === 'object' ? {
      firstName: String(shippingAddress.firstName ?? ''),
      lastName: String(shippingAddress.lastName ?? ''),
      address: String(shippingAddress.address ?? ''),
      city: String(shippingAddress.city ?? ''),
      phone: String(shippingAddress.phone ?? ''),
    } : undefined,
    paymentMethod: paymentMethod ? String(paymentMethod) : undefined,
    items: validItems,
    subtotal,
    discount,
    shipping,
    couponCode: appliedCode,
    total,
  });
  res.status(201).json({ id: order.id, status: order.status, total: order.total, discount, shipping });
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
  const status = String(req.body?.status) as OrderStatus;
  if (!ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${ORDER_STATUSES.join(', ')}` });
  }
  const updated = await updateOrderStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ error: 'Order not found.' });
  res.json(updated);
});

export default router;
