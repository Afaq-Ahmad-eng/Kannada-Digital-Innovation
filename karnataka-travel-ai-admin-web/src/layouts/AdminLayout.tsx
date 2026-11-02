import { Activity, CloudLightning, LayoutDashboard, LogOut, Route, ScrollText, ShieldCheck, Users } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { authApi } from '../features/auth/authApi';
import { useAuthStore } from '../store/auth';

const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/users', label: 'Travellers', icon: Users, end: false },
  { to: '/trips', label: 'Trips', icon: Route, end: false },
  { to: '/disruptions', label: 'Disruptions', icon: CloudLightning, end: false },
  { to: '/operations', label: 'Operations', icon: Activity, end: false },
  { to: '/audit', label: 'Audit log', icon: ScrollText, end: false },
];

export function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const signOut = async () => { try { await authApi.logout(); } finally { clear(); } };

  return (
    <div className="min-h-screen lg:flex">
      <aside className="bg-slate-900 text-slate-200 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:shrink-0 lg:flex-col">
        <div className="flex items-center gap-2 px-4 py-4"><ShieldCheck className="h-6 w-6 text-ochre-400" aria-hidden /><span className="font-display text-lg font-bold text-white">Yatre Admin</span></div>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-1 lg:flex-col lg:overflow-visible">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold ${isActive ? 'bg-ochre-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
              <Icon className="h-4 w-4" aria-hidden />{label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden border-t border-slate-800 p-3 lg:block">
          <p className="truncate text-xs text-slate-400">{user?.email}</p>
          <button type="button" onClick={() => void signOut()} className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800"><LogOut className="h-4 w-4" aria-hidden />Sign out</button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mb-4 flex items-center justify-between lg:hidden"><span className="truncate text-xs text-slate-500">{user?.email}</span><button type="button" onClick={() => void signOut()} className="text-sm font-semibold text-slate-700 underline">Sign out</button></div>
        <Outlet />
      </main>
    </div>
  );
}
