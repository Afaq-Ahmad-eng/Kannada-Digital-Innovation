import { http } from '../../../services/http';
import type { AuthUser } from '../../../store/auth';
import type { LoginPayload, RegisterPayload } from '../types';

export interface SessionResponse { accessToken: string; expiresIn: number; user: AuthUser }

export const authApi = {
  login: (p: LoginPayload) => http.post<SessionResponse>('/auth/login', p).then((r) => r.data),
  register: (p: RegisterPayload) => http.post<{ id: string; email: string }>('/users/register', p).then((r) => r.data),
  logout: () => http.post('/auth/logout').then(() => undefined),
};
