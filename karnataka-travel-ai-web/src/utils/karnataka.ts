export type Cluster = 'HERITAGE' | 'NATURE' | 'COASTAL';

export interface Place { name: string; cluster?: Cluster; lat: number; lng: number }

export const DESTINATIONS: Place[] = [
  { name: 'Hampi', cluster: 'HERITAGE', lat: 15.335, lng: 76.462 },
  { name: 'Badami', cluster: 'HERITAGE', lat: 15.9149, lng: 75.6768 },
  { name: 'Pattadakal', cluster: 'HERITAGE', lat: 15.9486, lng: 75.817 },
  { name: 'Mysuru', cluster: 'HERITAGE', lat: 12.2958, lng: 76.6394 },
  { name: 'Belur-Halebidu', cluster: 'HERITAGE', lat: 13.165, lng: 75.865 },
  { name: 'Coorg', cluster: 'NATURE', lat: 12.4244, lng: 75.7382 },
  { name: 'Chikmagalur', cluster: 'NATURE', lat: 13.3161, lng: 75.772 },
  { name: 'Agumbe', cluster: 'NATURE', lat: 13.5013, lng: 75.0916 },
  { name: 'Gokarna', cluster: 'COASTAL', lat: 14.5479, lng: 74.3188 },
  { name: 'Murudeshwar', cluster: 'COASTAL', lat: 14.094, lng: 74.4849 },
  { name: 'Udupi', cluster: 'COASTAL', lat: 13.3409, lng: 74.7421 },
];

export const ORIGINS = ['Bengaluru', 'Mangaluru', 'Hubballi', 'Mysuru', 'Belagavi'];

export const CLUSTERS: { id: Cluster; label: string; hint: string }[] = [
  { id: 'HERITAGE', label: 'Heritage', hint: 'Hampi, Badami, Pattadakal' },
  { id: 'NATURE', label: 'Nature', hint: 'Coorg, Chikmagalur' },
  { id: 'COASTAL', label: 'Coastal', hint: 'Gokarna, Murudeshwar' },
];

export const KARNATAKA_CENTER: [number, number] = [14.5, 75.8];

export const placeByName = (name: string): Place | undefined => DESTINATIONS.find((d) => d.name.toLowerCase() === name.toLowerCase());
