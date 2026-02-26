import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

// Pages publiques
import HomeHub    from './pages/HomeHub';
import Login      from './pages/Login';
import Signup     from './pages/Signup';
import ProLogin   from './ProLogin';
import ProSignup  from './pages/ProSignup';

// Layouts avec sidebar
import PersoLayout    from './pages/PersoLayout';
import PersoDashboard from './pages/PersoDashboard';
import ProLayout      from './pages/ProLayout';

// Guards
import ProtectedRoute from './components/ProtectedRoute';
import RequireAuthPro from './RequireAuthPro';

// Module Factures
import VigieFacturesWrapper from './pages/VigieFacturesWrapper';
import ProHome from './pages/ProHome';
const router = createBrowserRouter([

  // ═══ Pages publiques ═══
  { path: '/',           element: <HomeHub /> },
  { path: '/login',      element: <Login /> },
  { path: '/signup',     element: <Signup /> },
  { path: '/pro/login',  element: <ProLogin /> },
  { path: '/pro/signup', element: <ProSignup /> },

  // ═══ Espace Perso ═══
  {
    path: '/perso',
    element: (
      <ProtectedRoute>
        <PersoLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true,      element: <PersoDashboard /> },       // /perso → dashboard
      { path: 'factures', element: <VigieFacturesWrapper /> }, // /perso/factures
    ],
  },

  // ═══ Espace Pro ═══
  // /pro → directement Vigie Factures (pas de dashboard intermédiaire)
  {
    path: '/pro',
    element: (
      <RequireAuthPro>
        <ProLayout />
      </RequireAuthPro>
    ),
    children: [
      { index: true,      element: <ProHome /> },
      { path: 'factures', element: <VigieFacturesWrapper /> }, // /pro/factures (compatibilité)
    ],
  },

  // ═══ Redirect ═══
  { path: '*', element: <Navigate to="/" replace /> },
]);

export default function Router() {
  return <RouterProvider router={router} />;
}
