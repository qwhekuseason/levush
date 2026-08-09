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
import { auth, googleProvider } from '@/lib/firebase';
import { api } from '@/lib/api';
import type { Role } from '@/types';

/** Emails that are always granted admin role */
const ADMIN_EMAILS = ['admin@levush.com'];

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  role: Role;
  isAdmin: boolean;
  loading: boolean;
  roleLoading: boolean;
  enabled: boolean;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | undefined>;
  authHeader: () => Promise<string | null>;
  updateProfileInfo: (name: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toAuthUser(u: User): AuthUser {
  return { uid: u.uid, email: u.email, displayName: u.displayName };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<Role>('customer');
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState<boolean>(false);

  // Firebase auth state subscription
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u ? toAuthUser(u) : null);
      setLoading(false);
    });
    return unsub;
  }, []);

  const authHeader = useCallback(async (): Promise<string | null> => {
    if (auth.currentUser) {
      return `Bearer ${await auth.currentUser.getIdToken()}`;
    }
    return null;
  }, []);

  // Resolve role from the backend / admin allowlist
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
        if (header) {
          const me = await api.me(header);
          if (active) setRole(me.role);
        } else if (active) {
          const email = user.email?.toLowerCase() ?? '';
          setRole(ADMIN_EMAILS.includes(email) ? 'admin' : 'customer');
        }
      } catch {
        if (active) {
          const email = user.email?.toLowerCase() ?? '';
          setRole(ADMIN_EMAILS.includes(email) ? 'admin' : 'customer');
        }
      } finally {
        if (active) setRoleLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user, authHeader]);

  const updateProfileInfo = useCallback(async (name: string) => {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: name });
      setUser((prev) => (prev ? { ...prev, displayName: name } : null));
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    if (auth.currentUser) {
      await deleteUser(auth.currentUser);
      setUser(null);
      setRole('customer');
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role,
      isAdmin: role === 'admin',
      loading,
      roleLoading,
      enabled: true,
      authHeader,
      getIdToken: async () => (auth.currentUser ? auth.currentUser.getIdToken() : undefined),
      updateProfileInfo,
      deleteAccount,
      async signUp(name, email, password) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        setUser({ ...toAuthUser(cred.user), displayName: name });
      },
      async signIn(email, password) {
        await signInWithEmailAndPassword(auth, email, password);
      },
      async signInWithGoogle() {
        await signInWithPopup(auth, googleProvider);
      },
      async logout() {
        setUser(null);
        setRole('customer');
        await signOut(auth);
      },
    }),
    [user, role, loading, roleLoading, authHeader, updateProfileInfo, deleteAccount]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
