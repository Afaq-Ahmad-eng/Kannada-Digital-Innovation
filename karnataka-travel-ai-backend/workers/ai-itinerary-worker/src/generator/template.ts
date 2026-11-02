import { Activity, ActivityCategory, Day, findPlace, haversineKm, Plan, TripParams } from '@kta/shared-types';

interface Spot {
  title: string;
  description: string;
  location: string;
  lat: number;
  lng: number;
  durationMin: number;
  cost: number; // INR per person, moderate tier
  category: ActivityCategory;
  indoor: boolean;
}

// Offline template data. Coordinates are approximate.
const SPOTS: Record<string, Spot[]> = {
  Hampi: [
    { title: 'Virupaksha Temple and Hampi Bazaar', description: 'Living 7th-century temple and the old market street.', location: 'Hampi Bazaar', lat: 15.335, lng: 76.46, durationMin: 120, cost: 100, category: 'HERITAGE', indoor: false },
    { title: 'Vittala Temple and Stone Chariot', description: 'Iconic Vijayanagara complex with musical pillars.', location: 'Vittala Temple', lat: 15.3426, lng: 76.4753, durationMin: 150, cost: 600, category: 'HERITAGE', indoor: false },
    { title: 'Coracle ride on the Tungabhadra', description: 'Traditional round boat ride near the ruins.', location: 'Tungabhadra river', lat: 15.327, lng: 76.477, durationMin: 60, cost: 300, category: 'ADVENTURE', indoor: false },
  ],
  Badami: [
    { title: 'Badami Cave Temples', description: '6th-century Chalukyan rock-cut caves above Agastya Lake.', location: 'Badami', lat: 15.9199, lng: 75.6865, durationMin: 150, cost: 400, category: 'HERITAGE', indoor: false },
    { title: 'Agastya Lake and Bhutanatha Temples', description: 'Lakeside temples at sunset.', location: 'Badami', lat: 15.921, lng: 75.69, durationMin: 90, cost: 100, category: 'LEISURE', indoor: false },
  ],
  Pattadakal: [
    { title: 'Pattadakal Group of Monuments', description: 'UNESCO World Heritage temple complex.', location: 'Pattadakal', lat: 15.9486, lng: 75.817, durationMin: 120, cost: 500, category: 'HERITAGE', indoor: false },
    { title: 'Aihole temples', description: 'Early experimental temple architecture.', location: 'Aihole', lat: 15.9877, lng: 75.883, durationMin: 120, cost: 300, category: 'HERITAGE', indoor: false },
  ],
  Mysuru: [
    { title: 'Mysore Palace', description: 'The grand Wadiyar palace, lit on Sundays and festivals.', location: 'Mysuru', lat: 12.3052, lng: 76.6552, durationMin: 150, cost: 400, category: 'HERITAGE', indoor: true },
    { title: 'Chamundi Hills and Chamundeshwari Temple', description: 'Hilltop temple with city views; dress modestly.', location: 'Chamundi Hills', lat: 12.2724, lng: 76.67, durationMin: 120, cost: 150, category: 'CULTURE', indoor: false },
    { title: 'Devaraja Market and Mysore Pak tasting', description: 'Flowers, spices and the famous sweet.', location: 'Devaraja Market', lat: 12.3085, lng: 76.654, durationMin: 90, cost: 300, category: 'FOOD', indoor: true },
  ],
  'Belur-Halebidu': [
    { title: 'Chennakeshava Temple, Belur', description: 'Hoysala temple with soapstone carvings.', location: 'Belur', lat: 13.1651, lng: 75.8657, durationMin: 120, cost: 100, category: 'HERITAGE', indoor: true },
    { title: 'Hoysaleswara Temple, Halebidu', description: 'Star-shaped platform temple with detailed friezes.', location: 'Halebidu', lat: 13.2128, lng: 75.9944, durationMin: 120, cost: 100, category: 'HERITAGE', indoor: true },
  ],
  Coorg: [
    { title: 'Coffee estate walk', description: 'Guided walk through a Kodagu plantation.', location: 'Madikeri', lat: 12.4, lng: 75.75, durationMin: 120, cost: 500, category: 'NATURE', indoor: false },
    { title: 'Abbey Falls', description: 'Waterfall amid coffee and spice plantations.', location: 'Abbey Falls', lat: 12.4528, lng: 75.7176, durationMin: 90, cost: 100, category: 'NATURE', indoor: false },
    { title: "Raja's Seat sunset", description: 'Garden viewpoint over the valley.', location: 'Madikeri', lat: 12.4167, lng: 75.74, durationMin: 60, cost: 50, category: 'LEISURE', indoor: false },
  ],
  Chikmagalur: [
    { title: 'Mullayanagiri sunrise trek', description: "Karnataka's highest peak; start early.", location: 'Mullayanagiri', lat: 13.39, lng: 75.717, durationMin: 180, cost: 300, category: 'ADVENTURE', indoor: false },
    { title: 'Coffee plantation tour', description: 'From bean to cup at an estate.', location: 'Chikmagalur', lat: 13.3161, lng: 75.772, durationMin: 120, cost: 500, category: 'NATURE', indoor: false },
  ],
  Agumbe: [
    { title: 'Agumbe sunset point', description: 'Western Ghats sunset over the Arabian Sea.', location: 'Agumbe', lat: 13.5036, lng: 75.0911, durationMin: 90, cost: 0, category: 'NATURE', indoor: false },
    { title: 'Onake Abbi Falls', description: 'Rainforest waterfall; trails slippery in monsoon.', location: 'Agumbe', lat: 13.511, lng: 75.095, durationMin: 150, cost: 100, category: 'NATURE', indoor: false },
  ],
  Gokarna: [
    { title: 'Mahabaleshwar Temple', description: 'Pilgrim temple in the town centre.', location: 'Gokarna', lat: 14.541, lng: 74.3184, durationMin: 60, cost: 0, category: 'CULTURE', indoor: true },
    { title: 'Kudle and Om beach hike', description: 'Coastal trail between quiet beaches.', location: 'Gokarna', lat: 14.5253, lng: 74.316, durationMin: 180, cost: 100, category: 'LEISURE', indoor: false },
  ],
  Murudeshwar: [
    { title: 'Murudeshwar Temple and Shiva statue', description: 'Tall Shiva statue and Raja Gopura with lift.', location: 'Murudeshwar', lat: 14.094, lng: 74.485, durationMin: 120, cost: 150, category: 'CULTURE', indoor: false },
    { title: 'Murudeshwar beach', description: 'Beach beside the temple.', location: 'Murudeshwar', lat: 14.0925, lng: 74.484, durationMin: 90, cost: 0, category: 'LEISURE', indoor: false },
  ],
  Udupi: [
    { title: 'Sri Krishna Matha', description: 'Temple town centre; sattvic meals nearby.', location: 'Udupi', lat: 13.3414, lng: 74.7519, durationMin: 90, cost: 0, category: 'CULTURE', indoor: true },
    { title: 'Malpe Beach', description: 'Wide beach with sea views.', location: 'Malpe', lat: 13.379, lng: 74.701, durationMin: 120, cost: 150, category: 'LEISURE', indoor: false },
  ],
};

const FOOD: Record<string, { veg: string; non: string }> = {
  Hampi: { veg: 'South Indian thali at a Hampi cafe', non: 'Local meals at a riverside cafe' },
  Mysuru: { veg: 'Masala dosa and filter coffee', non: 'Mysuru meals at a local restaurant' },
  Coorg: { veg: 'Akki otti and kadambuttu with vegetable curry', non: 'Kodava pandi curry with akki otti' },
  Gokarna: { veg: 'Beach cafe vegetarian thali', non: 'Fresh fish thali at a beach shack' },
  Udupi: { veg: 'Udupi sattvic meal', non: 'Coastal fish thali' },
  Murudeshwar: { veg: 'Udupi-style vegetarian meal', non: 'Coastal seafood meal' },
};
const VEG = new Set(['VEGETARIAN', 'SATTVIC', 'JAIN', 'COASTAL_VEGETARIAN']);
const MULT = { BACKPACKER: 0.6, MODERATE: 1, LUXURY: 1.8 } as const;
const STAY_RATE = { BACKPACKER: 900, MODERATE: 3200, LUXURY: 9500 } as const;
const KM_RATE = { BACKPACKER: 1.8, MODERATE: 4.5, LUXURY: 11 } as const;

const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const round10 = (n: number) => Math.round(n / 10) * 10;

/** Deterministic offline plan used when GEMINI_API_KEY is absent or the LLM fails. Clearly labelled source=TEMPLATE. */
export function buildTemplatePlan(p: TripParams, destinations: string[], numDays: number): Plan {
  const perDay = { RELAXED: 2, BALANCED: 3, FAST: 4 }[p.pace];
  const veg = VEG.has(p.dietary);
  const rooms = Math.ceil(p.travelers / 2);
  const cursor: Record<string, number> = {};
  let prev = findPlace(p.origin) ?? { name: p.origin, lat: 12.9716, lng: 77.5946 };
  const totals = { accommodation: 0, food: 0, transport: 0, activities: 0 };
  const days: Day[] = [];

  for (let d = 1; d <= numDays; d++) {
    const dest = destinations[Math.min(destinations.length - 1, Math.floor(((d - 1) * destinations.length) / numDays))];
    const place = findPlace(dest) ?? { name: dest, lat: 15.3173, lng: 75.7139 };
    const spots = SPOTS[dest] ?? [{ title: `Explore ${dest}`, description: 'Free exploration of the town and local sights.', location: dest, lat: place.lat, lng: place.lng, durationMin: 180, cost: 200, category: 'LEISURE' as const, indoor: false }];
    const acts: Activity[] = [];
    let clock = 9 * 60;

    if (prev.name.toLowerCase() !== dest.toLowerCase()) {
      const km = Math.round(haversineKm(prev, place) * 1.35);
      const dur = Math.round((km / 45) * 60);
      const cost = round10(km * KM_RATE[p.budgetTier] * p.travelers);
      clock = Math.max(6 * 60, 9 * 60 - dur);
      acts.push({ title: `Travel from ${prev.name} to ${dest}`, description: `About ${km} km by road (estimate).`, location: prev.name, destination: dest, lat: prev.lat, lng: prev.lng, startTime: hhmm(clock), durationMin: Math.max(30, dur), estCostInr: cost, category: 'TRANSIT', indoor: true });
      totals.transport += cost;
      clock += Math.max(30, dur) + 30;
    }

    for (let i = 0; i < perDay; i++) {
      const s = spots[(cursor[dest] = (cursor[dest] ?? -1) + 1) % spots.length];
      const cost = round10(s.cost * MULT[p.budgetTier] * p.travelers);
      acts.push({ title: s.title, description: s.description, location: s.location, destination: dest, lat: s.lat, lng: s.lng, startTime: hhmm(Math.min(clock, 18 * 60)), durationMin: s.durationMin, estCostInr: cost, category: s.category, indoor: s.indoor });
      totals.activities += cost;
      clock += s.durationMin + 30;
      if (i === 0 && clock < 13 * 60) {
        const f = FOOD[dest] ?? { veg: 'Local vegetarian meal', non: 'Local meal' };
        const fc = round10(250 * MULT[p.budgetTier] * p.travelers);
        acts.push({ title: veg ? f.veg : f.non, description: 'Lunch at a well-reviewed local eatery.', location: dest, destination: dest, lat: s.lat, lng: s.lng, startTime: '13:00', durationMin: 60, estCostInr: fc, category: 'FOOD', indoor: true });
        totals.food += fc;
        clock = Math.max(clock, 14 * 60);
      }
    }
    if (!acts.some((a) => a.category === 'FOOD')) {
      const fc = round10(250 * MULT[p.budgetTier] * p.travelers);
      acts.push({ title: 'Dinner at a local restaurant', description: 'Regional specialities.', location: dest, destination: dest, lat: place.lat, lng: place.lng, startTime: '19:30', durationMin: 75, estCostInr: fc, category: 'FOOD', indoor: true });
      totals.food += fc;
    }
    if (d < numDays) {
      const sc = round10(STAY_RATE[p.budgetTier] * rooms);
      acts.push({ title: `Overnight stay in ${dest}`, description: `${p.budgetTier.toLowerCase()} stay (estimate per room-night).`, location: dest, destination: dest, lat: place.lat, lng: place.lng, startTime: '21:00', durationMin: 600, estCostInr: sc, category: 'STAY', indoor: true });
      totals.accommodation += sc;
    }
    acts.sort((a, b) => a.startTime.localeCompare(b.startTime));
    days.push({ dayNumber: d, theme: `${dest} highlights`, summary: `A ${p.pace.toLowerCase()} day in ${dest}.`, activities: acts });
    prev = { name: dest, lat: place.lat, lng: place.lng };
  }

  const month = Number(p.startDate.slice(5, 7));
  const tips = [
    'This is an offline template plan with estimated costs; add GEMINI_API_KEY to get a fully AI-personalised itinerary.',
    month >= 6 && month <= 9 ? 'Monsoon season: check Western Ghats road conditions each morning and keep a buffer day.' : 'Start early at heritage sites to avoid midday heat.',
    veg ? 'Vegetarian meals are widely available; confirm Jain or sattvic needs at restaurants in advance.' : 'Try regional specialities, but choose busy places for fresh seafood.',
  ];
  const total = totals.accommodation + totals.food + totals.transport + totals.activities;
  return { title: `${numDays}-day Karnataka trip: ${destinations.join(' to ')}`, summary: `${p.pace.toLowerCase()} ${p.budgetTier.toLowerCase()} itinerary from ${p.origin}.`, days, budget: { ...totals, total }, tips };
}
