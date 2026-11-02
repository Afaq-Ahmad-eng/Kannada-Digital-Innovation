import { useCallback, useEffect, useState } from 'react';
import { errorMessage } from '../../../services/http';
import { profileApi } from '../services/profileApi';
import type { Preferences, Profile } from '../types';

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    profileApi.me().then((p) => live && setProfile(p)).catch((e) => live && setError(errorMessage(e)));
    return () => {
      live = false;
    };
  }, []);

  const save = useCallback(async (prefs: Preferences) => {
    const saved = await profileApi.save(prefs);
    setProfile((p) => (p ? { ...p, preferences: saved } : p));
  }, []);

  return { profile, error, save };
}
