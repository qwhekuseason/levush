import { db } from '../lib/firebaseAdmin.js';

/** A Mobile Money (or bank) account customers can pay into. */
export interface PaymentAccount {
  /** e.g. "MTN MoMo", "Telecel Cash" */
  network: string;
  number: string;
  /** registered account name, so customers can confirm before sending */
  name: string;
}

/** Store-wide settings the admin controls from the dashboard. */
export interface StoreSettings {
  shippingFee: number;
  /** subtotal at/above which delivery is free; 0 disables free delivery */
  freeShippingThreshold: number;
  /** max units of a single line item per order */
  maxQtyPerItem: number;
  /** when false, checkout is disabled and `closedMessage` is shown */
  ordersOpen: boolean;
  closedMessage: string;
  announcement: {
    enabled: boolean;
    text: string;
    /** optional in-site link, e.g. /shop */
    link: string;
  };
  /** where customers send their order on WhatsApp, international digits e.g. 233201234567 */
  whatsappNumber: string;
  paymentAccounts: PaymentAccount[];
  /** extra instructions shown after checkout */
  paymentNote: string;
  updatedAt: number;
}

export const DEFAULT_SETTINGS: StoreSettings = {
  shippingFee: 30,
  freeShippingThreshold: 400,
  maxQtyPerItem: 10,
  ordersOpen: true,
  closedMessage: 'We’re taking a short break — orders will reopen soon.',
  announcement: { enabled: false, text: '', link: '' },
  whatsappNumber: '',
  paymentAccounts: [],
  paymentNote: 'Use your order number as the payment reference, then send us your order on WhatsApp with a screenshot of the payment.',
  updatedAt: 0,
};

/** Normalise a phone number to WhatsApp's international digits form (Ghana-aware). */
export function toWhatsAppDigits(raw: string): string {
  let d = String(raw ?? '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 10 && d.startsWith('0')) d = '233' + d.slice(1); // 024xxxxxxx → 23324xxxxxxx
  if (d.length === 9) d = '233' + d;
  return d;
}

const REF = () => db.collection('settings').doc('store');

// Settings are read on every order; a short in-memory cache keeps that cheap.
let cache: { value: StoreSettings; at: number } | null = null;
const CACHE_MS = 30_000;

export async function getSettings(): Promise<StoreSettings> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;
  const snap = await REF().get();
  const stored = (snap.exists ? snap.data() : {}) as Partial<StoreSettings>;
  const value: StoreSettings = {
    ...DEFAULT_SETTINGS,
    ...stored,
    announcement: { ...DEFAULT_SETTINGS.announcement, ...(stored.announcement ?? {}) },
  };
  cache = { value, at: Date.now() };
  return value;
}

const money = (v: unknown, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : fallback;
};

/** Validate + persist a partial settings update. Throws on invalid input. */
export async function updateSettings(input: Partial<StoreSettings>): Promise<StoreSettings> {
  const current = await getSettings();
  const maxQty = input.maxQtyPerItem !== undefined ? Math.floor(Number(input.maxQtyPerItem)) : current.maxQtyPerItem;
  if (!Number.isFinite(maxQty) || maxQty < 1 || maxQty > 100) {
    throw new Error('Max quantity per item must be between 1 and 100.');
  }
  const link = String(input.announcement?.link ?? current.announcement.link).trim();
  if (link && !link.startsWith('/')) {
    throw new Error('Announcement link must be a page on this site, e.g. /shop');
  }

  const whatsappNumber =
    input.whatsappNumber !== undefined ? toWhatsAppDigits(input.whatsappNumber) : current.whatsappNumber;
  if (whatsappNumber && (whatsappNumber.length < 10 || whatsappNumber.length > 15)) {
    throw new Error('WhatsApp number looks invalid — use a full number like 024 123 4567 or +233 24 123 4567.');
  }
  const rawAccounts = input.paymentAccounts !== undefined ? input.paymentAccounts : current.paymentAccounts;
  if (!Array.isArray(rawAccounts) || rawAccounts.length > 4) throw new Error('Add up to 4 payment accounts.');
  const paymentAccounts = rawAccounts
    .map((a) => ({
      network: String(a?.network ?? '').trim().slice(0, 30),
      number: String(a?.number ?? '').trim().slice(0, 20),
      name: String(a?.name ?? '').trim().slice(0, 60),
    }))
    .filter((a) => a.network || a.number || a.name);
  if (paymentAccounts.some((a) => !a.network || !a.number || !a.name)) {
    throw new Error('Each payment account needs a network, number and account name.');
  }

  const next: StoreSettings = {
    shippingFee: money(input.shippingFee, current.shippingFee),
    freeShippingThreshold: money(input.freeShippingThreshold, current.freeShippingThreshold),
    maxQtyPerItem: maxQty,
    ordersOpen: input.ordersOpen !== undefined ? Boolean(input.ordersOpen) : current.ordersOpen,
    closedMessage: String(input.closedMessage ?? current.closedMessage).slice(0, 300),
    announcement: {
      enabled: input.announcement?.enabled !== undefined ? Boolean(input.announcement.enabled) : current.announcement.enabled,
      text: String(input.announcement?.text ?? current.announcement.text).slice(0, 160),
      link,
    },
    whatsappNumber,
    paymentAccounts,
    paymentNote: String(input.paymentNote ?? current.paymentNote).slice(0, 300),
    updatedAt: Date.now(),
  };
  await REF().set(next);
  cache = { value: next, at: Date.now() };
  return next;
}

/** Shipping for a subtotal under the current settings. */
export function shippingFor(subtotal: number, s: StoreSettings): number {
  if (subtotal <= 0) return 0;
  if (s.freeShippingThreshold > 0 && subtotal >= s.freeShippingThreshold) return 0;
  return s.shippingFee;
}
