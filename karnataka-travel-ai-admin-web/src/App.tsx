import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { refreshAccessToken } from './services/http';

export default function App() {
  // Restore the admin session from the admin-only refresh cookie.
  useEffect(() => void refreshAccessToken(), []);
  return <RouterProvider router={router} />;
}
