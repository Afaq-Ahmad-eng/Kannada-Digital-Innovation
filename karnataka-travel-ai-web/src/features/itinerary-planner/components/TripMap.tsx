import { useEffect } from 'react';
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { KARNATAKA_CENTER, placeByName } from '../../../utils/karnataka';
import type { Day } from '../types';

export interface MapAlert { id: string; region: string; headline: string }

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  const key = JSON.stringify(points);
  useEffect(() => {
    if (points.length > 1) map.fitBounds(points, { padding: [36, 36], maxZoom: 12 });
    else if (points.length === 1) map.setView(points[0], 11);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}

/** Daily waypoints and routes (OpenStreetMap tiles) with real-time alert markers. */
export function TripMap({ days, activeDay, alerts }: { days: Day[]; activeDay: number; alerts: MapAlert[] }) {
  const active = days.find((d) => d.dayNumber === activeDay) ?? days[0];
  const activePoints = (active?.activities ?? []).map((a) => [a.lat, a.lng] as [number, number]);
  const alertPlaces = alerts.map((a) => ({ ...a, place: placeByName(a.region) })).filter((a) => a.place);
  const fitPoints = [...activePoints, ...alertPlaces.map((a) => [a.place!.lat, a.place!.lng] as [number, number])];

  return (
    <MapContainer center={KARNATAKA_CENTER} zoom={7} scrollWheelZoom={false} className="h-72 w-full lg:h-96" aria-label="Trip map">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {days.filter((d) => d.dayNumber !== active?.dayNumber).map((d) => (
        <Polyline key={d.dayNumber} positions={d.activities.map((a) => [a.lat, a.lng] as [number, number])} pathOptions={{ color: '#33a37f', weight: 3, opacity: 0.35 }} />
      ))}
      {activePoints.length > 1 && <Polyline positions={activePoints} pathOptions={{ color: '#a8650d', weight: 4 }} />}
      {(active?.activities ?? []).map((a, i) => (
        <CircleMarker key={a.id} center={[a.lat, a.lng]} radius={8} pathOptions={{ color: '#fff', weight: 2, fillColor: '#a8650d', fillOpacity: 1 }}>
          <Tooltip>{i + 1}. {a.title}</Tooltip>
        </CircleMarker>
      ))}
      {alertPlaces.map((a) => (
        <CircleMarker key={a.id} center={[a.place!.lat, a.place!.lng]} radius={16} pathOptions={{ color: '#b3261e', weight: 3, fillColor: '#b3261e', fillOpacity: 0.25 }}>
          <Tooltip>{a.headline}</Tooltip>
        </CircleMarker>
      ))}
      <FitBounds points={fitPoints} />
    </MapContainer>
  );
}
