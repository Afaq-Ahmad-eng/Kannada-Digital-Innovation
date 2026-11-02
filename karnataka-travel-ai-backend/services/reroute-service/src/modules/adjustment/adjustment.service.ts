import { randomUUID } from 'crypto';
import { AppError, conflict, notFound, z } from '@kta/service-kit';
import { Payload, Topics } from '@kta/kafka-events';
import { DaySchema, GEMINI_REROUTE_SCHEMA, Day } from '@kta/shared-types';
import { bus } from '../../shared/bus';
import { gemini } from '../../shared/gemini';
import { log } from '../../shared/logger';
import { templateReroute } from './alternatives';
import { adjustmentRepository } from './adjustment.repository';

const RerouteSchema = z.object({ summary: z.string(), changedDays: z.array(DaySchema).min(1) });

/** Which activity slots does this disruption affect? */
function findAffected(days: Day[], d: Payload<'itinerary.disrupted'>): Map<number, Set<number>> {
  const out = new Map<number, Set<number>>();
  for (const day of days) {
    day.activities.forEach((a, idx) => {
      const inRegion = a.destination.toLowerCase() === d.region.toLowerCase();
      const outdoorOnly = d.category === 'WEATHER';
      if (inRegion && a.category !== 'STAY' && a.category !== 'FOOD' && (!outdoorOnly || !a.indoor)) {
        if (!out.has(day.dayNumber)) out.set(day.dayNumber, new Set());
        out.get(day.dayNumber)!.add(idx);
      }
    });
  }
  return out;
}

async function proposeWithLlm(days: Day[], affected: Map<number, Set<number>>, d: Payload<'itinerary.disrupted'>) {
  const affectedDays = days.filter((x) => affected.has(x.dayNumber));
  const slots = affectedDays.map((x) => ({ dayNumber: x.dayNumber, affectedActivityIndexes: [...affected.get(x.dayNumber)!] }));
  const prompt =
    `A traveller's Karnataka itinerary is disrupted.\nDisruption: ${d.severity} ${d.category} in ${d.region}: ${d.headline}. ${d.details}\n\n` +
    `Current plan for the affected days (JSON):\n${JSON.stringify(affectedDays)}\n\nAffected slots (0-based activity indexes): ${JSON.stringify(slots)}\n\n` +
    `Return the FULL replacement for each affected day (changedDays). Replace only the affected activities with safe alternatives: prefer indoor heritage temples, museums, craft centres or food experiences ` +
    `in the same or a neighbouring town reachable by a road NOT affected by the disruption (for example Agumbe waterfalls -> temples and crafts in Udupi). ` +
    `Keep unaffected activities exactly as they are, keep similar start times and costs, use real places with accurate coordinates, set indoor correctly, and keep dayNumber values.`;
  const raw = await gemini.generateJson(prompt, GEMINI_REROUTE_SCHEMA, { system: 'You are a careful Karnataka travel re-planner. Safety first.', temperature: 0.3 });
  return RerouteSchema.parse(raw);
}

export const adjustmentService = {
  async handleDisruption(d: Payload<'itinerary.disrupted'>): Promise<void> {
    const snap = await adjustmentRepository.getSnapshot(d.tripId);
    if (!snap) return log.warn({ tripId: d.tripId }, 'disruption for unknown trip snapshot');
    const affected = findAffected(snap.plan.days, d);
    if (affected.size === 0) return log.info({ tripId: d.tripId, region: d.region }, 'no affected slots; no proposal needed');

    let proposal: { summary: string; changedDays: Day[] };
    try {
      if (!gemini.enabled) throw new Error('llm disabled');
      proposal = await proposeWithLlm(snap.plan.days, affected, d);
    } catch (err) {
      if (gemini.enabled) log.warn({ err }, 'LLM reroute failed; using template alternatives');
      const changedDays = templateReroute(snap.plan.days, affected, d.region);
      proposal = { summary: `Swap affected ${d.region} activities for indoor alternatives while "${d.headline}" is in effect.`, changedDays };
    }
    const proposalId = randomUUID();
    await adjustmentRepository.createProposal({ id: proposalId, tripId: d.tripId, userId: d.userId, region: d.region, reason: d.headline, summary: proposal.summary, changedDays: proposal.changedDays });
    await bus.publish(Topics.RerouteProposed, { tripId: d.tripId, userId: d.userId, proposalId, summary: proposal.summary, reason: d.headline, changedDays: proposal.changedDays }, d.tripId);
  },

  async alternatives(tripId: string, userId: string) {
    const snap = await adjustmentRepository.getSnapshot(tripId);
    if (!snap || snap.userId !== userId) throw notFound('Trip not found');
    return adjustmentRepository.openProposals(tripId);
  },

  /** Accept or dismiss a proposal. Accepting emits ItineraryRerouted; the itinerary service applies it and pushes the delta over SSE. */
  async modify(userId: string, tripId: string, proposalId: string, action: 'ACCEPT' | 'DISMISS') {
    const p = await adjustmentRepository.getProposal(proposalId);
    if (!p || p.tripId !== tripId || p.userId !== userId) throw notFound('Proposal not found');
    if (p.status !== 'PROPOSED') throw conflict(`Proposal already ${p.status.toLowerCase()}`);
    if (!(await adjustmentRepository.setStatus(proposalId, action === 'ACCEPT' ? 'ACCEPTED' : 'DISMISSED'))) throw conflict('Proposal is no longer open');
    if (action === 'ACCEPT') {
      try {
        await bus.publish(Topics.ItineraryRerouted, { tripId, userId, proposalId, reason: p.reason, origin: 'REROUTE', changedDays: p.changedDays }, tripId);
      } catch (err) {
        throw new AppError(503, 'Could not apply the change right now. Please retry.', 'EVENT_BUS_UNAVAILABLE', { cause: (err as Error).message });
      }
    }
    return { status: action === 'ACCEPT' ? 'ACCEPTED' : 'DISMISSED', proposalId };
  },
};
