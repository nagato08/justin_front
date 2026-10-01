import { ArrowRight, KeyRound, Phone, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { ConfirmationResult } from "firebase/auth";
import { ApiError } from "../lib/api";
import { confirmOtp, firebaseConfigured, otpErrorMessage, resetOtp, sendOtp } from "../lib/firebase";
import { normalizePhone } from "../lib/phone";
import { Alert } from "./ui";

type Step = "phone" | "code" | "name";

interface PhoneAuthProps {
  onVerified(idToken: string, displayName?: string): Promise<void>;
}

/**
 * Connexion et inscription se font dans le même parcours : le serveur crée
 * le compte au premier passage et demande alors le nom (réponse 428).
 */
export function PhoneAuth({ onVerified }: PhoneAuthProps) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [idToken, setIdToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const confirmation = useRef<ConfirmationResult | null>(null);
  const recaptcha = useRef<HTMLDivElement>(null);
  useEffect(() => resetOtp, []);

  if (!firebaseConfigured) {
    return <Alert tone="warning">La connexion par SMS n’est pas encore configurée. Utilisez votre e-mail.</Alert>;
  }

  const run = async (action: () => Promise<void>, fallback: string) => {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (reason) {
      setError(otpErrorMessage(reason, fallback));
    } finally {
      setBusy(false);
    }
  };

  const authenticate = async (token: string, displayName?: string) => {
    try {
      await onVerified(token, displayName);
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 428) {
        setIdToken(token);
        setStep("name");
        return;
      }
      throw reason;
    }
  };

  const requestCode = (event?: FormEvent) => {
    event?.preventDefault();
    void run(async () => {
      confirmation.current = await sendOtp(normalizePhone(phone), recaptcha.current!);
      setStep("code");
    }, "Envoi du code impossible.");
  };

  const verifyCode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("code"));
    void run(async () => {
      await authenticate(await confirmOtp(confirmation.current!, code));
    }, "Code invalide.");
  };

  const finishProfile = (event: FormEvent) => {
    event.preventDefault();
    void run(() => authenticate(idToken, name.trim()), "Création du compte impossible.");
  };

  const restart = () => {
    resetOtp();
    confirmation.current = null;
    setStep("phone");
    setError("");
  };

  const errorBlock = error && <p className="field-error" role="alert">{error}</p>;

  return (
    <div className="phone-auth">
      {step === "phone" && (
        <form onSubmit={requestCode}>
          <div className="field">
            <label htmlFor="auth-phone">Numéro de téléphone</label>
            <div className="input-group">
              <Phone aria-hidden="true" />
              <span className="input-prefix">+237</span>
              <input
                id="auth-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                type="tel"
                inputMode="tel"
                required
                autoComplete="tel-national"
                placeholder="6 90 00 00 00"
                aria-describedby="auth-phone-hint"
              />
            </div>
            <small id="auth-phone-hint" className="field-hint">Nous vous envoyons un code à 6 chiffres par SMS.</small>
          </div>
          {errorBlock}
          <button className="button primary block lg" disabled={busy || phone.trim().length < 8}>
            {busy ? "Envoi du code…" : <>Recevoir le code <ArrowRight aria-hidden="true" /></>}
          </button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={verifyCode}>
          <p className="otp-sent">
            Code envoyé au <strong>{normalizePhone(phone)}</strong>
            <button type="button" className="link-button" onClick={restart}>Modifier</button>
          </p>
          <div className="field">
            <label htmlFor="auth-code">Code de vérification</label>
            <div className="input-group">
              <KeyRound aria-hidden="true" />
              <input
                id="auth-code"
                name="code"
                className="otp-input"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                required
                autoFocus
                placeholder="••••••"
              />
            </div>
          </div>
          {errorBlock}
          <button className="button primary block lg" disabled={busy}>{busy ? "Vérification…" : "Valider le code"}</button>
          <button type="button" className="link-button centered" onClick={() => requestCode()} disabled={busy}>
            Je n’ai rien reçu, renvoyer le code
          </button>
        </form>
      )}

      {step === "name" && (
        <form onSubmit={finishProfile}>
          <Alert tone="success">Numéro vérifié. Bienvenue !</Alert>
          <div className="field">
            <label htmlFor="auth-name">Comment vous appelez-vous ?</label>
            <div className="input-group">
              <UserRound aria-hidden="true" />
              <input
                id="auth-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                minLength={2}
                autoComplete="name"
                autoFocus
                placeholder="Ex. Grâce Mbarga"
              />
            </div>
            <small className="field-hint">Ce nom sera utilisé par le livreur pour vous trouver.</small>
          </div>
          {errorBlock}
          <button className="button primary block lg" disabled={busy || name.trim().length < 2}>
            {busy ? "Création…" : "Créer mon compte"}
          </button>
        </form>
      )}
      <div ref={recaptcha} />
    </div>
  );
}
