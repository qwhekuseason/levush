import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * Saved pieces ("wishlist") and recently viewed products, kept on this device
 * so shoppers don't need an account.
 */
interface WishlistValue {
  saved: string[];
  isSaved: (productId: string) => boolean;
  toggleSaved: (productId: string) => void;
  recent: string[];
  markViewed: (productId: string) => void;
}

const WishlistContext = createContext<WishlistValue | undefined>(undefined);
const SAVED_KEY = 'levush.saved.v1';
const RECENT_KEY = 'levush.recent.v1';
const MAX_SAVED = 60;
const MAX_RECENT = 12;

function load(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

function persist(key: string, value: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — keep working in memory */
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<string[]>(() => load(SAVED_KEY));
  const [recent, setRecent] = useState<string[]>(() => load(RECENT_KEY));

  useEffect(() => persist(SAVED_KEY, saved), [saved]);
  useEffect(() => persist(RECENT_KEY, recent), [recent]);

  // Keep tabs in sync when the shopper saves something in another tab.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === SAVED_KEY) setSaved(load(SAVED_KEY));
      if (e.key === RECENT_KEY) setRecent(load(RECENT_KEY));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggleSaved = useCallback((id: string) => {
    setSaved((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev].slice(0, MAX_SAVED)));
  }, []);

  const markViewed = useCallback((id: string) => {
    setRecent((prev) => (prev[0] === id ? prev : [id, ...prev.filter((x) => x !== id)].slice(0, MAX_RECENT)));
  }, []);

  const value = useMemo<WishlistValue>(
    () => ({ saved, isSaved: (id) => saved.includes(id), toggleSaved, recent, markViewed }),
    [saved, recent, toggleSaved, markViewed]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
