import { createHash } from 'crypto';
import { extractJson, z } from '@kta/service-kit';
import { Topics } from '@kta/kafka-events';
import { DESTINATIONS } from '@kta/shared-types';
import { redis } from '../../database';
import { bus } from '../../shared/bus';
import { gemini } from '../../shared/gemini';
import { log } from '../../shared/logger';
import { dispatchService } from '../dispatch/dispatch.service';
import { monitoringRepository } from './monitoring.repository';

const AssessmentSchema = z.object({
  severity: z.enum(['NONE', 'LOW', 'HIGH', 'CRITICAL']),
  category: z.string().default('OTHER'),
  headline: z.string().default(''),
  details: z.string().default(''),
});
export type Assessment = z.infer<typeof AssessmentSchema> & { sources: { title: string; uri: string }[] };

const REGION_HINTS: Record<string, string> = {
  Coorg: 'Kodagu: Sampaje, Makutta and Madikeri ghat roads',
  Chikmagalur: 'Charmadi Ghat and Baba Budangiri roads',
  Agumbe: 'Agumbe ghat road and Shiradi Ghat on NH-75',
  Udupi: 'Agumbe and Karkala approach roads',
  Gokarna: 'coastal NH-66 and Gokarna beach access',
  Murudeshwar: 'coastal NH-66',
};

const regionLabel = (name: string) => DESTINATIONS.find((d) => d.name === name)?.region ?? name;

/** Ask Gemini with Google Search grounding for verified, current conditions in a region. */
export async function assessRegion(destination: string): Promise<Assessment> {
  const cacheKey = `scan:${destination}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached) as Assessment;

  let result: Assessment = { severity: 'NONE', category: 'OTHER', headline: '', details: '', sources: [] };
  if (gemini.enabled) {
    const today = new Date().toISOString().slice(0, 10);
    const hint = REGION_HINTS[destination] ? ` Also check: ${REGION_HINTS[destination]}.` : '';
    try {
      const g = await gemini.generateGrounded(
        `Today is ${today}. Using Google Search, check ONLY current, verified information for ${regionLabel(destination)}, Karnataka, India: ` +
          `road blockages or landslides on ghat roads, heavy-rain / flood warnings (IMD orange or red alerts), and bandh, strike or curfew affecting tourists today or in the next 48 hours.${hint} ` +
          `If nothing significant is reported by credible sources, answer severity NONE. ` +
          `Respond with ONLY a JSON object: {"severity":"NONE|LOW|HIGH|CRITICAL","category":"WEATHER|ROAD|BANDH|OTHER","headline":"<=100 chars","details":"2 short sentences"}.`,
        { system: 'You are a cautious travel-safety analyst. Never speculate. Prefer official sources (IMD, district administration, NHAI, state police).' },
      );
      const parsed = AssessmentSchema.safeParse(extractJson(g.text));
      if (parsed.success) result = { ...parsed.data, sources: g.sources };
      else log.warn({ destination, issues: parsed.error.issues }, 'unparseable assessment treated as NONE');
    } catch (err) {
      log.error({ err, destination }, 'region assessment failed');
    }
  }
  await redis.set(cacheKey, JSON.stringify(result), 'EX', 30 * 60);
  return result;
}

export interface RaiseInput {
  tripId: string;
  userId: string;
  region: string;
  severity: 'HIGH' | 'CRITICAL';
  category: string;
  headline: string;
  details: string;
  sources?: { title: string; uri: string }[];
}

/** Persist + emit ItineraryDisrupted + notify. Deduplicated per trip/region/headline for 6 hours. */
export async function raiseDisruption(i: RaiseInput): Promise<boolean> {
  const fingerprint = createHash('sha1').update(`${i.tripId}|${i.region}|${i.headline}`).digest('hex');
  const fresh = await redis.set(`alerted:${fingerprint}`, '1', 'EX', 6 * 3600, 'NX');
  if (!fresh) return false;
  const sources = i.sources ?? [];
  await monitoringRepository.saveAlert({ ...i, sources });
  await bus.publish(
    Topics.ItineraryDisrupted,
    { tripId: i.tripId, userId: i.userId, region: i.region, severity: i.severity, category: i.category, headline: i.headline, details: i.details, detectedAt: new Date().toISOString(), sources },
    i.tripId,
  );
  await dispatchService
    .notifyUser(i.userId, `Travel alert: ${i.headline}`, `${i.details}\n\nOpen your itinerary to review suggested alternatives.`)
    .catch((err) => log.error({ err }, 'notification dispatch failed'));
  return true;
}

export async function runScan(): Promise<{ trips: number; regions: number; disruptions: number }> {
  const trips = await monitoringRepository.tripsToScan();
  const regions = [...new Set(trips.flatMap((t) => t.regions))];
  const assessments = new Map<string, Assessment>();
  for (const r of regions) assessments.set(r, await assessRegion(r));

  let disruptions = 0;
  for (const t of trips) {
    for (const region of t.regions) {
      const a = assessments.get(region);
      if (!a || (a.severity !== 'HIGH' && a.severity !== 'CRITICAL')) continue;
      const raised = await raiseDisruption({
        tripId: t.tripId, userId: t.userId, region, severity: a.severity, category: a.category,
        headline: a.headline || `Disruption reported in ${region}`, details: a.details, sources: a.sources,
      });
      if (raised) disruptions++;
    }
  }
  log.info({ trips: trips.length, regions: regions.length, disruptions }, 'scan complete');
  return { trips: trips.length, regions: regions.length, disruptions };
}
