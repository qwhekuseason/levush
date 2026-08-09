// Shared domain types for the Levush storefront.

// Photographed colourways are 'black' | 'white', but admins can define custom keys.
export type ColorwayName = string;

export interface Colorway {
  name: ColorwayName;
  label: string;
  /** hex shown in the colour swatch */
  swatch: string;
  image: string;
}

export interface Verse {
  text: string;
  reference: string;
}

export type ProductTier = 'core' | 'limited';

export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  /** the scripture printed on the garment */
  verse: Verse;
  description: string;
  price: number; // in GHS (current selling price)
  originalPrice?: number; // in GHS (original list price before discount)
  tier: ProductTier;
  category?: 't-shirt' | 'hoodie' | 'sweatshirt';
  collection: string;
  colorways: Colorway[];
  defaultColor: ColorwayName;
  sizes: string[];
  /** marketing flags */
  isNew?: boolean;
  isBestSeller?: boolean;
  /** admin can hide a product from the buyer-facing shop */
  isHidden?: boolean;
}

export interface CartItem {
  id: string; // line id: `${productId}-${color}-${size}`
  productId: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  color: ColorwayName;
  size: string;
  quantity: number;
}

export interface VerseChip {
  snippet: string;
  reference: string;
}

export interface Testimonial {
  quote: string;
  author: string;
  location: string;
}

export interface LookbookItem {
  productId: string;
  collection: string;
  caption: string;
  ref?: string;
}

export type Role = 'admin' | 'customer';

export interface Me {
  authenticated: boolean;
  role: Role;
  uid?: string;
  email?: string | null;
}

export type OrderStatus = 'received' | 'paid' | 'shipped' | 'cancelled';

export interface OrderItem {
  productId: string;
  name: string;
  image?: string;
  color?: string;
  size?: string;
  quantity: number;
  price: number;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  phone: string;
}

export interface Order {
  id: string;
  email: string;
  uid: string | null;
  shippingAddress?: ShippingAddress;
  paymentMethod?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  couponCode: string | null;
  total: number;
  status: OrderStatus;
  createdAt: number;
}

export type CouponKind = 'percent' | 'shipping';

export interface Coupon {
  code: string;
  label: string;
  kind: CouponKind;
  value: number;
  used: boolean;
  email: string;
  createdAt: number;
}

