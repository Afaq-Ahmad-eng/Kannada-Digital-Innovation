import { Router } from 'express';
import { asyncHandler, parse, requireAuth, z } from '@kta/service-kit';
import { ragService } from './rag.service';

const GuideRequest = z.object({
  query: z.string().trim().min(3).max(300),
  topic: z.enum(['TEMPLE', 'FOOD', 'PHRASES', 'ETIQUETTE', 'TRANSPORT', 'TRAVEL', 'HERITAGE']).optional(),
});

export const culturalRouter = Router();
culturalRouter.post(
  '/cultural-guide',
  requireAuth,
  asyncHandler(async (req, res) => {
    const b = parse(GuideRequest, req.body);
    res.json(await ragService.guide(b.query, b.topic));
  }),
);
