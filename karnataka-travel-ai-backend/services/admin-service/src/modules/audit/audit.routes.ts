import { Router } from 'express';
import { asyncHandler, parse, z } from '@kta/service-kit';
import { PageQuery } from '../../shared/pagination';
import { auditRepository } from './audit.repository';

export const auditRouter = Router();
auditRouter.get(
  '/audit',
  asyncHandler(async (req, res) => {
    const q = parse(PageQuery.extend({ action: z.string().max(60).optional() }), req.query);
    res.json(await auditRepository.list(q, q.action));
  }),
);
