import { Download, Share2, Smartphone, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type InstallChoice = { outcome: "accepted" | "dismissed"; platform: string };
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<InstallChoice>;
}

const DISMISSED_AT = "ma-cuisine-pwa-dismissed-at";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000;

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches
    || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

export function PwaInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const isIOS = useMemo(() => /iphone|ipad|ipod/i.test(navigator.userAgent), []);

  useEffect(() => {
    if (isStandalone()) return;
    const dismissedAt = Number(localStorage.getItem(DISMISSED_AT) || 0);
    if (Date.now() - dismissedAt < DISMISS_DURATION) return;

    const mobile = window.matchMedia("(max-width: 800px)").matches
      || /android|iphone|ipad|ipod/i.test(navigator.userAgent);
    const fallbackTimer = mobile ? window.setTimeout(() => setVisible(true), 1800) : undefined;

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setPromptEvent(null);
      localStorage.removeItem(DISMISSED_AT);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_AT, String(Date.now()));
    setVisible(false);
  };

  const install = async () => {
    if (!promptEvent) {
      setShowHelp(true);
      return;
    }
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    setPromptEvent(null);
    if (choice.outcome === "accepted") setVisible(false);
    else dismiss();
  };

  if (!visible) return null;

  return <aside className="pwa-install" role="dialog" aria-label="Installer l’application">
    <button className="pwa-install-close" type="button" onClick={dismiss} aria-label="Fermer"><X/></button>
    <div className="pwa-install-icon"><Smartphone/></div>
    <div className="pwa-install-copy">
      <strong>Installez Ma cuisine</strong>
      {!showHelp
        ? <p>Accédez au menu et suivez vos commandes directement depuis votre écran d’accueil.</p>
        : isIOS
          ? <p className="pwa-install-help"><Share2/> Touchez <b>Partager</b>, puis <b>Sur l’écran d’accueil</b>.</p>
          : <p className="pwa-install-help">Ouvrez le menu du navigateur <b>⋮</b>, puis choisissez <b>Installer l’application</b>.</p>}
    </div>
    {!showHelp && <button className="button primary pwa-install-action" type="button" onClick={install}>
      <Download/> {promptEvent ? "Installer" : "Voir comment"}
    </button>}
  </aside>;
}
