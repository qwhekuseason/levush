import { db } from '../lib/firebaseAdmin.js';

export type CouponKind = 'percent' | 'shipping';

export interface Coupon {
  code: string;
  label: string;
  kind: CouponKind;
  value: number; // percent off (for 'percent'); ignored for 'shipping'
  used: boolean;
  email: string;
  createdAt: number;
}

const COLLECTION = 'coupons';

export async function findCoupon(code: string): Promise<Coupon | null> {
  const snap = await db.collection(COLLECTION).doc(code).get();
  return snap.exists ? (snap.data() as Coupon) : null;
}

export async function redeemCoupon(code: string): Promise<void> {
  await db.collection(COLLECTION).doc(code).update({ used: true });
}

export async function listCoupons(email: string): Promise<Coupon[]> {
  const key = email.toLowerCase();
  const snap = await db.collection(COLLECTION).where('email', '==', key).get();
  return snap.docs.map((d) => d.data() as Coupon).sort((a, b) => b.createdAt - a.createdAt);
}

export async function listAllCoupons(): Promise<Coupon[]> {
  const snap = await db.collection(COLLECTION).get();
  return snap.docs.map((d) => d.data() as Coupon).sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteCoupon(code: string): Promise<boolean> {
  const normalized = code.trim().toUpperCase();
  await db.collection(COLLECTION).doc(normalized).delete();
  return true;
}

export async function createCustomCoupon(input: {
  code: string;
  label: string;
  kind: CouponKind;
  value: number;
  email?: string;
}): Promise<Coupon> {
  const code = input.code.trim().toUpperCase();
  const coupon: Coupon = {
    code,
    label: input.label,
    kind: input.kind,
    value: Number(input.value) || 0,
    used: false,
    email: input.email ? input.email.toLowerCase() : 'public',
    createdAt: Date.now(),
  };
  await db.collection(COLLECTION).doc(coupon.code).set(coupon);
  return coupon;
}
