import { create } from 'zustand';

export interface AuthUser { id: string; email: string; role: 'USER' | 'ADMIN' }

interface AuthState {
  accessToken: string | null; // memory only; the refresh token lives in an HttpOnly cookie
  user: AuthUser | null;
  status: 'unknown' | 'authed' | 'anon';
  setSession: (token: string, user: AuthUser) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  status: 'unknown',
  setSession: (accessToken, user) => set({ accessToken, user, status: 'authed' }),
  clear: () => set({ accessToken: null, user: null, status: 'anon' }),
}));
