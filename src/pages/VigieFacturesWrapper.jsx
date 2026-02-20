import { useLocation } from 'react-router-dom';
import VigieFacturesApp from '../VigieFactures';

export default function VigieFacturesWrapper() {
  const location = useLocation();
  
  // Détermine le contexte selon l'URL
  const context = location.pathname.startsWith('/perso') ? 'perso' : 'pro';
  
  // Injecte le contexte comme prop
  return <VigieFacturesApp context={context} />;
}