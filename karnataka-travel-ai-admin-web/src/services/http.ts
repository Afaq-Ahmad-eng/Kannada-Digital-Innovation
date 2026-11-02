import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/auth';

/** "X-Client: admin" gives this app its own refresh cookie and makes the backend reject non-admin accounts. */
const CLIENT = { 'X-Client': 'admin' };

export const http = axios.create({ baseURL: '/api/v1', withCredentials: true, timeout: 30_000, headers: CLIENT });

http.interceptors.request.use((cfg) => {
  const t = useAuthStore.getState().accessToken;
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

let refreshing: Promise<string | null> | null = null;
export function refreshAccessToken(): Promise<string | null> {
  if (!refreshing) {
    refreshing = axios
      .post('/api/v1/auth/refresh-token', null, { withCredentials: true, headers: CLIENT })
      .then((r) => {
        if (r.data.user.role !== 'ADMIN') throw new Error('not an admin');
        useAuthStore.getState().setSession(r.data.accessToken, r.data.user);
        return r.data.accessToken as string;
      })
      .catch(() => {
        useAuthStore.getState().clear();
        return null;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

http.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const cfg = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    if (error.response?.status === 401 && cfg && !cfg._retried && !cfg.url?.startsWith('/auth/')) {
      cfg._retried = true;
      const t = await refreshAccessToken();
      if (t) {
        cfg.headers.Authorization = `Bearer ${t}`;
        return http(cfg);
      }
    }
    return Promise.reject(error);
  },
);

export function errorMessage(e: unknown, fallback = 'Something went wrong.'): string {
  if (axios.isAxiosError(e)) {
    const m = e.response?.data?.error?.message as string | undefined;
    if (m) return m;
    if (!e.response) return 'Cannot reach the server.';
  }
  return fallback;
}
