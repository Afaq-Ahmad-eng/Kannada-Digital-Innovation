import { z } from '@kta/service-kit';
import { KNOWLEDGE } from '@kta/shared-types';
import { env } from '../../config';
import { gemini } from '../../shared/gemini';
import { log } from '../../shared/logger';
import { ragRepository, Retrieved } from './rag.repository';

const GuideSchema = z.object({
  answer: z.string(),
  etiquetteTips: z.array(z.string()).default([]),
  phrases: z.array(z.object({ english: z.string(), kannada: z.string(), phonetic: z.string() })).default([]),
});

const GUIDE_JSON_SCHEMA = {
  type: 'OBJECT',
  properties: {
    answer: { type: 'STRING' },
    etiquetteTips: { type: 'ARRAY', items: { type: 'STRING' } },
    phrases: {
      type: 'ARRAY',
      items: { type: 'OBJECT', properties: { english: { type: 'STRING' }, kannada: { type: 'STRING' }, phonetic: { type: 'STRING' } }, required: ['english', 'kannada', 'phonetic'] },
    },
  },
  required: ['answer', 'etiquetteTips', 'phrases'],
};

export async function seedKnowledge(): Promise<void> {
  if (env.RESEED_KNOWLEDGE === 'true') await ragRepository.truncate();
  if ((await ragRepository.count()) > 0) return;
  log.info({ docs: KNOWLEDGE.length, llm: gemini.enabled }, 'seeding cultural knowledge base');
  for (const doc of KNOWLEDGE) await ragRepository.insert(doc, await gemini.embed(`${doc.title}. ${doc.content}`));
}

export const ragService = {
  async guide(query: string, topic?: string) {
    const hits: Retrieved[] = await ragRepository.search(await gemini.embed(query), 4, topic);
    const sources = hits.map((h) => ({ id: h.id, title: h.title, score: Number(h.score.toFixed(3)) }));
    if (!gemini.enabled || hits.length === 0) {
      return {
        mode: 'RETRIEVAL_ONLY' as const,
        answer: hits[0]?.content ?? 'No guidance found for that question yet.',
        etiquetteTips: hits.slice(1, 3).map((h) => h.content),
        phrases: [] as { english: string; kannada: string; phonetic: string }[],
        sources,
      };
    }
    const context = hits.map((h, i) => `[${i + 1}] ${h.title}: ${h.content}`).join('\n');
    const raw = await gemini.generateJson(
      `Traveller question: ${query}\n\nVerified context:\n${context}\n\n` +
        `Answer in 3-5 friendly sentences using ONLY the context. If the context does not cover something, say the traveller should check on-site notices. ` +
        `Add up to 4 short etiquetteTips and up to 4 useful Kannada phrases (Kannada script, plus phonetic Latin pronunciation).`,
      GUIDE_JSON_SCHEMA,
      { system: 'You are a warm, accurate cultural guide for visitors to Karnataka, India. Never invent rules or prices.', temperature: 0.3 },
    );
    return { mode: 'RAG' as const, ...GuideSchema.parse(raw), sources };
  },
};
