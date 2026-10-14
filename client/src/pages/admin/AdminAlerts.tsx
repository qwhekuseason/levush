import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCatalog } from '@/context/CatalogContext';
import { api } from '@/lib/api';
import { classNames } from '@/lib/format';
import { isSoldOut } from '@/lib/stock';
import { formatPhone, whatsappLink } from '@/lib/whatsapp';
import type { StockAlert } from '@/types';

interface Group {
  key: string;
  productId: string;
  productName: string;
  slug?: string;
  color: string;
  colorLabel: string;
  size: string;
  backInStock: boolean;
  alerts: StockAlert[];
}

export default function AdminAlerts() {
  const { authHeader } = useAuth();
  const { allProducts } = useCatalog();
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);

  const withAuth = async () => {
    const h = await authHeader();
    if (!h) throw new Error('Your session expired — sign in again.');
    return h;
  };

  useEffect(() => {
    (async () => {
      try {
        setAlerts(await api.listStockAlerts(await withAuth()));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load requests.');
      } finally {
        setLoaded(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // One row per product + colour + size, back-in-stock items first.
  const groups = useMemo(() => {
    const map = new Map<string, Group>();
    for (const a of alerts) {
      if (a.notified && !showDone) continue;
      const key = `${a.productId}|${a.color}|${a.size}`;
      if (!map.has(key)) {
        const product = allProducts.find((p) => p.id === a.productId);
        map.set(key, {
          key,
          productId: a.productId,
          productName: product?.name ?? a.productName,
          slug: product?.slug,
          color: a.color,
          colorLabel: a.colorLabel,
          size: a.size,
          backInStock: product ? !isSoldOut(product, a.color, a.size) && !product.isHidden : false,
          alerts: [],
        });
      }
      map.get(key)!.alerts.push(a);
    }
    return [...map.values()].sort((x, y) => Number(y.backInStock) - Number(x.backInStock) || y.alerts.length - x.alerts.length);
  }, [alerts, allProducts, showDone]);

  const mark = async (a: StockAlert, notified: boolean) => {
    setAlerts((prev) => prev.map((x) => (x.id === a.id ? { ...x, notified } : x)));
    try {
      await api.markStockAlert(a.id, notified, await withAuth());
    } catch {
      setAlerts((prev) => prev.map((x) => (x.id === a.id ? a : x)));
    }
  };

  const remove = async (a: StockAlert) => {
    try {
      await api.deleteStockAlert(a.id, await withAuth());
      setAlerts((prev) => prev.filter((x) => x.id !== a.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete.');
    }
  };

  const message = (g: Group, a: StockAlert) =>
    `Hi${a.name ? ` ${a.name}` : ''}! Good news from Levush: ${g.productName} (${g.colorLabel}, size ${g.size}) is back in stock. ` +
    `Grab it here: ${window.location.origin}/shop/${g.slug ?? ''}`;

  const waiting = alerts.filter((a) => !a.notified).length;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h2 className="heading-serif text-2xl text-bone">Restock requests</h2>
        <label className="flex items-center gap-2 text-xs text-bone/60">
          <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} className="h-4 w-4 accent-gold" />
          Show already-notified
        </label>
      </div>
      <p className="mb-6 text-sm text-bone/55">
        {loaded ? `${waiting} customer${waiting === 1 ? '' : 's'} waiting.` : 'Loading…'} When you restock a size in Products,
        it shows “Back in stock” here. Message each customer on WhatsApp, then tick them off.
      </p>
      {error && <p className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400" role="alert">{error}</p>}

      {loaded && groups.length === 0 && <p className="text-sm text-bone/45">No one is waiting right now.</p>}

      <div className="space-y-3">
        {groups.map((g) => (
          <section key={g.key} className={classNames('card-surface p-4', g.backInStock && 'border-l-2 border-emerald-500')}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-bone">{g.productName}</p>
                <p className="text-xs text-bone/50">{g.colorLabel} · Size {g.size} · {g.alerts.length} waiting</p>
              </div>
              <span className={classNames('rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide', g.backInStock ? 'bg-emerald-500/15 text-emerald-600' : 'bg-bone/10 text-bone/50')}>
                {g.backInStock ? 'Back in stock — notify' : 'Still sold out'}
              </span>
            </div>
            <ul className="mt-3 divide-y divide-bone/10">
              {g.alerts.map((a) => (
                <li key={a.id} className={classNames('flex flex-wrap items-center gap-3 py-2 text-sm', a.notified && 'opacity-50')}>
                  <span className="min-w-[8rem] text-bone/80">{a.name || 'Customer'}</span>
                  <span className="font-mono text-xs text-bone/60">{formatPhone(a.phone)}</span>
                  <span className="text-xs text-bone/40">{new Date(a.createdAt).toLocaleDateString()}</span>
                  <span className="ml-auto flex items-center gap-3">
                    {g.backInStock && !a.notified && (
                      <a
                        href={whatsappLink(a.phone, message(g, a))}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => void mark(a, true)}
                        className="rounded-full bg-[#25D366] px-3 py-1 text-xs font-semibold text-white hover:bg-[#1ebe5a]"
                      >
                        Message on WhatsApp
                      </a>
                    )}
                    <button onClick={() => mark(a, !a.notified)} className="text-xs text-bone/60 hover:text-gold">
                      {a.notified ? 'Undo' : 'Mark notified'}
                    </button>
                    <button onClick={() => remove(a)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
