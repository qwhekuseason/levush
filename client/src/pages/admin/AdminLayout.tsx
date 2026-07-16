import { NavLink, Outlet } from 'react-router-dom';
import { classNames } from '@/lib/format';

const tabs = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/coupons', label: 'Promo Coupons' },
];

export default function AdminLayout() {
  return (
    <div className="container-site py-12">
      <p className="eyebrow mb-2">Admin</p>
      <h1 className="heading-serif mb-8 text-4xl text-bone">Store management</h1>

      <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                classNames(
                  'whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition',
                  isActive ? 'bg-gold text-ink' : 'text-bone/65 hover:bg-bone/5 hover:text-bone'
                )
              }
            >
              {t.label}
            </NavLink>
          ))}
        </nav>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
