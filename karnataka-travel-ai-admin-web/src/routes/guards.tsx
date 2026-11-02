import { Navigate, Outlet } from 'react-router-dom';
import { Spinner } from '../components/ui';
import { useAuthStore } from '../store/auth';

export function RequireAdmin() {
  const status = useAuthStore((s) => s.status);
  if (status === 'unknown') return <Spinner label="Checking your session" />;
  return status === 'authed' ? <Outlet /> : <Navigate to="/login" replace />;
}
export function GuestOnly() {
  const status = useAuthStore((s) => s.status);
  if (status === 'unknown') return <Spinner label="Loading" />;
  return status === 'authed' ? <Navigate to="/" replace /> : <Outlet />;
}
