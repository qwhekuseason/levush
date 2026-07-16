import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Rewards, SpinResult } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from './AuthContext';

interface RewardsContextValue {
  rewards: Rewards | null;
  points: number;
  loading: boolean;
  refresh: () => Promise<void>;
  spin: () => Promise<SpinResult>;
  submitQuiz: (correct: number) => Promise<{ awarded: number; alreadyToday: boolean }>;
}

const RewardsContext = createContext<RewardsContextValue | undefined>(undefined);

export function RewardsProvider({ children }: { children: ReactNode }) {
  const { user, authHeader } = useAuth();
  const [rewards, setRewards] = useState<Rewards | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const header = await authHeader();
    if (!header) {
      setRewards(null);
      return;
    }
    setLoading(true);
    try {
      setRewards(await api.getRewards(header));
    } catch {
      setRewards(null);
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  useEffect(() => {
    void refresh();
  }, [refresh, user]);

  const spin = useCallback(async () => {
    const header = await authHeader();
    if (!header) throw new Error('Sign in to spin.');
    const result = await api.spin(header);
    await refresh();
    return result;
  }, [authHeader, refresh]);

  const submitQuiz = useCallback(
    async (correct: number) => {
      const header = await authHeader();
      if (!header) throw new Error('Sign in to earn points.');
      const result = await api.submitQuiz(correct, header);
      await refresh();
      return { awarded: result.awarded, alreadyToday: result.alreadyToday };
    },
    [authHeader, refresh]
  );

  const value = useMemo<RewardsContextValue>(
    () => ({ rewards, points: rewards?.points ?? 0, loading, refresh, spin, submitQuiz }),
    [rewards, loading, refresh, spin, submitQuiz]
  );

  return <RewardsContext.Provider value={value}>{children}</RewardsContext.Provider>;
}

export function useRewards(): RewardsContextValue {
  const ctx = useContext(RewardsContext);
  if (!ctx) throw new Error('useRewards must be used within RewardsProvider');
  return ctx;
}
