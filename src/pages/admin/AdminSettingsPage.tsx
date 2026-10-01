import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Alert, PageHeader, Skeleton } from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../lib/api";

interface Settings {
  businessName: string;
  isManuallyClosed: boolean;
  manualClosureReason?: string;
  defaultDeliveryFee: string;
  mobileMoneyEnabled: boolean;
  dailyOrderLimit?: number;
  dailyPortionLimit?: number;
}

export function AdminSettingsPage() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<Settings>();
  const [closed, setClosed] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Settings>("/store/settings", {}, token)
      .then((next) => {
        setSettings(next);
        setClosed(next.isManuallyClosed);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Chargement impossible."));
  }, [token]);

  useEffect(() => {
    if (!saved) return;
    const timer = window.setTimeout(() => setSaved(false), 3000);
    return () => window.clearTimeout(timer);
  }, [saved]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const next = await api<Settings>("/store/settings", {
        method: "PATCH",
        body: JSON.stringify({
          businessName: data.get("businessName"),
          isManuallyClosed: closed,
          manualClosureReason: closed ? data.get("reason") || null : settings?.manualClosureReason ?? null,
          defaultDeliveryFee: Number(data.get("fee")),
          mobileMoneyEnabled: data.get("mobile") === "on",
          dailyOrderLimit: data.get("limit") ? Number(data.get("limit")) : null,
          dailyPortionLimit: data.get("portions") ? Number(data.get("portions")) : null,
        }),
      }, token);
      setSettings(next);
      setDirty(false);
      setSaved(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  };

  if (!settings) {
    return (
      <div className="admin-page">
        <PageHeader title="Réglages" />
        {error ? <Alert tone="danger">{error}</Alert> : <div className="stack"><Skeleton className="skeleton-block" /><Skeleton className="skeleton-block" /></div>}
      </div>
    );
  }

  return (
    <div className="admin-page">
      <PageHeader title="Réglages" description="Ouverture des commandes, limites et paiements." />
      {error && <Alert tone="danger" onClose={() => setError("")}>{error}</Alert>}

      <form className="settings" onSubmit={submit} onChange={() => setDirty(true)}>
        <SettingsSection title="Prise de commandes" description="Fermez les commandes en un geste, par exemple quand tout est réservé.">
          <label className="switch-row large">
            <span>
              <strong>{closed ? "Commandes fermées" : "Commandes ouvertes"}</strong>
              <small>{closed ? "Les clients voient le menu mais ne peuvent pas commander." : "Les clients peuvent commander en ce moment."}</small>
            </span>
            <input type="checkbox" className="switch" checked={!closed} onChange={(event) => setClosed(!event.target.checked)} aria-label="Accepter les commandes" />
          </label>
          {closed && (
            <div className="field">
              <label htmlFor="settings-reason">Message affiché aux clients</label>
              <textarea id="settings-reason" name="reason" rows={2} defaultValue={settings.manualClosureReason || ""} placeholder="Ex. Toutes les portions du jour sont réservées. Retour demain à 18 h." />
            </div>
          )}
          <div className="field-row">
            <div className="field">
              <label htmlFor="settings-limit">Commandes max. par jour <span className="optional">facultatif</span></label>
              <input id="settings-limit" name="limit" type="number" min="1" inputMode="numeric" defaultValue={settings.dailyOrderLimit} placeholder="Illimité" />
            </div>
            <div className="field">
              <label htmlFor="settings-portions">Portions max. par jour <span className="optional">facultatif</span></label>
              <input id="settings-portions" name="portions" type="number" min="1" inputMode="numeric" defaultValue={settings.dailyPortionLimit} placeholder="Illimité" />
            </div>
          </div>
        </SettingsSection>

        <SettingsSection title="Boutique" description="Informations générales et livraison.">
          <div className="field">
            <label htmlFor="settings-name">Nom de l’activité</label>
            <input id="settings-name" name="businessName" defaultValue={settings.businessName} required />
          </div>
          <div className="field">
            <label htmlFor="settings-fee">Frais de livraison par défaut</label>
            <div className="input-group">
              <input id="settings-fee" name="fee" type="number" min="500" step="50" inputMode="numeric" defaultValue={settings.defaultDeliveryFee} required />
              <span className="input-suffix">FCFA</span>
            </div>
            <small className="field-hint">Appliqués hors zones configurées. Minimum 500 FCFA.</small>
          </div>
        </SettingsSection>

        <SettingsSection title="Paiements" description="Les espèces sont toujours acceptées.">
          <label className="switch-row large">
            <span>
              <strong>Mobile Money</strong>
              <small>Les clients paient via PawaPay juste après leur commande.</small>
            </span>
            <input name="mobile" type="checkbox" className="switch" defaultChecked={settings.mobileMoneyEnabled} />
          </label>
        </SettingsSection>

        <div className={dirty || saved ? "save-bar visible" : "save-bar"}>
          <span>{saved ? "Modifications enregistrées." : "Modifications non enregistrées."}</span>
          <button className="button primary" disabled={busy || !dirty}><Save aria-hidden="true" /> {busy ? "Enregistrement…" : "Enregistrer"}</button>
        </div>
      </form>
    </div>
  );
}

function SettingsSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="settings-section">
      <header>
        <h2>{title}</h2>
        <p>{description}</p>
      </header>
      <div className="card stack">{children}</div>
    </section>
  );
}
