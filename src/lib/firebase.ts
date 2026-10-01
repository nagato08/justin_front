import { getApps, initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, signOut } from "firebase/auth";
import type { Auth, ConfirmationResult } from "firebase/auth";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

export const firebaseConfigured = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);

let verifier: RecaptchaVerifier | null = null;

function firebaseAuth(): Auth {
  const auth = getAuth(getApps()[0] ?? initializeApp(config));
  auth.languageCode = "fr";
  return auth;
}

export async function sendOtp(phone: string, container: HTMLElement): Promise<ConfirmationResult> {
  const auth = firebaseAuth();
  verifier?.clear();
  verifier = new RecaptchaVerifier(auth, container, { size: "invisible" });
  try {
    return await signInWithPhoneNumber(auth, phone, verifier);
  } catch (error) {
    verifier.clear();
    verifier = null;
    throw error;
  }
}

/** Valide le code, puis ferme la session Firebase : seule la session de l’API est conservée. */
export async function confirmOtp(confirmation: ConfirmationResult, code: string) {
  const credential = await confirmation.confirm(code);
  const idToken = await credential.user.getIdToken();
  await signOut(firebaseAuth());
  return idToken;
}

export function resetOtp() {
  verifier?.clear();
  verifier = null;
}

const MESSAGES: Record<string, string> = {
  "auth/invalid-phone-number": "Numéro de téléphone invalide.",
  "auth/missing-phone-number": "Saisissez votre numéro de téléphone.",
  "auth/too-many-requests": "Trop de tentatives. Réessayez dans quelques minutes.",
  "auth/quota-exceeded": "Service SMS momentanément indisponible. Réessayez plus tard.",
  "auth/invalid-verification-code": "Code incorrect.",
  "auth/code-expired": "Code expiré. Demandez un nouveau code.",
  "auth/captcha-check-failed": "Vérification anti-robot échouée. Réessayez.",
  "auth/network-request-failed": "Connexion réseau impossible.",
};

export function otpErrorMessage(error: unknown, fallback: string) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  return MESSAGES[code] ?? (error instanceof Error && !code ? error.message : fallback);
}
