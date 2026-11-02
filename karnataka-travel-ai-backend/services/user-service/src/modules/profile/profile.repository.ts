import type { Preferences } from '@kta/shared-types';
import { pool } from '../../database';

export interface UserRow {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  createdAt: string;
}

interface PrefRow {
  contact_channels: Preferences['contactChannels'];
  travel_pace: Preferences['travelPace'];
  dietary: Preferences['dietary'];
  accessibility: string[];
  default_budget_tier: Preferences['defaultBudgetTier'];
  home_city: string | null;
  preferred_language: 'en' | 'kn';
}
const mapPrefs = (r: PrefRow): Preferences => ({
  contactChannels: r.contact_channels,
  travelPace: r.travel_pace,
  dietary: r.dietary,
  accessibility: r.accessibility,
  defaultBudgetTier: r.default_budget_tier,
  homeCity: r.home_city,
  preferredLanguage: r.preferred_language,
});

export const profileRepository = {
  async emailExists(email: string): Promise<boolean> {
    const r = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
    return r.rowCount! > 0;
  },
  async create(u: { id: string; email: string; fullName: string; phone?: string }): Promise<UserRow> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const r = await client.query(
        'INSERT INTO users (id, email, full_name, phone) VALUES ($1,$2,$3,$4) RETURNING created_at',
        [u.id, u.email, u.fullName, u.phone ?? null],
      );
      await client.query('INSERT INTO preferences (user_id) VALUES ($1)', [u.id]);
      await client.query('COMMIT');
      return { id: u.id, email: u.email, fullName: u.fullName, phone: u.phone ?? null, createdAt: new Date(r.rows[0].created_at).toISOString() };
    } catch (e) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw e;
    } finally {
      client.release();
    }
  },
  async remove(id: string): Promise<void> {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
  },
  async find(id: string): Promise<{ user: UserRow; preferences: Preferences } | null> {
    const r = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.phone, u.created_at, p.*
         FROM users u JOIN preferences p ON p.user_id = u.id WHERE u.id = $1`,
      [id],
    );
    const row = r.rows[0];
    if (!row) return null;
    return {
      user: { id: row.id, email: row.email, fullName: row.full_name, phone: row.phone, createdAt: new Date(row.created_at).toISOString() },
      preferences: mapPrefs(row as PrefRow),
    };
  },
  async updatePreferences(id: string, p: Preferences): Promise<Preferences> {
    const r = await pool.query<PrefRow>(
      `UPDATE preferences SET contact_channels=$2, travel_pace=$3, dietary=$4, accessibility=$5,
         default_budget_tier=$6, home_city=$7, preferred_language=$8, updated_at=now()
       WHERE user_id=$1 RETURNING *`,
      [id, p.contactChannels, p.travelPace, p.dietary, p.accessibility, p.defaultBudgetTier, p.homeCity ?? null, p.preferredLanguage],
    );
    return mapPrefs(r.rows[0]);
  },
};
