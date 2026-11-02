import type { TripParams } from '@kta/shared-types';

export const SYSTEM_PROMPT =
  'You are an expert Karnataka (India) travel planner. Plan only real, currently operating places with accurate coordinates. ' +
  'Costs are realistic estimates in Indian Rupees (INR) for the whole group. Never invent opening hours, prices or rules; keep descriptions practical and brief. ' +
  'Respect dietary needs strictly, prefer indoor options for the monsoon (June-September) in the Western Ghats, and keep each day geographically coherent.';

const TIER_GUIDE = {
  BACKPACKER: 'Backpacker: dorms/budget stays, buses and shared transport, local eateries; roughly INR 1,500-3,000 per person per day.',
  MODERATE: 'Moderate: comfortable hotels/homestays, mix of trains and cabs, good restaurants; roughly INR 4,000-8,000 per person per day.',
  LUXURY: 'Luxury: premium resorts/heritage stays, private cabs, fine dining and curated experiences; INR 10,000+ per person per day.',
} as const;

const PACE_GUIDE = { RELAXED: '2 main activities per day', BALANCED: '3 main activities per day', FAST: '4-5 activities per day' } as const;

export function buildItineraryPrompt(p: TripParams, destinations: string[], numDays: number, context: string[], feedback?: string): string {
  return [
    `Create a ${numDays}-day Karnataka itinerary starting from ${p.origin}.`,
    `Dates: ${p.startDate} to ${p.endDate}. Travellers: ${p.travelers}.`,
    `Destinations to cover (in a sensible order): ${destinations.join(', ')}.`,
    `Budget tier - ${TIER_GUIDE[p.budgetTier]}`,
    `Pace: ${p.pace} (${PACE_GUIDE[p.pace]}). Dietary regime: ${p.dietary}.`,
    p.accessibility.length ? `Accessibility needs: ${p.accessibility.join(', ')}.` : '',
    p.interests ? `Interests: ${p.interests}.` : '',
    '',
    'Rules:',
    `- Produce exactly ${numDays} days, dayNumber 1..${numDays}. Day 1 starts with a TRANSIT activity from ${p.origin}.`,
    '- Each activity has startTime (24h HH:MM), durationMin, estCostInr for the whole group, category and whether it is indoor.',
    '- Include a FOOD activity for lunch each day matching the dietary regime, and a STAY activity at the end of each day except the last.',
    '- budget = sum of estimated costs by type (accommodation, food, transport, activities); total = sum of the four.',
    '- tips: 3-5 practical, season-aware tips.',
    '',
    'Verified local context (use it, do not contradict it):',
    ...context.map((c, i) => `[${i + 1}] ${c}`),
    feedback ? `\nYour previous answer was rejected: ${feedback}. Fix it.` : '',
  ].join('\n');
}
