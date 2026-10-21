import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Logo from '@/components/Logo';
import { CartIcon, CloseIcon, MenuIcon, UserIcon } from '@/components/icons';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { useWishlist } from '@/context/WishlistContext';
import { classNames } from '@/lib/format';

const baseLinks = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact Us' },
];

export default function Navbar() {
  const { count, openCart } = useCart();
  const { isAdmin, user } = useAuth();
  const { saved } = useWishlist();
  const { announcement } = useStoreSettings().settings;
  const showAnnouncement = announcement.enabled && announcement.text.trim().length > 0;
  const links = isAdmin ? [...baseLinks, { to: '/admin', label: 'Admin' }] : baseLinks;
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Drawer open: lock page scroll, close on Escape, focus the close button.
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false);
    window.addEventListener('keydown', onKey);
    const t = window.setTimeout(() => closeRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
    };
  }, [mobileOpen]);

  return (
    <header
      className={classNames(
        'site-header fixed inset-x-0 top-0 z-50 transition-all duration-500',
        scrolled
          ? 'border-b border-bone/10 bg-ink-800/70 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]'
          : 'border-b border-transparent bg-transparent'
      )}
    >
      {showAnnouncement && (
        <div className="flex h-9 items-center justify-center bg-gold px-4 text-center text-xs font-semibold tracking-wide text-ink">
          {announcement.link ? (
            <Link to={announcement.link} className="truncate hover:underline underline-offset-2">
              {announcement.text} →
            </Link>
          ) : (
            <span className="truncate">{announcement.text}</span>
          )}
        </div>
      )}
      <nav className="container-site flex h-16 items-center justify-between md:h-20">
        <Logo />

        <ul className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                className={({ isActive }) =>
                  classNames(
                    'text-sm font-medium tracking-wide transition-colors',
                    isActive ? 'text-gold' : 'text-bone/75 hover:text-bone'
                  )
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1">
          <Link
            to="/saved"
            className="group relative rounded-full p-2.5 text-bone/70 transition-all duration-200 hover:bg-bone/8 hover:text-bone"
            aria-label={saved.length ? `Saved pieces (${saved.length})` : 'Saved pieces'}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path strokeLinejoin="round" d="M12 20.5s-7.5-4.4-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.8-1.8 4.8-9.3 9.2-9.3 9.2z" />
            </svg>
            {saved.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-[18px] w-[18px] place-items-center rounded-full bg-bone text-[10px] font-bold text-ink shadow-sm">
                {saved.length}
              </span>
            )}
          </Link>
          <Link
            to={user ? "/account" : "/signin"}
            className="group relative rounded-full p-2.5 text-bone/70 transition-all duration-200 hover:bg-bone/8 hover:text-bone"
            aria-label="Account"
          >
            <UserIcon width={22} height={22} strokeWidth={1.5} />
          </Link>
          <button
            onClick={openCart}
            className="group relative rounded-full p-2.5 text-bone/70 transition-all duration-200 hover:bg-bone/8 hover:text-bone"
            aria-label="Open cart"
          >
            <CartIcon width={22} height={22} strokeWidth={1.5} />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-[18px] w-[18px] place-items-center rounded-full bg-gold text-[10px] font-bold text-ink shadow-sm">
                {count}
              </span>
            )}
          </button>
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-full p-2.5 text-bone/80 transition hover:bg-bone/5 hover:text-bone md:hidden"
            aria-label="Menu"
            aria-haspopup="dialog"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            <MenuIcon />
          </button>
        </div>
      </nav>

      {/* Mobile menu: a drawer sliding in from the right. Rendered at page level
          because the header's backdrop blur would otherwise trap a fixed panel inside it. */}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] md:hidden"
            aria-hidden={!mobileOpen}
            style={{ visibility: mobileOpen ? 'visible' : 'hidden', transition: mobileOpen ? 'none' : 'visibility 0s linear .35s' }}
          >
            {/* backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300"
              style={{ opacity: mobileOpen ? 1 : 0 }}
              onClick={() => setMobileOpen(false)}
            />
            {/* panel */}
            <aside
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className="absolute inset-y-0 right-0 flex w-[84%] max-w-sm flex-col bg-ink shadow-2xl transition-transform duration-[350ms] ease-[cubic-bezier(.22,1,.36,1)]"
              style={{ transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)' }}
            >
              <div className="flex h-16 items-center justify-between border-b border-bone/10 px-6">
                <span className="eyebrow">Menu</span>
                <button
                  ref={closeRef}
                  onClick={() => setMobileOpen(false)}
                  className="grid h-10 w-10 place-items-center rounded-full text-bone/70 transition hover:bg-bone/5 hover:text-bone"
                  aria-label="Close menu"
                >
                  <CloseIcon />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-6 py-6" aria-label="Main">
                <ul className="space-y-1">
                  {links.map((l, i) => (
                    <li
                      key={l.to}
                      className="transition-all duration-500"
                      style={{
                        opacity: mobileOpen ? 1 : 0,
                        transform: mobileOpen ? 'none' : 'translateX(24px)',
                        transitionDelay: mobileOpen ? `${120 + i * 50}ms` : '0ms',
                      }}
                    >
                      <NavLink
                        to={l.to}
                        end={l.to === '/'}
                        className={({ isActive }) =>
                          classNames(
                            'flex items-center justify-between rounded-xl px-3 py-3 font-serif text-2xl transition-colors',
                            isActive ? 'bg-gold/10 text-gold' : 'text-bone hover:bg-bone/5'
                          )
                        }
                      >
                        {l.label}
                        <span aria-hidden="true" className="text-base text-bone/30">→</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 border-t border-bone/10 pt-6">
                  <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-bone/40">Your Levush</p>
                  <ul className="space-y-0.5 text-sm">
                    <li>
                      <Link to="/saved" className="flex justify-between rounded-lg px-3 py-2.5 text-bone/80 hover:bg-bone/5 hover:text-bone">
                        Saved pieces {saved.length > 0 && <span className="rounded-full bg-bone px-2 text-xs font-bold text-ink">{saved.length}</span>}
                      </Link>
                    </li>
                    <li>
                      <Link to="/track" className="block rounded-lg px-3 py-2.5 text-bone/80 hover:bg-bone/5 hover:text-bone">Track your order</Link>
                    </li>
                    <li>
                      <Link to={user ? '/account' : '/signin'} className="block rounded-lg px-3 py-2.5 text-bone/80 hover:bg-bone/5 hover:text-bone">
                        {user ? 'My account' : 'Sign in'}
                      </Link>
                    </li>
                  </ul>
                </div>
              </nav>

              <div className="border-t border-bone/10 px-6 py-5 text-xs text-bone/45">
                Faith, worn. · Scripture streetwear from Ghana
              </div>
            </aside>
          </div>,
          document.body
        )}
    </header>
  );
}
