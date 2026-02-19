import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

// Pages publiques
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
  { path: '/', element: <div style={{ minHeight:'100vh', background:'#0E0D0B', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:20 }}><h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:48, color:'#D4A853' }}>Vigie</h1><a href="/login" style={{ padding:'12px 28px', borderRadius:10, background:'linear-gradient(135deg,#D4A853,#C78A5B)', color:'#0E0D0B', fontWeight:700, textDecoration:'none' }}>Se connecter</a><a href="/signup" style={{ padding:'12px 28px', borderRadius:10, border:'1px solid rgba(212,168,83,0.3)', color:'#D4A853', textDecoration:'none' }}>S'inscrire</a></div> },
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