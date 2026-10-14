import { randomUUID } from 'node:crypto';
import { db } from '../lib/firebaseAdmin.js';
import { couponRef, evaluateCoupon, normalizeCoupon, redemptionsOf } from './couponStore.js';

export interface OrderItem {
  productId: string;
  name: string;
  image?: string;
  color?: string;
  size?: string;
  quantity: number;
  price: number;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  phone: string;
}

export type OrderStatus = 'received' | 'paid' | 'shipped' | 'cancelled';
export const ORDER_STATUSES: OrderStatus[] = ['received', 'paid', 'shipped', 'cancelled'];

export interface Order {
  id: string;
  email: string;
  uid: string | null;
  shippingAddress?: ShippingAddress;
  /** delivery option chosen at checkout (when the shop has delivery zones) */
  delivery?: { id: string; name: string; eta: string };
  paymentMethod?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  couponCode: string | null;
  total: number;
  status: OrderStatus;
  /** when each status was reached (orders placed before this existed won't have it) */
  statusHistory?: Array<{ status: OrderStatus; at: number }>;
  /** optional message from the shop, shown on the customer's tracking page */
  customerNote?: string;
  createdAt: number;
}

/** What a customer may see when tracking an order (no email, uid or full address). */
export interface TrackedOrder {
  id: string;
  status: OrderStatus;
  statusHistory: Array<{ status: OrderStatus; at: number }>;
  items: Array<Pick<OrderItem, 'productId' | 'name' | 'color' | 'size' | 'quantity' | 'price'>>;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  city: string;
  delivery: string;
  customerNote: string;
  createdAt: number;
}

const COLLECTION = 'orders';

/** Raised when a coupon is rejected at order time; message is shopper-facing. */
export class CouponRejectedError extends Error {}

/**
 * Create an order, redeeming `couponCode` (if any) atomically: the coupon's
 * limits are re-checked, its usage counter bumped and a redemption recorded in
 * the same transaction that writes the order — so two simultaneous checkouts
 * can't both squeeze through a limit, and a failed order never burns a code.
 */
export async function placeOrder(
  input: Omit<Order, 'id' | 'status' | 'createdAt' | 'discount' | 'couponCode' | 'total'>,
  couponCode: string | null
): Promise<Order> {
  const id = `LV-${randomUUID().slice(0, 8).toUpperCase()}`;
  const email = input.email.trim().toLowerCase();

  return db.runTransaction(async (tx) => {
    let discount = 0;
    let shipping = input.shipping;
    let appliedCode: string | null = null;

    if (couponCode) {
      const ref = couponRef(couponCode);
      const snap = await tx.get(ref);
      if (!snap.exists) throw new CouponRejectedError('That coupon code doesn’t exist.');
      const coupon = normalizeCoupon(snap.data()!);
      const customerUses =
        coupon.perCustomerLimit !== null
          ? (await tx.get(redemptionsOf(coupon.code).where('email', '==', email))).size
          : 0;
      const result = evaluateCoupon(coupon, { subtotal: input.subtotal, email, customerUses });
      if (!result.ok) throw new CouponRejectedError(result.reason);

      discount = result.discount;
      if (result.freeShipping) shipping = 0;
      appliedCode = coupon.code;
      // Rewriting the whole doc also migrates legacy-shaped coupons.
      tx.set(ref, { ...coupon, usedCount: coupon.usedCount + 1, updatedAt: Date.now() });
      // `discount` here is what the shopper saved, including waived delivery.
      const saved = discount + (result.freeShipping ? input.shipping : 0);
      tx.set(redemptionsOf(coupon.code).doc(id), { orderId: id, email, discount: saved, at: Date.now() });
    }

    const order: Order = {
      ...input,
      email,
      id,
      shipping,
      discount,
      couponCode: appliedCode,
      total: Math.max(0, input.subtotal - discount) + shipping,
      status: 'received',
      statusHistory: [{ status: 'received', at: Date.now() }],
      createdAt: Date.now(),
    };
    tx.set(db.collection(COLLECTION).doc(id), order);
    return order;
  });
}

export async function listOrdersForUser(uid: string): Promise<Order[]> {
  const snap = await db.collection(COLLECTION).where('uid', '==', uid).get();
  return snap.docs.map((d) => d.data() as Order).sort((a, b) => b.createdAt - a.createdAt);
}

export async function listAllOrders(): Promise<Order[]> {
  const snap = await db.collection(COLLECTION).orderBy('createdAt', 'desc').limit(500).get();
  return snap.docs.map((d) => d.data() as Order);
}

/** Admin update: change status (recorded in the history) and/or the customer note. */
export async function updateOrder(
  id: string,
  patch: { status?: OrderStatus; customerNote?: string }
): Promise<Order | null> {
  const ref = db.collection(COLLECTION).doc(id);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return null;
    const order = snap.data() as Order;
    const next: Order = { ...order };
    if (patch.status && patch.status !== order.status) {
      const history = order.statusHistory ?? [{ status: 'received' as OrderStatus, at: order.createdAt }];
      next.status = patch.status;
      next.statusHistory = [...history, { status: patch.status, at: Date.now() }];
    }
    if (patch.customerNote !== undefined) next.customerNote = patch.customerNote.trim().slice(0, 500);
    tx.set(ref, next);
    return next;
  });
}

const lastDigits = (phone: string) => String(phone ?? '').replace(/\D/g, '').slice(-9);

/**
 * Look up an order for its customer. Requires the order number AND the phone
 * used at checkout (last 9 digits, so 024…, +233 24… and 23324… all match).
 */
/** The full order, but only if `phone` matches the one used at checkout. */
export async function getOrderForCustomer(id: string, phone: string): Promise<Order | null> {
  const snap = await db.collection(COLLECTION).doc(id.trim().toUpperCase()).get();
  if (!snap.exists) return null;
  const o = snap.data() as Order;
  const given = lastDigits(phone);
  if (given.length < 9 || given !== lastDigits(o.shippingAddress?.phone ?? '')) return null;
  return o;
}

export async function trackOrder(id: string, phone: string): Promise<TrackedOrder | null> {
  const o = await getOrderForCustomer(id, phone);
  if (!o) return null;
  return {
    id: o.id,
    status: o.status,
    statusHistory: o.statusHistory ?? [{ status: 'received', at: o.createdAt }],
    items: o.items.map(({ productId, name, color, size, quantity, price }) => ({ productId, name, color, size, quantity, price })),
    subtotal: o.subtotal,
    discount: o.discount,
    shipping: o.shipping,
    total: o.total,
    city: o.shippingAddress?.city ?? '',
    delivery: o.delivery ? `${o.delivery.name}${o.delivery.eta ? ` (${o.delivery.eta})` : ''}` : '',
    customerNote: o.customerNote ?? '',
    createdAt: o.createdAt,
  };
}
