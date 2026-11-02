import { haversineKm } from '@kta/shared-types';
import { env } from './config';
import { log } from './shared';

export interface LatLng {
  lat: number;
  lng: number;
}
export interface Leg {
  distanceKm: number;
  durationMin: number;
  ghat: boolean;
  source: 'OSRM' | 'ESTIMATE';
}

// Approximate Western Ghats mountain-pass zones (centre + radius km). Heuristic, not survey data.
const GHAT_ZONES: { lat: number; lng: number; r: number }[] = [
  { lat: 12.95, lng: 75.65, r: 18 }, // Shiradi Ghat
  { lat: 13.01, lng: 75.53, r: 15 }, // Charmadi Ghat
  { lat: 13.5, lng: 75.09, r: 18 }, // Agumbe
  { lat: 12.44, lng: 75.62, r: 20 }, // Sampaje / Madikeri
  { lat: 13.39, lng: 75.72, r: 18 }, // Mullayanagiri / Baba Budangiri
];
const GHAT_SLOWDOWN = 1.3;

const inGhat = (p: LatLng) => GHAT_ZONES.some((z) => haversineKm(p, z) <= z.r);
const cache = new Map<string, Leg>();

export async function computeLeg(a: LatLng, b: LatLng): Promise<Leg> {
  const key = [a.lat, a.lng, b.lat, b.lng].map((n) => n.toFixed(4)).join(',');
  const hit = cache.get(key);
  if (hit) return hit;

  const mid = { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };
  const ghat = inGhat(a) || inGhat(b) || inGhat(mid);
  let leg: Leg;
  try {
    const res = await fetch(`${env.OSRM_URL}/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=false`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const data = (await res.json()) as { routes?: { distance: number; duration: number }[] };
    const route = data.routes?.[0];
    if (!route) throw new Error('no route');
    leg = { distanceKm: +(route.distance / 1000).toFixed(1), durationMin: Math.round((route.duration / 60) * (ghat ? GHAT_SLOWDOWN : 1)), ghat, source: 'OSRM' };
  } catch (err) {
    log.warn({ err: (err as Error).message }, 'OSRM unavailable; using straight-line estimate');
    const km = haversineKm(a, b) * 1.35;
    leg = { distanceKm: +km.toFixed(1), durationMin: Math.round((km / (ghat ? 28 : 45)) * 60), ghat, source: 'ESTIMATE' };
  }
  if (cache.size > 5000) cache.clear();
  cache.set(key, leg);
  return leg;
}
