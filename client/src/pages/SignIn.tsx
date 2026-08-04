import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';

export default function SignIn() {
  const { user, isAdmin, roleLoading, signIn, signInWithGoogle, enabled, devSignIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in — wait until role is resolved
  useEffect(() => {
    if (user && !roleLoading) {
      navigate(isAdmin ? '/admin' : '/account', { replace: true });
    }
  }, [user, isAdmin, roleLoading, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);

    try {
      if (!enabled) {
        // Demo Mode fallback
        if (!email) throw new Error('Enter an email address.');
        devSignIn('', email);
      } else {
        await signIn(email, password);
      }
      // Role will be resolved by AuthContext after sign-in;
      // the useEffect above will redirect once roleLoading completes.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-site flex min-h-[80vh] items-center justify-center py-16 bg-grain">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="glass-panel rounded-[2rem] p-8 md:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.03)] border border-ink-600/40">
          <div className="mb-8 text-center">
            <p className="eyebrow mb-2">Welcome Back</p>
            <h1 className="heading-serif text-3xl text-bone sm:text-4xl">Sign In</h1>
            <p className="mt-2 text-sm text-bone/55">
              Access your orders, rewards, and clothing vault.
            </p>
          </div>

          {!enabled && (
            <div className="mb-6 rounded-xl border border-gold/30 bg-gold/5 p-4 text-xs text-gold/90">
              <p className="font-semibold">Demo mode enabled</p>
              <p className="mt-1 text-gold/80">
                Firebase is not configured. Enter any email to explore the site as a customer, or use <code className="font-mono text-bone font-bold">admin@levush.test</code> to access the Admin Panel.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-bone/55 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="field"
              />
            </div>

            {enabled && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-bone/55 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="field"
                />
              </div>
            )}

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-red-500 font-medium"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="btn-primary w-full mt-2"
            >
              {busy ? 'Verifying...' : enabled ? 'Sign In' : 'Enter Demo Mode'}
            </button>
          </form>

          {enabled && (
            <>
              <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-bone/25">
                <span className="h-px flex-1 bg-ink-600" />
                <span>or</span>
                <span className="h-px flex-1 bg-ink-600" />
              </div>

              <button
                onClick={() => signInWithGoogle().catch((e) => setError(e.message))}
                className="btn-outline w-full flex items-center justify-center gap-2"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Continue with Google
              </button>
            </>
          )}

          <div className="mt-8 text-center text-xs text-bone/50">
            Don't have an account?{' '}
            <Link to="/signup" className="link-underline font-semibold text-gold">
              Create an account
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
