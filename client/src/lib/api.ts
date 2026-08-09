import type {
  Coupon,
  CouponKind,
  Me,
  Order,
  OrderStatus,
  Product,
} from '@/types';

const BASE = '/api';

async function request<T>(path: string, init: RequestInit = {}, auth?: string | null): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (auth) headers.Authorization = auth;
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  health: () => request<{ status: string }>('/health'),
  me: (auth?: string | null) => request<Me>('/me', {}, auth),

  // Catalogue
  listProducts: () => request<Product[]>('/products'),
  getProduct: (slug: string) => request<Product>(`/products/${slug}`),
  createProduct: (data: Partial<Product>, auth: string) =>
    request<Product>('/products', { method: 'POST', body: JSON.stringify(data) }, auth),
  updateProduct: (id: string, data: Partial<Product>, auth: string) =>
    request<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }, auth),
  deleteProduct: (id: string, auth: string) =>
    request<{ deleted: boolean }>(`/products/${id}`, { method: 'DELETE' }, auth),

  // Orders
  createOrder: (
    input: {
      items: { productId: string; name: string; image?: string; color?: string; size?: string; quantity: number; price: number }[];
      email: string;
      shippingAddress?: { firstName: string; lastName: string; address: string; city: string; phone: string };
      paymentMethod?: string;
      couponCode?: string | null;
    },
    auth?: string | null
  ) =>
    request<{ id: string; status: string; total: number; discount: number; shipping: number }>(
      '/orders',
      { method: 'POST', body: JSON.stringify(input) },
      auth
    ),
  listMyOrders: (auth: string) => request<Order[]>('/orders/mine', {}, auth),
  listAllOrders: (auth: string) => request<Order[]>('/orders', {}, auth),
  updateOrderStatus: (id: string, status: OrderStatus, auth: string) =>
    request<Order>(`/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }, auth),

  // Coupons
  validateCoupon: (code: string) =>
    request<{ valid: boolean; code?: string; kind?: CouponKind; value?: number; label?: string }>(
      '/coupons/validate',
      { method: 'POST', body: JSON.stringify({ code }) }
    ),

  // Admin — coupon management
  listAllCoupons: (auth: string) => request<Coupon[]>('/coupons', {}, auth),
  createCoupon: (
    data: { code: string; label: string; kind: CouponKind; value: number; email?: string },
    auth: string
  ) => request<Coupon>('/coupons', { method: 'POST', body: JSON.stringify(data) }, auth),
  deleteCoupon: (code: string, auth: string) =>
    request<{ deleted: boolean }>(`/coupons/${code}`, { method: 'DELETE' }, auth),
};

export type { Coupon };
