import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { StoreSettings } from '@/types';
import { api } from '@/lib/api';

// Mirrors the server defaults so the UI is correct before the fetch lands.
export const DEFAULT_STORE_SETTINGS: StoreSettings = {
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
  homepage: {
    hero: {
      eyebrow: 'Faith, worn.',
      title: 'Wear What',
      accent: 'You Believe',
      subtitle: 'Premium scripture streetwear, designed with intention. Every piece carries a word worth wearing.',
    },
    featuredIds: [],
    sections: (['marquee', 'featured', 'lookbook', 'collections', 'promise', 'testimonials', 'cta'] as const).map((key) => ({ key, visible: true })),
  },
};

interface StoreSettingsValue {
  settings: StoreSettings;
  /** shipping owed on `subtotal` before any coupon (for the chosen delivery zone, if any) */
  shippingFor: (subtotal: number, zoneId?: string | null) => number;
  refresh: (fresh?: boolean) => Promise<void>;
  /** apply a just-saved settings object immediately (admin screen) */
  setSettings: (s: StoreSettings) => void;
}

const StoreSettingsContext = createContext<StoreSettingsValue | undefined>(undefined);
const CACHE_KEY = 'levush.settings.v1';

/**
 * Fill any missing pieces with defaults, so an older cached copy or a partial
 * response can never leave the site reading `undefined`.
 */
function withDefaults(s: Partial<StoreSettings> | null | undefined): StoreSettings {
  const d = DEFAULT_STORE_SETTINGS;
  const hp: Partial<StoreSettings['homepage']> = s?.homepage ?? {};
  return {
    ...d,
    ...s,
    announcement: { ...d.announcement, ...(s?.announcement ?? {}) },
    paymentAccounts: Array.isArray(s?.paymentAccounts) ? s!.paymentAccounts : [],
    deliveryZones: Array.isArray(s?.deliveryZones) ? s!.deliveryZones : [],
    homepage: {
      hero: { ...d.homepage.hero, ...(hp.hero ?? {}) },
      featuredIds: Array.isArray(hp.featuredIds) ? hp.featuredIds : [],
      sections: Array.isArray(hp.sections) && hp.sections.length ? hp.sections : d.homepage.sections,
    },
  };
}

function cached(): StoreSettings {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return withDefaults(raw ? JSON.parse(raw) : null);
  } catch {
    return DEFAULT_STORE_SETTINGS;
  }
}

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setState] = useState<StoreSettings>(cached);

  const setSettings = useCallback((incoming: StoreSettings) => {
    const s = withDefaults(incoming);
    setState(s);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(s));
    } catch {
      /* storage full or disabled — not critical */
    }
  }, []);

  const refresh = useCallback(
    async (fresh = true) => {
      try {
        setSettings(await api.getSettings(fresh));
      } catch {
        /* keep cached/default values if the API is unreachable */
      }
    },
    [setSettings]
  );

  useEffect(() => {
    void refresh(false);
  }, [refresh]);

  const value = useMemo<StoreSettingsValue>(
    () => ({
      settings,
      shippingFor: (subtotal, zoneId) =>
        subtotal <= 0 || (settings.freeShippingThreshold > 0 && subtotal >= settings.freeShippingThreshold)
          ? 0
          : settings.deliveryZones.find((z) => z.id === zoneId)?.fee ?? settings.shippingFee,
      refresh,
      setSettings,
    }),
    [settings, refresh, setSettings]
  );

  return <StoreSettingsContext.Provider value={value}>{children}</StoreSettingsContext.Provider>;
}

export function useStoreSettings(): StoreSettingsValue {
  const ctx = useContext(StoreSettingsContext);
  if (!ctx) throw new Error('useStoreSettings must be used within StoreSettingsProvider');
  return ctx;
}
