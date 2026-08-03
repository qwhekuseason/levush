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
  products: Product[];        // visible to shoppers (hidden ones excluded)
  allProducts: Product[];     // full list including hidden (admin use only)
  loading: boolean;
  getProduct: (slug: string) => Product | undefined;
  getProductById: (id: string) => Product | undefined;
  refresh: () => Promise<void>;
}

const CatalogContext = createContext<CatalogContextValue | undefined>(undefined);

export function CatalogProvider({ children }: { children: ReactNode }) {
  // Seed with the static catalogue so the UI renders instantly, then sync
  // from the backend (the admin-managed source of truth).
  const [allProducts, setAllProducts] = useState<Product[]>(seedProducts);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const list = await api.listProducts();
      if (Array.isArray(list) && list.length) {
        setAllProducts(list);
      }
    } catch {
      /* keep the seed catalogue if the backend is unreachable */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Buyers never see hidden products
  const products = useMemo(() => allProducts.filter((p) => !p.isHidden), [allProducts]);

  const value = useMemo<CatalogContextValue>(
    () => ({
      products,
      allProducts,
      loading,
      getProduct: (slug) => products.find((p) => p.slug === slug),
      getProductById: (id) => allProducts.find((p) => p.id === id),
      refresh,
    }),
    [products, allProducts, loading, refresh]
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogContextValue {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider');
  return ctx;
}
