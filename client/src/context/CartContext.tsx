import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { CartItem, ColorwayName, Product } from '@/types';
import { productImage } from '@/lib/format';
import { useCatalog } from '@/context/CatalogContext';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { isSoldOut } from '@/lib/stock';

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  /** admin-configured max units per line item */
  maxQty: number;
  /** some line is sold out or no longer available; checkout must wait */
  hasUnavailable: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product, color: ColorwayName, size: string, quantity?: number) => void;
  removeItem: (lineId: string) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  /** +1 / -1 from the current value (safe for rapid taps); 0 removes the line */
  changeQuantity: (lineId: string, delta: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = 'levush.cart.v1';

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

// Data-URL images are huge; they'd blow through localStorage's quota. Store
// only real URLs and resolve the rest from the catalogue at render time.
const persistableImage = (src: string) => (src.startsWith('data:') ? '' : src);

export function CartProvider({ children }: { children: ReactNode }) {
  const { products, loading: catalogLoading } = useCatalog();
  const { settings } = useStoreSettings();
  const maxQty = settings.maxQtyPerItem;
  const [stored, setItems] = useState<CartItem[]>(loadCart);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const lean = stored.map(({ soldOut: _derived, ...i }) => ({ ...i, image: persistableImage(i.image) }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lean));
  }, [stored]);

  const items = useMemo(
    () =>
      stored.map((i) => {
        const product = products.find((p) => p.id === i.productId);
        // Once the live catalogue has loaded, a missing product was removed or hidden.
        if (!product) return catalogLoading ? i : { ...i, soldOut: true };
        return {
          ...i,
          // keep the cart in step with the live catalogue price and limits
          price: product.price,
          quantity: Math.min(i.quantity, maxQty),
          originalPrice: product.originalPrice,
          image: i.image || productImage(product, i.color),
          colorLabel: i.colorLabel ?? product.colorways.find((c) => c.name === i.color)?.label,
          soldOut: isSoldOut(product, i.color, i.size),
        };
      }),
    [stored, products, maxQty, catalogLoading]
  );

  const addItem = useCallback(
    (product: Product, color: ColorwayName, size: string, quantity = 1) => {
      const lineId = `${product.id}-${color}-${size}`;
      setItems((prev) => {
        const existing = prev.find((i) => i.id === lineId);
        if (existing) {
          return prev.map((i) =>
            i.id === lineId ? { ...i, quantity: Math.min(maxQty, i.quantity + quantity) } : i
          );
        }
        return [
          ...prev,
          {
            id: lineId,
            productId: product.id,
            name: product.name,
            image: productImage(product, color),
            colorLabel: product.colorways.find((c) => c.name === color)?.label,
            price: product.price,
            originalPrice: product.originalPrice,
            color,
            size,
            quantity: Math.min(maxQty, quantity),
          },
        ];
      });
      setIsOpen(true);
    },
    [maxQty]
  );

  const removeItem = useCallback((lineId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== lineId));
  }, []);

  const setQuantity = useCallback((lineId: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.id !== lineId)
        : prev.map((i) => (i.id === lineId ? { ...i, quantity: Math.min(maxQty, quantity) } : i))
    );
  }, [maxQty]);

  const changeQuantity = useCallback((lineId: string, delta: number) => {
    // Functional update: each tap builds on the latest quantity, not a stale render.
    setItems((prev) =>
      prev.flatMap((i) => {
        if (i.id !== lineId) return [i];
        const q = Math.min(maxQty, i.quantity + delta);
        return q <= 0 ? [] : [{ ...i, quantity: q }];
      })
    );
  }, [maxQty]);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((n, i) => n + i.quantity, 0);
    const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0);
    return {
      items,
      count,
      subtotal,
      isOpen,
      maxQty,
      hasUnavailable: items.some((i) => i.soldOut),
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addItem,
      removeItem,
      setQuantity,
      changeQuantity,
      clear,
    };
  }, [items, isOpen, maxQty, addItem, removeItem, setQuantity, changeQuantity, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
