import { Router } from 'express';
import { asyncHandler, getAuth, parse, z } from '@kta/service-kit';
import { auditRepository } from '../audit/audit.repository';
import { operationsService } from './operations.service';

const NotifyBody = z.object({
  userId: z.string().uuid(),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(2000),
  channels: z.array(z.enum(['EMAIL', 'WHATSAPP'])).optional(),
});

export const operationsRouter = Router();

operationsRouter.get('/operations/health', asyncHandler(async (_req, res) => res.json({ services: await operationsService.health() })));

operationsRouter.post(
  '/operations/scan',
  asyncHandler(async (req, res) => {
    const actor = getAuth(req);
    const result = await operationsService.runScan(actor);
    await auditRepository.record(actor, 'ALERT_SCAN_TRIGGERED', { type: 'system' }, { result });
    res.json(result);
  }),
);

operationsRouter.post(
  '/operations/notify',
  asyncHandler(async (req, res) => {
    const actor = getAuth(req);
    const body = parse(NotifyBody, req.body);
    const result = await operationsService.notify(actor, body);
    await auditRepository.record(actor, 'NOTIFICATION_SENT', { type: 'user', id: body.userId }, { subject: body.subject, channels: body.channels ?? 'preferred' });
    res.json(result);
  }),
);
