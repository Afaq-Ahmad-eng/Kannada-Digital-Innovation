import { pool } from '../../database';
import { offsetOf, Page } from '../../shared/pagination';

export interface AuditEntry {
  id: number;
  actorId: string;
  actorEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  detail: Record<string, unknown>;
  createdAt: string;
}

export const auditRepository = {
  async record(actor: { userId: string; email: string }, action: string, target: { type?: string; id?: string } = {}, detail: Record<string, unknown> = {}): Promise<void> {
    await pool.query(
      `INSERT INTO audit_log (actor_id, actor_email, action, target_type, target_id, detail) VALUES ($1,$2,$3,$4,$5,$6)`,
      [actor.userId, actor.email || null, action, target.type ?? null, target.id ?? null, JSON.stringify(detail)],
    );
  },
  async list(q: { page: number; pageSize: number }, action?: string): Promise<Page<AuditEntry>> {
    const where = action ? 'WHERE action = $3' : '';
    const params: unknown[] = [q.pageSize, offsetOf(q)];
    if (action) params.push(action);
    const [rows, total] = await Promise.all([
      pool.query(`SELECT * FROM audit_log ${where} ORDER BY id DESC LIMIT $1 OFFSET $2`, params),
      pool.query(`SELECT count(*) AS n FROM audit_log ${action ? 'WHERE action = $1' : ''}`, action ? [action] : []),
    ]);
    return {
      items: rows.rows.map((r) => ({
        id: Number(r.id), actorId: r.actor_id, actorEmail: r.actor_email, action: r.action, targetType: r.target_type,
        targetId: r.target_id, detail: r.detail, createdAt: new Date(r.created_at).toISOString(),
      })),
      total: total.rows[0].n,
      page: q.page,
      pageSize: q.pageSize,
    };
  },
};
