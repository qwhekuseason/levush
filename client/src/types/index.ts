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
  price: number; // in GHS
  tier: ProductTier;
  category?: 't-shirt' | 'hoodie' | 'sweatshirt';
  collection: string;
  colorways: Colorway[];
  defaultColor: ColorwayName;
  sizes: string[];
  /** marketing flags */
  isNew?: boolean;
  isBestSeller?: boolean;
}

export interface CartItem {
  id: string; // line id: `${productId}-${color}-${size}`
  productId: string;
  name: string;
  image: string;
  price: number;
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
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  email: string;
  uid: string | null;
  items: OrderItem[];
  subtotal: number;
  discount: number;
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

export interface Rewards {
  email: string;
  points: number;
  lastSpinDay: string | null;
  lastQuizDay: string | null;
  coupons: Coupon[];
}

export interface SpinResult {
  alreadySpun: boolean;
  prizeLabel: string;
  prizeIndex: number;
  coupon: Coupon | null;
  rewards: Omit<Rewards, 'coupons'>;
}
