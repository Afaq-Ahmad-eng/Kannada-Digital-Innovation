import type { Activity, Day } from '@kta/shared-types';

interface Alt {
  title: string;
  description: string;
  location: string;
  destination: string;
  lat: number;
  lng: number;
  category: Activity['category'];
  cost: number;
}

/** Offline fallback: weather/road-proof indoor alternatives. Coordinates are approximate. */
const INDOOR_ALTERNATIVES: Record<string, Alt[]> = {
  Coorg: [
    { title: 'Omkareshwara Temple, Madikeri', description: 'Historic temple in Madikeri with a quiet tank, easy to visit in rain.', location: 'Madikeri', destination: 'Coorg', lat: 12.4198, lng: 75.7405, category: 'CULTURE', cost: 0 },
    { title: 'Madikeri Fort and museum', description: 'Fort complex with a small museum on Kodagu history.', location: 'Madikeri', destination: 'Coorg', lat: 12.4208, lng: 75.739, category: 'HERITAGE', cost: 50 },
  ],
  Chikmagalur: [
    { title: 'Chennakeshava Temple, Belur', description: 'Hoysala masterpiece with intricate soapstone carving.', location: 'Belur', destination: 'Belur-Halebidu', lat: 13.1651, lng: 75.8657, category: 'HERITAGE', cost: 0 },
    { title: 'Hoysaleswara Temple, Halebidu', description: 'Twin-shrine Hoysala temple with detailed friezes.', location: 'Halebidu', destination: 'Belur-Halebidu', lat: 13.2128, lng: 75.9944, category: 'HERITAGE', cost: 0 },
  ],
  Agumbe: [
    { title: 'Sri Krishna Matha, Udupi', description: 'Temple town experience with sattvic meals nearby.', location: 'Udupi', destination: 'Udupi', lat: 13.3414, lng: 74.7519, category: 'CULTURE', cost: 0 },
    { title: 'Anantheshwara Temple, Udupi', description: 'Ancient temple close to Krishna Matha.', location: 'Udupi', destination: 'Udupi', lat: 13.3409, lng: 74.7517, category: 'CULTURE', cost: 0 },
  ],
  Gokarna: [{ title: 'Mahabaleshwar Temple, Gokarna', description: 'Pilgrim temple in town, unaffected by beach conditions.', location: 'Gokarna', destination: 'Gokarna', lat: 14.541, lng: 74.3184, category: 'CULTURE', cost: 0 }],
  Murudeshwar: [{ title: 'Murudeshwar Temple and Raja Gopura', description: 'Temple complex with lift views from the gopura.', location: 'Murudeshwar', destination: 'Murudeshwar', lat: 14.094, lng: 74.485, category: 'CULTURE', cost: 100 }],
  Hampi: [{ title: 'Archaeological Museum, Kamalapura', description: 'Indoor museum of Vijayanagara sculpture and artefacts.', location: 'Kamalapura', destination: 'Hampi', lat: 15.309, lng: 76.4643, category: 'HERITAGE', cost: 30 }],
  Badami: [{ title: 'Archaeological Museum, Badami', description: 'Chalukyan sculptures displayed indoors.', location: 'Badami', destination: 'Badami', lat: 15.9187, lng: 75.6788, category: 'HERITAGE', cost: 25 }],
};
const GENERIC: Alt = { title: 'Mysore Palace', description: 'Large indoor palace visit; reachable by road from most of southern Karnataka.', location: 'Mysuru', destination: 'Mysuru', lat: 12.3052, lng: 76.6552, category: 'HERITAGE', cost: 120 };

export function templateReroute(days: Day[], affected: Map<number, Set<number>>, region: string): Day[] {
  const pool = INDOOR_ALTERNATIVES[region] ?? [GENERIC];
  let n = 0;
  return days
    .filter((d) => affected.has(d.dayNumber))
    .map((d) => ({
      ...d,
      theme: `${d.theme} (weather-safe plan)`,
      activities: d.activities.map((a, idx) => {
        if (!affected.get(d.dayNumber)!.has(idx)) return a;
        const alt = pool[n++ % pool.length];
        return {
          ...a, title: alt.title, description: alt.description, location: alt.location, destination: alt.destination,
          lat: alt.lat, lng: alt.lng, category: alt.category, indoor: true, estCostInr: alt.cost,
          legDistanceKm: null, legDurationMin: null, ghat: null,
        };
      }),
    }));
}
