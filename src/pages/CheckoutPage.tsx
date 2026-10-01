import { ArrowLeft, Banknote, Bike, Check, MapPin, Smartphone, Store } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { MapPicker, type Coordinates } from "../components/MapPicker";
import { Alert } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { api, money } from "../lib/api";
import type { Order, StoreStatus } from "../lib/types";

interface Quote { fee: string; zoneName?: string; distanceKm?: number }
type Fulfillment = "DELIVERY" | "PICKUP";
type PaymentMethod = "CASH" | "MOBILE_MONEY";

const MINIMUM_DELIVERY_FEE = 500;

export function CheckoutPage() {
  const { user, token } = useAuth();
  const { lines, total, clear } = useCart();
  const navigate = useNavigate();
  const [fulfillment, setFulfillment] = useState<Fulfillment>("DELIVERY");
  const [payment, setPayment] = useState<PaymentMethod>("CASH");
  const [store, setStore] = useState<StoreStatus | null>(null);
  const [coords, setCoords] = useState<Coordinates>();
  const [quote, setQuote] = useState<Quote>();
  const [quoteError, setQuoteError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  // Une seule clé par passage sur cette page : un nouvel essai après une coupure réseau ne crée pas de doublon.
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  useEffect(() => {
    api<StoreStatus>("/store/status").then(setStore).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!lines.length && !busy) navigate("/panier", { replace: true });
  }, [lines.length, busy, navigate]);

  useEffect(() => {
    if (!coords || fulfillment !== "DELIVERY") return;
    const timer = window.setTimeout(() => {
      api<Quote>("/delivery/quote", { method: "POST", body: JSON.stringify(coords) })
        .then((next) => { setQuote(next); setQuoteError(""); })
        .catch((reason: unknown) => { setQuote(undefined); setQuoteError(reason instanceof Error ? reason.message : "Zone non desservie."); });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [coords, fulfillment]);

  const mobileMoneyEnabled = Boolean(store?.mobileMoneyEnabled);
  const isDelivery = fulfillment === "DELIVERY";
  const deliveryFee = isDelivery ? Number(quote?.fee ?? MINIMUM_DELIVERY_FEE) : 0;
  const grandTotal = total + deliveryFee;
  const blockedByZone = isDelivery && Boolean(quoteError);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isDelivery && !coords) {
      setError("Placez le point de livraison sur la carte pour continuer.");
      document.getElementById("etape-livraison")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const order = await api<Order>(
        "/orders",
        {
          method: "POST",
          headers: { "idempotency-key": idempotencyKey },
          body: JSON.stringify({
            customerName: data.get("name"),
            customerPhone: data.get("phone"),
            fulfillmentType: fulfillment,
            paymentMethod: payment,
            deliveryAddress: isDelivery ? data.get("address") : undefined,
            deliveryLatitude: isDelivery ? coords?.latitude : undefined,
            deliveryLongitude: isDelivery ? coords?.longitude : undefined,
            deliveryInstructions: (isDelivery && data.get("instructions")) || undefined,
            items: lines.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
          }),
        },
        token,
      );
      clear();
      navigate(`/orders/${order.reference}`, { state: { created: true }, replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "La commande n’a pas pu être envoyée. Réessayez.");
      setBusy(false);
    }
  };

  const submitLabel = busy ? "Envoi de la commande…" : "Confirmer la commande";
  const submitDisabled = busy || !lines.length || blockedByZone || store?.isOpen === false;

  return (
    <>
      <Header />
      <main id="contenu" className="container page checkout-page">
        <Link to="/panier" className="back-link"><ArrowLeft aria-hidden="true" /> Retour au panier</Link>
        <div className="page-header"><div><h1>Finaliser ma commande</h1><p>Encore quelques informations et c’est parti.</p></div></div>

        {store?.isOpen === false && <Alert tone="warning"><strong>Les commandes sont fermées.</strong> {store.message}</Alert>}

        <form className="split-layout" onSubmit={submit}>
          <div className="checkout-steps">
            <CheckoutStep number={1} title="Mode de réception">
              <div className="choice-grid" role="radiogroup" aria-label="Mode de réception">
                <ChoiceCard checked={isDelivery} onSelect={() => setFulfillment("DELIVERY")} icon={<Bike />} title="Livraison" description={`Dès ${money(MINIMUM_DELIVERY_FEE)}`} />
                <ChoiceCard checked={!isDelivery} onSelect={() => setFulfillment("PICKUP")} icon={<Store />} title="Retrait sur place" description="Gratuit" />
              </div>
            </CheckoutStep>

            <CheckoutStep number={2} title="Vos coordonnées" description="Pour vous prévenir quand votre repas arrive.">
              <div className="field-row">
                <div className="field">
                  <label htmlFor="checkout-name">Nom complet</label>
                  <input id="checkout-name" name="name" defaultValue={user?.displayName} required minLength={2} autoComplete="name" />
                </div>
                <div className="field">
                  <label htmlFor="checkout-phone">Téléphone</label>
                  <input id="checkout-phone" name="phone" type="tel" inputMode="tel" defaultValue={user?.phone ?? undefined} placeholder="+237 6 90 00 00 00" required pattern="\+?[0-9 ]{8,20}" autoComplete="tel" />
                </div>
              </div>
            </CheckoutStep>

            {isDelivery && (
              <CheckoutStep number={3} title="Lieu de livraison" description="Placez le repère exactement là où le livreur doit vous retrouver." id="etape-livraison">
                <MapPicker value={coords} onChange={(value) => { setCoords(value); setError(""); }} />
                {quote && (
                  <div className="quote">
                    <MapPin aria-hidden="true" />
                    <span>{quote.zoneName || "Zone desservie"}{quote.distanceKm ? ` · ${quote.distanceKm} km` : ""}</span>
                    <strong>{money(quote.fee)}</strong>
                  </div>
                )}
                {quoteError && <Alert tone="danger">{quoteError} Choisissez un autre point ou optez pour le retrait.</Alert>}
                <div className="field">
                  <label htmlFor="checkout-address">Adresse ou point de repère</label>
                  <input id="checkout-address" name="address" placeholder="Quartier, rue, immeuble, couleur du portail…" required maxLength={300} />
                </div>
                <div className="field">
                  <label htmlFor="checkout-instructions">Instructions pour le livreur <span className="optional">facultatif</span></label>
                  <textarea id="checkout-instructions" name="instructions" rows={2} maxLength={500} placeholder="Ex. Appelez en arrivant, 2ᵉ étage" />
                </div>
              </CheckoutStep>
            )}

            <CheckoutStep number={isDelivery ? 4 : 3} title="Paiement">
              <div className="choice-grid" role="radiogroup" aria-label="Moyen de paiement">
                <ChoiceCard checked={payment === "CASH"} onSelect={() => setPayment("CASH")} icon={<Banknote />} title="Espèces" description={isDelivery ? "À la livraison" : "Au retrait"} />
                <ChoiceCard
                  checked={payment === "MOBILE_MONEY"}
                  onSelect={() => setPayment("MOBILE_MONEY")}
                  disabled={!mobileMoneyEnabled}
                  icon={<Smartphone />}
                  title="Mobile Money"
                  description={mobileMoneyEnabled ? "Réglé juste après la commande" : "Bientôt disponible"}
                />
              </div>
            </CheckoutStep>

            <section className="checkout-recap mobile-only" aria-label="Contenu de la commande">
              <h2>Votre commande</h2>
              <OrderLines lines={lines} />
            </section>
          </div>

          <aside className="summary-card sticky-desktop" aria-label="Récapitulatif">
            <h2>Votre commande</h2>
            <OrderLines lines={lines} />
            <dl className="summary-rows">
              <div><dt>Sous-total</dt><dd>{money(total)}</dd></div>
              <div>
                <dt>Livraison</dt>
                <dd>{!isDelivery ? "Gratuit" : quote ? money(quote.fee) : <span className="muted">dès {money(MINIMUM_DELIVERY_FEE)}</span>}</dd>
              </div>
            </dl>
            <div className="summary-total"><span>Total</span><strong>{money(grandTotal)}</strong></div>
            {error && <p className="field-error" role="alert">{error}</p>}
            <button className="button primary block lg" disabled={submitDisabled}>{submitLabel}</button>
            <p className="summary-note">Vous pourrez annuler tant que la cuisine n’a pas confirmé.</p>
          </aside>

          <div className="mobile-action-bar">
            <div>
              <small>Total{isDelivery && !quote ? " estimé" : ""}</small>
              <strong>{money(grandTotal)}</strong>
            </div>
            <button className="button primary lg" disabled={submitDisabled}>{busy ? "Envoi…" : "Confirmer"}</button>
          </div>
          {error && <div className="mobile-only"><Alert tone="danger">{error}</Alert></div>}
        </form>
      </main>
    </>
  );
}

function CheckoutStep({ number, title, description, id, children }: { number: number; title: string; description?: string; id?: string; children: ReactNode }) {
  return (
    <section className="checkout-step" id={id} aria-labelledby={`step-${number}`}>
      <header>
        <span className="step-number" aria-hidden="true">{number}</span>
        <div>
          <h2 id={`step-${number}`}>{title}</h2>
          {description && <p>{description}</p>}
        </div>
      </header>
      <div className="checkout-step-body">{children}</div>
    </section>
  );
}

function ChoiceCard({ checked, onSelect, icon, title, description, disabled }: { checked: boolean; onSelect(): void; icon: ReactNode; title: string; description: string; disabled?: boolean }) {
  return (
    <button type="button" role="radio" aria-checked={checked} className="choice-card" onClick={onSelect} disabled={disabled}>
      <span className="choice-icon" aria-hidden="true">{icon}</span>
      <span className="choice-text"><strong>{title}</strong><small>{description}</small></span>
      <span className="choice-check" aria-hidden="true">{checked && <Check />}</span>
    </button>
  );
}

function OrderLines({ lines }: { lines: ReturnType<typeof useCart>["lines"] }) {
  return (
    <ul className="order-lines">
      {lines.map((line) => (
        <li key={line.product.id}>
          <span><b>{line.quantity}×</b> {line.product.name}</span>
          <span className="price">{money(Number(line.product.price) * line.quantity)}</span>
        </li>
      ))}
    </ul>
  );
}
