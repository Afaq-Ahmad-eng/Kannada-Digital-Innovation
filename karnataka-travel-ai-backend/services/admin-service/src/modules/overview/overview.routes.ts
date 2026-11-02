import { Router } from 'express';
import { asyncHandler } from '@kta/service-kit';
import { pool } from '../../database';

export const overviewRouter = Router();

overviewRouter.get(
  '/overview',
  asyncHandler(async (_req, res) => {
    const [totals, byStatus, sources, daily, destinations] = await Promise.all([
      pool.query(
        `SELECT
           (SELECT count(*) FROM users) AS users,
           (SELECT count(*) FROM users WHERE disabled) AS suspended_users,
           (SELECT count(*) FROM users WHERE registered_at > now() - interval '7 days') AS new_users_7d,
           (SELECT count(*) FROM trips) AS trips,
           (SELECT count(*) FROM trips WHERE created_at > now() - interval '24 hours') AS trips_24h,
           (SELECT count(*) FROM disruptions WHERE detected_at > now() - interval '24 hours') AS disruptions_24h,
           (SELECT count(*) FROM disruptions) AS disruptions_total,
           (SELECT count(*) FROM reroutes WHERE status = 'PROPOSED') AS reroutes_open,
           (SELECT count(*) FROM reroutes WHERE status = 'APPLIED') AS reroutes_applied`,
      ),
      pool.query(`SELECT status, count(*) AS n FROM trips GROUP BY status ORDER BY n DESC`),
      pool.query(`SELECT source, count(*) AS n FROM trips WHERE source IS NOT NULL GROUP BY source ORDER BY n DESC`),
      pool.query(
        `SELECT to_char(d::date, 'YYYY-MM-DD') AS day,
                (SELECT count(*) FROM users WHERE registered_at::date = d::date) AS users,
                (SELECT count(*) FROM trips WHERE created_at::date = d::date) AS trips
           FROM generate_series(current_date - 13, current_date, interval '1 day') AS d ORDER BY d`,
      ),
      pool.query(`SELECT dest AS name, count(*) AS n FROM trips, unnest(destinations) AS dest GROUP BY dest ORDER BY n DESC LIMIT 8`),
    ]);
    const t = totals.rows[0];
    res.json({
      totals: {
        users: t.users, suspendedUsers: t.suspended_users, newUsers7d: t.new_users_7d, trips: t.trips, trips24h: t.trips_24h,
        disruptions24h: t.disruptions_24h, disruptionsTotal: t.disruptions_total, reroutesOpen: t.reroutes_open, reroutesApplied: t.reroutes_applied,
      },
      tripsByStatus: byStatus.rows,
      planSources: sources.rows,
      daily: daily.rows,
      topDestinations: destinations.rows,
    });
  }),
);
