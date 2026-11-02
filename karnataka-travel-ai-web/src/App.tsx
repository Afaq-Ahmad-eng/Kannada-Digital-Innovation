import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useAuthActions } from './features/auth/hooks/useAuthActions';
import { router } from './routes';

export default function App() {
  const { bootstrap } = useAuthActions();
  // Restore the session from the HttpOnly refresh cookie (single-flight, so StrictMode double-invoke is safe).
  useEffect(() => void bootstrap(), [bootstrap]);
  return <RouterProvider router={router} />;
}
