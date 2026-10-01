import { ArrowLeft, Check, ShoppingBag, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CartBar } from "../components/CartBar";
import { Header } from "../components/Header";
import { ProductGallery } from "../components/ProductGallery";
import { Alert, EmptyState, QuantityStepper, Skeleton } from "../components/ui";
import { useCart } from "../contexts/CartContext";
import { api, money } from "../lib/api";
import type { Product, StoreStatus } from "../lib/types";

export function ProductDetailPage() {
  const { slug = "" } = useParams();
  const { lines, add } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [store, setStore] = useState<StoreStatus | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api<Product>(`/catalog/products/${encodeURIComponent(slug)}`), api<StoreStatus>("/store/status")])
      .then(([nextProduct, status]) => {
        setProduct(nextProduct);
        setStore(status);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Plat introuvable."));
  }, [slug]);

  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => setAdded(false), 2400);
    return () => window.clearTimeout(timer);
  }, [added]);

  const inCart = product ? lines.find((line) => line.product.id === product.id)?.quantity ?? 0 : 0;

  const addToCart = () => {
    if (!product) return;
    add(product, quantity);
    setAdded(true);
    setQuantity(1);
  };

  return (
    <>
      <Header />
      <main id="contenu" className="container page product-page">
        <Link className="back-link" to="/#menu"><ArrowLeft aria-hidden="true" /> Retour au menu</Link>
        {error ? (
          <EmptyState icon={ShoppingBag} title={error} action={<Link className="button primary" to="/">Voir le menu</Link>}>
            Ce plat n’est peut-être plus disponible aujourd’hui.
          </EmptyState>
        ) : !product ? (
          <div className="product-layout">
            <Skeleton className="skeleton-gallery" />
            <div className="stack"><Skeleton className="skeleton-line lg" /><Skeleton className="skeleton-line" /><Skeleton className="skeleton-line sm" /></div>
          </div>
        ) : (
          <div className="product-layout">
            <ProductGallery product={product} />
            <section className="product-info">
              <span className="eyebrow">{product.category?.name ?? "Au menu"}</span>
              <h1>{product.name}</h1>
              <p className="product-price">{money(product.price)}</p>
              {product.portions > 1 && (
                <p className="product-meta"><UsersRound aria-hidden="true" /> Prévu pour {product.portions} personnes</p>
              )}
              <p className="product-description">{product.description || "Portion généreuse, préparée à la commande."}</p>

              {store && !store.isOpen && <Alert tone="warning"><strong>Commandes fermées.</strong> {store.message}</Alert>}

              <div className="buy-box">
                <QuantityStepper value={quantity} min={1} onChange={setQuantity} label="Quantité" />
                <button type="button" className={added ? "button success lg grow" : "button primary lg grow"} onClick={addToCart} disabled={!store?.isOpen}>
                  {added ? <><Check aria-hidden="true" /> Ajouté au panier</> : <><ShoppingBag aria-hidden="true" /> Ajouter <span className="price">· {money(Number(product.price) * quantity)}</span></>}
                </button>
              </div>
              {inCart > 0 && (
                <p className="in-cart-note">
                  Déjà {inCart} dans votre panier · <Link to="/panier">Voir le panier</Link>
                </p>
              )}
            </section>
          </div>
        )}
      </main>
      <CartBar />
    </>
  );
}
