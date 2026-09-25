import { ArrowLeft, Minus, Plus, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Header } from "../components/Header";
import { ProductGallery } from "../components/ProductGallery";
import { useCart } from "../contexts/CartContext";
import { api, money } from "../lib/api";
import type { Product, StoreStatus } from "../lib/types";

export function ProductDetailPage() {
  const { slug = "" } = useParams();
  const { add, count } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [store, setStore] = useState<StoreStatus | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api<Product>(`/catalog/products/${encodeURIComponent(slug)}`),
      api<StoreStatus>("/store/status"),
    ])
      .then(([nextProduct, status]) => {
        setProduct(nextProduct);
        setStore(status);
      })
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "Produit introuvable."),
      );
  }, [slug]);

  const addToCart = () => {
    if (!product) return;
    for (let index = 0; index < quantity; index += 1) add(product);
  };

  return (
    <>
      <Header />
      <main className="product-detail-page">
        <div className="container">
          <Link className="detail-back" to="/#menu"><ArrowLeft /> Retour au menu</Link>
          {error ? (
            <div className="empty-state-v2">
              <ShoppingBag />
              <h3>{error}</h3>
              <Link className="button primary" to="/">Voir le menu</Link>
            </div>
          ) : !product ? (
            <div className="product-detail-loading" />
          ) : (
            <div className="product-detail-layout">
              <ProductGallery product={product} />
              <section className="product-detail-copy">
                <span className="eyebrow">{product.category?.name ?? "Au menu"}</span>
                <h1>{product.name}</h1>
                <p className="product-detail-description">
                  {product.description || "Une portion généreuse, préparée à la commande."}
                </p>
                <div className="product-detail-price">{money(product.price)}</div>
                {product.portions > 1 && (
                  <p className="product-portions">Prévu pour {product.portions} personnes</p>
                )}
                <div className={store?.isOpen ? "detail-availability open" : "detail-availability"}>
                  <span />
                  {store?.message || "Vérification de la disponibilité…"}
                </div>
                <div className="product-buy-row">
                  <div className="quantity-picker">
                    <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Retirer une portion"><Minus /></button>
                    <strong>{quantity}</strong>
                    <button type="button" onClick={() => setQuantity((value) => value + 1)} aria-label="Ajouter une portion"><Plus /></button>
                  </div>
                  <button className="button primary product-add-button" onClick={addToCart} disabled={!store?.isOpen}>
                    <ShoppingBag /> Ajouter · {money(Number(product.price) * quantity)}
                  </button>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
      {count > 0 && (
        <Link to="/panier" className="floating-cart">
          <ShoppingBag /><span>Voir mon panier</span><b>{count}</b>
        </Link>
      )}
    </>
  );
}
