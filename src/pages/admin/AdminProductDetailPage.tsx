import { ArrowLeft, CalendarDays, Eye, EyeOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ProductGallery } from "../../components/ProductGallery";
import { useAuth } from "../../contexts/AuthContext";
import { api, dateTime, money } from "../../lib/api";
import type { Product } from "../../lib/types";

export function AdminProductDetailPage() {
  const { id = "" } = useParams();
  const { token } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() =>
    api<Product>(`/admin/catalog/products/${encodeURIComponent(id)}`, {}, token)
      .then(setProduct)
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "Produit introuvable."),
      ), [id, token]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async () => {
    if (!product) return;
    setBusy(true);
    setError("");
    try {
      const next = await api<Product>(
        `/admin/catalog/products/${product.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: product.status === "ACTIVE" ? "UNAVAILABLE" : "ACTIVE",
          }),
        },
        token,
      );
      setProduct(next);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Modification impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-product-detail">
      <Link className="detail-back" to="/admin/catalogue"><ArrowLeft /> Retour au catalogue</Link>
      {error && <div className="error-banner">{error}</div>}
      {!product ? (
        !error && <div className="product-detail-loading" />
      ) : (
        <>
          <div className="admin-page-head">
            <div>
              <span className="eyebrow">{product.category?.name ?? "Produit"}</span>
              <h1>{product.name}</h1>
              <p>Consultez le rendu présenté aux clients et sa disponibilité.</p>
            </div>
            <button className={product.status === "ACTIVE" ? "button subtle" : "button primary"} onClick={toggle} disabled={busy}>
              {product.status === "ACTIVE" ? <EyeOff /> : <Eye />}
              {busy ? "Modification…" : product.status === "ACTIVE" ? "Rendre indisponible" : "Mettre en ligne"}
            </button>
          </div>
          <div className="admin-product-detail-grid">
            <ProductGallery product={product} />
            <section className="admin-product-facts">
              <div className="admin-product-status">
                <span className={product.status === "ACTIVE" ? "active" : ""} />
                {product.status === "ACTIVE" ? "Visible par les clients" : "Non visible par les clients"}
              </div>
              <div>
                <small>Prix</small>
                <strong>{money(product.price)}</strong>
              </div>
              <div>
                <small>Portions</small>
                <strong>{product.portions}</strong>
              </div>
              <div>
                <small>Description</small>
                <p>{product.description || "Aucune description"}</p>
              </div>
              {product.createdAt && (
                <div className="admin-product-date">
                  <CalendarDays />
                  <span>Ajouté le {dateTime(product.createdAt)}</span>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
