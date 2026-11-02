/** JSON-schema subset accepted by Gemini `responseSchema` (structured output). */
const str = { type: 'STRING' } as const;
const num = { type: 'NUMBER' } as const;

const activity = {
  type: 'OBJECT',
  properties: {
    title: str,
    description: str,
    location: str,
    destination: str,
    lat: num,
    lng: num,
    startTime: str,
    durationMin: { type: 'INTEGER' },
    estCostInr: num,
    category: { type: 'STRING', enum: ['HERITAGE', 'NATURE', 'FOOD', 'CULTURE', 'TRANSIT', 'STAY', 'LEISURE', 'ADVENTURE'] },
    indoor: { type: 'BOOLEAN' },
  },
  required: ['title', 'description', 'location', 'destination', 'lat', 'lng', 'startTime', 'durationMin', 'estCostInr', 'category', 'indoor'],
};

export const GEMINI_DAY_SCHEMA = {
  type: 'OBJECT',
  properties: {
    dayNumber: { type: 'INTEGER' },
    theme: str,
    summary: str,
    activities: { type: 'ARRAY', items: activity },
  },
  required: ['dayNumber', 'theme', 'summary', 'activities'],
};

export const GEMINI_PLAN_SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: str,
    summary: str,
    days: { type: 'ARRAY', items: GEMINI_DAY_SCHEMA },
    budget: {
      type: 'OBJECT',
      properties: { accommodation: num, food: num, transport: num, activities: num, total: num },
      required: ['accommodation', 'food', 'transport', 'activities', 'total'],
    },
    tips: { type: 'ARRAY', items: str },
  },
  required: ['title', 'summary', 'days', 'budget', 'tips'],
};

export const GEMINI_REROUTE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    summary: str,
    changedDays: { type: 'ARRAY', items: GEMINI_DAY_SCHEMA },
  },
  required: ['summary', 'changedDays'],
};
