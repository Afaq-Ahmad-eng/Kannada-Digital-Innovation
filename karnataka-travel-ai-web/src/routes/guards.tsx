import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Spinner } from '../components/ui';
import { useAuthStore } from '../store/auth';

export function RequireAuth() {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();
  if (status === 'unknown') return <Spinner label="Restoring your session" />;
  if (status === 'anon') return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export function GuestOnly() {
  const status = useAuthStore((s) => s.status);
  if (status === 'unknown') return <Spinner label="Loading" />;
  if (status === 'authed') return <Navigate to="/" replace />;
  return <Outlet />;
}
