import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/auth';

export const http = axios.create({ baseURL: '/api/v1', withCredentials: true, timeout: 30_000 });

http.interceptors.request.use((cfg) => {
  const token = useAuthStore.getState().accessToken;
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

let refreshing: Promise<string | null> | null = null;

/** Single-flight refresh: concurrent callers share one request (the refresh token rotates on every use). */
export function refreshAccessToken(): Promise<string | null> {
  if (!refreshing) {
    refreshing = axios
      .post('/api/v1/auth/refresh-token', null, { withCredentials: true })
      .then((r) => {
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
      const token = await refreshAccessToken();
      if (token) {
        cfg.headers.Authorization = `Bearer ${token}`;
        return http(cfg);
      }
    }
    return Promise.reject(error);
  },
);

/** Human-readable message from the backend's { error: { message } } envelope. */
export function errorMessage(e: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(e)) {
    const msg = e.response?.data?.error?.message as string | undefined;
    if (msg) return msg;
    if (!e.response) return 'Cannot reach the server. Check your connection and retry.';
  }
  return fallback;
}
