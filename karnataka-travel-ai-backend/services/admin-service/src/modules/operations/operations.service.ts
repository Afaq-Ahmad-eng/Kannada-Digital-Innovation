import { AppError } from '@kta/service-kit';
import { env } from '../../config';
import type { AuthContext } from '@kta/service-kit';

/** Admin identity forwarded to peer services exactly as the gateway would (they require the internal key + ADMIN role). */
function adminHeaders(actor: AuthContext): Record<string, string> {
  return {
    'content-type': 'application/json',
    'x-internal-key': env.INTERNAL_API_KEY,
    'x-user-id': actor.userId,
    'x-user-role': 'ADMIN',
    'x-user-email': actor.email,
  };
}

async function callAlertService(actor: AuthContext, path: string, body: unknown, timeoutMs: number): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(`${env.ALERT_SERVICE_URL}${path}`, { method: 'POST', headers: adminHeaders(actor), body: JSON.stringify(body ?? {}), signal: AbortSignal.timeout(timeoutMs) });
  } catch {
    throw new AppError(502, 'The alert service did not respond', 'ALERT_SERVICE_UNAVAILABLE');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new AppError(res.status === 404 ? 502 : res.status, (data as { error?: { message?: string } }).error?.message ?? 'Alert service error', 'ALERT_SERVICE_ERROR');
  return data;
}

export const operationsService = {
  runScan: (actor: AuthContext) => callAlertService(actor, '/api/v1/alerts/check-status', {}, 180_000),
  notify: (actor: AuthContext, body: { userId: string; subject: string; message: string; channels?: ('EMAIL' | 'WHATSAPP')[] }) =>
    callAlertService(actor, '/api/v1/alerts/dispatch-notification', body, 20_000),

  async health(): Promise<{ name: string; url: string; status: 'UP' | 'DOWN'; latencyMs: number | null }[]> {
    const targets = env.HEALTH_TARGETS.split(',').map((s) => s.trim()).filter(Boolean).map((s) => {
      const [name, url] = s.split('=');
      return { name, url };
    });
    return Promise.all(
      targets.map(async ({ name, url }) => {
        const started = Date.now();
        try {
          const r = await fetch(`${url}/health`, { signal: AbortSignal.timeout(2500) });
          return { name, url, status: r.ok ? ('UP' as const) : ('DOWN' as const), latencyMs: Date.now() - started };
        } catch {
          return { name, url, status: 'DOWN' as const, latencyMs: null };
        }
      }),
    );
  },
};
