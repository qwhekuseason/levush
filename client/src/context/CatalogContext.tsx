import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Product } from '@/types';
import { products as seedProducts } from '@/data/products';
import { api } from '@/lib/api';

interface CatalogContextValue {
  products: Product[];
  loading: boolean;
  getProduct: (slug: string) => Product | undefined;
  getProductById: (id: string) => Product | undefined;
  refresh: () => Promise<void>;
}

const CatalogContext = createContext<CatalogContextValue | undefined>(undefined);

export function CatalogProvider({ children }: { children: ReactNode }) {
  // Seed with the static catalogue so the UI renders instantly, then sync
  // from the backend (the admin-managed source of truth).
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const list = await api.listProducts();
      if (Array.isArray(list) && list.length) setProducts(list);
    } catch {
      /* keep the seed catalogue if the backend is unreachable */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<CatalogContextValue>(
    () => ({
      products,
      loading,
      getProduct: (slug) => products.find((p) => p.slug === slug),
      getProductById: (id) => products.find((p) => p.id === id),
      refresh,
    }),
    [products, loading, refresh]
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogContextValue {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider');
  return ctx;
}
