import type { Page } from '../../hooks/usePaged';
import { http } from '../../services/http';

export interface AdminTrip { id: string; userId: string; userEmail: string | null; origin: string; destinations: string[]; startDate: string; endDate: string; budgetTier: string; travelers: number; status: string; source: string | null; failureReason: string | null; createdAt: string; updatedAt: string }
export interface TripDetail {
  trip: AdminTrip;
  disruptions: { region: string; severity: string; category: string | null; headline: string; detectedAt: string }[];
  reroutes: { proposalId: string; summary: string; reason: string; status: string; createdAt: string; updatedAt: string }[];
}
export interface AdminDisruption { id: string; tripId: string; userEmail: string | null; region: string; severity: string; category: string | null; headline: string; detectedAt: string }

export const tripsApi = {
  list: (page: number, status: string, search: string) => http.get<Page<AdminTrip>>('/admin/trips', { params: { page, status: status || undefined, search: search || undefined } }).then((r) => r.data),
  get: (id: string) => http.get<TripDetail>(`/admin/trips/${id}`).then((r) => r.data),
  disruptions: (page: number) => http.get<Page<AdminDisruption>>('/admin/disruptions', { params: { page } }).then((r) => r.data),
};
