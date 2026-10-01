import { ArrowLeft, BellRing, Bike, MapPin, RefreshCw, Smartphone, Store, Wallet } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Header } from "../components/Header";
import { OrderStatus } from "../components/OrderStatus";
import { TrackingMap } from "../components/TrackingMap";
import { Alert, Badge, ConfirmDialog, EmptyState, Skeleton } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { api, ApiError, dateTime, money } from "../lib/api";
import { orderStatusHint, orderStatusLabel, paymentMethodLabel, paymentStatusLabel, paymentStatusTone } from "../lib/labels";
import { subscribeOrderPush } from "../lib/push";
import type { DeliveryTracking, Order } from "../lib/types";

interface Provider { provider: string; displayName?: string }

function providersFrom(data: unknown): Provider[] {
  const root = data as { countries?: Array<{ country: string; providers?: Provider[] }> };
  return root.countries?.find((country) => country.country === "CMR")?.providers
    || root.countries?.flatMap((country) => country.providers || [])
    || [];
}

export function OrderDetailPage() {
  const { reference = "" } = useParams();
  const { token } = useAuth();
  const location = useLocation();
  const [order, setOrder] = useState<Order>();
  const [tracking, setTracking] = useState<DeliveryTracking>();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [message, setMessage] = useState((location.state as { created?: boolean } | null)?.created ? "Commande envoyée. La cuisine va la confirmer très vite." : "");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const load = useCallback(() => api<Order>(`/orders/${reference}/status`, {}, token)
    .then((next) => { setOrder(next); setNotFound(false); })
    .catch((reason: unknown) => {
      if (reason instanceof ApiError && reason.status === 404) setNotFound(true);
      else setError(reason instanceof Error ? reason.message : "Actualisation impossible.");
    }), [reference, token]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 15000);
    return () => window.clearInterval(timer);
  }, [load]);

  const status = order?.status;
  const payment = order?.payments?.[0];

  useEffect(() => {
    if (status === "OUT_FOR_DELIVERY") {
      api<DeliveryTracking>(`/delivery/tracking/${reference}`, {}, token).then(setTracking).catch(() => undefined);
    }
  }, [status, reference, token]);

  useEffect(() => {
    if (payment?.method === "MOBILE_MONEY" && payment.status === "PENDING") {
      api<unknown>("/payments/pawapay/providers").then((data) => setProviders(providersFrom(data))).catch(() => undefined);
    }
  }, [payment?.method, payment?.status]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const enablePush = async () => {
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      await subscribeOrderPush(token, reference);
      setMessage("Notifications activées : vous serez prévenu à chaque étape.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Activation impossible.");
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    setBusy(true);
    try {
      await api(`/orders/${reference}/cancel`, { method: "PATCH", body: JSON.stringify({ reason: "Annulation depuis l’espace client" }) }, token);
      setConfirmCancel(false);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Annulation impossible.");
      setConfirmCancel(false);
    } finally {
      setBusy(false);
    }
  };

  const pay = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await api("/payments/pawapay/deposits", { method: "POST", body: JSON.stringify({ reference, provider: data.get("provider"), phoneNumber: data.get("phone") }) }, token);
      setMessage("Demande envoyée. Validez le paiement sur votre téléphone.");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Paiement impossible.");
    } finally {
      setBusy(false);
    }
  };

  if (notFound) {
    return (
      <>
        <Header />
        <main id="contenu" className="container page narrow">
          <EmptyState icon={Store} title="Commande introuvable" action={<Link className="button primary" to="/orders">Mes commandes</Link>}>
            Cette commande n’existe pas ou n’est pas liée à votre compte.
          </EmptyState>
        </main>
      </>
    );
  }

  if (!order || !payment) {
    return (
      <>
        <Header />
        <main id="contenu" className="container page narrow stack">
          {error ? <Alert tone="danger">{error}</Alert> : <><Skeleton className="skeleton-line lg" /><Skeleton className="skeleton-block" /><Skeleton className="skeleton-block" /></>}
        </main>
      </>
    );
  }

  const destination = order.deliveryLongitude && order.deliveryLatitude ? [Number(order.deliveryLongitude), Number(order.deliveryLatitude)] as [number, number] : undefined;
  const isDelivery = order.fulfillmentType === "DELIVERY";
  const awaitingMobileMoney = payment.method === "MOBILE_MONEY" && payment.status === "PENDING" && order.status !== "CANCELLED";

  return (
    <>
      <Header />
      <main id="contenu" className="container page narrow order-detail">
        <Link to="/orders" className="back-link"><ArrowLeft aria-hidden="true" /> Mes commandes</Link>
        {message && <Alert tone="success" onClose={() => setMessage("")}>{message}</Alert>}
        {error && <Alert tone="danger" onClose={() => setError("")}>{error}</Alert>}

        <section className="status-hero" aria-labelledby="order-title">
          <div className="status-hero-head">
            <div>
              <span className="muted">Commande {order.reference} · {dateTime(order.createdAt)}</span>
              <h1 id="order-title">{orderStatusLabel(order.status)}</h1>
              <p>{orderStatusHint(order.status)}</p>
            </div>
            <button type="button" className="icon-button" onClick={refresh} disabled={refreshing} aria-label="Actualiser le statut" title="Actualiser">
              <RefreshCw className={refreshing ? "spin" : undefined} />
            </button>
          </div>
          <OrderStatus status={order.status} fulfillment={order.fulfillmentType} />
          {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
            <button type="button" className="button secondary sm" onClick={enablePush} disabled={busy}>
              <BellRing aria-hidden="true" /> Me prévenir à chaque étape
            </button>
          )}
        </section>

        {order.status === "OUT_FOR_DELIVERY" && (
          <section className="card live-card" aria-labelledby="live-title">
            <header className="card-head">
              <div>
                <span className="live-label"><span className="live-dot" aria-hidden="true" /> En direct</span>
                <h2 id="live-title">Votre livreur arrive</h2>
                <p className="muted">{tracking ? (tracking.stopsBefore > 0 ? `${tracking.stopsBefore} livraison${tracking.stopsBefore > 1 ? "s" : ""} avant la vôtre` : "Vous êtes le prochain arrêt") : "Connexion à la tournée…"}</p>
              </div>
            </header>
            {token && <TrackingMap token={token} reference={reference} initial={tracking?.latestLocation} destination={destination} />}
          </section>
        )}

        {awaitingMobileMoney && (
          <section className="card pay-card" aria-labelledby="pay-title">
            <header className="card-head">
              <span className="card-icon"><Smartphone aria-hidden="true" /></span>
              <div>
                <h2 id="pay-title">Payer {money(order.total)} par Mobile Money</h2>
                <p className="muted">Choisissez votre opérateur, puis validez la demande qui s’affiche sur votre téléphone.</p>
              </div>
            </header>
            <form onSubmit={pay} className="pay-form">
              <div className="field">
                <label htmlFor="pay-provider">Opérateur</label>
                <select id="pay-provider" name="provider" required defaultValue="">
                  <option value="" disabled>{providers.length ? "Choisir l’opérateur" : "Aucun opérateur disponible"}</option>
                  {providers.map((provider) => <option value={provider.provider} key={provider.provider}>{provider.displayName || provider.provider}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="pay-phone">Numéro Mobile Money</label>
                <input id="pay-phone" name="phone" type="tel" inputMode="numeric" required placeholder="2376XXXXXXXX" minLength={9} defaultValue={order.customerPhone.replace(/^\+/, "")} />
              </div>
              <button className="button primary lg" disabled={busy || !providers.length}>{busy ? "Envoi…" : "Demander le paiement"}</button>
            </form>
          </section>
        )}

        <div className="detail-grid">
          <section className="card" aria-labelledby="content-title">
            <h2 id="content-title" className="card-title">Contenu</h2>
            <ul className="order-lines">
              {order.items.map((item, index) => (
                <li key={index}>
                  <span><b>{item.quantity}×</b> {item.productName}</span>
                  <span className="price">{money(item.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <dl className="summary-rows">
              <div><dt>Sous-total</dt><dd>{money(order.subtotal)}</dd></div>
              <div><dt>Livraison</dt><dd>{isDelivery ? money(order.deliveryFee) : "Gratuit"}</dd></div>
            </dl>
            <div className="summary-total"><span>Total</span><strong>{money(order.total)}</strong></div>
          </section>

          <section className="card" aria-labelledby="info-title">
            <h2 id="info-title" className="card-title">Réception et paiement</h2>
            <ul className="info-list">
              <li>
                <span className="info-icon">{isDelivery ? <Bike aria-hidden="true" /> : <Store aria-hidden="true" />}</span>
                <div><small>Mode</small><strong>{isDelivery ? "Livraison" : "Retrait sur place"}</strong></div>
              </li>
              {order.deliveryAddress && (
                <li>
                  <span className="info-icon"><MapPin aria-hidden="true" /></span>
                  <div><small>Adresse</small><strong>{order.deliveryAddress}</strong></div>
                </li>
              )}
              <li>
                <span className="info-icon"><Wallet aria-hidden="true" /></span>
                <div>
                  <small>Paiement</small>
                  <strong>{paymentMethodLabel(payment.method)}</strong>
                  <Badge tone={paymentStatusTone(payment.status)}>{paymentStatusLabel(payment.status)}</Badge>
                </div>
              </li>
            </ul>
            {order.status === "PENDING" && (
              <button type="button" className="button ghost danger-text block" disabled={busy} onClick={() => setConfirmCancel(true)}>
                Annuler la commande
              </button>
            )}
          </section>
        </div>

        <p className="muted small">Le statut s’actualise automatiquement toutes les 15 secondes.</p>

        {confirmCancel && (
          <ConfirmDialog title="Annuler cette commande ?" confirmLabel="Oui, annuler" busy={busy} onConfirm={cancel} onCancel={() => setConfirmCancel(false)}>
            La cuisine n’a pas encore confirmé votre commande. L’annulation est immédiate et définitive.
          </ConfirmDialog>
        )}
      </main>
    </>
  );
}
