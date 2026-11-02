import { Compass, Languages, LogOut, User } from 'lucide-react';
import { useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuthActions } from '../features/auth/hooks/useAuthActions';
import { VoiceFab } from '../features/culture-assistant/components/VoiceFab';
import { AdvisoryRibbon } from '../features/travel-alerts/components/AdvisoryRibbon';
import { startLiveStream } from '../services/sse';
import { useAuthStore } from '../store/auth';

const NAV = [
  { to: '/', label: 'Plan', icon: Compass, end: true },
  { to: '/culture', label: 'Culture', icon: Languages, end: false },
  { to: '/profile', label: 'Profile', icon: User, end: false },
];

export function AppLayout() {
  const { logout } = useAuthActions();
  const user = useAuthStore((s) => s.user);

  useEffect(() => startLiveStream(), []);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-sandal-200 bg-sandal-50/95 backdrop-blur" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <NavLink to="/" className="flex items-baseline gap-2" aria-label="Yatre home">
            <span className="font-display text-2xl font-bold text-ghats-700">Yatre</span>
            <span className="text-lg text-ochre-700" lang="kn">ಯಾತ್ರೆ</span>
          </NavLink>
          <nav className="hidden gap-1 sm:flex" aria-label="Main">
            {NAV.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? 'bg-ghats-100 text-ghats-800' : 'text-slate-700 hover:bg-sandal-100'}`}>{label}</NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-[180px] truncate text-sm text-slate-600 md:block">{user?.email}</span>
            <button type="button" onClick={() => void logout()} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-slate-700 hover:bg-sandal-100"><LogOut className="h-4 w-4" aria-hidden />Sign out</button>
          </div>
        </div>
      </header>
      <AdvisoryRibbon />
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:pb-12"><Outlet /></main>
      <VoiceFab />
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 border-t border-sandal-200 bg-sandal-50 sm:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-xs font-semibold ${isActive ? 'text-ghats-700' : 'text-slate-600'}`}>
            <Icon className="h-5 w-5" aria-hidden />{label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
