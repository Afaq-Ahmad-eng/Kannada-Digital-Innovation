import { useCallback } from 'react';
import { refreshAccessToken } from '../../../services/http';
import { useAuthStore } from '../../../store/auth';
import { useLiveStore } from '../../../store/live';
import { authApi } from '../services/authApi';
import type { LoginPayload, RegisterPayload } from '../types';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function useAuthActions() {
  const setSession = useAuthStore((s) => s.setSession);
  const clear = useAuthStore((s) => s.clear);

  const login = useCallback(
    async (p: LoginPayload) => {
      const s = await authApi.login(p);
      setSession(s.accessToken, s.user);
    },
    [setSession],
  );

  /** Registration provisions credentials asynchronously (event-driven), so retry the first sign-in briefly. */
  const register = useCallback(
    async (p: RegisterPayload) => {
      await authApi.register(p);
      for (let attempt = 0; attempt < 6; attempt++) {
        try {
          await login({ email: p.email, password: p.password });
          return;
        } catch (e) {
          if (attempt === 5) throw e;
          await sleep(700);
        }
      }
    },
    [login],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      useLiveStore.getState().reset();
      clear();
    }
  }, [clear]);

  const bootstrap = useCallback(() => refreshAccessToken(), []);
  return { login, register, logout, bootstrap };
}
