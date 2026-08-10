import type { ColorwayName, Product } from '@/types';

const cedi = new Intl.NumberFormat('en-GH', {
  style: 'currency',
  currency: 'GHS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Format a GHS amount, e.g. 250 -> "GH₵250". */
export function formatPrice(amount: number): string {
  // Intl renders "GH₵" for GHS in en-GH — keep it, it reads clearly in Ghana.
  return cedi.format(amount);
}

/** Convert local asset paths to optimized .webp equivalent */
export function toWebp(path: string | undefined | null): string {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:') || path.endsWith('.svg')) return path;
  return path.replace(/\.(png|jpg|jpeg)$/i, '.webp');
}

/** Resolve the image for a product's given (or default) colourway in WebP format. */
export function productImage(product: Product, color?: ColorwayName): string {
  const target = color ?? product.defaultColor;
  const match = product.colorways.find((c) => c.name === target);
  return toWebp((match ?? product.colorways[0]).image);
}

export interface DiscountInfo {
  hasDiscount: boolean;
  originalPrice: number;
  currentPrice: number;
  savings: number;
  percent: number;
}

/** Calculate discount details if product has an originalPrice higher than current price. */
export function getDiscountInfo(product: Partial<Product>): DiscountInfo {
  const current = Number(product.price) || 0;
  const original = Number(product.originalPrice) || 0;
  if (original > current && current > 0) {
    const savings = original - current;
    const percent = Math.round((savings / original) * 100);
    return { hasDiscount: true, originalPrice: original, currentPrice: current, savings, percent };
  }
  return { hasDiscount: false, originalPrice: current, currentPrice: current, savings: 0, percent: 0 };
}

export function classNames(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
