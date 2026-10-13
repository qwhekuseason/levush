import type {
  Coupon,
  CouponInput,
  Me,
  Order,
  OrderStatus,
  Product,
  PublicCoupon,
  StoreSettings,
  TrackedOrder,
  ContactMessage,
} from '@/types';

const BASE = '/api';

/** Product writes; `originalPrice: null` explicitly removes a sale price. */
export type ProductPayload = Partial<Omit<Product, 'originalPrice'>> & { originalPrice?: number | null };

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
  /** `fresh` bypasses the CDN cache (admin screens, right after an edit). */
  listProducts: (fresh = false) => request<Product[]>(fresh ? `/products?fresh=${Date.now()}` : '/products'),
  getProduct: (slug: string) => request<Product>(`/products/${slug}`),
  createProduct: (data: ProductPayload, auth: string) =>
    request<Product>('/products', { method: 'POST', body: JSON.stringify(data) }, auth),
  updateProduct: (id: string, data: ProductPayload, auth: string) =>
    request<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }, auth),
  deleteProduct: (id: string, auth: string) =>
    request<{ deleted: boolean }>(`/products/${id}`, { method: 'DELETE' }, auth),

  // Orders
  createOrder: (
    input: {
      items: { productId: string; name: string; image?: string; color?: string; colorKey?: string; size?: string; quantity: number; price: number }[];
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
  updateOrderNote: (id: string, customerNote: string, auth: string) =>
    request<Order>(`/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ customerNote }) }, auth),
  trackOrder: (id: string, phone: string) =>
    request<TrackedOrder>('/orders/track', { method: 'POST', body: JSON.stringify({ id, phone }) }),

  // Coupons
  publicCoupons: () => request<PublicCoupon[]>('/coupons/public'),
  validateCoupon: (code: string, ctx: { subtotal: number; email?: string }) =>
    request<({ valid: true } & PublicCoupon) | { valid: false; error?: string }>(
      '/coupons/validate',
      { method: 'POST', body: JSON.stringify({ code, ...ctx }) }
    ),

  // Admin — coupon management
  listAllCoupons: (auth: string) => request<Coupon[]>('/coupons', {}, auth),
  createCoupon: (data: CouponInput, auth: string) =>
    request<Coupon>('/coupons', { method: 'POST', body: JSON.stringify(data) }, auth),
  updateCoupon: (code: string, data: Partial<CouponInput>, auth: string) =>
    request<Coupon>(`/coupons/${encodeURIComponent(code)}`, { method: 'PUT', body: JSON.stringify(data) }, auth),
  deleteCoupon: (code: string, auth: string) =>
    request<{ deleted: boolean }>(`/coupons/${encodeURIComponent(code)}`, { method: 'DELETE' }, auth),
  couponRedemptions: (code: string, auth: string) =>
    request<{ orderId: string; email: string; discount: number; at: number }[]>(
      `/coupons/${encodeURIComponent(code)}/redemptions`,
      {},
      auth
    ),

  // Contact messages
  sendMessage: (data: { name: string; email: string; phone?: string; message: string; website?: string }) =>
    request<{ ok: true }>('/messages', { method: 'POST', body: JSON.stringify(data) }),
  listMessages: (auth: string) => request<ContactMessage[]>('/messages', {}, auth),
  markMessage: (id: string, read: boolean, auth: string) =>
    request<ContactMessage>(`/messages/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ read }) }, auth),
  deleteMessage: (id: string, auth: string) =>
    request<{ deleted: boolean }>(`/messages/${encodeURIComponent(id)}`, { method: 'DELETE' }, auth),

  // Store settings
  getSettings: (fresh = false) => request<StoreSettings>(fresh ? `/settings?fresh=${Date.now()}` : '/settings'),
  updateSettings: (data: Partial<StoreSettings>, auth: string) =>
    request<StoreSettings>('/settings', { method: 'PUT', body: JSON.stringify(data) }, auth),
};

export type { Coupon };
