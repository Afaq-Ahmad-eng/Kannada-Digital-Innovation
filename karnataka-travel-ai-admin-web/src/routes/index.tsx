import { Navigate, createBrowserRouter } from 'react-router-dom';
import AuditPage from '../features/audit/AuditPage';
import LoginPage from '../features/auth/LoginPage';
import OperationsPage from '../features/operations/OperationsPage';
import OverviewPage from '../features/overview/OverviewPage';
import DisruptionsPage from '../features/trips/DisruptionsPage';
import TripsPage from '../features/trips/TripsPage';
import UsersPage from '../features/users/UsersPage';
import { AdminLayout } from '../layouts/AdminLayout';
import { GuestOnly, RequireAdmin } from './guards';

export const router = createBrowserRouter([
  { element: <GuestOnly />, children: [{ path: '/login', element: <LoginPage /> }] },
  {
    element: <RequireAdmin />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/', element: <OverviewPage /> },
          { path: '/users', element: <UsersPage /> },
          { path: '/trips', element: <TripsPage /> },
          { path: '/disruptions', element: <DisruptionsPage /> },
          { path: '/operations', element: <OperationsPage /> },
          { path: '/audit', element: <AuditPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
