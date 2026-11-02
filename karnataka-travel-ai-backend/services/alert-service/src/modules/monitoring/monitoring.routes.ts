import { Router } from 'express';
import cron from 'node-cron';
import { asyncHandler, AppError, getAuth, notFound, parse, requireAuth, requireRole, z } from '@kta/service-kit';
import { env } from '../../config';
import { log } from '../../shared/logger';
import { monitoringRepository } from './monitoring.repository';
import { raiseDisruption, runScan } from './monitoring.service';

const SimulateSchema = z.object({
  tripId: z.string().uuid(),
  region: z.string().min(2),
  category: z.enum(['WEATHER', 'ROAD', 'BANDH', 'OTHER']).default('WEATHER'),
  headline: z.string().min(3).max(120).default('Heavy rainfall warning'),
  severity: z.enum(['HIGH', 'CRITICAL']).default('HIGH'),
});

export const monitoringRouter = Router();

monitoringRouter.post('/check-status', requireRole('ADMIN'), asyncHandler(async (_req, res) => res.json(await runScan())));

monitoringRouter.get(
  '/mine',
  requireAuth,
  asyncHandler(async (req, res) => res.json({ alerts: await monitoringRepository.alertsForUser(getAuth(req).userId) })),
);

/** Demo helper: lets a signed-in traveller trigger a disruption on their own trip (ENABLE_DEMO_ENDPOINTS=true). */
monitoringRouter.post(
  '/simulate',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (env.ENABLE_DEMO_ENDPOINTS !== 'true') throw new AppError(404, 'Not found', 'NOT_FOUND');
    const b = parse(SimulateSchema, req.body);
    const owner = await monitoringRepository.tripOwner(b.tripId);
    if (!owner || owner.userId !== getAuth(req).userId) throw notFound('Trip not found');
    const raised = await raiseDisruption({
      tripId: b.tripId, userId: owner.userId, region: b.region, severity: b.severity, category: b.category, headline: b.headline,
      details: 'Simulated advisory for demonstration purposes.',
    });
    res.status(202).json({ raised });
  }),
);

export function startScanner(): void {
  if (env.SCAN_ENABLED !== 'true') return;
  cron.schedule(env.SCAN_CRON, () => {
    runScan().catch((err) => log.error({ err }, 'scheduled scan failed'));
  });
  log.info({ cron: env.SCAN_CRON }, 'scanner scheduled');
}
