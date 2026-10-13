import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { classNames } from '@/lib/format';
import { whatsappLink } from '@/lib/whatsapp';
import type { ContactMessage } from '@/types';

const fmt = (ts: number) =>
  new Date(ts).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function AdminMessages() {
  const { authHeader } = useAuth();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [open, setOpen] = useState<string | null>(null);

  const withAuth = async () => {
    const h = await authHeader();
    if (!h) throw new Error('Your session expired — sign in again.');
    return h;
  };

  useEffect(() => {
    (async () => {
      try {
        setMessages(await api.listMessages(await withAuth()));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load messages.');
      } finally {
        setLoaded(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mark = async (m: ContactMessage, read: boolean) => {
    setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, read } : x)));
    try {
      await api.markMessage(m.id, read, await withAuth());
    } catch {
      setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, read: m.read } : x)));
    }
  };

  const toggle = (m: ContactMessage) => {
    setOpen((id) => (id === m.id ? null : m.id));
    if (!m.read) void mark(m, true);
  };

  const remove = async (m: ContactMessage) => {
    if (!confirm(`Delete the message from ${m.name}?`)) return;
    try {
      await api.deleteMessage(m.id, await withAuth());
      setMessages((prev) => prev.filter((x) => x.id !== m.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete message.');
    }
  };

  const unread = messages.filter((m) => !m.read).length;
  const shown = filter === 'unread' ? messages.filter((m) => !m.read) : messages;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="heading-serif text-2xl text-bone">
          Messages {loaded && unread > 0 && <span className="ml-2 rounded-full bg-gold px-2.5 py-0.5 align-middle text-xs font-bold text-ink">{unread} new</span>}
        </h2>
        <div className="flex gap-1.5">
          {(['all', 'unread'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={classNames(
                'rounded-full px-3 py-1.5 text-xs font-medium transition',
                filter === f ? 'bg-gold text-ink' : 'border border-bone/15 text-bone/60 hover:text-bone'
              )}
            >
              {f === 'all' ? `All (${messages.length})` : `Unread (${unread})`}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400" role="alert">{error}</p>}

      {!loaded ? (
        <p className="text-sm text-bone/45">Loading messages…</p>
      ) : shown.length === 0 ? (
        <p className="text-sm text-bone/45">{messages.length ? 'No unread messages.' : 'No messages yet. Messages from the Contact page will appear here.'}</p>
      ) : (
        <ul className="space-y-2">
          {shown.map((m) => (
            <li key={m.id} className={classNames('card-surface overflow-hidden', !m.read && 'border-l-2 border-gold')}>
              <button onClick={() => toggle(m)} className="flex w-full items-start justify-between gap-4 p-4 text-left">
                <span className="min-w-0">
                  <span className={classNames('block text-sm', m.read ? 'text-bone/80' : 'font-semibold text-bone')}>{m.name}</span>
                  <span className="block truncate text-xs text-bone/50">{m.message}</span>
                </span>
                <span className="shrink-0 text-xs text-bone/40">{fmt(m.createdAt)}</span>
              </button>
              {open === m.id && (
                <div className="border-t border-bone/10 p-4">
                  <p className="whitespace-pre-line text-sm text-bone/85">{m.message}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                    <a href={`mailto:${m.email}?subject=${encodeURIComponent('Re: your message to Levush')}`} className="btn-outline !py-1.5 text-xs">
                      Reply by email ({m.email})
                    </a>
                    {m.phone && (
                      <a
                        href={whatsappLink(m.phone, `Hi ${m.name.split(' ')[0]}, this is Levush replying to your message. `)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-[#25D366] px-3 py-1.5 font-semibold text-white hover:bg-[#1ebe5a]"
                      >
                        WhatsApp {m.phone}
                      </a>
                    )}
                    <button onClick={() => mark(m, !m.read)} className="text-bone/60 hover:text-gold">
                      Mark as {m.read ? 'unread' : 'read'}
                    </button>
                    <button onClick={() => remove(m)} className="ml-auto text-red-400 hover:text-red-300">Delete</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
