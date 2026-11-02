import { http } from '../../../services/http';
import type { GenerateRequest, Trip, TripSummary } from '../types';

export const itineraryApi = {
  generate: (body: GenerateRequest) => http.post<{ tripId: string; status: string }>('/itineraries/generate', body).then((r) => r.data),
  list: () => http.get<{ trips: TripSummary[] }>('/itineraries').then((r) => r.data.trips),
  get: (id: string) => http.get<Trip>(`/itineraries/${id}`).then((r) => r.data),
  reorder: (id: string, dayNumber: number, orderedItemIds: string[]) =>
    http.put<Trip>(`/itineraries/${id}/reorder`, { dayNumber, orderedItemIds }).then((r) => r.data),
};
