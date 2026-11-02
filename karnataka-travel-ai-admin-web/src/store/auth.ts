import { create } from 'zustand';

export interface AdminUser { id: string; email: string; role: 'ADMIN' | 'USER' }
interface AuthState {
  accessToken: string | null;
  user: AdminUser | null;
  status: 'unknown' | 'authed' | 'anon';
  setSession: (token: string, user: AdminUser) => void;
  clear: () => void;
}
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  status: 'unknown',
  setSession: (accessToken, user) => set({ accessToken, user, status: 'authed' }),
  clear: () => set({ accessToken: null, user: null, status: 'anon' }),
}));
