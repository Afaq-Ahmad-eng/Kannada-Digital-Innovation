import { Navigate, createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import AuthPage from './AuthPage';
import CulturePage from './CulturePage';
import DashboardPage from './DashboardPage';
import { GuestOnly, RequireAuth } from './guards';
import ProfilePage from './ProfilePage';
import TripPage from './TripPage';

export const router = createBrowserRouter([
  { element: <GuestOnly />, children: [{ path: '/login', element: <AuthPage mode="login" /> }, { path: '/register', element: <AuthPage mode="register" /> }] },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/trips/:id', element: <TripPage /> },
          { path: '/culture', element: <CulturePage /> },
          { path: '/profile', element: <ProfilePage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
