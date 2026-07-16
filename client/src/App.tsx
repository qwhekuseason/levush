import { Route, Routes } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import RequireAdmin from '@/components/RequireAdmin';
import Home from '@/pages/Home';
import Shop from '@/pages/Shop';
import ProductDetail from '@/pages/ProductDetail';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import Account from '@/pages/Account';
import SignIn from '@/pages/SignIn';
import SignUp from '@/pages/SignUp';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/NotFound';
import ShippingReturns from '@/pages/legal/ShippingReturns';
import Terms from '@/pages/legal/Terms';
import Privacy from '@/pages/legal/Privacy';
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminProducts from '@/pages/admin/AdminProducts';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminCoupons from '@/pages/admin/AdminCoupons';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Buyer side */}
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/shop/:slug" element={<ProductDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/account" element={<Account />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/settings" element={<Settings />} />
        
        {/* Legal Pages */}
        <Route path="/policies/shipping-returns" element={<ShippingReturns />} />
        <Route path="/policies/terms" element={<Terms />} />
        <Route path="/policies/privacy" element={<Privacy />} />

        {/* Admin side (role-gated) */}
        <Route
          path="/admin"
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
      </Route>
    </Routes>
  );
}
