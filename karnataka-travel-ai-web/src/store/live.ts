import { create } from 'zustand';

export interface Progress { stage: string; percent: number; message: string }
export interface Advisory {
  id: string;
  tripId: string;
  region: string;
  severity: string;
  category?: string;
  headline: string;
  details: string;
}
export interface Proposal { proposalId: string; tripId: string; summary: string; reason: string }

interface LiveState {
  connected: boolean;
  progress: Record<string, Progress>;
  /** Bumped whenever the server says something changed for a trip; pages refetch on change. */
  tick: Record<string, number>;
  advisories: Advisory[];
  proposals: Proposal[];
  setConnected: (v: boolean) => void;
  handle: (event: string, data: Record<string, any>) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  addAdvisories: (list: Advisory[]) => void;
  addProposals: (list: Proposal[]) => void;
  dismissAdvisory: (id: string) => void;
  removeProposal: (id: string) => void;
  reset: () => void;
}

export const useLiveStore = create<LiveState>((set) => ({
  connected: false,
  progress: {},
  tick: {},
  advisories: [],
  proposals: [],
  setConnected: (connected) => set({ connected }),
  handle: (event, d) =>
    set((s) => {
      const tripId = d.tripId as string | undefined;
      const tick = tripId ? { ...s.tick, [tripId]: (s.tick[tripId] ?? 0) + 1 } : s.tick;
      switch (event) {
        case 'progress':
          return { tick, progress: { ...s.progress, [tripId!]: { stage: d.stage, percent: d.percent, message: d.message } } };
        case 'disrupted': {
          const a: Advisory = { id: `${tripId}:${d.region}:${d.headline}`, tripId: tripId!, region: d.region, severity: d.severity, category: d.category, headline: d.headline, details: d.details };
          return s.advisories.some((x) => x.id === a.id) ? { tick } : { tick, advisories: [a, ...s.advisories] };
        }
        case 'reroute-proposed':
          return { tick, proposals: [{ proposalId: d.proposalId, tripId: tripId!, summary: d.summary, reason: d.reason }, ...s.proposals.filter((p) => p.proposalId !== d.proposalId)] };
        case 'rerouted':
          return { tick, proposals: s.proposals.filter((p) => p.proposalId !== d.proposalId), advisories: s.advisories.filter((a) => a.tripId !== tripId) };
        default:
          return { tick };
      }
    }),
  addAdvisories: (list) => set((s) => ({ advisories: [...list.filter((a) => !s.advisories.some((x) => x.id === a.id)), ...s.advisories] })),
  addProposals: (list) => set((s) => ({ proposals: [...list.filter((p) => !s.proposals.some((x) => x.proposalId === p.proposalId)), ...s.proposals] })),
  dismissAdvisory: (id) => set((s) => ({ advisories: s.advisories.filter((a) => a.id !== id) })),
  removeProposal: (id) => set((s) => ({ proposals: s.proposals.filter((p) => p.proposalId !== id) })),
  reset: () => set({ connected: false, progress: {}, tick: {}, advisories: [], proposals: [] }),
}));
