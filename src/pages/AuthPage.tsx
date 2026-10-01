import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import heroFood from "../assets/hero-food-v2.webp";
import { Logo } from "../components/Logo";
import { PhoneAuth } from "../components/PhoneAuth";
import { useAuth } from "../contexts/AuthContext";

type Method = "phone" | "email";
type EmailMode = "login" | "register";

export function AuthPage() {
  const [method, setMethod] = useState<Method>("phone");
  const [emailMode, setEmailMode] = useState<EmailMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login, register, loginPhone } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destination = (location.state as { from?: string } | null)?.from || "/";

  const finish = useCallback(
    (role: string) => navigate(role === "ADMIN" ? "/admin" : role === "DELIVERER" ? "/driver" : destination, { replace: true }),
    [destination, navigate],
  );

  const submitEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const email = String(data.get("email"));
      const password = String(data.get("password"));
      const user = emailMode === "login" ? await login(email, password) : await register(String(data.get("name")), email, password);
      finish(user.role);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Connexion impossible.");
    } finally {
      setBusy(false);
    }
  };

  const verifiedPhone = useCallback(
    async (idToken: string, displayName?: string) => finish((await loginPhone(idToken, displayName)).role),
    [finish, loginPhone],
  );

  const switchMethod = (next: Method) => {
    setMethod(next);
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
          {method === "phone" ? (
            <>
              <h1>Connexion ou inscription</h1>
              <p className="auth-lead">Entrez votre numéro. Si c’est votre première commande, nous créons votre compte en quelques secondes.</p>
              <PhoneAuth onVerified={verifiedPhone} />
            </>
          ) : (
            <>
              <h1>{emailMode === "login" ? "Connexion par e-mail" : "Créer un compte"}</h1>
              <div className="segmented" role="tablist" aria-label="Choix de l’action">
                <button type="button" role="tab" aria-selected={emailMode === "login"} onClick={() => { setEmailMode("login"); setError(""); }}>J’ai un compte</button>
                <button type="button" role="tab" aria-selected={emailMode === "register"} onClick={() => { setEmailMode("register"); setError(""); }}>Je suis nouveau</button>
              </div>
              <form onSubmit={submitEmail} className="stack">
                {emailMode === "register" && (
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
                      minLength={emailMode === "login" ? 6 : 8}
                      autoComplete={emailMode === "login" ? "current-password" : "new-password"}
                    />
                    <button type="button" className="input-action" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                  {emailMode === "register" && <small className="field-hint">8 caractères minimum.</small>}
                </div>
                {error && <p className="field-error" role="alert">{error}</p>}
                <button className="button primary block lg" disabled={busy}>
                  {busy ? "Un instant…" : emailMode === "login" ? "Se connecter" : "Créer mon compte"}
                </button>
              </form>
            </>
          )}

          <div className="divider"><span>ou</span></div>
          {method === "phone" ? (
            <button type="button" className="button secondary block" onClick={() => switchMethod("email")}>
              <Mail aria-hidden="true" /> Continuer avec un e-mail
            </button>
          ) : (
            <button type="button" className="button secondary block" onClick={() => switchMethod("phone")}>
              <Phone aria-hidden="true" /> Continuer avec mon numéro
            </button>
          )}
          <p className="auth-legal">En continuant, vous acceptez nos conditions d’utilisation. Votre numéro sert uniquement au suivi de vos commandes.</p>
        </div>
      </main>
    </div>
  );
}
