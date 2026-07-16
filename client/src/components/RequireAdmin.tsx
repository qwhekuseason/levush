import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';

/** Gate that only lets admins through; everyone else is sent to /account. */
export default function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading, roleLoading } = useAuth();

  if (loading || roleLoading) {
    return <div className="container-site py-32 text-center text-bone/50">Checking access…</div>;
  }

  if (!user) return <Navigate to="/account" replace state={{ from: 'admin' }} />;

  if (!isAdmin) {
    return (
      <div className="container-site py-32 text-center">
        <p className="eyebrow mb-3">Restricted</p>
        <h1 className="heading-serif text-3xl text-bone">Admins only</h1>
        <p className="mt-3 text-bone/55">
          This area is for store administrators. You’re signed in as a customer.
        </p>
        <Navigate to="/account" replace />
      </div>
    );
  }

  return <>{children}</>;
}
