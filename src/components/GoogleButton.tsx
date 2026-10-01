import { useEffect, useRef } from "react";
import { Alert } from "./ui";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(options: { client_id: string; callback(response: { credential: string }): void }): void;
          renderButton(element: HTMLElement, options: object): void;
        };
      };
    };
  }
}

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

export function GoogleButton({ onCredential }: { onCredential(token: string): void }) {
  const ref = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!clientId || !ref.current) return;
    const render = () => {
      if (!window.google || !ref.current) return;
      ref.current.replaceChildren();
      window.google.accounts.id.initialize({ client_id: clientId, callback: ({ credential }) => callbackRef.current(credential) });
      // Le bouton Google n’accepte qu’une largeur fixe : on prend celle du conteneur (400 px max).
      const width = Math.min(400, Math.round(ref.current.getBoundingClientRect().width)) || 320;
      window.google.accounts.id.renderButton(ref.current, { theme: "outline", size: "large", shape: "pill", width, text: "continue_with", logo_alignment: "center", locale: "fr" });
    };
    if (window.google) {
      render();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", render, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = render;
    document.head.appendChild(script);
  }, [clientId]);

  if (!clientId) return <Alert tone="warning">La connexion Google n’est pas encore configurée. Utilisez votre e-mail.</Alert>;
  return (
    <>
      <div className="google-button" ref={ref} aria-label="Continuer avec Google" />
      <p className="auth-hint">Le plus rapide : aucun mot de passe à retenir.</p>
    </>
  );
}
