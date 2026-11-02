import { Card, Spinner } from '../components/ui';
import { PreferencesForm } from '../features/user-profile/components/PreferencesForm';
import { useProfile } from '../features/user-profile/hooks/useProfile';

export default function ProfilePage() {
  const { profile, error, save } = useProfile();
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Your preferences</h1>
      {profile && <p className="mb-6 mt-2 text-slate-600">{profile.user.fullName} · {profile.user.email}</p>}
      <Card>
        {error && <p className="text-alert-600" role="alert">{error}</p>}
        {!profile && !error && <Spinner label="Loading profile" />}
        {profile && <PreferencesForm initial={profile.preferences} onSave={save} />}
      </Card>
    </div>
  );
}
