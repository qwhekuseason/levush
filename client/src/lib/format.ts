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

/** Resolve the image for a product's given (or default) colourway. */
export function productImage(product: Product, color?: ColorwayName): string {
  const target = color ?? product.defaultColor;
  const match = product.colorways.find((c) => c.name === target);
  return (match ?? product.colorways[0]).image;
}

export function classNames(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
