import { toVectorSql } from '@kta/service-kit';
import type { KnowledgeDoc } from '@kta/shared-types';
import { pool } from '../../database';

export interface Retrieved {
  id: string;
  title: string;
  topic: string;
  content: string;
  score: number;
}

export const ragRepository = {
  async count(): Promise<number> {
    const r = await pool.query('SELECT count(*)::int AS n FROM culture_docs');
    return r.rows[0].n;
  },
  async truncate(): Promise<void> {
    await pool.query('TRUNCATE culture_docs');
  },
  async insert(doc: KnowledgeDoc, embedding: number[]): Promise<void> {
    await pool.query(
      `INSERT INTO culture_docs (id, topic, destination, title, content, embedding) VALUES ($1,$2,$3,$4,$5,$6::vector)
       ON CONFLICT (id) DO UPDATE SET topic=EXCLUDED.topic, destination=EXCLUDED.destination, title=EXCLUDED.title, content=EXCLUDED.content, embedding=EXCLUDED.embedding`,
      [doc.id, doc.topic, doc.destination ?? null, doc.title, doc.content, toVectorSql(embedding)],
    );
  },
  async search(embedding: number[], k: number, topic?: string): Promise<Retrieved[]> {
    const r = await pool.query(
      `SELECT id, title, topic, content, 1 - (embedding <=> $1::vector) AS score
         FROM culture_docs WHERE ($3::text IS NULL OR topic = $3)
        ORDER BY embedding <=> $1::vector LIMIT $2`,
      [toVectorSql(embedding), k, topic ?? null],
    );
    return r.rows;
  },
};
