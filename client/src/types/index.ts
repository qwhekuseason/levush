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
  /** human model photoshoot shot */
  modelImage?: string;
  /** additional gallery shots (models, close-ups) */
  gallery?: string[];
  /** marketing flags */
  isNew?: boolean;
  isBestSeller?: boolean;
  /** admin can hide a product from the buyer-facing shop */
  isHidden?: boolean;
  /** sold-out variants as `${colourName}:${size}` keys */
  soldOut?: string[];
}

export interface CartItem {
  id: string; // line id: `${productId}-${color}-${size}`
  productId: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  color: ColorwayName;
  /** human-readable colour, e.g. "Raisin Black" */
  colorLabel?: string;
  /** derived from the live catalogue: this colour/size can't be ordered right now */
  soldOut?: boolean;
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
  statusHistory?: Array<{ status: OrderStatus; at: number }>;
  customerNote?: string;
  delivery?: { id: string; name: string; eta: string };
  createdAt: number;
}

/** A message sent from the Contact page. */
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  read: boolean;
  createdAt: number;
}

/** The customer-safe view returned by order tracking. */
export interface TrackedOrder {
  id: string;
  status: OrderStatus;
  statusHistory: Array<{ status: OrderStatus; at: number }>;
  items: Array<{ productId: string; name: string; color?: string; size?: string; quantity: number; price: number }>;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  city: string;
  delivery: string;
  customerNote: string;
  createdAt: number;
}

export type CouponKind = 'percent' | 'fixed' | 'shipping';
export type CouponVisibility = 'hidden' | 'public';
export type CouponStatus = 'active' | 'paused' | 'scheduled' | 'expired' | 'exhausted';

export interface Coupon {
  code: string;
  label: string;
  kind: CouponKind;
  value: number;
  visibility: CouponVisibility;
  active: boolean;
  email: string | null;
  minSubtotal: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  perCustomerLimit: number | null;
  usedCount: number;
  startsAt: number | null;
  expiresAt: number | null;
  createdAt: number;
  updatedAt: number;
  status: CouponStatus;
}

export type CouponInput = Omit<Coupon, 'usedCount' | 'createdAt' | 'updatedAt' | 'status'>;

/** What shoppers see about an offer (no limits or customer data). */
export interface PublicCoupon {
  code: string;
  label: string;
  kind: CouponKind;
  value: number;
  minSubtotal: number;
  maxDiscount: number | null;
  expiresAt: number | null;
}

export interface PaymentAccount {
  network: string;
  number: string;
  name: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  eta: string;
}

export type HomeSectionKey = 'marquee' | 'light' | 'featured' | 'lookbook' | 'collections' | 'promise' | 'testimonials' | 'cta';

export interface HomepageSettings {
  hero: { eyebrow: string; title: string; accent: string; subtitle: string };
  intro: { enabled: boolean; text: string; reference: string };
  /** imageRef: 'studio' | 'model' | 'color:<name>' | 'gallery:<i>' */
  light: { productId: string; imageRef: string; verse: string; reference: string };
  featuredIds: string[];
  sections: Array<{ key: HomeSectionKey; visible: boolean }>;
}

export interface StockAlert {
  id: string;
  productId: string;
  productName: string;
  color: string;
  colorLabel: string;
  size: string;
  phone: string;
  name: string;
  notified: boolean;
  createdAt: number;
  notifiedAt?: number;
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Review {
  id: string;
  productId: string;
  productName: string;
  orderId: string;
  name: string;
  city: string;
  rating: number;
  text: string;
  status: ReviewStatus;
  createdAt: number;
}

export type PublicReview = Pick<Review, 'id' | 'name' | 'city' | 'rating' | 'text' | 'createdAt'>;

export interface StoreSettings {
  shippingFee: number;
  freeShippingThreshold: number;
  maxQtyPerItem: number;
  ordersOpen: boolean;
  closedMessage: string;
  announcement: { enabled: boolean; text: string; link: string };
  /** international digits, e.g. 233241234567 */
  whatsappNumber: string;
  paymentAccounts: PaymentAccount[];
  paymentNote: string;
  deliveryZones: DeliveryZone[];
  homepage: HomepageSettings;
}
