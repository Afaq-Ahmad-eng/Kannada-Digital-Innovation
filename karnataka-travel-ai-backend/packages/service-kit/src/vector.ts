export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

/** pgvector literal, e.g. '[0.1,0.2]'. */
export const toVectorSql = (v: number[]): string => `[${v.join(',')}]`;

export function encodeVector(v: number[]): string {
  return Buffer.from(new Float32Array(v).buffer).toString('base64');
}

export function decodeVector(s: string): number[] {
  const b = Buffer.from(s, 'base64');
  const ab = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
  return Array.from(new Float32Array(ab));
}

function fnv1a(str: string, seed = 2166136261): number {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** Deterministic hashed bag-of-ngrams embedding. Used only when no Gemini key is configured (offline/demo mode). */
export function hashEmbedding(text: string, dims = 768): number[] {
  const vec = new Array<number>(dims).fill(0);
  const words = text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  const feats: string[] = [];
  words.forEach((w, i) => {
    feats.push(`w:${w}`);
    if (i > 0) feats.push(`b:${words[i - 1]}_${w}`);
    for (let j = 0; j + 3 <= w.length; j++) feats.push(`c:${w.slice(j, j + 3)}`);
  });
  for (const f of feats) {
    const h = fnv1a(f);
    vec[h % dims] += fnv1a(f, 7) & 1 ? 1 : -1;
  }
  const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0)) || 1;
  return vec.map((x) => x / norm);
}
