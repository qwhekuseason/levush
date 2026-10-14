import { db } from '../lib/firebaseAdmin.js';

/** A Mobile Money (or bank) account customers can pay into. */
export interface PaymentAccount {
  /** e.g. "MTN MoMo", "Telecel Cash" */
  network: string;
  number: string;
  /** registered account name, so customers can confirm before sending */
  name: string;
}

/** A delivery option the customer picks at checkout (e.g. "Accra", "Pickup"). */
export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  /** shown to customers, e.g. "1–2 days" */
  eta: string;
}

/** Homepage sections, in the order the admin arranges them. */
export const HOME_SECTIONS = ['marquee', 'featured', 'lookbook', 'collections', 'promise', 'testimonials', 'cta'] as const;
export type HomeSectionKey = (typeof HOME_SECTIONS)[number];

export interface HomepageSettings {
  hero: { eyebrow: string; title: string; accent: string; subtitle: string };
  /** product ids for "New & Noted"; empty = newest 4 */
  featuredIds: string[];
  sections: Array<{ key: HomeSectionKey; visible: boolean }>;
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
  /** when non-empty, customers choose one at checkout and its fee replaces shippingFee */
  deliveryZones: DeliveryZone[];
  homepage: HomepageSettings;
  updatedAt: number;
}

export const DEFAULT_HOMEPAGE: HomepageSettings = {
  hero: {
    eyebrow: 'Faith, worn.',
    title: 'Wear What',
    accent: 'You Believe',
    subtitle: 'Premium scripture streetwear, designed with intention. Every piece carries a word worth wearing.',
  },
  featuredIds: [],
  sections: HOME_SECTIONS.map((key) => ({ key, visible: true })),
};

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
  deliveryZones: [],
  homepage: DEFAULT_HOMEPAGE,
  updatedAt: 0,
};

/** Fill gaps and fix the section list so every known section appears exactly once. */
function normalizeHomepage(raw: Partial<HomepageSettings> | undefined): HomepageSettings {
  const hero = { ...DEFAULT_HOMEPAGE.hero, ...(raw?.hero ?? {}) };
  const seen = new Set<string>();
  const sections = (Array.isArray(raw?.sections) ? raw!.sections : [])
    .filter((x) => HOME_SECTIONS.includes(x?.key as HomeSectionKey) && !seen.has(x.key) && seen.add(x.key))
    .map((x) => ({ key: x.key, visible: x.visible !== false }));
  for (const key of HOME_SECTIONS) if (!seen.has(key)) sections.push({ key, visible: true });
  const featuredIds = Array.isArray(raw?.featuredIds) ? [...new Set(raw!.featuredIds.map(String))].slice(0, 8) : [];
  return { hero, featuredIds, sections };
}

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
    deliveryZones: Array.isArray(stored.deliveryZones) ? stored.deliveryZones : [],
    homepage: normalizeHomepage(stored.homepage),
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

  const rawZones = input.deliveryZones !== undefined ? input.deliveryZones : current.deliveryZones;
  if (!Array.isArray(rawZones) || rawZones.length > 12) throw new Error('Add up to 12 delivery options.');
  const usedIds = new Set<string>();
  const deliveryZones = rawZones
    .map((z) => {
      const name = String(z?.name ?? '').trim().slice(0, 40);
      let id = String(z?.id ?? '').trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      while (usedIds.has(id)) id += '-2';
      usedIds.add(id);
      // A blank fee arrives as null/''; treat it as missing rather than as free.
      const rawFee = z?.fee as unknown;
      const fee = rawFee === null || rawFee === undefined || rawFee === '' ? NaN : money(rawFee, NaN);
      return { id, name, fee, eta: String(z?.eta ?? '').trim().slice(0, 40) };
    })
    .filter((z) => z.name || Number.isFinite(z.fee));
  if (deliveryZones.some((z) => !z.name || !z.id || !Number.isFinite(z.fee))) {
    throw new Error('Each delivery option needs a name and a fee (0 for free, e.g. pickup).');
  }

  const hpIn = input.homepage ? normalizeHomepage({ ...current.homepage, ...input.homepage }) : current.homepage;
  const homepage: HomepageSettings = {
    hero: {
      eyebrow: hpIn.hero.eyebrow.slice(0, 40),
      title: hpIn.hero.title.slice(0, 40),
      accent: hpIn.hero.accent.slice(0, 30),
      subtitle: hpIn.hero.subtitle.slice(0, 200),
    },
    featuredIds: hpIn.featuredIds,
    sections: hpIn.sections,
  };

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
    deliveryZones,
    homepage,
    updatedAt: Date.now(),
  };
  await REF().set(next);
  cache = { value: next, at: Date.now() };
  return next;
}

/** The delivery option a customer chose (only meaningful when zones are set up). */
export function findZone(s: StoreSettings, zoneId: string | null | undefined): DeliveryZone | undefined {
  return s.deliveryZones.find((z) => z.id === zoneId);
}

/** Delivery fee for a subtotal: the chosen zone's fee (or the flat fee), free over the threshold. */
export function shippingFor(subtotal: number, s: StoreSettings, zoneId?: string | null): number {
  if (subtotal <= 0) return 0;
  if (s.freeShippingThreshold > 0 && subtotal >= s.freeShippingThreshold) return 0;
  const zone = findZone(s, zoneId);
  return zone ? zone.fee : s.shippingFee;
}
