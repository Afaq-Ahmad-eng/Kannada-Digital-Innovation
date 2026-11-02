import { http } from '../../services/http';
import type { Page } from '../../hooks/usePaged';

export interface AdminUser { id: string; email: string; fullName: string | null; phone: string | null; registeredAt: string; disabled: boolean; disabledReason: string | null; disabledAt: string | null; tripCount: number }
export interface UserTrip { id: string; origin: string; destinations: string[]; startDate: string; endDate: string; status: string; source: string | null; createdAt: string }

export const usersApi = {
  list: (page: number, search: string, status: string) => http.get<Page<AdminUser>>('/admin/users', { params: { page, search: search || undefined, status: status || undefined } }).then((r) => r.data),
  get: (id: string) => http.get<{ user: AdminUser; trips: UserTrip[] }>(`/admin/users/${id}`).then((r) => r.data),
  suspend: (id: string, reason: string) => http.post<AdminUser>(`/admin/users/${id}/suspend`, { reason }).then((r) => r.data),
  reactivate: (id: string) => http.post<AdminUser>(`/admin/users/${id}/reactivate`).then((r) => r.data),
};
