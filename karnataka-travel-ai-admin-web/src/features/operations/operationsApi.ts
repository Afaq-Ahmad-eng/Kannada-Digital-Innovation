import { http } from '../../services/http';

export interface ServiceHealth { name: string; url: string; status: 'UP' | 'DOWN'; latencyMs: number | null }
export interface DispatchResult { channel: string; status: string; detail?: string }

export const operationsApi = {
  health: () => http.get<{ services: ServiceHealth[] }>('/admin/operations/health').then((r) => r.data.services),
  scan: () => http.post<{ trips: number; regions: number; disruptions: number }>('/admin/operations/scan', {}, { timeout: 200_000 }).then((r) => r.data),
  notify: (b: { userId: string; subject: string; message: string; channels?: ('EMAIL' | 'WHATSAPP')[] }) => http.post<{ results: DispatchResult[] }>('/admin/operations/notify', b).then((r) => r.data),
};
