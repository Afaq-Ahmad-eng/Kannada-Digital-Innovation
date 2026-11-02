import type { DestinationCluster, TripParams } from './schemas';

export interface Destination {
  name: string;
  cluster: DestinationCluster;
  lat: number;
  lng: number;
  /** Human-readable region used in alert / disruption queries. */
  region: string;
}

// Coordinates are approximate town-level centroids.
export const DESTINATIONS: Destination[] = [
  { name: 'Hampi', cluster: 'HERITAGE', lat: 15.335, lng: 76.462, region: 'Hampi, Vijayanagara district' },
  { name: 'Badami', cluster: 'HERITAGE', lat: 15.9149, lng: 75.6768, region: 'Badami, Bagalkot district' },
  { name: 'Pattadakal', cluster: 'HERITAGE', lat: 15.9486, lng: 75.817, region: 'Pattadakal, Bagalkot district' },
  { name: 'Mysuru', cluster: 'HERITAGE', lat: 12.2958, lng: 76.6394, region: 'Mysuru' },
  { name: 'Belur-Halebidu', cluster: 'HERITAGE', lat: 13.165, lng: 75.865, region: 'Belur and Halebidu, Hassan district' },
  { name: 'Coorg', cluster: 'NATURE', lat: 12.4244, lng: 75.7382, region: 'Kodagu (Coorg)' },
  { name: 'Chikmagalur', cluster: 'NATURE', lat: 13.3161, lng: 75.772, region: 'Chikkamagaluru' },
  { name: 'Agumbe', cluster: 'NATURE', lat: 13.5013, lng: 75.0916, region: 'Agumbe, Shivamogga district' },
  { name: 'Gokarna', cluster: 'COASTAL', lat: 14.5479, lng: 74.3188, region: 'Gokarna, Uttara Kannada' },
  { name: 'Murudeshwar', cluster: 'COASTAL', lat: 14.094, lng: 74.4849, region: 'Murudeshwar, Uttara Kannada' },
  { name: 'Udupi', cluster: 'COASTAL', lat: 13.3409, lng: 74.7421, region: 'Udupi' },
];

export const ORIGINS: { name: string; lat: number; lng: number }[] = [
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { name: 'Mangaluru', lat: 12.9141, lng: 74.856 },
  { name: 'Hubballi', lat: 15.3647, lng: 75.124 },
  { name: 'Mysuru', lat: 12.2958, lng: 76.6394 },
  { name: 'Belagavi', lat: 15.8497, lng: 74.4977 },
];

export function findPlace(name: string): { name: string; lat: number; lng: number } | undefined {
  const n = name.trim().toLowerCase();
  return DESTINATIONS.find((d) => d.name.toLowerCase() === n) ?? ORIGINS.find((o) => o.name.toLowerCase() === n);
}

export function daysBetween(start: string, end: string): number {
  return Math.floor((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000) + 1;
}

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Explicit destinations win; otherwise interleave the selected clusters, capped by trip length (max 5). */
export function resolveDestinations(p: Pick<TripParams, 'clusters' | 'destinations' | 'startDate' | 'endDate'>): string[] {
  if (p.destinations.length > 0) return [...new Set(p.destinations)];
  const limit = Math.min(5, Math.max(1, daysBetween(p.startDate, p.endDate)));
  const lists = p.clusters.map((c) => DESTINATIONS.filter((d) => d.cluster === c).map((d) => d.name));
  const out: string[] = [];
  for (let i = 0; out.length < limit && lists.some((l) => i < l.length); i++) {
    for (const l of lists) if (i < l.length && out.length < limit) out.push(l[i]);
  }
  return out;
}
