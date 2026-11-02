import type { BudgetTier, Dietary, TravelPace } from '../../itinerary-planner/types';

export interface Preferences {
  contactChannels: ('WHATSAPP' | 'EMAIL')[];
  travelPace: TravelPace;
  dietary: Dietary;
  accessibility: string[];
  defaultBudgetTier: BudgetTier;
  homeCity?: string | null;
  preferredLanguage: 'en' | 'kn';
}
export interface Profile {
  user: { id: string; email: string; fullName: string; phone: string | null };
  preferences: Preferences;
}
