import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  deleteUser,
  type User,
} from 'firebase/auth';
import { auth, firebaseEnabled, googleProvider } from '@/lib/firebase';
import { api } from '@/lib/api';
import type { Role } from '@/types';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isDev?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  role: Role;
  isAdmin: boolean;
  loading: boolean;
  /** true while the user's role is still being resolved from the backend */
  roleLoading: boolean;
  enabled: boolean;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  /** Demo-mode sign-in (when Firebase isn't configured). */
  devSignIn: (name: string, email: string) => void;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | undefined>;
  /** Authorization header value for API calls, or null if signed out. */
  authHeader: () => Promise<string | null>;
  updateProfileInfo: (name: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const DEV_KEY = 'levush.devUser';
const DISABLED_MSG =
  'Authentication is not configured yet. Add your Firebase keys to client/.env, or use demo sign-in below.';

function toAuthUser(u: User): AuthUser {
  return { uid: u.uid, email: u.email, displayName: u.displayName };
}

function loadDevUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(DEV_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => (firebaseEnabled ? null : loadDevUser()));
  const [role, setRole] = useState<Role>('customer');
  const [loading, setLoading] = useState(true);
  // Start resolving immediately if we already have a (dev) user on first paint.
  const [roleLoading, setRoleLoading] = useState<boolean>(() => (firebaseEnabled ? false : !!loadDevUser()));

  // Firebase auth subscription (only when configured).
  useEffect(() => {
    if (!firebaseEnabled || !auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u ? toAuthUser(u) : null);
      setLoading(false);
    });
    return unsub;
  }, []);

  const authHeader = useCallback(async (): Promise<string | null> => {
    if (firebaseEnabled && auth?.currentUser) {
      return `Bearer ${await auth.currentUser.getIdToken()}`;
    }
    if (!firebaseEnabled && user?.isDev && user.email) {
      return `Bearer dev:${user.email}`;
    }
    return null;
  }, [user]);

  // Resolve role from the backend whenever the user changes.
  useEffect(() => {
    let active = true;
    (async () => {
      if (!user) {
        setRole('customer');
        setRoleLoading(false);
        return;
      }
      setRoleLoading(true);
      try {
        const header = await authHeader();
        const me = await api.me(header);
        if (active) setRole(me.role);
      } catch {
        if (active) setRole('customer');
      } finally {
        if (active) setRoleLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user, authHeader]);

  const devSignIn = useCallback((name: string, email: string) => {
    const devUser: AuthUser = {
      uid: `dev:${email}`,
      email,
      displayName: name || email.split('@')[0],
      isDev: true,
    };
    localStorage.setItem(DEV_KEY, JSON.stringify(devUser));
    setUser(devUser);
  }, []);

  const updateProfileInfo = useCallback(async (name: string) => {
    if (firebaseEnabled && auth?.currentUser) {
      await updateProfile(auth.currentUser, { displayName: name });
      setUser((prev) => prev ? { ...prev, displayName: name } : null);
    } else if (!firebaseEnabled && user?.isDev) {
      const updated = { ...user, displayName: name };
      localStorage.setItem(DEV_KEY, JSON.stringify(updated));
      setUser(updated);
    }
  }, [user]);

  const deleteAccount = useCallback(async () => {
    if (firebaseEnabled && auth?.currentUser) {
      await deleteUser(auth.currentUser);
      localStorage.removeItem(DEV_KEY);
      setUser(null);
      setRole('customer');
    } else if (!firebaseEnabled && user?.isDev) {
      localStorage.removeItem(DEV_KEY);
      setUser(null);
      setRole('customer');
    }
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role,
      isAdmin: role === 'admin',
      loading,
      roleLoading,
      enabled: firebaseEnabled,
      authHeader,
      getIdToken: async () => (auth?.currentUser ? auth.currentUser.getIdToken() : undefined),
      devSignIn,
      updateProfileInfo,
      deleteAccount,
      async signUp(name, email, password) {
        if (!auth) throw new Error(DISABLED_MSG);
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        setUser({ ...toAuthUser(cred.user), displayName: name });
      },
      async signIn(email, password) {
        if (!auth) throw new Error(DISABLED_MSG);
        await signInWithEmailAndPassword(auth, email, password);
      },
      async signInWithGoogle() {
        if (!auth) throw new Error(DISABLED_MSG);
        await signInWithPopup(auth, googleProvider);
      },
      async logout() {
        localStorage.removeItem(DEV_KEY);
        setUser(null);
        setRole('customer');
        if (auth) await signOut(auth);
      },
    }),
    [user, role, loading, roleLoading, authHeader, devSignIn, updateProfileInfo, deleteAccount]
  );


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
