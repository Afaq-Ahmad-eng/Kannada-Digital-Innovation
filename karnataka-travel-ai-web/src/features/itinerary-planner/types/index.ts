export type BudgetTier = 'BACKPACKER' | 'MODERATE' | 'LUXURY';
export type TravelPace = 'RELAXED' | 'BALANCED' | 'FAST';
export type Dietary = 'NONE' | 'VEGETARIAN' | 'SATTVIC' | 'JAIN' | 'HALAL' | 'COASTAL_VEGETARIAN' | 'NON_VEGETARIAN';
export type TripStatus = 'PENDING' | 'GENERATING' | 'READY' | 'DISRUPTED' | 'FAILED' | 'COMPLETED';
export type ActivityCategory = 'HERITAGE' | 'NATURE' | 'FOOD' | 'CULTURE' | 'TRANSIT' | 'STAY' | 'LEISURE' | 'ADVENTURE';

export interface Activity {
  id: string;
  title: string;
  description: string;
  location: string;
  destination: string;
  lat: number;
  lng: number;
  startTime: string;
  durationMin: number;
  estCostInr: number;
  category: ActivityCategory;
  indoor: boolean;
  legDistanceKm?: number | null;
  legDurationMin?: number | null;
  ghat?: boolean | null;
}
export interface Day { dayNumber: number; date: string; theme: string; summary: string; activities: Activity[] }
export interface Budget { accommodation: number; food: number; transport: number; activities: number; total: number }

export interface TripSummary {
  id: string;
  title: string | null;
  origin: string;
  clusters: string[];
  destinations: string[];
  startDate: string;
  endDate: string;
  budgetTier: BudgetTier;
  status: TripStatus;
}
export interface Trip extends TripSummary {
  travelers: number;
  source: 'LLM' | 'CACHE' | 'TEMPLATE' | null;
  summary: string | null;
  budget: Budget | null;
  tips: string[];
  failureReason: string | null;
  days: Day[];
}

export interface GenerateRequest {
  origin: string;
  clusters: ('HERITAGE' | 'NATURE' | 'COASTAL')[];
  destinations: string[];
  startDate: string;
  endDate: string;
  budgetTier: BudgetTier;
  travelers: number;
  pace: TravelPace;
  dietary: Dietary;
  accessibility: string[];
  interests?: string;
}
