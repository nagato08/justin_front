import { ArrowLeft, ArrowRight, ImageOff, ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { ConfirmDialog, EmptyState, PageHeader, QuantityStepper } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { money } from "../lib/api";
import { productImageUrls } from "../lib/products";

const MINIMUM_DELIVERY_FEE = 500;

export function CartPage() {
  const { lines, count, total, setQuantity, clear } = useCart();
  const { user } = useAuth();
  const [confirmClear, setConfirmClear] = useState(false);
  const next = user ? "/commande" : "/connexion";
  const nextState = user ? undefined : { from: "/commande" };

  return (
    <>
      <Header />
      <main id="contenu" className="container page cart-page">
        <Link to="/" className="back-link"><ArrowLeft aria-hidden="true" /> Continuer mes achats</Link>
        <PageHeader
          title="Mon panier"
          description={lines.length ? `${count} article${count > 1 ? "s" : ""} sélectionné${count > 1 ? "s" : ""}` : undefined}
          actions={lines.length > 0 && <button type="button" className="button ghost sm danger-text" onClick={() => setConfirmClear(true)}><Trash2 aria-hidden="true" /> Vider</button>}
        />

        {!lines.length ? (
          <EmptyState icon={ShoppingBag} title="Votre panier est vide" action={<Link className="button primary" to="/">Découvrir le menu</Link>}>
            Ajoutez les plats qui vous font envie, ils apparaîtront ici.
          </EmptyState>
        ) : (
          <div className="split-layout">
            <ul className="cart-list" aria-label="Articles du panier">
              {lines.map(({ product, quantity }) => {
                const image = productImageUrls(product)[0];
                return (
                  <li className="cart-item" key={product.id}>
                    <Link to={`/produit/${product.slug}`} className="cart-thumb" tabIndex={-1} aria-hidden="true">
                      {image ? <img src={image} alt="" /> : <ImageOff />}
                    </Link>
                    <div className="cart-item-info">
                      <Link to={`/produit/${product.slug}`} className="cart-item-name">{product.name}</Link>
                      <span className="muted">{money(product.price)} l’unité</span>
                    </div>
                    <QuantityStepper size="sm" value={quantity} onChange={(value) => setQuantity(product.id, value)} label={product.name} />
                    <strong className="cart-item-total price">{money(Number(product.price) * quantity)}</strong>
                  </li>
                );
              })}
            </ul>

            <aside className="summary-card sticky-desktop" aria-label="Récapitulatif">
              <h2>Récapitulatif</h2>
              <dl className="summary-rows">
                <div><dt>Sous-total</dt><dd>{money(total)}</dd></div>
                <div><dt>Livraison</dt><dd className="muted">calculée à l’étape suivante</dd></div>
              </dl>
              <div className="summary-total"><span>Total provisoire</span><strong>{money(total)}</strong></div>
              <p className="summary-note">Livraison à partir de {money(MINIMUM_DELIVERY_FEE)} selon votre quartier. Retrait sur place gratuit.</p>
              <Link className="button primary block lg" to={next} state={nextState}>
                {user ? "Passer la commande" : "Se connecter pour commander"} <ArrowRight aria-hidden="true" />
              </Link>
            </aside>

            <div className="mobile-action-bar">
              <div>
                <small>Total provisoire</small>
                <strong>{money(total)}</strong>
              </div>
              <Link className="button primary lg" to={next} state={nextState}>
                {user ? "Commander" : "Se connecter"} <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}
        {confirmClear && (
          <ConfirmDialog
            title="Vider le panier ?"
            confirmLabel="Vider le panier"
            onCancel={() => setConfirmClear(false)}
            onConfirm={() => { clear(); setConfirmClear(false); }}
          >
            Tous les plats sélectionnés seront retirés.
          </ConfirmDialog>
        )}
      </main>
    </>
  );
}
