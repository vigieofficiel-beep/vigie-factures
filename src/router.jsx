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

// Vigie-Factures avec wrapper contextuel
import VigieFacturesWrapper from './pages/VigieFacturesWrapper';

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
        <VigieFacturesWrapper />
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
        <VigieFacturesWrapper />
      </ProtectedRoute>
    ),
  },

  // ═══ Redirect ═══
  { path: '*', element: <Navigate to="/" replace /> },
]);

export default function Router() {
  return <RouterProvider router={router} />;
}