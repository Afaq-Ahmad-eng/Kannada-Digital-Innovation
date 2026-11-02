import { http } from '../../../services/http';
import type { Preferences, Profile } from '../types';

export const profileApi = {
  me: () => http.get<Profile>('/users/me').then((r) => r.data),
  save: (p: Preferences) => http.put<Preferences>('/users/me/preferences', p).then((r) => r.data),
};
