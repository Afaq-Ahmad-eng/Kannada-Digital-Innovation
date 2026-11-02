import { Router } from 'express';
import { asyncHandler, getAuth, notFound, parse, z } from '@kta/service-kit';
import { PageQuery } from '../../shared/pagination';
import { pool } from '../../database';
import { usersRepository } from './users.repository';
import { usersService } from './users.service';

const Id = z.string().uuid();
const ListQuery = PageQuery.extend({
  search: z.string().trim().max(100).optional(),
  status: z.enum(['active', 'suspended']).optional(),
});
const SuspendBody = z.object({ reason: z.string().trim().min(3, 'Give a reason (min 3 characters)').max(300) });

export const usersRouter = Router();

usersRouter.get(
  '/users',
  asyncHandler(async (req, res) => {
    const q = parse(ListQuery, req.query);
    res.json(await usersRepository.list(q, q.search, q.status));
  }),
);

usersRouter.get(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const id = parse(Id, req.params.id);
    const user = await usersRepository.get(id);
    if (!user) throw notFound('User not found');
    const trips = await pool.query(
      `SELECT id, origin, destinations, start_date, end_date, status, source, created_at FROM trips WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [id],
    );
    res.json({
      user,
      trips: trips.rows.map((t) => ({ id: t.id, origin: t.origin, destinations: t.destinations, startDate: t.start_date, endDate: t.end_date, status: t.status, source: t.source, createdAt: new Date(t.created_at).toISOString() })),
    });
  }),
);

usersRouter.post(
  '/users/:id/suspend',
  asyncHandler(async (req, res) => {
    const { reason } = parse(SuspendBody, req.body);
    res.json(await usersService.setSuspended(getAuth(req), parse(Id, req.params.id), true, reason));
  }),
);

usersRouter.post(
  '/users/:id/reactivate',
  asyncHandler(async (req, res) => {
    res.json(await usersService.setSuspended(getAuth(req), parse(Id, req.params.id), false));
  }),
);
