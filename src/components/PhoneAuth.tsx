import { KeyRound, Phone, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { ConfirmationResult } from "firebase/auth";
import { ApiError } from "../lib/api";
import { confirmOtp, firebaseConfigured, otpErrorMessage, resetOtp, sendOtp } from "../lib/firebase";
import { normalizePhone } from "../lib/phone";

type Step = "phone" | "code" | "name";

export function PhoneAuth({ askName, onVerified }: { askName: boolean; onVerified(idToken: string, displayName?: string): Promise<void> }) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [idToken, setIdToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const confirmation = useRef<ConfirmationResult | null>(null);
  const recaptcha = useRef<HTMLDivElement>(null);
  useEffect(() => resetOtp, []);

  if (!firebaseConfigured) return <div className="google-unavailable">Connexion par SMS en attente de configuration</div>;

  const run = async (action: () => Promise<void>, fallback: string) => {
    setBusy(true); setError("");
    try { await action(); } catch (reason) { setError(otpErrorMessage(reason, fallback)); } finally { setBusy(false); }
  };
  const authenticate = async (token: string, displayName?: string) => {
    try { await onVerified(token, displayName); }
    catch (reason) {
      if (reason instanceof ApiError && reason.status === 428) { setIdToken(token); setStep("name"); return; }
      throw reason;
    }
  };

  const requestCode = (event: FormEvent) => { event.preventDefault(); void run(async () => {
    confirmation.current = await sendOtp(normalizePhone(phone), recaptcha.current!);
    setStep("code");
  }, "Envoi du code impossible."); };
  const verifyCode = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const code = String(new FormData(event.currentTarget).get("code")); void run(async () => {
    await authenticate(await confirmOtp(confirmation.current!, code), askName ? name.trim() : undefined);
  }, "Code invalide."); };
  const finishProfile = (event: FormEvent) => { event.preventDefault(); void run(() => authenticate(idToken, name.trim()), "Création du compte impossible."); };
  const restart = () => { resetOtp(); confirmation.current = null; setStep("phone"); setError(""); };

  return <div className="phone-auth">
    {step === "phone" && <form onSubmit={requestCode}>
      {askName && <label>Nom complet<div className="input-wrap"><UserRound/><input value={name} onChange={e => setName(e.target.value)} required minLength={2} autoComplete="name" placeholder="Ex. Grâce M."/></div></label>}
      <label>Numéro de téléphone<div className="input-wrap"><Phone/><input value={phone} onChange={e => setPhone(e.target.value)} type="tel" inputMode="tel" required autoComplete="tel" placeholder="6 90 00 00 00"/></div></label>
      <small className="field-hint">Vous recevrez un code par SMS. Préfixe +237 ajouté automatiquement.</small>
      {error && <p className="form-error">{error}</p>}
      <button className="button primary wide" disabled={busy}>{busy ? "Envoi…" : "Recevoir le code"}</button>
    </form>}
    {step === "code" && <form onSubmit={verifyCode}>
      <p className="otp-sent">Code envoyé au <b>{normalizePhone(phone)}</b>. <button type="button" className="text-button" onClick={restart}>Modifier</button></p>
      <label>Code de vérification<div className="input-wrap"><KeyRound/><input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required autoFocus placeholder="6 chiffres"/></div></label>
      {error && <p className="form-error">{error}</p>}
      <button className="button primary wide" disabled={busy}>{busy ? "Vérification…" : "Valider"}</button>
    </form>}
    {step === "name" && <form onSubmit={finishProfile}>
      <p className="otp-sent">Numéro vérifié. Dernière étape : comment vous appeler ?</p>
      <label>Nom complet<div className="input-wrap"><UserRound/><input value={name} onChange={e => setName(e.target.value)} required minLength={2} autoComplete="name" autoFocus placeholder="Ex. Grâce M."/></div></label>
      {error && <p className="form-error">{error}</p>}
      <button className="button primary wide" disabled={busy}>{busy ? "Un instant…" : "Créer mon compte"}</button>
    </form>}
    <div ref={recaptcha}/>
  </div>;
}
