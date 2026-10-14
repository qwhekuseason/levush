import { useState } from 'react';
import { api } from '@/lib/api';

/** "Tell me when it's back" for a sold-out colour + size. */
export default function NotifyMe({
  productId,
  color,
  colorLabel,
  size,
  onClose,
}: {
  productId: string;
  color: string;
  colorLabel: string;
  size: string;
  onClose: () => void;
}) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setState('sending');
    try {
      await api.requestStockAlert({ productId, color, size, phone, name });
      setState('done');
    } catch (err) {
      setState('idle');
      setError(err instanceof Error ? err.message : 'Could not save your request.');
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-gold/30 bg-gold/5 p-4" role="region" aria-label="Back in stock alert">
      {state === 'done' ? (
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-bone">
            Done. We’ll WhatsApp you as soon as <strong>{size}</strong> in {colorLabel} is back.
          </p>
          <button type="button" onClick={onClose} className="text-xs text-bone/50 hover:text-bone">Close</button>
        </div>
      ) : (
        <form onSubmit={submit}>
          <div className="mb-3 flex items-start justify-between gap-3">
            <p className="text-sm text-bone">
              <strong>{size}</strong> in {colorLabel} is sold out. Get a WhatsApp message when it’s back.
            </p>
            <button type="button" onClick={onClose} className="text-xs text-bone/50 hover:text-bone" aria-label="Close alert form">✕</button>
          </div>
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <label className="sr-only" htmlFor="notify-name">Your name (optional)</label>
            <input id="notify-name" className="field text-sm" placeholder="Name (optional)" autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
            <label className="sr-only" htmlFor="notify-phone">WhatsApp number</label>
            <input id="notify-phone" className="field text-sm" type="tel" placeholder="WhatsApp number" autoComplete="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />
            <button type="submit" disabled={state === 'sending'} className="btn-primary whitespace-nowrap px-5 text-sm">
              {state === 'sending' ? 'Saving…' : 'Notify me'}
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-red-500" role="alert">{error}</p>}
        </form>
      )}
    </div>
  );
}
