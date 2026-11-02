import type { Role } from '@kta/shared-types';
import { pool } from '../../database';

export interface Credential {
  userId: string;
  email: string;
  passwordHash: string;
  role: Role;
  disabled?: boolean;
}

interface Row {
  user_id: string;
  email: string;
  password_hash: string;
  role: Role;
  disabled: boolean;
}
const map = (r: Row): Credential => ({ userId: r.user_id, email: r.email, passwordHash: r.password_hash, role: r.role, disabled: r.disabled });

export const authRepository = {
  async upsert(c: Credential): Promise<void> {
    await pool.query(
      `INSERT INTO credentials (user_id, email, password_hash, role) VALUES ($1,$2,$3,$4)
       ON CONFLICT (user_id) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role`,
      [c.userId, c.email.toLowerCase(), c.passwordHash, c.role],
    );
  },
  async findByEmail(email: string): Promise<Credential | null> {
    const r = await pool.query<Row>('SELECT * FROM credentials WHERE email = $1', [email.toLowerCase()]);
    return r.rows[0] ? map(r.rows[0]) : null;
  },
  async setDisabled(userId: string, disabled: boolean): Promise<void> {
    await pool.query('UPDATE credentials SET disabled = $2 WHERE user_id = $1', [userId, disabled]);
  },
  async findById(userId: string): Promise<Credential | null> {
    const r = await pool.query<Row>('SELECT * FROM credentials WHERE user_id = $1', [userId]);
    return r.rows[0] ? map(r.rows[0]) : null;
  },
};
