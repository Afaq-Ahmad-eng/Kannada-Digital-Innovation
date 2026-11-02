import { Router } from 'express';
import { asyncHandler, notFound, parse, z } from '@kta/service-kit';
import { pool } from '../../database';
import { offsetOf, PageQuery } from '../../shared/pagination';

const ListQuery = PageQuery.extend({
  status: z.enum(['PENDING', 'GENERATING', 'READY', 'DISRUPTED', 'FAILED', 'COMPLETED']).optional(),
  search: z.string().trim().max(100).optional(),
});

/* eslint-disable @typescript-eslint/no-explicit-any */
const mapTrip = (t: any) => ({
  id: t.id, userId: t.user_id, userEmail: t.email ?? null, origin: t.origin, destinations: t.destinations, startDate: t.start_date,
  endDate: t.end_date, budgetTier: t.budget_tier, travelers: t.travelers, status: t.status, source: t.source,
  failureReason: t.failure_reason, createdAt: new Date(t.created_at).toISOString(), updatedAt: new Date(t.updated_at).toISOString(),
});

export const tripsRouter = Router();

tripsRouter.get(
  '/trips',
  asyncHandler(async (req, res) => {
    const q = parse(ListQuery, req.query);
    const conds: string[] = [];
    const params: unknown[] = [];
    if (q.status) { params.push(q.status); conds.push(`t.status = $${params.length}`); }
    if (q.search) { params.push(`%${q.search}%`); conds.push(`(u.email ILIKE $${params.length} OR t.origin ILIKE $${params.length})`); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const from = `FROM trips t LEFT JOIN users u ON u.id = t.user_id ${where}`;
    const [rows, total] = await Promise.all([
      pool.query(`SELECT t.*, u.email ${from} ORDER BY t.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, q.pageSize, offsetOf(q)]),
      pool.query(`SELECT count(*) AS n ${from}`, params),
    ]);
    res.json({ items: rows.rows.map(mapTrip), total: total.rows[0].n, page: q.page, pageSize: q.pageSize });
  }),
);

tripsRouter.get(
  '/trips/:id',
  asyncHandler(async (req, res) => {
    const id = parse(z.string().uuid(), req.params.id);
    const t = await pool.query(`SELECT t.*, u.email FROM trips t LEFT JOIN users u ON u.id = t.user_id WHERE t.id = $1`, [id]);
    if (!t.rows[0]) throw notFound('Trip not found');
    const [d, r] = await Promise.all([
      pool.query(`SELECT region, severity, category, headline, detected_at FROM disruptions WHERE trip_id = $1 ORDER BY detected_at DESC`, [id]),
      pool.query(`SELECT proposal_id, summary, reason, status, created_at, updated_at FROM reroutes WHERE trip_id = $1 ORDER BY created_at DESC`, [id]),
    ]);
    res.json({
      trip: mapTrip(t.rows[0]),
      disruptions: d.rows.map((x) => ({ region: x.region, severity: x.severity, category: x.category, headline: x.headline, detectedAt: new Date(x.detected_at).toISOString() })),
      reroutes: r.rows.map((x) => ({ proposalId: x.proposal_id, summary: x.summary, reason: x.reason, status: x.status, createdAt: new Date(x.created_at).toISOString(), updatedAt: new Date(x.updated_at).toISOString() })),
    });
  }),
);

tripsRouter.get(
  '/disruptions',
  asyncHandler(async (req, res) => {
    const q = parse(PageQuery, req.query);
    const [rows, total] = await Promise.all([
      pool.query(
        `SELECT d.*, u.email FROM disruptions d LEFT JOIN users u ON u.id = d.user_id ORDER BY d.detected_at DESC LIMIT $1 OFFSET $2`,
        [q.pageSize, offsetOf(q)],
      ),
      pool.query(`SELECT count(*) AS n FROM disruptions`),
    ]);
    res.json({
      items: rows.rows.map((d) => ({ id: d.id, tripId: d.trip_id, userEmail: d.email ?? null, region: d.region, severity: d.severity, category: d.category, headline: d.headline, detectedAt: new Date(d.detected_at).toISOString() })),
      total: total.rows[0].n, page: q.page, pageSize: q.pageSize,
    });
  }),
);
