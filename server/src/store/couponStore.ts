import { db } from '../lib/firebaseAdmin.js';

export type CouponKind = 'percent' | 'fixed' | 'shipping';
/** hidden: works only if you know the code. public: advertised at checkout. */
export type CouponVisibility = 'hidden' | 'public';

export interface Coupon {
  code: string;
  label: string;
  kind: CouponKind;
  /** percent off (percent), GH₵ off (fixed); ignored for shipping */
  value: number;
  visibility: CouponVisibility;
  /** admin can pause a code without deleting it */
  active: boolean;
  /** restrict to one customer's email; null = anyone */
  email: string | null;
  /** minimum cart subtotal (GH₵) required; 0 = none */
  minSubtotal: number;
  /** cap on a percent discount (GH₵); null = uncapped */
  maxDiscount: number | null;
  /** total redemptions allowed across all customers; null = unlimited */
  usageLimit: number | null;
  /** redemptions allowed per customer email; null = unlimited */
  perCustomerLimit: number | null;
  usedCount: number;
  startsAt: number | null;
  expiresAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export type CouponStatus = 'active' | 'paused' | 'scheduled' | 'expired' | 'exhausted';

const COLLECTION = 'coupons';
export const couponRef = (code: string) => db.collection(COLLECTION).doc(normalizeCode(code));
export const redemptionsOf = (code: string) => couponRef(code).collection('redemptions');

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Bring any stored coupon (including the old `{ used: boolean, email: 'public' }`
 * shape, which was single-use) up to the current schema.
 */
export function normalizeCoupon(raw: Record<string, unknown>): Coupon {
  const legacy = typeof raw.used === 'boolean' && raw.usedCount === undefined;
  const email = typeof raw.email === 'string' && raw.email && raw.email !== 'public' ? raw.email.toLowerCase() : null;
  const num = (v: unknown) => (v === null || v === undefined || v === '' ? null : Number(v));
  return {
    code: normalizeCode(String(raw.code ?? '')),
    label: String(raw.label ?? ''),
    kind: raw.kind === 'fixed' || raw.kind === 'shipping' ? raw.kind : 'percent',
    value: Number(raw.value) || 0,
    visibility: raw.visibility === 'public' ? 'public' : 'hidden',
    active: raw.active === undefined ? true : Boolean(raw.active),
    email,
    minSubtotal: Number(raw.minSubtotal) || 0,
    maxDiscount: num(raw.maxDiscount),
    usageLimit: legacy ? 1 : num(raw.usageLimit),
    perCustomerLimit: legacy ? 1 : num(raw.perCustomerLimit),
    usedCount: legacy ? (raw.used ? 1 : 0) : Number(raw.usedCount) || 0,
    startsAt: num(raw.startsAt),
    expiresAt: num(raw.expiresAt),
    createdAt: Number(raw.createdAt) || Date.now(),
    updatedAt: Number(raw.updatedAt ?? raw.createdAt) || Date.now(),
  };
}

export function couponStatus(c: Coupon, now = Date.now()): CouponStatus {
  if (!c.active) return 'paused';
  if (c.startsAt && now < c.startsAt) return 'scheduled';
  if (c.expiresAt && now > c.expiresAt) return 'expired';
  if (c.usageLimit !== null && c.usedCount >= c.usageLimit) return 'exhausted';
  return 'active';
}

export type CouponResult =
  | { ok: true; discount: number; freeShipping: boolean }
  | { ok: false; reason: string };

const cedis = (n: number) => `GH₵${n.toLocaleString('en-GH')}`;

/**
 * Decide whether a coupon applies and what it's worth. Pure — callers supply
 * the redemption count for the customer so this can run inside a transaction.
 */
export function evaluateCoupon(
  c: Coupon,
  ctx: { subtotal: number; email?: string | null; customerUses?: number; now?: number }
): CouponResult {
  switch (couponStatus(c, ctx.now)) {
    case 'paused':
      return { ok: false, reason: 'This code is no longer active.' };
    case 'scheduled':
      return { ok: false, reason: 'This code isn’t active yet.' };
    case 'expired':
      return { ok: false, reason: 'This code has expired.' };
    case 'exhausted':
      return { ok: false, reason: 'This code has reached its usage limit.' };
  }
  const email = ctx.email?.trim().toLowerCase();
  if (c.email) {
    if (!email) return { ok: false, reason: 'Enter your email first — this code is tied to a specific customer.' };
    if (email !== c.email) return { ok: false, reason: 'This code isn’t valid for this email address.' };
  }
  if (c.perCustomerLimit !== null && (ctx.customerUses ?? 0) >= c.perCustomerLimit) {
    return { ok: false, reason: 'You’ve already used this code.' };
  }
  if (c.minSubtotal > 0 && ctx.subtotal < c.minSubtotal) {
    return { ok: false, reason: `Spend ${cedis(c.minSubtotal)} or more to use this code.` };
  }

  if (c.kind === 'shipping') return { ok: true, discount: 0, freeShipping: true };
  let discount = c.kind === 'percent' ? Math.round((ctx.subtotal * c.value) / 100) : c.value;
  if (c.kind === 'percent' && c.maxDiscount !== null) discount = Math.min(discount, c.maxDiscount);
  return { ok: true, discount: Math.max(0, Math.min(discount, ctx.subtotal)), freeShipping: false };
}

export async function findCoupon(code: string): Promise<Coupon | null> {
  if (!normalizeCode(code)) return null;
  const snap = await couponRef(code).get();
  return snap.exists ? normalizeCoupon(snap.data()!) : null;
}

export async function customerRedemptions(code: string, email: string | null | undefined): Promise<number> {
  if (!email) return 0;
  const snap = await redemptionsOf(code).where('email', '==', email.trim().toLowerCase()).get();
  return snap.size;
}

export async function listAllCoupons(): Promise<Coupon[]> {
  const snap = await db.collection(COLLECTION).get();
  return snap.docs.map((d) => normalizeCoupon(d.data())).sort((a, b) => b.createdAt - a.createdAt);
}

/** Public offers shown to shoppers: active, public, not tied to an email. */
export async function listPublicCoupons(): Promise<Coupon[]> {
  const all = await listAllCoupons();
  return all.filter((c) => c.visibility === 'public' && !c.email && couponStatus(c) === 'active');
}

export async function deleteCoupon(code: string): Promise<boolean> {
  const ref = couponRef(code);
  if (!(await ref.get()).exists) return false;
  await db.recursiveDelete(ref);
  return true;
}

export type CouponInput = Partial<Omit<Coupon, 'usedCount' | 'createdAt' | 'updatedAt'>>;

/** Validate admin input into a full coupon. Throws Error with a readable message. */
function buildCoupon(input: CouponInput, base?: Coupon): Coupon {
  const merged = { ...base, ...input } as CouponInput & Partial<Coupon>;
  const code = normalizeCode(String(merged.code ?? ''));
  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) {
    throw new Error('Code must be 3–32 characters: letters, numbers, - or _.');
  }
  const kind: CouponKind = merged.kind === 'fixed' || merged.kind === 'shipping' ? merged.kind : 'percent';
  const value = Number(merged.value) || 0;
  if (kind === 'percent' && (value <= 0 || value > 100)) throw new Error('Percentage must be between 1 and 100.');
  if (kind === 'fixed' && value <= 0) throw new Error('Fixed discount must be more than GH₵0.');

  const optInt = (v: unknown, name: string) => {
    if (v === null || v === undefined || v === '') return null;
    const n = Math.floor(Number(v));
    if (!Number.isFinite(n) || n < 1) throw new Error(`${name} must be 1 or more (or left blank).`);
    return n;
  };
  const optMoney = (v: unknown, name: string) => {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) throw new Error(`${name} must be more than GH₵0 (or left blank).`);
    return n;
  };
  const optTime = (v: unknown) => (v === null || v === undefined || v === '' ? null : Number(v) || null);

  const startsAt = optTime(merged.startsAt);
  const expiresAt = optTime(merged.expiresAt);
  if (startsAt && expiresAt && expiresAt <= startsAt) throw new Error('Expiry must be after the start date.');

  const email = typeof merged.email === 'string' && merged.email.trim() ? merged.email.trim().toLowerCase() : null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Customer email looks invalid.');

  const now = Date.now();
  return {
    code,
    label: String(merged.label ?? '').trim().slice(0, 80) || code,
    kind,
    value: kind === 'shipping' ? 0 : value,
    visibility: merged.visibility === 'public' ? 'public' : 'hidden',
    active: merged.active === undefined ? true : Boolean(merged.active),
    email,
    minSubtotal: Math.max(0, Number(merged.minSubtotal) || 0),
    maxDiscount: kind === 'percent' ? optMoney(merged.maxDiscount, 'Max discount') : null,
    usageLimit: optInt(merged.usageLimit, 'Total usage limit'),
    perCustomerLimit: optInt(merged.perCustomerLimit, 'Per-customer limit'),
    usedCount: base?.usedCount ?? 0,
    startsAt,
    expiresAt,
    createdAt: base?.createdAt ?? now,
    updatedAt: now,
  };
}

export class CouponConflictError extends Error {}

export async function createCoupon(input: CouponInput): Promise<Coupon> {
  const coupon = buildCoupon(input);
  try {
    await couponRef(coupon.code).create(coupon);
  } catch (e) {
    if ((e as { code?: number }).code === 6) throw new CouponConflictError(`A coupon called ${coupon.code} already exists.`);
    throw e;
  }
  return coupon;
}

/** Update everything except the code itself and the usage counter. */
export async function updateCoupon(code: string, input: CouponInput): Promise<Coupon | null> {
  // Transactional so an edit can't clobber a usedCount bumped by a concurrent order.
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(couponRef(code));
    if (!snap.exists) return null;
    const existing = normalizeCoupon(snap.data()!);
    const next = buildCoupon({ ...input, code: existing.code }, existing);
    tx.set(couponRef(code), next);
    return next;
  });
}
