import { pool } from '../../database';

export interface ActiveTrip {
  tripId: string;
  userId: string;
  regions: string[];
}
export interface AlertRow {
  id: string;
  tripId: string;
  region: string;
  severity: string;
  category: string | null;
  headline: string;
  details: string | null;
  sources: { title: string; uri: string }[];
  createdAt: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export const monitoringRepository = {
  async upsertContact(c: { userId: string; email?: string; fullName?: string; phone?: string | null; channels?: string[] }): Promise<void> {
    await pool.query(
      `INSERT INTO contacts (user_id, email, full_name, phone, channels) VALUES ($1,$2,$3,$4,COALESCE($5,'{EMAIL}'))
       ON CONFLICT (user_id) DO UPDATE SET
         email = COALESCE(EXCLUDED.email, contacts.email),
         full_name = COALESCE(EXCLUDED.full_name, contacts.full_name),
         phone = COALESCE(EXCLUDED.phone, contacts.phone),
         channels = COALESCE($5, contacts.channels)`,
      [c.userId, c.email ?? null, c.fullName ?? null, c.phone ?? null, c.channels ?? null],
    );
  },
  async getContact(userId: string) {
    const r = await pool.query('SELECT * FROM contacts WHERE user_id = $1', [userId]);
    return r.rows[0] as { user_id: string; email: string | null; full_name: string | null; phone: string | null; channels: string[] } | undefined;
  },
  async upsertTrip(t: { tripId: string; userId: string; regions: string[]; startDate: string; endDate: string }): Promise<void> {
    await pool.query(
      `INSERT INTO active_trips (trip_id, user_id, regions, start_date, end_date) VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (trip_id) DO UPDATE SET regions = EXCLUDED.regions`,
      [t.tripId, t.userId, t.regions, t.startDate, t.endDate],
    );
  },
  async updateRegions(tripId: string, regions: string[]): Promise<void> {
    await pool.query('UPDATE active_trips SET regions = $2 WHERE trip_id = $1', [tripId, regions]);
  },
  async completeTrip(tripId: string): Promise<void> {
    await pool.query(`UPDATE active_trips SET status = 'COMPLETED' WHERE trip_id = $1`, [tripId]);
  },
  async tripsToScan(): Promise<ActiveTrip[]> {
    const r = await pool.query(
      `SELECT trip_id, user_id, regions FROM active_trips
        WHERE status = 'ACTIVE' AND end_date >= CURRENT_DATE AND start_date <= CURRENT_DATE + 3`,
    );
    return r.rows.map((x: any) => ({ tripId: x.trip_id, userId: x.user_id, regions: x.regions }));
  },
  async tripOwner(tripId: string): Promise<{ userId: string; regions: string[] } | null> {
    const r = await pool.query('SELECT user_id, regions FROM active_trips WHERE trip_id = $1', [tripId]);
    return r.rows[0] ? { userId: r.rows[0].user_id, regions: r.rows[0].regions } : null;
  },
  async saveAlert(a: { tripId: string; userId: string; region: string; severity: string; category: string; headline: string; details: string; sources: unknown[] }): Promise<void> {
    await pool.query(
      `INSERT INTO alerts (trip_id, user_id, region, severity, category, headline, details, sources) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [a.tripId, a.userId, a.region, a.severity, a.category, a.headline, a.details, JSON.stringify(a.sources)],
    );
  },
  async alertsForUser(userId: string): Promise<AlertRow[]> {
    const r = await pool.query(
      `SELECT a.* FROM alerts a JOIN active_trips t ON t.trip_id = a.trip_id
        WHERE a.user_id = $1 AND t.status = 'ACTIVE' AND a.created_at > now() - interval '48 hours'
        ORDER BY a.created_at DESC LIMIT 20`,
      [userId],
    );
    return r.rows.map((x: any) => ({
      id: x.id, tripId: x.trip_id, region: x.region, severity: x.severity, category: x.category,
      headline: x.headline, details: x.details, sources: x.sources, createdAt: new Date(x.created_at).toISOString(),
    }));
  },
};
