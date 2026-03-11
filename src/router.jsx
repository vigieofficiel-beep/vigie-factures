import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import DepensesPage from './pages/DepensesPage';
import RecettesPage from './pages/RecettesPage';
import BanquePage from './pages/BanquePage';
import ContratsPage from './pages/ContratsPage';
import FormalitesPage from './pages/FormalitesPage';
import EquipePro       from "./pages/EquipePro";
import PointagesPro    from "./pages/PointagesPro";
import FournisseursPro from "./pages/FournisseursPro";
import ExportsFEC from './pages/ExportsFEC';
import MailAgent from './pages/MailAgent';
import LandingPage from './pages/LandingPage';
import MentionsLegales from './pages/MentionsLegales';
import Confidentialite from './pages/Confidentialite';
import NotFound from './pages/NotFound';

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
  { path: '/tarifs', element: <LandingPage /> },
  { path: '/mentions-legales', element: <MentionsLegales /> },
  { path: '/confidentialite',  element: <Confidentialite /> },
  
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
      { path: 'depenses', element: <DepensesPage /> },
      { path: 'recettes', element: <RecettesPage /> },
      { path: 'banque', element: <BanquePage /> },
      { path: 'contrats', element: <ContratsPage /> },
      { path: 'formalites', element: <FormalitesPage /> },
      { path: 'equipe',     element: <EquipePro /> },
      { path: 'pointages',  element: <PointagesPro /> },
      { path: 'fournisseurs', element: <FournisseursPro /> },
      { path: 'exports', element: <ExportsFEC /> },
      { path: '*', element: <NotFound /> }

    ],
  },

  // ═══ Redirect ═══
  { path: '*', element: <Navigate to="/" replace /> },
]);

export default function Router() {
  return <RouterProvider router={router} />;
}
