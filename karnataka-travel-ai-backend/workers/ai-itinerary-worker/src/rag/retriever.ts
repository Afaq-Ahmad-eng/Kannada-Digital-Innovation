import { toVectorSql } from '@kta/service-kit';
import { KNOWLEDGE } from '@kta/shared-types';
import { env } from '../config';
import { gemini, log, pool } from '../shared';

export async function initRag(): Promise<void> {
  await pool.query(
    `CREATE EXTENSION IF NOT EXISTS vector;
     CREATE TABLE IF NOT EXISTS rag_docs (
       id TEXT PRIMARY KEY,
       topic TEXT NOT NULL,
       destination TEXT,
       title TEXT NOT NULL,
       content TEXT NOT NULL,
       embedding vector(${env.EMBED_DIMS}) NOT NULL
     );
     CREATE INDEX IF NOT EXISTS idx_rag_docs_embedding ON rag_docs USING hnsw (embedding vector_cosine_ops);`,
  );
  const { rows } = await pool.query('SELECT count(*)::int AS n FROM rag_docs');
  if (rows[0].n > 0) return;
  log.info({ docs: KNOWLEDGE.length }, 'seeding RAG index');
  for (const d of KNOWLEDGE) {
    const emb = await gemini.embed(`${d.title}. ${d.content}`);
    await pool.query(
      'INSERT INTO rag_docs (id, topic, destination, title, content, embedding) VALUES ($1,$2,$3,$4,$5,$6::vector) ON CONFLICT (id) DO NOTHING',
      [d.id, d.topic, d.destination ?? null, d.title, d.content, toVectorSql(emb)],
    );
  }
}

/** Top-k context: semantic neighbours plus any docs tied to the selected destinations. */
export async function retrieveContext(embedding: number[], destinations: string[], k = 6): Promise<string[]> {
  const sem = await pool.query('SELECT title, content FROM rag_docs ORDER BY embedding <=> $1::vector LIMIT $2', [toVectorSql(embedding), k]);
  const dest = await pool.query('SELECT title, content FROM rag_docs WHERE destination = ANY($1) LIMIT $2', [destinations, k]);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of [...dest.rows, ...sem.rows]) {
    if (!seen.has(r.title)) {
      seen.add(r.title);
      out.push(`${r.title}: ${r.content}`);
    }
  }
  return out.slice(0, k + 2);
}
