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

export interface Rewards {
  email: string;
  points: number;
  lastSpinDay: string | null;
  lastQuizDay: string | null;
}

// ── Memory fallback ──
const rewardsMem = new Map<string, Rewards>();
const couponsMem = new Map<string, Coupon>();

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function blankRewards(email: string): Rewards {
  return { email, points: 0, lastSpinDay: null, lastQuizDay: null };
}

async function readRewards(email: string): Promise<Rewards> {
  const key = email.toLowerCase();
  if (!db) return rewardsMem.get(key) ?? blankRewards(key);
  const snap = await db.collection('rewards').doc(key).get();
  return snap.exists ? (snap.data() as Rewards) : blankRewards(key);
}

async function writeRewards(r: Rewards): Promise<void> {
  const key = r.email.toLowerCase();
  if (!db) {
    rewardsMem.set(key, r);
    return;
  }
  await db.collection('rewards').doc(key).set(r);
}

async function writeCoupon(c: Coupon): Promise<void> {
  if (!db) {
    couponsMem.set(c.code, c);
    return;
  }
  await db.collection('coupons').doc(c.code).set(c);
}

export async function getRewards(email: string): Promise<Rewards> {
  return readRewards(email);
}

export async function listCoupons(email: string): Promise<Coupon[]> {
  const key = email.toLowerCase();
  if (!db) return [...couponsMem.values()].filter((c) => c.email === key).sort((a, b) => b.createdAt - a.createdAt);
  const snap = await db.collection('coupons').where('email', '==', key).get();
  return snap.docs.map((d) => d.data() as Coupon).sort((a, b) => b.createdAt - a.createdAt);
}

export async function addPoints(email: string, points: number): Promise<Rewards> {
  const r = await readRewards(email);
  r.points += points;
  await writeRewards(r);
  return r;
}

// ── Spin-to-Win ──
interface Prize {
  label: string;
  kind: CouponKind | 'points';
  value: number;
  weight: number;
  points: number;
}

const PRIZES: Prize[] = [
  { label: '5% off', kind: 'percent', value: 5, weight: 30, points: 20 },
  { label: '10% off', kind: 'percent', value: 10, weight: 22, points: 25 },
  { label: 'Free shipping', kind: 'shipping', value: 0, weight: 20, points: 20 },
  { label: '50 bonus points', kind: 'points', value: 0, weight: 18, points: 50 },
  { label: '15% off', kind: 'percent', value: 15, weight: 10, points: 30 },
];

function pickPrize(): Prize {
  const total = PRIZES.reduce((n, p) => n + p.weight, 0);
  let roll = Math.random() * total;
  for (const p of PRIZES) {
    roll -= p.weight;
    if (roll <= 0) return p;
  }
  return PRIZES[0];
}

function couponCode(): string {
  return `SPIN-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export interface SpinResult {
  alreadySpun: boolean;
  prizeLabel: string;
  coupon: Coupon | null;
  rewards: Rewards;
  prizeIndex: number;
}

export async function spin(email: string): Promise<SpinResult> {
  const r = await readRewards(email);
  if (r.lastSpinDay === today()) {
    return { alreadySpun: true, prizeLabel: '', coupon: null, rewards: r, prizeIndex: -1 };
  }
  const prize = pickPrize();
  const prizeIndex = PRIZES.indexOf(prize);
  r.lastSpinDay = today();
  r.points += prize.points;
  await writeRewards(r);

  let coupon: Coupon | null = null;
  if (prize.kind !== 'points') {
    coupon = {
      code: couponCode(),
      label: prize.label,
      kind: prize.kind,
      value: prize.value,
      used: false,
      email: email.toLowerCase(),
      createdAt: Date.now(),
    };
    await writeCoupon(coupon);
  }
  return { alreadySpun: false, prizeLabel: prize.label, coupon, rewards: r, prizeIndex };
}

/** Prize labels in wheel order — shared with the client wheel. */
export const PRIZE_LABELS = PRIZES.map((p) => p.label);

// ── Quiz ──
export async function recordQuiz(email: string, correct: number): Promise<{ rewards: Rewards; awarded: number; alreadyToday: boolean }> {
  const r = await readRewards(email);
  const alreadyToday = r.lastQuizDay === today();
  const awarded = alreadyToday ? 0 : correct * 10;
  if (!alreadyToday) {
    r.lastQuizDay = today();
    r.points += awarded;
    await writeRewards(r);
  }
  return { rewards: r, awarded, alreadyToday };
}

// ── Coupons ──
export async function findCoupon(code: string): Promise<Coupon | null> {
  if (!db) return couponsMem.get(code) ?? null;
  const snap = await db.collection('coupons').doc(code).get();
  return snap.exists ? (snap.data() as Coupon) : null;
}

export async function redeemCoupon(code: string): Promise<void> {
  if (!db) {
    const c = couponsMem.get(code);
    if (c) c.used = true;
    return;
  }
  await db.collection('coupons').doc(code).update({ used: true });
}

export async function listAllCoupons(): Promise<Coupon[]> {
  if (!db) return [...couponsMem.values()].sort((a, b) => b.createdAt - a.createdAt);
  const snap = await db.collection('coupons').get();
  return snap.docs.map((d) => d.data() as Coupon).sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteCoupon(code: string): Promise<boolean> {
  const normalized = code.trim().toUpperCase();
  if (!db) {
    return couponsMem.delete(normalized);
  }
  await db.collection('coupons').doc(normalized).delete();
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
  await writeCoupon(coupon);
  return coupon;
}

