import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { formatPrice } from '@/lib/format';
import { formatPhone, whatsappLink } from '@/lib/whatsapp';

/** Everything the confirmation screen needs, captured before the cart is cleared. */
export interface PlacedOrder {
  id: string;
  items: Array<{ name: string; color?: string; size?: string; quantity: number; price: number }>;
  subtotal: number;
  discount: number;
  couponCode: string | null;
  shipping: number;
  total: number;
  customer: { firstName: string; lastName: string; phone: string; email: string; address: string; city: string };
}

export const LAST_ORDER_KEY = 'levush.lastOrder.v1';

function orderMessage(o: PlacedOrder): string {
  const lines = [
    'Hello Levush! 👋 I just placed an order on the website.',
    '',
    `*Order ${o.id}*`,
    ...o.items.map(
      (i) => `• ${i.name}${i.color || i.size ? ` (${[i.color, i.size].filter(Boolean).join(', ')})` : ''} × ${i.quantity} — ${formatPrice(i.price * i.quantity)}`
    ),
    '',
    `Subtotal: ${formatPrice(o.subtotal)}`,
    ...(o.discount > 0 ? [`Discount${o.couponCode ? ` (${o.couponCode})` : ''}: -${formatPrice(o.discount)}`] : []),
    `Delivery: ${o.shipping === 0 ? 'Free' : formatPrice(o.shipping)}`,
    `*Total: ${formatPrice(o.total)}*`,
    '',
    `Name: ${o.customer.firstName} ${o.customer.lastName}`.trim(),
    `Phone: ${o.customer.phone}`,
    `Deliver to: ${o.customer.address}, ${o.customer.city}`,
    '',
    'I’ll send my payment screenshot here.',
  ];
  return lines.join('\n');
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* clipboard unavailable — the value is visible to copy by hand */
        }
      }}
      className="shrink-0 rounded-lg border border-bone/15 px-3 py-1.5 text-xs font-semibold text-bone/70 transition hover:border-gold hover:text-gold"
      aria-label={`Copy ${label}`}
    >
      {copied ? 'Copied ✓' : 'Copy'}
    </button>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="card-surface p-6 text-left sm:p-7">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold text-sm font-bold text-ink">{n}</span>
        <h2 className="heading-serif text-xl text-bone">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function OrderPayment({ order, onDone }: { order: PlacedOrder; onDone: () => void }) {
  const { settings } = useStoreSettings();
  const hasWhatsApp = Boolean(settings.whatsappNumber);
  const accounts = settings.paymentAccounts;
  const waHref = hasWhatsApp ? whatsappLink(settings.whatsappNumber, orderMessage(order)) : '';

  let step = 0;
  return (
    <div className="container-site max-w-2xl py-16 md:py-20">
      <div className="mb-10 text-center">
        <p className="eyebrow mb-4">Order Received</p>
        <h1 className="heading-serif text-3xl text-bone sm:text-4xl">Thank you, {order.customer.firstName}. 🙏</h1>
        <div className="mx-auto mt-5 inline-flex items-center gap-3 rounded-xl border border-bone/10 bg-ink-800 px-4 py-2.5">
          <span className="text-sm text-bone/55">Order number</span>
          <span className="font-mono text-base font-bold text-gold">{order.id}</span>
          <CopyButton value={order.id} label="order number" />
        </div>
        <p className="mt-4 text-bone/60">
          Total to pay: <span className="font-serif text-2xl text-bone">{formatPrice(order.total)}</span>
        </p>
      </div>

      <div className="space-y-5">
        {hasWhatsApp && (
          <Step n={++step} title="Send us your order on WhatsApp">
            <p className="mb-5 text-sm text-bone/60">
              Tap the button. WhatsApp opens with your order already typed out, so just press send.
            </p>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2.5 rounded-full bg-[#25D366] px-6 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-[#1ebe5a]"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.79-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.4 9.4 0 0 1-1.44-5.01c0-5.2 4.23-9.43 9.43-9.43a9.37 9.37 0 0 1 6.67 2.77 9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.24 9.42-9.43 9.42m8.02-17.44A11.27 11.27 0 0 0 12.04.75C5.8.75.72 5.83.72 12.07c0 2 .52 3.94 1.51 5.65L.62 23.6l6.02-1.58a11.3 11.3 0 0 0 5.4 1.38h.01c6.24 0 11.32-5.08 11.32-11.32 0-3.02-1.18-5.87-3.31-8.01" />
              </svg>
              Send order on WhatsApp
            </a>
            <p className="mt-3 text-center text-xs text-bone/45">
              Or message us directly: <span className="font-mono">{formatPhone(settings.whatsappNumber)}</span>
            </p>
          </Step>
        )}

        <Step n={++step} title={`Pay ${formatPrice(order.total)} with Mobile Money`}>
          {accounts.length > 0 ? (
            <>
              <ul className="space-y-3">
                {accounts.map((a) => (
                  <li key={`${a.network}-${a.number}`} className="rounded-xl border border-bone/10 bg-ink-800/60 p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-bone/45">{a.network}</p>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <span className="font-mono text-xl font-bold tracking-wide text-bone">{a.number}</span>
                      <CopyButton value={a.number.replace(/\s/g, '')} label={`${a.network} number`} />
                    </div>
                    <p className="mt-1 text-sm text-bone/60">
                      Name: <span className="font-medium text-bone">{a.name}</span>
                    </p>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-gold/10 px-4 py-3">
                <span className="text-sm text-bone/70">
                  Reference: <span className="font-mono font-bold text-gold">{order.id}</span>
                </span>
                <CopyButton value={order.id} label="payment reference" />
              </div>
            </>
          ) : (
            <p className="text-sm text-bone/60">
              We’ll send you our Mobile Money details{hasWhatsApp ? ' on WhatsApp' : ` at ${order.customer.phone}`} shortly.
            </p>
          )}
          {accounts.length > 0 && (
            <>
              {settings.paymentNote && <p className="mt-4 text-sm text-bone/55">{settings.paymentNote}</p>}
              <p className="mt-2 text-xs text-bone/40">
                Please check the account name matches before you send. We’ll confirm once your payment arrives.
              </p>
            </>
          )}
        </Step>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link
          to="/track"
          state={{ id: order.id, phone: order.customer.phone }}
          onClick={onDone}
          className="btn-primary"
        >
          Track this order
        </Link>
        <Link to="/shop" onClick={onDone} className="btn-outline">Keep shopping</Link>
      </div>
      <p className="mt-4 text-center text-xs text-bone/40">
        You can check your order status anytime from “Track Your Order” at the bottom of every page.
      </p>
    </div>
  );
}
