import type { Order } from '@/types';

const STATUS_LABEL: Record<string, string> = {
  received: 'Awaiting payment',
  paid: 'Paid',
  shipped: 'Shipped',
  cancelled: 'Cancelled',
};

/** One CSV cell: quoted, and neutralised so a spreadsheet can't run it as a formula. */
function cell(v: unknown): string {
  let s = v === null || v === undefined ? '' : String(v);
  // Customer-typed text starting with = + - @ would run as a formula in Excel/Sheets.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function ordersToCsv(orders: Order[]): string {
  const header = [
    'Order', 'Date', 'Status', 'Name', 'Phone', 'Email', 'City', 'Address', 'Delivery option',
    'Items', 'Units', 'Subtotal (GHS)', 'Discount (GHS)', 'Coupon', 'Delivery (GHS)', 'Total (GHS)', 'Payment',
  ];
  const rows = orders.map((o) => {
    const a = o.shippingAddress;
    return [
      o.id,
      new Date(o.createdAt).toISOString().replace('T', ' ').slice(0, 16),
      STATUS_LABEL[o.status] ?? o.status,
      a ? `${a.firstName} ${a.lastName}`.trim() : '',
      a?.phone ?? '',
      o.email,
      a?.city ?? '',
      a?.address ?? '',
      o.delivery?.name ?? '',
      o.items.map((i) => `${i.name} (${[i.color, i.size].filter(Boolean).join(', ')}) x${i.quantity}`).join('; '),
      o.items.reduce((n, i) => n + i.quantity, 0),
      o.subtotal,
      o.discount,
      o.couponCode ?? '',
      o.shipping,
      o.total,
      o.paymentMethod ?? '',
    ];
  });
  // BOM so Excel reads GH₵ and accented names as UTF-8.
  return '﻿' + [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');
}

export function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
