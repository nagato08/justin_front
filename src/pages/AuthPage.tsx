import { ArrowLeft, Check, Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import heroFood from "../assets/hero-food-v2.webp";
import { Logo } from "../components/Logo";
import { PhoneAuth } from "../components/PhoneAuth";
import { useAuth } from "../contexts/AuthContext";
export function AuthPage() {
  const [mode,setMode] = useState<"login"|"register">("login");
  const [show,setShow] = useState(false);
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(false);
  const [withEmail,setWithEmail] = useState(false);
  const { login, register, loginPhone } = useAuth();
  const navigate=useNavigate();
  const location=useLocation();
  const destination = (location.state as { from?: string } | null)?.from || "/";
  const finish = useCallback((role: string) => navigate(role === "ADMIN" ? "/admin" : role === "DELIVERER" ? "/driver" : destination, { replace: true }), [destination,navigate]);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); setError(""); const data=new FormData(event.currentTarget); try { const user = mode === "login" ? await login(String(data.get("email")),String(data.get("password"))) : await register(String(data.get("name")),String(data.get("email")),String(data.get("password"))); finish(user.role); } catch(reason) { setError(reason instanceof Error ? reason.message : "Connexion impossible."); } finally { setBusy(false); } };
  const phone = useCallback(async (idToken: string, displayName?: string) => finish((await loginPhone(idToken, displayName)).role), [finish,loginPhone]);
  return <main className="auth-page auth-v2">
    <section className="auth-story"><img src={heroFood} alt="Plat cuisiné maison"/><div className="auth-story-overlay"><Link to="/" className="back-link"><ArrowLeft/> Retour au menu</Link><Logo/><div className="auth-story-copy"><span>Bien manger, simplement.</span><h1>Votre prochain repas est à quelques clics.</h1><ul><li><Check/> Position de livraison libre</li><li><Check/> Suivi en temps réel</li><li><Check/> Commandes et paiements sécurisés</li></ul></div><small>Préparé avec soin, livré chez vous.</small></div></section>
    <section className="auth-panel"><div className="auth-card auth-card-v2"><span className="auth-overline">Votre espace</span><h2>{mode === "login" ? "Bon retour parmi nous." : "Créez votre compte."}</h2><p>{mode === "login" ? "Connectez-vous pour commander et suivre vos livraisons." : "Un compte est nécessaire pour protéger et retrouver vos commandes."}</p>
      <div className="auth-tabs"><button type="button" className={mode === "login" ? "active" : ""} onClick={() => {setMode("login");setError("")}}>Connexion</button><button type="button" className={mode === "register" ? "active" : ""} onClick={() => {setMode("register");setError("")}}>Inscription</button></div>
      {!withEmail ? <><PhoneAuth key={mode} askName={mode === "register"} onVerified={phone}/><div className="divider"><span>ou</span></div><button type="button" className="button wide email-switch" onClick={() => {setWithEmail(true);setError("")}}><Mail/> Continuer avec mon e-mail</button></> : <>
      <form onSubmit={submit}>{mode === "register" && <label>Nom complet<div className="input-wrap"><UserRound/><input name="name" required minLength={2} autoComplete="name" placeholder="Ex. Grâce M."/></div></label>}<label>Adresse e-mail<div className="input-wrap"><Mail/><input type="email" name="email" required autoComplete="email" placeholder="vous@exemple.com"/></div></label><label>Mot de passe<div className="input-wrap"><LockKeyhole/><input type={show ? "text" : "password"} name="password" required minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="6 caractères minimum"/><button type="button" onClick={() => setShow(!show)} aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}>{show ? <EyeOff/> : <Eye/>}</button></div></label>{error && <p className="form-error">{error}</p>}<button className="button primary wide" disabled={busy}>{busy ? "Un instant…" : mode === "login" ? "Se connecter" : "Créer mon compte"}</button></form>
      <div className="divider"><span>ou</span></div><button type="button" className="button wide email-switch" onClick={() => {setWithEmail(false);setError("")}}><Phone/> Continuer avec mon numéro</button></>}
      <p className="legal">En continuant, vous acceptez les conditions d’utilisation.</p>
    </div></section>
  </main>;
}
