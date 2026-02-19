import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

// Pages publiques
import HomeHub from './pages/HomeHub';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Espaces Perso/Pro
import PersoSpace from './pages/PersoSpace';
import ProSpace from './pages/ProSpace';

// Layout protégé
import ProtectedRoute from './components/ProtectedRoute';

// Vigie-Factures
import VigieFacturesApp from './VigieFactures';

const router = createBrowserRouter([
  // ═══ Pages publiques ═══
  { path: '/', element: <HomeHub /> },
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },

  // ═══ Espace Perso ═══
  {
    path: '/perso',
    element: (
      <ProtectedRoute>
        <PersoSpace />
      </ProtectedRoute>
    ),
  },
  {
    path: '/perso/factures',
    element: (
      <ProtectedRoute>
        <VigieFacturesApp />
      </ProtectedRoute>
    ),
  },

  // ═══ Espace Pro ═══
  {
    path: '/pro',
    element: (
      <ProtectedRoute>
        <ProSpace />
      </ProtectedRoute>
    ),
  },
  {
    path: '/pro/factures',
    element: (
      <ProtectedRoute>
        <VigieFacturesApp />
      </ProtectedRoute>
    ),
  },

  // ═══ Redirect ═══
  { path: '*', element: <Navigate to="/" replace /> },
]);

export default function Router() {
  return <RouterProvider router={router} />;
}