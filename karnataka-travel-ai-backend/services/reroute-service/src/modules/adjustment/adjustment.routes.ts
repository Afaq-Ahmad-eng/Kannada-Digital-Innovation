import { Router } from 'express';
import { asyncHandler, getAuth, parse, requireAuth, z } from '@kta/service-kit';
import { adjustmentService } from './adjustment.service';

const ModifySchema = z.object({
  tripId: z.string().uuid(),
  proposalId: z.string().uuid(),
  action: z.enum(['ACCEPT', 'DISMISS']),
});

export const adjustmentRouter = Router();
adjustmentRouter.use(requireAuth);

adjustmentRouter.get(
  '/alternatives/:tripId',
  asyncHandler(async (req, res) => {
    const tripId = parse(z.string().uuid(), req.params.tripId);
    res.json({ proposals: await adjustmentService.alternatives(tripId, getAuth(req).userId) });
  }),
);

adjustmentRouter.post(
  '/modify-active-trip',
  asyncHandler(async (req, res) => {
    const b = parse(ModifySchema, req.body);
    res.json(await adjustmentService.modify(getAuth(req).userId, b.tripId, b.proposalId, b.action));
  }),
);
