import type { Product } from '@/types';

export const variantKey = (color: string, size: string) => `${color}:${size}`;

export function isSoldOut(p: Pick<Product, 'soldOut'>, color: string, size: string): boolean {
  return Boolean(p.soldOut?.includes(variantKey(color, size)));
}

/** Every size of this colour is sold out. */
export function colorSoldOut(p: Pick<Product, 'soldOut' | 'sizes'>, color: string): boolean {
  return p.sizes.length > 0 && p.sizes.every((s) => isSoldOut(p, color, s));
}

/** Nothing about this product can be ordered. */
export function productSoldOut(p: Pick<Product, 'soldOut' | 'sizes' | 'colorways'>): boolean {
  return Boolean(p.soldOut?.length) && p.colorways.every((c) => colorSoldOut(p, c.name));
}

/** At least one colour has this size available. */
export function sizeAvailableAnyColor(p: Pick<Product, 'soldOut' | 'colorways'>, size: string): boolean {
  return p.colorways.some((c) => !isSoldOut(p, c.name, size));
}
