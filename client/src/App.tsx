import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import RequireAdmin from '@/components/RequireAdmin';

// Eager load Home for instant first render
import Home from '@/pages/Home';

// Lazy load secondary and heavy routes for instant initial bundle delivery
const Shop = lazy(() => import('@/pages/Shop'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
const About = lazy(() => import('@/pages/About'));
const Contact = lazy(() => import('@/pages/Contact'));
const Cart = lazy(() => import('@/pages/Cart'));
const Checkout = lazy(() => import('@/pages/Checkout'));
const Account = lazy(() => import('@/pages/Account'));
const SignIn = lazy(() => import('@/pages/SignIn'));
const SignUp = lazy(() => import('@/pages/SignUp'));
const Settings = lazy(() => import('@/pages/Settings'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Legal pages
const ShippingReturns = lazy(() => import('@/pages/legal/ShippingReturns'));
const Terms = lazy(() => import('@/pages/legal/Terms'));
const Privacy = lazy(() => import('@/pages/legal/Privacy'));

// Admin pages
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('@/pages/admin/AdminProducts'));
const AdminOrders = lazy(() => import('@/pages/admin/AdminOrders'));
const AdminCoupons = lazy(() => import('@/pages/admin/AdminCoupons'));

function PageLoader() {
  return (
    <div className="container-site flex min-h-[60vh] items-center justify-center text-bone/40">
      <div className="flex flex-col items-center gap-3">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        <span className="text-xs uppercase tracking-widest text-bone/50">Loading…</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Buyer side */}
        <Route path="/" element={<Home />} />
        
        <Route
          path="/*"
          element={
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="shop" element={<Shop />} />
                <Route path="shop/:slug" element={<ProductDetail />} />
                <Route path="about" element={<About />} />
                <Route path="contact" element={<Contact />} />
                <Route path="cart" element={<Cart />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="account" element={<Account />} />
                <Route path="signin" element={<SignIn />} />
                <Route path="signup" element={<SignUp />} />
                <Route path="settings" element={<Settings />} />

                {/* Legal Pages */}
                <Route path="policies/shipping-returns" element={<ShippingReturns />} />
                <Route path="policies/terms" element={<Terms />} />
                <Route path="policies/privacy" element={<Privacy />} />

                {/* Admin side (role-gated) */}
                <Route
                  path="admin"
                  element={
                    <RequireAdmin>
                      <AdminLayout />
                    </RequireAdmin>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="coupons" element={<AdminCoupons />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}
