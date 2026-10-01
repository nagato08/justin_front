import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import heroFood from "../assets/hero-food-v2.webp";
import { GoogleButton } from "../components/GoogleButton";
import { Logo } from "../components/Logo";
import { useAuth } from "../contexts/AuthContext";

type Mode = "login" | "register";

export function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login, register, loginGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destination = (location.state as { from?: string } | null)?.from || "/";

  const finish = useCallback(
    (role: string) => navigate(role === "ADMIN" ? "/admin" : role === "DELIVERER" ? "/driver" : destination, { replace: true }),
    [destination, navigate],
  );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const email = String(data.get("email"));
      const password = String(data.get("password"));
      const user = mode === "login" ? await login(email, password) : await register(String(data.get("name")), email, password);
      finish(user.role);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Connexion impossible.");
    } finally {
      setBusy(false);
    }
  };

  const google = useCallback(async (credential: string) => {
    setBusy(true);
    setError("");
    try {
      finish((await loginGoogle(credential)).role);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Connexion Google impossible.");
    } finally {
      setBusy(false);
    }
  }, [finish, loginGoogle]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError("");
  };

  return (
    <div className="auth-page">
      <aside className="auth-visual">
        <img src={heroFood} alt="" />
        <div className="auth-visual-copy">
          <Logo />
          <p className="auth-quote">« Des plats généreux, préparés à la commande et livrés là où vous êtes. »</p>
        </div>
      </aside>

      <main className="auth-main" id="contenu">
        <div className="auth-top">
          <Link to="/" className="back-link"><ArrowLeft aria-hidden="true" /> Retour au menu</Link>
          <span className="auth-top-logo"><Logo /></span>
        </div>

        <div className="auth-card">
          <h1>{mode === "login" ? "Bon retour parmi nous" : "Créer un compte"}</h1>
          <p className="auth-lead">Un compte protège vos commandes et vous permet de suivre la livraison en direct.</p>

          <GoogleButton onCredential={google} />

          <div className="divider"><span>ou avec votre e-mail</span></div>

          <div className="segmented" role="tablist" aria-label="Choix de l’action">
            <button type="button" role="tab" aria-selected={mode === "login"} onClick={() => switchMode("login")}>J’ai un compte</button>
            <button type="button" role="tab" aria-selected={mode === "register"} onClick={() => switchMode("register")}>Je suis nouveau</button>
          </div>

          <form onSubmit={submit} className="stack">
            {mode === "register" && (
              <div className="field">
                <label htmlFor="auth-fullname">Nom complet</label>
                <div className="input-group">
                  <UserRound aria-hidden="true" />
                  <input id="auth-fullname" name="name" required minLength={2} autoComplete="name" placeholder="Ex. Grâce Mbarga" />
                </div>
              </div>
            )}
            <div className="field">
              <label htmlFor="auth-email">Adresse e-mail</label>
              <div className="input-group">
                <Mail aria-hidden="true" />
                <input id="auth-email" type="email" name="email" required autoComplete="email" placeholder="vous@exemple.com" />
              </div>
            </div>
            <div className="field">
              <label htmlFor="auth-password">Mot de passe</label>
              <div className="input-group">
                <LockKeyhole aria-hidden="true" />
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  minLength={mode === "login" ? 6 : 8}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
                <button type="button" className="input-action" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
              {mode === "register" && <small className="field-hint">8 caractères minimum.</small>}
            </div>
            {error && <p className="field-error" role="alert">{error}</p>}
            <button className="button primary block lg" disabled={busy}>
              {busy ? "Un instant…" : mode === "login" ? "Se connecter" : "Créer mon compte"}
            </button>
          </form>

          <p className="auth-legal">En continuant, vous acceptez nos conditions d’utilisation.</p>
        </div>
      </main>
    </div>
  );
}
