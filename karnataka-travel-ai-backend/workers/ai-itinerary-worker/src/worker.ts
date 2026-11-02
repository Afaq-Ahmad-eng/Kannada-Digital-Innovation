import { randomUUID } from 'crypto';
import { Payload, Topics } from '@kta/kafka-events';
import { jobsProcessed } from '@kta/service-kit';
import { daysBetween, GEMINI_PLAN_SCHEMA, Plan, PlanSchema, PlanSource, resolveDestinations, TripParams } from '@kta/shared-types';
import { semanticCache } from './cache/semantic-cache';
import { env } from './config';
import { buildTemplatePlan } from './generator/template';
import { buildItineraryPrompt, SYSTEM_PROMPT } from './prompts/itinerary.prompt';
import { initRag, retrieveContext } from './rag/retriever';
import { bus, gemini, log } from './shared';

function paramsToText(p: TripParams, destinations: string[], numDays: number): string {
  return `Trip to ${destinations.join(', ')} for ${numDays} days. Budget ${p.budgetTier}. Pace ${p.pace}. Diet ${p.dietary}. Travellers ${p.travelers}. ` +
    `Accessibility: ${p.accessibility.join(', ') || 'none'}. Interests: ${p.interests ?? 'general sightseeing'}.`;
}

/** Hard constraints must match exactly before cosine similarity is even considered. */
const bucketOf = (p: TripParams, destinations: string[], numDays: number) =>
  [p.origin, [...destinations].sort().join('+'), numDays, p.budgetTier, p.pace, p.dietary, p.travelers].join(':').toLowerCase().replace(/\s+/g, '-');

async function generateWithLlm(p: TripParams, destinations: string[], numDays: number, context: string[]): Promise<Plan> {
  let feedback: string | undefined;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const raw = await gemini.generateJson(buildItineraryPrompt(p, destinations, numDays, context, feedback), GEMINI_PLAN_SCHEMA, { system: SYSTEM_PROMPT, temperature: 0.5 });
    const parsed = PlanSchema.safeParse(raw);
    if (parsed.success && parsed.data.days.length === numDays) {
      const plan = parsed.data;
      plan.days = plan.days.map((d, i) => ({ ...d, dayNumber: i + 1, activities: [...d.activities].sort((a, b) => a.startTime.localeCompare(b.startTime)) }));
      const b = plan.budget;
      plan.budget = { ...b, total: b.accommodation + b.food + b.transport + b.activities };
      return plan;
    }
    feedback = parsed.success ? `expected ${numDays} days but got ${parsed.data.days.length}` : JSON.stringify(parsed.error.issues.slice(0, 3));
    log.warn({ attempt, feedback }, 'LLM plan rejected');
  }
  throw new Error('LLM did not produce a valid plan');
}

async function handleTrip({ tripId, userId, params }: Payload<'trip.requested'>): Promise<void> {
  const progress = (percent: number, message: string, stage = 'GENERATING') =>
    bus.publish(Topics.ItineraryProgress, { tripId, userId, stage, percent, message }, tripId);
  try {
    const numDays = daysBetween(params.startDate, params.endDate);
    const destinations = resolveDestinations(params);
    await progress(10, 'Scanning Western Ghats weather and seasonal conditions...');

    const embedding = await gemini.embed(paramsToText(params, destinations, numDays));
    const bucket = bucketOf(params, destinations, numDays);
    const hit = await semanticCache.lookup(bucket, embedding);
    if (hit) {
      await progress(85, 'Found a verified plan for a very similar trip...');
      await bus.publish(Topics.ItineraryGenerated, { tripId, userId, plan: hit.plan, source: 'CACHE' }, tripId);
      jobsProcessed.inc({ worker: 'ai-itinerary', outcome: 'cache_hit' });
      return;
    }

    await progress(35, `Finding verified stays and sights in ${destinations[0]}...`);
    const context = await retrieveContext(embedding, destinations);
    await progress(55, 'Composing your day-by-day itinerary...');

    let plan: Plan;
    let source: PlanSource = 'LLM';
    if (gemini.enabled) {
      try {
        plan = await generateWithLlm(params, destinations, numDays, context);
        await semanticCache.store(bucket, randomUUID(), embedding, plan);
      } catch (err) {
        log.error({ err, tripId }, 'LLM generation failed; falling back to template plan');
        plan = buildTemplatePlan(params, destinations, numDays);
        source = 'TEMPLATE';
      }
    } else {
      plan = buildTemplatePlan(params, destinations, numDays);
      source = 'TEMPLATE';
    }
    await progress(90, 'Balancing your budget...');
    await bus.publish(Topics.ItineraryGenerated, { tripId, userId, plan, source }, tripId);
    jobsProcessed.inc({ worker: 'ai-itinerary', outcome: source.toLowerCase() });
  } catch (err) {
    log.error({ err, tripId }, 'trip generation failed');
    jobsProcessed.inc({ worker: 'ai-itinerary', outcome: 'failed' });
    await progress(100, 'We could not generate this itinerary. Please try again.', 'FAILED').catch(() => undefined);
  }
}

export async function startWorker(): Promise<void> {
  await initRag();
  await bus.subscribe('ai-itinerary-worker', { [Topics.TripRequested]: handleTrip }, { concurrency: env.WORKER_CONCURRENCY });
}
