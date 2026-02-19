import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

// Pages publiques
import HomeHub from './pages/HomeHub';
import PersoSpace from './pages/PersoSpace';
import ProSpace from './pages/ProSpace';
import Home from './pages/Home'; // ancienne page gardée
import Login from './pages/Login';
import Signup from './pages/Signup';

// Layout protégé
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';

// Pages /app
import Dashboard from './pages/app/Dashboard';

// Vigie-Factures (votre app existante)
import VigieFacturesApp from './VigieFactures';

const router = createBrowserRouter([
  // ═══ Nouvelle structure ═══
  { path: '/', element: <HomeHub /> },
  { path: '/perso', element: <PersoSpace /> },
  { path: '/pro', element: <ProSpace /> },
  
  // ═══ Ancienne page gardée ═══
  { path: '/old-home', element: <Home /> },
  
  // ═══ Auth ═══
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },

  // ═══ Pages protégées /app ═══
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <AppLayout>
          <Dashboard />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/app/vigie-factures',
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