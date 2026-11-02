import type { Logger } from '@kta/logger';
import { hashEmbedding } from './vector';

export interface GeminiConfig {
  apiKey?: string;
  model: string;
  embedModel: string;
  embedDims: number;
}

export interface GroundedResult {
  text: string;
  sources: { title: string; uri: string }[];
}

interface GeminiResponse {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    groundingMetadata?: { groundingChunks?: { web?: { uri?: string; title?: string } }[] };
  }[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const BASE = 'https://generativelanguage.googleapis.com/v1beta';

/** Minimal Gemini REST client: structured JSON output, Google Search grounding and embeddings. */
export class GeminiClient {
  constructor(private readonly cfg: GeminiConfig, private readonly log: Logger) {}

  get enabled(): boolean {
    return Boolean(this.cfg.apiKey);
  }

  private async call<T>(path: string, body: unknown): Promise<T> {
    for (let attempt = 1; ; attempt++) {
      const res = await fetch(`${BASE}/${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': this.cfg.apiKey ?? '' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(90_000),
      });
      if (res.ok) return (await res.json()) as T;
      if ((res.status === 429 || res.status >= 500) && attempt < 3) {
        this.log.warn({ status: res.status, attempt }, 'gemini transient error, retrying');
        await sleep(800 * 2 ** attempt);
        continue;
      }
      throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }
  }

  private textOf(r: GeminiResponse): string {
    return (r.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('');
  }

  /** Strict structured output using responseSchema. Returns parsed (unvalidated) JSON. */
  async generateJson(prompt: string, schema: object, opts: { system?: string; temperature?: number } = {}): Promise<unknown> {
    const r = await this.call<GeminiResponse>(`models/${this.cfg.model}:generateContent`, {
      systemInstruction: opts.system ? { parts: [{ text: opts.system }] } : undefined,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: opts.temperature ?? 0.4, responseMimeType: 'application/json', responseSchema: schema },
    });
    return JSON.parse(this.textOf(r));
  }

  /** Google Search grounding (cannot be combined with responseSchema, so callers parse the text). */
  async generateGrounded(prompt: string, opts: { system?: string } = {}): Promise<GroundedResult> {
    const r = await this.call<GeminiResponse>(`models/${this.cfg.model}:generateContent`, {
      systemInstruction: opts.system ? { parts: [{ text: opts.system }] } : undefined,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }],
      generationConfig: { temperature: 0.1 },
    });
    const chunks = r.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const sources = chunks
      .map((c) => ({ title: c.web?.title ?? '', uri: c.web?.uri ?? '' }))
      .filter((s) => s.uri)
      .slice(0, 5);
    return { text: this.textOf(r), sources };
  }

  /** Embedding vector (L2-normalised). Falls back to a local hashed embedding when no API key is set. */
  async embed(text: string): Promise<number[]> {
    if (!this.enabled) return hashEmbedding(text, this.cfg.embedDims);
    const r = await this.call<{ embedding?: { values?: number[] } }>(`models/${this.cfg.embedModel}:embedContent`, {
      content: { parts: [{ text }] },
      outputDimensionality: this.cfg.embedDims,
    });
    const v = r.embedding?.values;
    if (!v?.length) throw new Error('Gemini returned an empty embedding');
    const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
    return v.map((x) => x / norm);
  }
}

/** Extract the first JSON object from free text (models sometimes wrap JSON in prose or code fences). */
export function extractJson(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('No JSON object found in model output');
  return JSON.parse(text.slice(start, end + 1));
}
