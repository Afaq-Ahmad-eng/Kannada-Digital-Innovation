import { Router } from 'express';
import { asyncHandler, parse, requireRole, z } from '@kta/service-kit';
import { dispatchService } from './dispatch.service';

const DispatchSchema = z.object({
  userId: z.string().uuid(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  channels: z.array(z.enum(['EMAIL', 'WHATSAPP'])).optional(),
});

export const dispatchRouter = Router();
dispatchRouter.post(
  '/dispatch-notification',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const b = parse(DispatchSchema, req.body);
    res.json({ results: await dispatchService.notifyUser(b.userId, b.subject, b.message, b.channels) });
  }),
);
