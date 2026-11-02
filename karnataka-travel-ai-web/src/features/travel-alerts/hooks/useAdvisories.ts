import { useEffect } from 'react';
import { useAuthStore } from '../../../store/auth';
import { useLiveStore } from '../../../store/live';
import { alertsApi } from '../services/alertsApi';

/** Loads alerts raised while the app was closed, plus any open reroute proposals for those trips. */
export function useInitialAdvisories() {
  const authed = useAuthStore((s) => s.status === 'authed');
  useEffect(() => {
    if (!authed) return;
    let cancelled = false;
    (async () => {
      try {
        const alerts = await alertsApi.mine();
        if (cancelled) return;
        useLiveStore.getState().addAdvisories(alerts);
        for (const tripId of new Set(alerts.map((a) => a.tripId))) {
          const proposals = await alertsApi.alternatives(tripId);
          if (!cancelled) useLiveStore.getState().addProposals(proposals);
        }
      } catch {
        /* the ribbon is progressive enhancement; ignore load failures */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authed]);
}
