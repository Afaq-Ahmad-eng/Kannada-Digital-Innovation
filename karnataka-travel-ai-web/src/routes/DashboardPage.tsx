import { Card, Spinner } from '../components/ui';
import { TripForm } from '../features/itinerary-planner/components/TripForm';
import { TripList } from '../features/itinerary-planner/components/TripList';
import { useTrips } from '../features/itinerary-planner/hooks/useTrips';
import { useProfile } from '../features/user-profile/hooks/useProfile';

export default function DashboardPage() {
  const { profile, error: profileError } = useProfile();
  const { trips, error } = useTrips();
  const ready = profile || profileError;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <h1 className="mb-4 font-display text-3xl font-bold sm:text-4xl">Where to next?</h1>
        <Card>
          {ready ? (
            <TripForm defaults={profile ? { budgetTier: profile.preferences.defaultBudgetTier, pace: profile.preferences.travelPace, dietary: profile.preferences.dietary, accessibility: profile.preferences.accessibility, origin: profile.preferences.homeCity ?? undefined } : undefined} />
          ) : (
            <Spinner label="Loading your preferences" />
          )}
        </Card>
      </div>
      <div>
        <h2 className="mb-4 font-display text-2xl font-bold">Your trips</h2>
        <Card>
          {error ? <p className="text-sm text-alert-600" role="alert">{error}</p> : trips ? <TripList trips={trips} /> : <Spinner label="Loading trips" />}
        </Card>
      </div>
    </div>
  );
}
