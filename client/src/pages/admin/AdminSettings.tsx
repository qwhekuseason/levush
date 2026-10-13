import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { formatPhone, whatsappLink } from '@/lib/whatsapp';
import type { PaymentAccount, StoreSettings } from '@/types';

export default function AdminSettings() {
  const { authHeader } = useAuth();
  const { settings, refresh, setSettings } = useStoreSettings();
  const [form, setForm] = useState<StoreSettings>(settings);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Always edit the latest server copy, not a CDN-cached one.
  useEffect(() => {
    void refresh(true);
  }, [refresh]);
  useEffect(() => setForm(settings), [settings]);

  const set = <K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) => {
    setSaved(false);
    setForm((f) => ({ ...f, [k]: v }));
  };
  const setAnn = (patch: Partial<StoreSettings['announcement']>) => {
    setSaved(false);
    setForm((f) => ({ ...f, announcement: { ...f.announcement, ...patch } }));
  };

  const setAccount = (i: number, patch: Partial<PaymentAccount>) =>
    set(
      'paymentAccounts',
      form.paymentAccounts.map((a, j) => (j === i ? { ...a, ...patch } : a))
    );

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const h = await authHeader();
      if (!h) throw new Error('Your session expired — sign in again.');
      setSettings(await api.updateSettings(form, h));
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save settings.');
    } finally {
      setBusy(false);
    }
  };

  const dirty = JSON.stringify(form) !== JSON.stringify(settings);

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="heading-serif text-2xl text-bone">Store settings</h2>
        <button type="submit" disabled={busy || !dirty} className="btn-primary">
          {busy ? 'Saving…' : saved && !dirty ? 'Saved ✓' : 'Save changes'}
        </button>
      </div>
      {error && <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400" role="alert">{error}</p>}
      <p className="text-xs text-bone/45">Changes reach shoppers within about a minute.</p>

      {/* Orders */}
      <section className="card-surface p-6">
        <h3 className="heading-serif mb-1 text-lg text-bone">Orders</h3>
        <p className="mb-5 text-xs text-bone/45">Pause checkout during stock-takes, holidays or restocks. Shoppers can still browse.</p>
        <label className="flex items-center gap-3 text-sm text-bone">
          <input
            type="checkbox"
            checked={form.ordersOpen}
            onChange={(e) => set('ordersOpen', e.target.checked)}
            className="h-4 w-4 accent-gold"
          />
          Accepting orders
        </label>
        {!form.ordersOpen && (
          <div className="mt-4">
            <label htmlFor="st-closed" className="mb-1.5 block text-xs font-medium text-bone/70">Message shown at checkout</label>
            <input
              id="st-closed"
              className="field"
              maxLength={300}
              value={form.closedMessage}
              onChange={(e) => set('closedMessage', e.target.value)}
            />
          </div>
        )}
        <div className="mt-5 max-w-xs">
          <label htmlFor="st-maxqty" className="mb-1.5 block text-xs font-medium text-bone/70">Max quantity per item</label>
          <input
            id="st-maxqty"
            type="number"
            min={1}
            max={100}
            className="field"
            value={form.maxQtyPerItem}
            onChange={(e) => set('maxQtyPerItem', Number(e.target.value))}
          />
        </div>
      </section>

      {/* Payments & WhatsApp */}
      <section className="card-surface p-6">
        <h3 className="heading-serif mb-1 text-lg text-bone">Payments &amp; WhatsApp</h3>
        <p className="mb-5 text-xs text-bone/45">
          After checkout, customers see these MoMo accounts and a button that sends their order to your WhatsApp.
        </p>

        <div className="max-w-sm">
          <label htmlFor="st-wa" className="mb-1.5 block text-xs font-medium text-bone/70">WhatsApp number for orders</label>
          <input
            id="st-wa"
            type="tel"
            className="field"
            placeholder="024 123 4567"
            value={form.whatsappNumber}
            onChange={(e) => set('whatsappNumber', e.target.value)}
          />
          {form.whatsappNumber.trim() ? (
            <a
              href={whatsappLink(form.whatsappNumber, 'Test from the Levush admin — this number receives orders.')}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-block text-[11px] text-gold hover:underline"
            >
              Test this number ({formatPhone(form.whatsappNumber)}) →
            </a>
          ) : (
            <p className="mt-1.5 text-[11px] text-amber-500">Not set: customers won’t see the WhatsApp button.</p>
          )}
        </div>

        <p className="mb-2 mt-6 text-xs font-medium text-bone/70">Mobile Money accounts</p>
        <div className="space-y-3">
          {form.paymentAccounts.map((a, i) => (
            <div key={i} className="grid gap-2 rounded-xl border border-bone/10 p-3 sm:grid-cols-[1fr_1fr_1.3fr_auto]">
              <input
                className="field"
                placeholder="Network, e.g. MTN MoMo"
                aria-label={`Account ${i + 1} network`}
                list="momo-networks"
                value={a.network}
                onChange={(e) => setAccount(i, { network: e.target.value })}
              />
              <input
                className="field font-mono"
                placeholder="Number"
                inputMode="tel"
                aria-label={`Account ${i + 1} number`}
                value={a.number}
                onChange={(e) => setAccount(i, { number: e.target.value })}
              />
              <input
                className="field"
                placeholder="Registered account name"
                aria-label={`Account ${i + 1} name`}
                value={a.name}
                onChange={(e) => setAccount(i, { name: e.target.value })}
              />
              <button
                type="button"
                onClick={() => set('paymentAccounts', form.paymentAccounts.filter((_, j) => j !== i))}
                className="px-2 text-xs text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            </div>
          ))}
          <datalist id="momo-networks">
            <option value="MTN MoMo" />
            <option value="Telecel Cash" />
            <option value="AT Money" />
          </datalist>
          {form.paymentAccounts.length < 4 && (
            <button
              type="button"
              onClick={() => set('paymentAccounts', [...form.paymentAccounts, { network: 'MTN MoMo', number: '', name: '' }])}
              className="btn-outline text-xs"
            >
              + Add account
            </button>
          )}
          {form.paymentAccounts.length === 0 && (
            <p className="text-[11px] text-amber-500">
              No accounts yet: customers will be told you’ll send payment details on WhatsApp.
            </p>
          )}
        </div>

        <div className="mt-6">
          <label htmlFor="st-note" className="mb-1.5 block text-xs font-medium text-bone/70">Payment instructions</label>
          <textarea
            id="st-note"
            rows={2}
            maxLength={300}
            className="field"
            value={form.paymentNote}
            onChange={(e) => set('paymentNote', e.target.value)}
          />
        </div>
      </section>

      {/* Delivery */}
      <section className="card-surface p-6">
        <h3 className="heading-serif mb-1 text-lg text-bone">Delivery</h3>
        <p className="mb-5 text-xs text-bone/45">Used in the cart, at checkout, on product pages and in the shipping policy.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="st-fee" className="mb-1.5 block text-xs font-medium text-bone/70">Delivery fee (GH₵)</label>
            <input
              id="st-fee"
              type="number"
              min={0}
              step="any"
              className="field"
              value={form.shippingFee}
              onChange={(e) => set('shippingFee', Number(e.target.value))}
            />
          </div>
          <div>
            <label htmlFor="st-free" className="mb-1.5 block text-xs font-medium text-bone/70">Free delivery from (GH₵)</label>
            <input
              id="st-free"
              type="number"
              min={0}
              step="any"
              className="field"
              value={form.freeShippingThreshold}
              onChange={(e) => set('freeShippingThreshold', Number(e.target.value))}
            />
            <p className="mt-1 text-[11px] text-bone/35">Set to 0 to turn free delivery off.</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-bone/55">
          {form.freeShippingThreshold > 0
            ? `Orders under ${formatPrice(form.freeShippingThreshold)} pay ${formatPrice(form.shippingFee)} delivery; above that it's free.`
            : `Every order pays ${formatPrice(form.shippingFee)} delivery.`}
        </p>
      </section>

      {/* Announcement */}
      <section className="card-surface p-6">
        <h3 className="heading-serif mb-1 text-lg text-bone">Announcement bar</h3>
        <p className="mb-5 text-xs text-bone/45">A strip across the top of every page, good for drops, sales and public codes.</p>
        <label className="flex items-center gap-3 text-sm text-bone">
          <input
            type="checkbox"
            checked={form.announcement.enabled}
            onChange={(e) => setAnn({ enabled: e.target.checked })}
            className="h-4 w-4 accent-gold"
          />
          Show announcement
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-[2fr_1fr]">
          <div>
            <label htmlFor="st-ann" className="mb-1.5 block text-xs font-medium text-bone/70">Text</label>
            <input
              id="st-ann"
              className="field"
              maxLength={160}
              placeholder="New drop: Easter collection — use code EASTER10"
              value={form.announcement.text}
              onChange={(e) => setAnn({ text: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="st-link" className="mb-1.5 block text-xs font-medium text-bone/70">Link (optional)</label>
            <input
              id="st-link"
              className="field"
              placeholder="/shop"
              value={form.announcement.link}
              onChange={(e) => setAnn({ link: e.target.value })}
            />
          </div>
        </div>
        {form.announcement.text.trim() && (
          <div className="mt-4 overflow-hidden rounded-lg">
            <p className="mb-1 text-[11px] uppercase tracking-widest text-bone/35">Preview</p>
            <div className="flex h-9 items-center justify-center rounded-lg bg-gold px-4 text-xs font-semibold tracking-wide text-ink">
              <span className="truncate">
                {form.announcement.text}
                {form.announcement.link ? ' →' : ''}
              </span>
            </div>
          </div>
        )}
      </section>
    </form>
  );
}
