import { http } from '../../services/http';
import type { AdminUser } from '../../store/auth';

export const authApi = {
  login: (email: string, password: string) => http.post<{ accessToken: string; user: AdminUser }>('/auth/login', { email, password }).then((r) => r.data),
  logout: () => http.post('/auth/logout').then(() => undefined),
};
