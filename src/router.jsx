import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

// Pages publiques
import Home from './pages/Home';
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
  // Pages publiques
  { path: '/', element: <Home /> },
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },

  // Pages protégées /app
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

  // Redirect
  { path: '*', element: <Navigate to="/" replace /> },
]);

export default function Router() {
  return <RouterProvider router={router} />;
}