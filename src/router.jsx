import { createBrowserRouter, RouterProvider } from 'react-router-dom';
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
import MentionsLegales from './pages/MentionsLegales';
import Confidentialite from './pages/Confidentialite';
import NotFound from './pages/NotFound';
import ProfilPro from './pages/ProfilPro';
import CalculateurTVA from './pages/CalculateurTVA';
import SimulateurCharges from './pages/SimulateurCharges';
import ConvertisseurDevises from './pages/ConvertisseurDevises';
import RentabiliteClients from './pages/RentabiliteClients';
import GraphiqueCA from './pages/GraphiqueCA';
import CalculateurAmortissement from './pages/CalculateurAmortissement';
import SimulateurSalaire from './pages/SimulateurSalaire';
import CalculateurSeuilRentabilite from './pages/CalculateurSeuilRentabilite';
import TableauFiscal from './pages/TableauFiscal';
import Tarifs  from './pages/Tarifs';
import CGU     from './pages/CGU';
import Contact from './pages/Contact';
import NouveauMotDePasse from './pages/NouveauMotDePasse';
import HomeHub    from './pages/HomeHub';
import Login      from './pages/Login';
import Signup     from './pages/Signup';
import ProLogin   from './ProLogin';
import ProSignup  from './pages/ProSignup';
import PersoLayout    from './pages/PersoLayout';
import PersoDashboard from './pages/PersoDashboard';
import ProLayout      from './pages/ProLayout';
import ProtectedRoute from './components/ProtectedRoute';
import RequireAuthPro from './RequireAuthPro';
import VigieFacturesWrapper from './pages/VigieFacturesWrapper';
import ProHome from './pages/ProHome';
import DocumentsPage from './pages/DocumentsPage';
import ModuleLock from './components/ModuleLock';
import AuthCallback from './pages/AuthCallback';
import BlogPage    from './pages/BlogPage';
import BlogArticle from './pages/BlogArticle';
import BlogAdmin   from './pages/BlogAdmin';
import VigieApp    from './pages/VigieApp';

const router = createBrowserRouter([

  // ═══ Pages publiques ═══
  { path: '/',                         element: <HomeHub /> },
  { path: '/login',                    element: <Login /> },
  { path: '/signup',                   element: <Signup /> },
  { path: '/pro/login',                element: <ProLogin /> },
  { path: '/pro/signup',               element: <ProSignup /> },
  { path: '/pro/auth/callback',        element: <AuthCallback /> },
  { path: '/tarifs',                   element: <Tarifs /> },
  { path: '/blog',                     element: <BlogPage /> },
  { path: '/blog/:slug',               element: <BlogArticle /> },
  { path: '/apps',                     element: <VigieApp /> },
  { path: '/cgu',                      element: <CGU /> },
  { path: '/contact',                  element: <Contact /> },
  { path: '/mentions-legales',         element: <MentionsLegales /> },
  { path: '/confidentialite',          element: <Confidentialite /> },
  { path: '/pro/nouveau-mot-de-passe', element: <NouveauMotDePasse /> },

  // ═══ Espace Perso ═══
  {
    path: '/perso',
    element: (
      <ProtectedRoute>
        <PersoLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true,      element: <PersoDashboard /> },
      { path: 'factures', element: <VigieFacturesWrapper /> },
    ],
  },

  // ═══ Espace Pro ═══
  {
    path: '/pro',
    element: (
      <RequireAuthPro>
        <ProLayout />
      </RequireAuthPro>
    ),
    children: [

      // ── Accès libre (auth suffisante) ──
      { index: true,       element: <ProHome /> },
      { path: 'profil',    element: <ProfilPro /> },
      { path: 'blog-admin', element: <BlogAdmin /> },

      // ── Plan GRATUIT — outils calculateurs ──
      { path: 'tva',           element: <CalculateurTVA /> },
      { path: 'charges',       element: <SimulateurCharges /> },
      { path: 'devises',       element: <ConvertisseurDevises /> },
      { path: 'rentabilite',   element: <RentabiliteClients /> },
      { path: 'graphiques',    element: <GraphiqueCA /> },
      { path: 'amortissement', element: <CalculateurAmortissement /> },
      { path: 'salaire',       element: <SimulateurSalaire /> },
      { path: 'seuil',         element: <CalculateurSeuilRentabilite /> },
      { path: 'fiscal',        element: <TableauFiscal /> },

      // ── Plan STARTER ──
      { path: 'depenses',     element: <ModuleLock module="depenses"><DepensesPage /></ModuleLock> },
      { path: 'recettes',     element: <ModuleLock module="recettes"><RecettesPage /></ModuleLock> },
      { path: 'banque',       element: <ModuleLock module="banque"><BanquePage /></ModuleLock> },
      { path: 'contrats',     element: <ModuleLock module="contrats"><ContratsPage /></ModuleLock> },
      { path: 'formalites',   element: <ModuleLock module="formalites"><FormalitesPage /></ModuleLock> },
      { path: 'mail-agent',   element: <ModuleLock module="mail-agent"><MailAgent /></ModuleLock> },
      { path: 'equipe',       element: <ModuleLock module="equipe"><EquipePro /></ModuleLock> },
      { path: 'pointages',    element: <ModuleLock module="pointages"><PointagesPro /></ModuleLock> },
      { path: 'fournisseurs', element: <ModuleLock module="fournisseurs"><FournisseursPro /></ModuleLock> },

      // ── Plan PRO ──
      { path: 'documents', element: <ModuleLock module="documents"><DocumentsPage /></ModuleLock> },
      { path: 'factures',  element: <ModuleLock module="factures"><VigieFacturesWrapper /></ModuleLock> },
      { path: 'exports',   element: <ModuleLock module="exports"><ExportsFEC /></ModuleLock> },

      { path: '*', element: <NotFound /> },
    ],
  },

  // ═══ 404 ═══
  { path: '*', element: <NotFound /> },
]);

export default function Router() {
  return <RouterProvider router={router} />;
}
