import { z } from 'zod';

export const Role = z.enum(['USER', 'ADMIN']);
export type Role = z.infer<typeof Role>;
export const BudgetTier = z.enum(['BACKPACKER', 'MODERATE', 'LUXURY']);
export type BudgetTier = z.infer<typeof BudgetTier>;
export const TravelPace = z.enum(['RELAXED', 'BALANCED', 'FAST']);
export type TravelPace = z.infer<typeof TravelPace>;
export const DietaryRegime = z.enum(['NONE', 'VEGETARIAN', 'SATTVIC', 'JAIN', 'HALAL', 'COASTAL_VEGETARIAN', 'NON_VEGETARIAN']);
export type DietaryRegime = z.infer<typeof DietaryRegime>;
export const DestinationCluster = z.enum(['HERITAGE', 'NATURE', 'COASTAL']);
export type DestinationCluster = z.infer<typeof DestinationCluster>;
export const ContactChannel = z.enum(['WHATSAPP', 'EMAIL']);
export type ContactChannel = z.infer<typeof ContactChannel>;
export const TripStatus = z.enum(['PENDING', 'GENERATING', 'READY', 'DISRUPTED', 'FAILED', 'COMPLETED']);
export type TripStatus = z.infer<typeof TripStatus>;
export const ActivityCategory = z.enum(['HERITAGE', 'NATURE', 'FOOD', 'CULTURE', 'TRANSIT', 'STAY', 'LEISURE', 'ADVENTURE']);
export type ActivityCategory = z.infer<typeof ActivityCategory>;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');

export const PreferencesSchema = z.object({
  contactChannels: z.array(ContactChannel).min(1).default(['EMAIL']),
  travelPace: TravelPace.default('BALANCED'),
  dietary: DietaryRegime.default('NONE'),
  accessibility: z.array(z.string().max(60)).max(10).default([]),
  defaultBudgetTier: BudgetTier.default('MODERATE'),
  homeCity: z.string().max(80).nullish(),
  preferredLanguage: z.enum(['en', 'kn']).default('en'),
});
export type Preferences = z.infer<typeof PreferencesSchema>;

export const TripParamsSchema = z.object({
  origin: z.string().min(2).max(80),
  clusters: z.array(DestinationCluster).min(1),
  destinations: z.array(z.string().max(60)).max(8).default([]),
  startDate: isoDate,
  endDate: isoDate,
  budgetTier: BudgetTier,
  travelers: z.number().int().min(1).max(12).default(2),
  pace: TravelPace.default('BALANCED'),
  dietary: DietaryRegime.default('NONE'),
  accessibility: z.array(z.string().max(60)).max(10).default([]),
  interests: z.string().max(300).optional(),
});
export type TripParams = z.infer<typeof TripParamsSchema>;

export const GenerateRequestSchema = TripParamsSchema.refine((p) => p.endDate >= p.startDate, {
  message: 'endDate must be on or after startDate',
  path: ['endDate'],
});

export const ActivitySchema = z.object({
  title: z.string().min(2),
  description: z.string().default(''),
  location: z.string().default(''),
  destination: z.string().min(2),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationMin: z.number().int().positive(),
  estCostInr: z.number().nonnegative(),
  category: ActivityCategory,
  indoor: z.boolean(),
  legDistanceKm: z.number().nullish(),
  legDurationMin: z.number().nullish(),
  ghat: z.boolean().nullish(),
});
export type Activity = z.infer<typeof ActivitySchema>;

export const DaySchema = z.object({
  dayNumber: z.number().int().positive(),
  theme: z.string().default(''),
  summary: z.string().default(''),
  activities: z.array(ActivitySchema).min(1),
});
export type Day = z.infer<typeof DaySchema>;

export const PlanBudgetSchema = z.object({
  accommodation: z.number().nonnegative(),
  food: z.number().nonnegative(),
  transport: z.number().nonnegative(),
  activities: z.number().nonnegative(),
  total: z.number().nonnegative(),
});

export const PlanSchema = z.object({
  title: z.string().min(3),
  summary: z.string().default(''),
  days: z.array(DaySchema).min(1),
  budget: PlanBudgetSchema,
  tips: z.array(z.string()).default([]),
});
export type Plan = z.infer<typeof PlanSchema>;
export type PlanSource = 'LLM' | 'CACHE' | 'TEMPLATE';
