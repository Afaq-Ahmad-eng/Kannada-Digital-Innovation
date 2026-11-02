import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useAuthStore } from '../store/auth';
import { useLiveStore } from '../store/live';
import { refreshAccessToken } from './http';

class FatalStreamError extends Error {}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Persistent Server-Sent Events listener (fetch-based so it can send the Authorization header).
 * Reconnects automatically and refreshes the access token when the gateway answers 401.
 */
export function startLiveStream(): () => void {
  const ctrl = new AbortController();
  let stopped = false;

  const run = async () => {
    while (!stopped) {
      const token = useAuthStore.getState().accessToken;
      if (!token) {
        await sleep(1000);
        continue;
      }
      try {
        await fetchEventSource('/api/v1/itineraries/stream', {
          signal: ctrl.signal,
          headers: { Authorization: `Bearer ${token}` },
          openWhenHidden: true,
          async onopen(res) {
            if (res.ok) return useLiveStore.getState().setConnected(true);
            throw new FatalStreamError(String(res.status));
          },
          onmessage(ev) {
            if (!ev.event || ev.event === 'connected') return;
            try {
              useLiveStore.getState().handle(ev.event, JSON.parse(ev.data));
            } catch {
              /* ignore malformed frame */
            }
          },
          onclose() {
            throw new Error('stream closed');
          },
          onerror(err) {
            throw err;
          },
        });
      } catch (err) {
        useLiveStore.getState().setConnected(false);
        if (stopped) return;
        if (err instanceof FatalStreamError) await refreshAccessToken();
        await sleep(3000);
      }
    }
  };
  void run();
  return () => {
    stopped = true;
    ctrl.abort();
    useLiveStore.getState().setConnected(false);
  };
}
