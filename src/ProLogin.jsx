import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabasePro } from "./lib/supabasePro";

export default function ProLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const next = searchParams.get("next") || "/pro";

  async function login(e) {
    e.preventDefault();
    setErr("");
    const { error } = await supabasePro.auth.signInWithPassword({ email, password });
    if (error) return setErr(error.message);
    navigate(next, { replace: true });
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Connexion Vigie Pro</h2>
      <form onSubmit={login} style={{ display: "grid", gap: 12, maxWidth: 360 }}>
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">Se connecter</button>
        {err && <p style={{ color: "crimson" }}>{err}</p>}
      </form>
    </div>
  );
}