import { Archive, ArrowLeft, CalendarDays, Eye, EyeOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ProductGallery } from "../../components/ProductGallery";
import { Alert, Badge, ConfirmDialog, PageHeader, Skeleton } from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import { api, dateTime, money } from "../../lib/api";
import { productStatusLabel, productStatusTone } from "../../lib/labels";
import type { Product } from "../../lib/types";

export function AdminProductDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  const load = useCallback(() =>
    api<Product>(`/admin/catalog/products/${encodeURIComponent(id)}`, {}, token)
      .then(setProduct)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Plat introuvable.")), [id, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const archive = async () => {
    if (!product) return;
    setBusy(true);
    setError("");
    try {
      await api(`/admin/catalog/products/${product.id}`, { method: "DELETE" }, token);
      navigate("/admin/catalogue", { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Archivage impossible.");
      setConfirmArchive(false);
      setBusy(false);
    }
  };

  const toggle = async () => {
    if (!product) return;
    setBusy(true);
    setError("");
    try {
      setProduct(await api<Product>(`/admin/catalog/products/${product.id}`, { method: "PATCH", body: JSON.stringify({ status: product.status === "ACTIVE" ? "UNAVAILABLE" : "ACTIVE" }) }, token));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Modification impossible.");
    } finally {
      setBusy(false);
    }
  };

  const active = product?.status === "ACTIVE";

  return (
    <div className="admin-page">
      <Link className="back-link" to="/admin/catalogue"><ArrowLeft aria-hidden="true" /> Catalogue</Link>
      {error && <Alert tone="danger" onClose={() => setError("")}>{error}</Alert>}
      {!product ? (
        !error && <div className="product-layout"><Skeleton className="skeleton-gallery" /><Skeleton className="skeleton-block" /></div>
      ) : (
        <>
          <PageHeader
            eyebrow={product.category?.name ?? "Plat"}
            title={product.name}
            actions={
              <>
                <button type="button" className="button ghost danger-text" onClick={() => setConfirmArchive(true)} disabled={busy}>
                  <Archive aria-hidden="true" /> Archiver
                </button>
                <button type="button" className={active ? "button secondary" : "button primary"} onClick={toggle} disabled={busy}>
                  {active ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                  {active ? "Retirer du menu" : "Mettre en ligne"}
                </button>
              </>
            }
          />
          <div className="product-layout">
            <ProductGallery product={product} />
            <section className="card">
              <dl className="facts">
                <div><dt>Visibilité</dt><dd><Badge tone={productStatusTone(product.status)}>{productStatusLabel(product.status)}</Badge> <span className="muted small">{active ? "Visible par les clients" : "Masqué du menu"}</span></dd></div>
                <div><dt>Prix</dt><dd className="price lg">{money(product.price)}</dd></div>
                <div><dt>Portions</dt><dd>{product.portions} personne{product.portions > 1 ? "s" : ""}</dd></div>
                <div><dt>Description</dt><dd>{product.description || <span className="muted">Aucune description</span>}</dd></div>
              </dl>
              {product.createdAt && <p className="muted small with-icon"><CalendarDays aria-hidden="true" /> Ajouté le {dateTime(product.createdAt)}</p>}
            </section>
          </div>
        </>
      )}
      {confirmArchive && product && (
        <ConfirmDialog title={`Archiver « ${product.name} » ?`} confirmLabel="Archiver le plat" busy={busy} onConfirm={archive} onCancel={() => setConfirmArchive(false)}>
          Le plat disparaît immédiatement du menu. Les anciennes commandes restent intactes.
        </ConfirmDialog>
      )}
    </div>
  );
}
