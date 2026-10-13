import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import CartDrawer from '@/components/CartDrawer';
import { useStoreSettings } from '@/context/StoreSettingsContext';

export default function Layout() {
  const { pathname } = useLocation();
  const { announcement } = useStoreSettings().settings;
  const hasAnnouncement = announcement.enabled && announcement.text.trim().length > 0;

  // Scroll to top on route change.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-ink bg-grain">
      <Navbar />
      <CartDrawer />
      {/* top padding clears the fixed navbar (+ 36px announcement bar when shown) */}
      <main className={hasAnnouncement ? 'flex-1 pt-[100px] md:pt-[116px]' : 'flex-1 pt-16 md:pt-20'}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
