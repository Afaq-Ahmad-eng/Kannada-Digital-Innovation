import { pool } from '../../database';
import { offsetOf, Page } from '../../shared/pagination';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  registeredAt: string;
  disabled: boolean;
  disabledReason: string | null;
  disabledAt: string | null;
  tripCount: number;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const map = (r: any): AdminUser => ({
  id: r.id,
  email: r.email,
  fullName: r.full_name,
  phone: r.phone,
  registeredAt: new Date(r.registered_at).toISOString(),
  disabled: r.disabled,
  disabledReason: r.disabled_reason,
  disabledAt: r.disabled_at ? new Date(r.disabled_at).toISOString() : null,
  tripCount: r.trip_count ?? 0,
});

const BASE = `SELECT u.*, (SELECT count(*) FROM trips t WHERE t.user_id = u.id) AS trip_count FROM users u`;

export const usersRepository = {
  async list(q: { page: number; pageSize: number }, search?: string, status?: 'active' | 'suspended'): Promise<Page<AdminUser>> {
    const conds: string[] = [];
    const params: unknown[] = [];
    if (search) {
      params.push(`%${search}%`);
      conds.push(`(u.email ILIKE $${params.length} OR u.full_name ILIKE $${params.length})`);
    }
    if (status) conds.push(status === 'suspended' ? 'u.disabled' : 'NOT u.disabled');
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const [rows, total] = await Promise.all([
      pool.query(`${BASE} ${where} ORDER BY u.registered_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, q.pageSize, offsetOf(q)]),
      pool.query(`SELECT count(*) AS n FROM users u ${where}`, params),
    ]);
    return { items: rows.rows.map(map), total: total.rows[0].n, page: q.page, pageSize: q.pageSize };
  },
  async get(id: string): Promise<AdminUser | null> {
    const r = await pool.query(`${BASE} WHERE u.id = $1`, [id]);
    return r.rows[0] ? map(r.rows[0]) : null;
  },
  async setDisabled(id: string, disabled: boolean, reason: string | null): Promise<void> {
    await pool.query(
      `UPDATE users SET disabled = $2, disabled_reason = $3, disabled_at = CASE WHEN $2 THEN now() ELSE NULL END WHERE id = $1`,
      [id, disabled, disabled ? reason : null],
    );
  },
};
