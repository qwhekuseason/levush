import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { classNames, formatPrice } from '@/lib/format';
import type { Coupon, CouponInput, CouponKind, CouponStatus } from '@/types';

const statusStyle: Record<CouponStatus, { label: string; cls: string }> = {
  active: { label: 'Active', cls: 'bg-emerald-500/15 text-emerald-400' },
  paused: { label: 'Paused', cls: 'bg-bone/10 text-bone/60' },
  scheduled: { label: 'Scheduled', cls: 'bg-sky-500/15 text-sky-400' },
  expired: { label: 'Expired', cls: 'bg-red-500/15 text-red-400' },
  exhausted: { label: 'Used up', cls: 'bg-amber-500/15 text-amber-400' },
};

const FILTERS: Array<{ key: 'all' | CouponStatus; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'paused', label: 'Paused' },
  { key: 'expired', label: 'Expired' },
  { key: 'exhausted', label: 'Used up' },
];

/** Form state keeps numbers as strings so fields can be left blank. */
interface FormState {
  code: string;
  label: string;
  kind: CouponKind;
  value: string;
  visibility: 'hidden' | 'public';
  active: boolean;
  email: string;
  minSubtotal: string;
  maxDiscount: string;
  usageLimit: string;
  perCustomerLimit: string;
  startsAt: string;
  expiresAt: string;
}

const EMPTY_FORM: FormState = {
  code: '',
  label: '',
  kind: 'percent',
  value: '10',
  visibility: 'hidden',
  active: true,
  email: '',
  minSubtotal: '',
  maxDiscount: '',
  usageLimit: '',
  perCustomerLimit: '1',
  startsAt: '',
  expiresAt: '',
};

// <input type="datetime-local"> works in local time without a zone suffix.
const toLocalInput = (ts: number | null) => {
  if (!ts) return '';
  const d = new Date(ts);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};
const fromLocalInput = (v: string) => (v ? new Date(v).getTime() : null);
const optNum = (v: string) => (v.trim() === '' ? null : Number(v));

function toForm(c: Coupon): FormState {
  return {
    code: c.code,
    label: c.label,
    kind: c.kind,
    value: String(c.value),
    visibility: c.visibility,
    active: c.active,
    email: c.email ?? '',
    minSubtotal: c.minSubtotal ? String(c.minSubtotal) : '',
    maxDiscount: c.maxDiscount !== null ? String(c.maxDiscount) : '',
    usageLimit: c.usageLimit !== null ? String(c.usageLimit) : '',
    perCustomerLimit: c.perCustomerLimit !== null ? String(c.perCustomerLimit) : '',
    startsAt: toLocalInput(c.startsAt),
    expiresAt: toLocalInput(c.expiresAt),
  };
}

function toInput(f: FormState): CouponInput {
  return {
    code: f.code.trim().toUpperCase(),
    label: f.label.trim(),
    kind: f.kind,
    value: f.kind === 'shipping' ? 0 : Number(f.value) || 0,
    visibility: f.visibility,
    active: f.active,
    email: f.email.trim() || null,
    minSubtotal: Number(f.minSubtotal) || 0,
    maxDiscount: f.kind === 'percent' ? optNum(f.maxDiscount) : null,
    usageLimit: optNum(f.usageLimit),
    perCustomerLimit: optNum(f.perCustomerLimit),
    startsAt: fromLocalInput(f.startsAt),
    expiresAt: fromLocalInput(f.expiresAt),
  };
}

function describe(c: Pick<Coupon, 'kind' | 'value' | 'maxDiscount' | 'minSubtotal'>): string {
  const what =
    c.kind === 'percent'
      ? `${c.value}% off${c.maxDiscount ? `, max ${formatPrice(c.maxDiscount)}` : ''}`
      : c.kind === 'fixed'
      ? `${formatPrice(c.value)} off`
      : 'Free delivery';
  return c.minSubtotal > 0 ? `${what} · min order ${formatPrice(c.minSubtotal)}` : what;
}

function randomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no look-alikes (0/O, 1/I)
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return 'LV' + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

const fmtDate = (ts: number) =>
  new Date(ts).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function AdminCoupons() {
  const { authHeader } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | CouponStatus>('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null); // code being edited
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  const [expanded, setExpanded] = useState<string | null>(null);
  const [redemptions, setRedemptions] = useState<Record<string, Awaited<ReturnType<typeof api.couponRedemptions>>>>({});

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const withAuth = async () => {
    const h = await authHeader();
    if (!h) throw new Error('Your session expired — sign in again.');
    return h;
  };

  const load = async () => {
    try {
      setCoupons(await api.listAllCoupons(await withAuth()));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load coupons.');
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 2500);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, code: randomCode() });
    setFormOpen(true);
    setError(null);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c.code);
    setForm(toForm(c));
    setFormOpen(true);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const upsert = (c: Coupon) =>
    setCoupons((prev) => (prev.some((p) => p.code === c.code) ? prev.map((p) => (p.code === c.code ? c : p)) : [c, ...prev]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const input = toInput(form);
    if (input.kind === 'percent' && (input.value <= 0 || input.value > 100)) {
      return setError('Percentage must be between 1 and 100.');
    }
    if (input.kind === 'fixed' && input.value <= 0) return setError('Enter a discount amount.');
    setBusy(true);
    try {
      const h = await withAuth();
      const saved = editing ? await api.updateCoupon(editing, input, h) : await api.createCoupon(input, h);
      upsert(saved);
      closeForm();
      flash(editing ? `Saved ${saved.code}.` : `Created ${saved.code}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save coupon.');
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (c: Coupon) => {
    try {
      upsert(await api.updateCoupon(c.code, { active: !c.active }, await withAuth()));
      flash(c.active ? `Paused ${c.code}.` : `Resumed ${c.code}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update coupon.');
    }
  };

  const handleDelete = async (c: Coupon) => {
    const warn = c.usedCount > 0 ? ` It has been used ${c.usedCount} time(s); past orders keep their discount.` : '';
    if (!confirm(`Delete coupon "${c.code}" permanently?${warn}\n\nTip: use Pause instead if you might bring it back.`)) return;
    try {
      await api.deleteCoupon(c.code, await withAuth());
      setCoupons((prev) => prev.filter((p) => p.code !== c.code));
      flash(`Deleted ${c.code}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete coupon.');
    }
  };

  const toggleRedemptions = async (code: string) => {
    if (expanded === code) return setExpanded(null);
    setExpanded(code);
    if (!redemptions[code]) {
      try {
        const list = await api.couponRedemptions(code, await withAuth());
        setRedemptions((r) => ({ ...r, [code]: list }));
      } catch {
        setRedemptions((r) => ({ ...r, [code]: [] }));
      }
    }
  };

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      flash(`Copied ${code}.`);
    } catch {
      /* clipboard blocked — ignore */
    }
  };

  const stats = useMemo(
    () => ({
      active: coupons.filter((c) => c.status === 'active').length,
      public: coupons.filter((c) => c.status === 'active' && c.visibility === 'public' && !c.email).length,
      redemptions: coupons.reduce((n, c) => n + c.usedCount, 0),
    }),
    [coupons]
  );

  const q = search.trim().toLowerCase();
  const filtered = coupons.filter(
    (c) =>
      (filter === 'all' || c.status === filter) &&
      (!q || c.code.toLowerCase().includes(q) || c.label.toLowerCase().includes(q) || (c.email ?? '').includes(q))
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="heading-serif text-2xl text-bone">Coupons</h2>
        <button onClick={formOpen ? closeForm : openCreate} className="btn-primary">
          {formOpen ? '✕ Cancel' : '+ New Coupon'}
        </button>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { label: 'Active codes', value: stats.active },
          { label: 'Shown at checkout', value: stats.public },
          { label: 'Total redemptions', value: stats.redemptions },
        ].map((s) => (
          <div key={s.label} className="card-surface p-4">
            <p className="text-2xl font-semibold text-bone">{loaded ? s.value : '…'}</p>
            <p className="text-xs text-bone/45">{s.label}</p>
          </div>
        ))}
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400" role="alert">{error}</p>}
      {notice && <p className="mb-4 rounded-lg bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">{notice}</p>}

      {formOpen && (
        <form onSubmit={handleSubmit} className="card-surface mb-8 p-6">
          <h3 className="heading-serif mb-5 text-lg text-bone">{editing ? `Edit ${editing}` : 'Create coupon'}</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Code *" htmlFor="cp-code" hint={editing ? 'Codes can’t be renamed.' : 'Letters, numbers, - or _'}>
              <div className="flex gap-2">
                <input
                  id="cp-code"
                  className="field flex-1 font-mono uppercase"
                  value={form.code}
                  disabled={Boolean(editing)}
                  onChange={(e) => set('code', e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                  maxLength={32}
                  required
                />
                {!editing && (
                  <button type="button" onClick={() => set('code', randomCode())} className="btn-outline px-3 text-xs">
                    Generate
                  </button>
                )}
              </div>
            </Field>
            <Field label="Label" htmlFor="cp-label" hint="Shown to shoppers, e.g. “Easter Sale”">
              <input id="cp-label" className="field" value={form.label} maxLength={80} onChange={(e) => set('label', e.target.value)} />
            </Field>

            <Field label="Discount type" htmlFor="cp-kind">
              <select id="cp-kind" className="field" value={form.kind} onChange={(e) => set('kind', e.target.value as CouponKind)}>
                <option value="percent">Percentage off</option>
                <option value="fixed">Fixed amount off (GH₵)</option>
                <option value="shipping">Free delivery</option>
              </select>
            </Field>
            {form.kind !== 'shipping' && (
              <Field label={form.kind === 'percent' ? 'Percent off *' : 'Amount off (GH₵) *'} htmlFor="cp-value">
                <input
                  id="cp-value"
                  type="number"
                  min={1}
                  max={form.kind === 'percent' ? 100 : undefined}
                  step="any"
                  className="field"
                  value={form.value}
                  onChange={(e) => set('value', e.target.value)}
                  required
                />
              </Field>
            )}

            <div className="sm:col-span-2">
              <p className="mb-1.5 text-xs font-medium text-bone/70">Visibility</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {([
                  ['hidden', 'Hidden', 'Only works for people you give the code to.'],
                  ['public', 'Public', 'Listed under “Available offers” at checkout.'],
                ] as const).map(([v, title, desc]) => (
                  <label
                    key={v}
                    className={classNames(
                      'cursor-pointer rounded-xl border p-3 transition',
                      form.visibility === v ? 'border-gold bg-gold/5' : 'border-bone/15 hover:border-bone/30'
                    )}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value={v}
                      checked={form.visibility === v}
                      onChange={() => set('visibility', v)}
                      className="sr-only"
                    />
                    <span className="block text-sm font-medium text-bone">{title}</span>
                    <span className="block text-xs text-bone/50">{desc}</span>
                  </label>
                ))}
              </div>
              {form.visibility === 'public' && form.email.trim() && (
                <p className="mt-2 text-xs text-amber-400">Codes tied to one customer are never listed publicly.</p>
              )}
            </div>
          </div>

          <h4 className="mb-3 mt-7 text-xs font-semibold uppercase tracking-widest text-bone/40">Conditions</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Minimum order (GH₵)" htmlFor="cp-min" hint="Blank = no minimum">
              <input id="cp-min" type="number" min={0} step="any" className="field" value={form.minSubtotal} onChange={(e) => set('minSubtotal', e.target.value)} />
            </Field>
            {form.kind === 'percent' && (
              <Field label="Max discount (GH₵)" htmlFor="cp-max" hint="Caps big orders. Blank = no cap">
                <input id="cp-max" type="number" min={1} step="any" className="field" value={form.maxDiscount} onChange={(e) => set('maxDiscount', e.target.value)} />
              </Field>
            )}
            <Field label="Total uses allowed" htmlFor="cp-limit" hint="Across all customers. Blank = unlimited">
              <input id="cp-limit" type="number" min={1} step={1} className="field" value={form.usageLimit} onChange={(e) => set('usageLimit', e.target.value)} />
            </Field>
            <Field label="Uses per customer" htmlFor="cp-per" hint="Matched by email. Blank = unlimited">
              <input id="cp-per" type="number" min={1} step={1} className="field" value={form.perCustomerLimit} onChange={(e) => set('perCustomerLimit', e.target.value)} />
            </Field>
            <Field label="Starts" htmlFor="cp-start" hint="Blank = immediately">
              <input id="cp-start" type="datetime-local" className="field" value={form.startsAt} onChange={(e) => set('startsAt', e.target.value)} />
            </Field>
            <Field label="Expires" htmlFor="cp-end" hint="Blank = never">
              <input id="cp-end" type="datetime-local" className="field" value={form.expiresAt} onChange={(e) => set('expiresAt', e.target.value)} />
            </Field>
            <Field label="Only for this customer" htmlFor="cp-email" hint="Blank = anyone with the code">
              <input id="cp-email" type="email" className="field" placeholder="customer@email.com" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
            <label className="flex items-center gap-3 self-end pb-3 text-sm text-bone/80">
              <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} className="h-4 w-4 accent-gold" />
              Active (uncheck to save as paused)
            </label>
          </div>

          <p className="mt-5 rounded-lg bg-bone/5 px-4 py-3 text-xs text-bone/60">
            Preview: <span className="font-mono text-gold">{form.code || '—'}</span> ·{' '}
            {describe({
              kind: form.kind,
              value: Number(form.value) || 0,
              maxDiscount: optNum(form.maxDiscount),
              minSubtotal: Number(form.minSubtotal) || 0,
            })}
          </p>

          <div className="mt-5 flex gap-3">
            <button type="submit" disabled={busy} className="btn-primary">
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Create coupon'}
            </button>
            <button type="button" onClick={closeForm} className="btn-outline">Cancel</button>
          </div>
        </form>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          className="field max-w-xs"
          placeholder="Search code, label or email…"
          aria-label="Search coupons"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={classNames(
                'rounded-full px-3 py-1.5 text-xs font-medium transition',
                filter === f.key ? 'bg-gold text-ink' : 'border border-bone/15 text-bone/60 hover:text-bone'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {!loaded ? (
        <p className="text-sm text-bone/45">Loading coupons…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-bone/45">
          {coupons.length === 0 ? 'No coupons yet. Create your first one above.' : 'No coupons match.'}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const st = statusStyle[c.status];
            return (
              <div key={c.code} className={classNames('card-surface p-4', c.status !== 'active' && 'opacity-75')}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <button
                      onClick={() => copy(c.code)}
                      title="Copy code"
                      className="rounded-md bg-gold/10 px-3 py-1 font-mono text-sm font-bold text-gold hover:bg-gold/20"
                    >
                      {c.code}
                    </button>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-bone">{c.label}</p>
                      <p className="text-xs text-bone/50">{describe(c)}</p>
                      <p className="mt-1 text-xs text-bone/40">
                        {c.email ? `Only ${c.email}` : 'Any customer'}
                        {c.perCustomerLimit !== null && ` · ${c.perCustomerLimit}× per customer`}
                        {c.startsAt && ` · starts ${fmtDate(c.startsAt)}`}
                        {c.expiresAt && ` · ends ${fmtDate(c.expiresAt)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={classNames('rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide', st.cls)}>
                      {st.label}
                    </span>
                    <span
                      className={classNames(
                        'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                        c.visibility === 'public' && !c.email ? 'bg-gold/15 text-gold' : 'bg-bone/10 text-bone/50'
                      )}
                    >
                      {c.visibility === 'public' && !c.email ? 'Public' : 'Hidden'}
                    </span>
                    <button onClick={() => toggleRedemptions(c.code)} className="text-xs text-bone/60 hover:text-bone">
                      Used {c.usedCount}
                      {c.usageLimit !== null ? ` / ${c.usageLimit}` : ''}
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-4 border-t border-bone/10 pt-3 text-xs">
                  <button onClick={() => openEdit(c)} className="text-bone/70 hover:text-gold">Edit</button>
                  <button onClick={() => toggleActive(c)} className="text-bone/70 hover:text-gold">
                    {c.active ? 'Pause' : 'Resume'}
                  </button>
                  <button onClick={() => toggleRedemptions(c.code)} className="text-bone/70 hover:text-gold">
                    {expanded === c.code ? 'Hide orders' : 'View orders'}
                  </button>
                  <button onClick={() => handleDelete(c)} className="ml-auto text-red-400 hover:text-red-300">Delete</button>
                </div>

                {expanded === c.code && (
                  <div className="mt-3 rounded-lg bg-bone/5 p-3 text-xs">
                    {!redemptions[c.code] ? (
                      <p className="text-bone/45">Loading…</p>
                    ) : redemptions[c.code].length === 0 ? (
                      <p className="text-bone/45">No orders have used this code yet.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {redemptions[c.code].map((r) => (
                          <li key={r.orderId} className="flex flex-wrap justify-between gap-2 text-bone/70">
                            <span className="font-mono text-gold">{r.orderId}</span>
                            <span>{r.email}</span>
                            <span>-{formatPrice(r.discount)}</span>
                            <span className="text-bone/40">{fmtDate(r.at)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-bone/70">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-bone/35">{hint}</p>}
    </div>
  );
}
