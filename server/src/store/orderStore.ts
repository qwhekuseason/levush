import { randomUUID } from 'node:crypto';
import { db } from '../lib/firebaseAdmin.js';

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
  paymentMethod?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  couponCode: string | null;
  total: number;
  status: OrderStatus;
  createdAt: number;
}

const COLLECTION = 'orders';
let memory: Order[] = [];

export async function createOrder(
  input: Omit<Order, 'id' | 'status' | 'createdAt'>
): Promise<Order> {
  const order: Order = {
    ...input,
    id: `LV-${randomUUID().slice(0, 8).toUpperCase()}`,
    status: 'received',
    createdAt: Date.now(),
  };
  if (!db) {
    memory.unshift(order);
    return order;
  }
  await db.collection(COLLECTION).doc(order.id).set(order);
  return order;
}

export async function listOrdersForUser(uid: string): Promise<Order[]> {
  if (!db) return memory.filter((o) => o.uid === uid).sort((a, b) => b.createdAt - a.createdAt);
  const snap = await db.collection(COLLECTION).where('uid', '==', uid).get();
  return snap.docs.map((d) => d.data() as Order).sort((a, b) => b.createdAt - a.createdAt);
}

export async function listAllOrders(): Promise<Order[]> {
  if (!db) return [...memory].sort((a, b) => b.createdAt - a.createdAt);
  const snap = await db.collection(COLLECTION).orderBy('createdAt', 'desc').limit(500).get();
  return snap.docs.map((d) => d.data() as Order);
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order | null> {
  if (!db) {
    const o = memory.find((x) => x.id === id);
    if (!o) return null;
    o.status = status;
    return o;
  }
  const ref = db.collection(COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  await ref.update({ status });
  return { ...(snap.data() as Order), status };
}
