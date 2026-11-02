import { http } from '../../../services/http';
import type { Advisory, Proposal } from '../../../store/live';

interface AlertRow { id: string; tripId: string; region: string; severity: string; category: string | null; headline: string; details: string | null }
interface ProposalRow { id: string; tripId: string; summary: string; reason: string }

export const alertsApi = {
  mine: () =>
    http.get<{ alerts: AlertRow[] }>('/alerts/mine').then((r): Advisory[] =>
      r.data.alerts.map((a) => ({ id: `${a.tripId}:${a.region}:${a.headline}`, tripId: a.tripId, region: a.region, severity: a.severity, category: a.category ?? undefined, headline: a.headline, details: a.details ?? '' })),
    ),
  alternatives: (tripId: string) =>
    http.get<{ proposals: ProposalRow[] }>(`/reroute/alternatives/${tripId}`).then((r): Proposal[] => r.data.proposals.map((p) => ({ proposalId: p.id, tripId: p.tripId, summary: p.summary, reason: p.reason }))),
  modify: (tripId: string, proposalId: string, action: 'ACCEPT' | 'DISMISS') => http.post('/reroute/modify-active-trip', { tripId, proposalId, action }).then((r) => r.data),
  simulate: (tripId: string, region: string, headline: string) => http.post('/alerts/simulate', { tripId, region, headline, category: 'WEATHER' }).then((r) => r.data),
};
