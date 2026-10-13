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
};

interface StoreSettingsValue {
  settings: StoreSettings;
  /** shipping owed on `subtotal` before any coupon */
  shippingFor: (subtotal: number) => number;
  refresh: (fresh?: boolean) => Promise<void>;
  /** apply a just-saved settings object immediately (admin screen) */
  setSettings: (s: StoreSettings) => void;
}

const StoreSettingsContext = createContext<StoreSettingsValue | undefined>(undefined);
const CACHE_KEY = 'levush.settings.v1';

function cached(): StoreSettings {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? { ...DEFAULT_STORE_SETTINGS, ...JSON.parse(raw) } : DEFAULT_STORE_SETTINGS;
  } catch {
    return DEFAULT_STORE_SETTINGS;
  }
}

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setState] = useState<StoreSettings>(cached);

  const setSettings = useCallback((s: StoreSettings) => {
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
      shippingFor: (subtotal) =>
        subtotal <= 0 || (settings.freeShippingThreshold > 0 && subtotal >= settings.freeShippingThreshold)
          ? 0
          : settings.shippingFee,
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
