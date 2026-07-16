import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Logo from '@/components/Logo';
import { CartIcon, CloseIcon, MenuIcon, UserIcon } from '@/components/icons';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
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

  return (
    <header
      className={classNames(
        'fixed inset-x-0 top-0 z-50 transition-all duration-500',
        scrolled
          ? 'border-b border-bone/10 bg-ink-800/70 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]'
          : 'border-b border-transparent bg-transparent'
      )}
    >
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
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-full p-2.5 text-bone/80 transition hover:bg-bone/5 hover:text-bone md:hidden"
            aria-label="Menu"
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-bone/10 bg-ink/95 backdrop-blur-md md:hidden">
          <ul className="container-site flex flex-col py-4">
            {links.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="block py-3 text-base font-medium text-bone/85 hover:text-gold"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
