import type { Day, Plan } from '@kta/shared-types';
import { pool } from '../../database';

export interface Proposal {
  id: string;
  tripId: string;
  userId: string;
  status: 'PROPOSED' | 'ACCEPTED' | 'DISMISSED';
  region: string;
  reason: string;
  summary: string;
  changedDays: Day[];
  createdAt: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const mapProposal = (r: any): Proposal => ({
  id: r.id, tripId: r.trip_id, userId: r.user_id, status: r.status, region: r.region, reason: r.reason,
  summary: r.summary, changedDays: r.changed_days, createdAt: new Date(r.created_at).toISOString(),
});

export const adjustmentRepository = {
  async saveSnapshot(tripId: string, userId: string, plan: Plan): Promise<void> {
    await pool.query(
      `INSERT INTO trip_snapshots (trip_id, user_id, plan) VALUES ($1,$2,$3)
       ON CONFLICT (trip_id) DO UPDATE SET plan = EXCLUDED.plan, updated_at = now()`,
      [tripId, userId, JSON.stringify(plan)],
    );
  },
  async getSnapshot(tripId: string): Promise<{ userId: string; plan: Plan } | null> {
    const r = await pool.query('SELECT user_id, plan FROM trip_snapshots WHERE trip_id = $1', [tripId]);
    return r.rows[0] ? { userId: r.rows[0].user_id, plan: r.rows[0].plan } : null;
  },
  async mergeDays(tripId: string, days: Day[]): Promise<void> {
    const snap = await this.getSnapshot(tripId);
    if (!snap) return;
    const byNumber = new Map(snap.plan.days.map((d) => [d.dayNumber, d]));
    for (const d of days) byNumber.set(d.dayNumber, d);
    snap.plan.days = [...byNumber.values()].sort((a, b) => a.dayNumber - b.dayNumber);
    await this.saveSnapshot(tripId, snap.userId, snap.plan);
  },
  async createProposal(p: Omit<Proposal, 'status' | 'createdAt'>): Promise<void> {
    // supersede older open proposals for the same trip
    await pool.query(`UPDATE proposals SET status = 'DISMISSED' WHERE trip_id = $1 AND status = 'PROPOSED'`, [p.tripId]);
    await pool.query(
      `INSERT INTO proposals (id, trip_id, user_id, region, reason, summary, changed_days) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [p.id, p.tripId, p.userId, p.region, p.reason, p.summary, JSON.stringify(p.changedDays)],
    );
  },
  async openProposals(tripId: string): Promise<Proposal[]> {
    const r = await pool.query(`SELECT * FROM proposals WHERE trip_id = $1 AND status = 'PROPOSED' ORDER BY created_at DESC`, [tripId]);
    return r.rows.map(mapProposal);
  },
  async getProposal(id: string): Promise<Proposal | null> {
    const r = await pool.query('SELECT * FROM proposals WHERE id = $1', [id]);
    return r.rows[0] ? mapProposal(r.rows[0]) : null;
  },
  async setStatus(id: string, status: 'ACCEPTED' | 'DISMISSED'): Promise<boolean> {
    const r = await pool.query(`UPDATE proposals SET status = $2 WHERE id = $1 AND status = 'PROPOSED'`, [id, status]);
    return r.rowCount! > 0;
  },
};
