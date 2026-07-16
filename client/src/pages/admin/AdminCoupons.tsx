import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { classNames } from '@/lib/format';
import type { Coupon, CouponKind } from '@/types';

const kindLabel: Record<CouponKind, string> = {
  percent: 'Percentage Off',
  shipping: 'Free Shipping',
};

export default function AdminCoupons() {
  const { authHeader } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    code: '',
    label: '',
    kind: 'percent' as CouponKind,
    value: 10,
    email: '',
  });

  const load = async () => {
    try {
      const h = await authHeader();
      if (h) setCoupons(await api.listAllCoupons(h));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load coupons.');
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => { void load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.code.trim()) return setError('Code is required.');
    if (!form.label.trim()) return setError('Label is required.');
    if (form.kind === 'percent' && (form.value <= 0 || form.value > 100)) {
      return setError('Percentage must be between 1 and 100.');
    }
    setBusy(true);
    try {
      const h = await authHeader();
      if (!h) throw new Error('Not authorised.');
      const created = await api.createCoupon(
        { code: form.code.trim().toUpperCase(), label: form.label.trim(), kind: form.kind, value: form.value, email: form.email || undefined },
        h
      );
      setCoupons((prev) => [created, ...prev]);
      setForm({ code: '', label: '', kind: 'percent', value: 10, email: '' });
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create coupon.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`Revoke coupon "${code}"?`)) return;
    try {
      const h = await authHeader();
      if (!h) return;
      await api.deleteCoupon(code, h);
      setCoupons((prev) => prev.filter((c) => c.code !== code));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete coupon.');
    }
  };

  const filtered = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.label.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="heading-serif text-2xl text-bone">Promo Coupons ({loaded ? coupons.length : '…'})</h2>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
          {showForm ? '✕ Cancel' : '+ New Coupon'}
        </button>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="card-surface mb-8 p-6">
          <h3 className="heading-serif mb-5 text-lg text-bone">Create Promo Coupon</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-bone/70">Code *</label>
              <input
                className="field uppercase"
                placeholder="SUMMER20"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-bone/70">Label *</label>
              <input
                className="field"
                placeholder="Summer Sale 20% off"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-bone/70">Type</label>
              <select
                className="field"
                value={form.kind}
                onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as CouponKind }))}
              >
                <option value="percent">Percentage Discount</option>
                <option value="shipping">Free Shipping</option>
              </select>
            </div>
            {form.kind === 'percent' && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-bone/70">Discount % (1–100)</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  className="field"
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))}
                />
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-bone/70">
                Link to email <span className="text-bone/35">(leave blank for any customer)</span>
              </label>
              <input
                type="email"
                className="field"
                placeholder="customer@email.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <button type="submit" disabled={busy} className="btn-primary">
              {busy ? 'Creating…' : 'Create Coupon'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          className="field max-w-xs"
          placeholder="Search by code, label, or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Coupon list */}
      {!loaded ? (
        <p className="text-sm text-bone/45">Loading coupons…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-bone/45">{search ? 'No coupons match your search.' : 'No coupons yet. Create one above!'}</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div
              key={c.code}
              className={classNames(
                'card-surface flex flex-wrap items-center justify-between gap-3 p-4',
                c.used ? 'opacity-50' : ''
              )}
            >
              <div className="flex items-center gap-4">
                <span className="rounded-md bg-gold/10 px-3 py-1 font-mono text-sm font-bold text-gold">
                  {c.code}
                </span>
                <div>
                  <p className="text-sm font-medium text-bone">{c.label}</p>
                  <p className="text-xs text-bone/45">
                    {kindLabel[c.kind]}{c.kind === 'percent' ? ` — ${c.value}%` : ''} ·{' '}
                    {c.email === 'public' ? 'Any customer' : c.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={classNames(
                  'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                  c.used ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'
                )}>
                  {c.used ? 'Used' : 'Active'}
                </span>
                <span className="text-xs text-bone/35">
                  {new Date(c.createdAt).toLocaleDateString()}
                </span>
                {!c.used && (
                  <button
                    onClick={() => handleDelete(c.code)}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Revoke
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
