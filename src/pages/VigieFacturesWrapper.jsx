import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import VigieFacturesCore from "./VigieFacturesCore";
import { supabase } from "../lib/supabaseClient";
import { supabasePro } from "../lib/supabasePro";

const getSb = (context) => context === "pro" ? supabasePro : supabase;

export default function VigieFacturesWrapper() {
  const location = useLocation();
  const context = location.pathname.startsWith("/pro") ? "pro" : "perso";
  const sb = getSb(context);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub?.subscription?.unsubscribe();
  }, [context]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0E0D0B", display: "flex", alignItems: "center", justifyContent: "center", color: "#D4A853", fontFamily: "'Nunito Sans', sans-serif", fontSize: 13 }}>
      Chargement...
    </div>
  );

  if (!user) return (
    <div style={{ minHeight: "100vh", background: "#0E0D0B", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)", fontFamily: "'Nunito Sans', sans-serif", fontSize: 13 }}>
      Session expirée. Veuillez vous reconnecter.
    </div>
  );

  return <VigieFacturesCore context={context} user={user} />;
}
