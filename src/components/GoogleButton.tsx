import { useEffect, useRef } from "react";

declare global { interface Window { google?: { accounts: { id: { initialize(options: { client_id: string; callback(response: { credential: string }): void }): void; renderButton(element: HTMLElement, options: object): void } } } } }
export function GoogleButton({ onCredential }: { onCredential(token: string): void }) {
  const ref = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  useEffect(() => { callbackRef.current = onCredential; }, [onCredential]);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  useEffect(() => {
    if (!clientId || !ref.current) return;
    const render = () => {
      if (!window.google || !ref.current) return;
      ref.current.replaceChildren();
      window.google.accounts.id.initialize({ client_id: clientId, callback: ({ credential }) => callbackRef.current(credential) });
      window.google.accounts.id.renderButton(ref.current, { theme: "outline", size: "large", shape: "rectangular", width: 400, text: "continue_with", logo_alignment: "left" });
    };
    if (window.google) { render(); return; }
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) { existing.addEventListener("load", render, { once: true }); return; }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = render;
    document.head.appendChild(script);
  }, [clientId]);
  if (!clientId) return <div className="google-unavailable">Connexion Google en attente de configuration</div>;
  return <div className="google-button" ref={ref} aria-label="Continuer avec Google"/>;
}
