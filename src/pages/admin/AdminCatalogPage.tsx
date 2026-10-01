import { FolderPlus, ImageOff, Images, Plus, Search, Trash2, Upload, UtensilsCrossed } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import { Alert, Badge, EmptyState, Modal, PageHeader, Skeleton } from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import { api, money } from "../../lib/api";
import { productStatusLabel, productStatusTone } from "../../lib/labels";
import { productImageUrls } from "../../lib/products";
import type { Category, Product } from "../../lib/types";

interface SelectedImage {
  file: File;
  preview: string;
}

const MAX_IMAGES = 8;

export function AdminCatalogPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState<"product" | "category" | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const selectedImagesRef = useRef<SelectedImage[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const replaceSelectedImages = (images: SelectedImage[]) => {
    selectedImagesRef.current = images;
    setSelectedImages(images);
  };

  const load = useCallback(() =>
    Promise.all([
      api<Category[]>("/admin/catalog/categories", {}, token),
      api<{ data: Product[] }>("/admin/catalog/products?page=1&limit=100", {}, token),
    ])
      .then(([nextCategories, nextProducts]) => {
        setCategories(nextCategories);
        setProducts(nextProducts.data);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Chargement impossible."))
      .finally(() => setLoading(false)), [token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => () => selectedImagesRef.current.forEach((image) => URL.revokeObjectURL(image.preview)), []);

  const clearSelectedImages = () => {
    selectedImagesRef.current.forEach((image) => URL.revokeObjectURL(image.preview));
    replaceSelectedImages([]);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const closeModal = () => {
    clearSelectedImages();
    setFormError("");
    setShow(null);
  };

  const selectImages = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const remaining = MAX_IMAGES - selectedImages.length;
    event.target.value = "";
    if (remaining <= 0) {
      setFormError(`Vous pouvez ajouter jusqu’à ${MAX_IMAGES} photos par plat.`);
      return;
    }
    const accepted = files.slice(0, remaining);
    setFormError(accepted.length < files.length ? `Seules les ${MAX_IMAGES} premières photos ont été conservées.` : "");
    replaceSelectedImages([...selectedImages, ...accepted.map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
  };

  const removeImage = (index: number) => {
    const image = selectedImages[index];
    if (image) URL.revokeObjectURL(image.preview);
    replaceSelectedImages(selectedImages.filter((_, current) => current !== index));
  };

  const createCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setFormError("");
    try {
      await api("/admin/catalog/categories", { method: "POST", body: JSON.stringify({ name: data.get("name"), isActive: true }) }, token);
      closeModal();
      await load();
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : "Création impossible.");
    } finally {
      setBusy(false);
    }
  };

  const createProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setFormError("");
    try {
      const imageUrls = await Promise.all(
        selectedImages.map(async ({ file }) => {
          const upload = new FormData();
          upload.append("file", file);
          return (await api<{ url: string }>("/admin/media/images", { method: "POST", body: upload }, token)).url;
        }),
      );
      await api(
        "/admin/catalog/products",
        {
          method: "POST",
          body: JSON.stringify({
            name: data.get("name"),
            categoryId: data.get("categoryId"),
            description: data.get("description") || undefined,
            price: Number(data.get("price")),
            imageUrl: imageUrls[0],
            imageUrls,
            status: "ACTIVE",
          }),
        },
        token,
      );
      closeModal();
      await load();
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : "Ajout impossible.");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (product: Product) => {
    setToggling(product.id);
    try {
      await api(`/admin/catalog/products/${product.id}`, { method: "PATCH", body: JSON.stringify({ status: product.status === "ACTIVE" ? "UNAVAILABLE" : "ACTIVE" }) }, token);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Modification impossible.");
    } finally {
      setToggling(null);
    }
  };

  const term = search.trim().toLowerCase();
  const visible = products.filter((product) =>
    product.name.toLowerCase().includes(term) && (!categoryFilter || product.categoryId === categoryFilter));
  const online = products.filter((product) => product.status === "ACTIVE").length;

  return (
    <div className="admin-page">
      <PageHeader
        title="Catalogue"
        description={`${online} plat${online > 1 ? "s" : ""} en ligne sur ${products.length} · ${categories.length} catégorie${categories.length > 1 ? "s" : ""}`}
        actions={
          <>
            <button type="button" className="button secondary" onClick={() => setShow("category")}><FolderPlus aria-hidden="true" /> Catégorie</button>
            <button type="button" className="button primary" onClick={() => setShow("product")} disabled={!categories.length} title={!categories.length ? "Créez d’abord une catégorie" : undefined}>
              <Plus aria-hidden="true" /> Nouveau plat
            </button>
          </>
        }
      />

      <div className="toolbar">
        <div className="search-field">
          <Search aria-hidden="true" />
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un plat" aria-label="Rechercher un plat" />
        </div>
        {categories.length > 1 && (
          <div className="chips scroll" role="tablist" aria-label="Filtrer par catégorie">
            <button type="button" role="tab" aria-selected={!categoryFilter} className="chip" onClick={() => setCategoryFilter("")}>Toutes</button>
            {categories.map((category) => (
              <button key={category.id} type="button" role="tab" aria-selected={categoryFilter === category.id} className="chip" onClick={() => setCategoryFilter(category.id)}>{category.name}</button>
            ))}
          </div>
        )}
      </div>

      {error && <Alert tone="danger" onClose={() => setError("")}>{error}</Alert>}
      {!loading && !categories.length && (
        <Alert tone="info">Commencez par créer une catégorie (ex. « Plats », « Boissons »), puis ajoutez vos plats.</Alert>
      )}

      {loading ? (
        <div className="admin-product-grid">{[1, 2, 3].map((item) => <Skeleton key={item} className="product-card-skeleton" />)}</div>
      ) : !visible.length ? (
        <EmptyState icon={UtensilsCrossed} title={products.length ? "Aucun plat ne correspond" : "Aucun plat pour l’instant"}>
          {products.length ? "Modifiez la recherche ou le filtre." : "Ajoutez votre premier plat pour qu’il apparaisse sur le menu."}
        </EmptyState>
      ) : (
        <div className="admin-product-grid">
          {visible.map((product) => {
            const images = productImageUrls(product);
            return (
              <article className="admin-product" key={product.id}>
                <Link className="admin-product-media" to={`/admin/catalogue/${product.id}`} aria-label={`Voir ${product.name}`}>
                  {images[0] ? <img src={images[0]} alt="" loading="lazy" /> : <span className="media-empty"><ImageOff aria-hidden="true" /></span>}
                  {images.length > 1 && <span className="media-count"><Images aria-hidden="true" /> {images.length}</span>}
                </Link>
                <div className="admin-product-body">
                  <div className="admin-product-top">
                    <small className="muted">{product.category?.name}</small>
                    <Badge tone={productStatusTone(product.status)}>{productStatusLabel(product.status)}</Badge>
                  </div>
                  <h3><Link to={`/admin/catalogue/${product.id}`}>{product.name}</Link></h3>
                  <strong className="price">{money(product.price)}</strong>
                  <label className="switch-row">
                    <span>Visible sur le menu</span>
                    <input type="checkbox" className="switch" checked={product.status === "ACTIVE"} onChange={() => toggle(product)} disabled={toggling === product.id} />
                  </label>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {show === "category" && (
        <Modal title="Nouvelle catégorie" description="Les catégories organisent le menu côté client." onClose={closeModal} size="sm" locked={busy}>
          <form onSubmit={createCategory} className="stack">
            <div className="field">
              <label htmlFor="category-name">Nom</label>
              <input id="category-name" name="name" required autoFocus placeholder="Ex. Plats du jour" />
            </div>
            {formError && <p className="field-error" role="alert">{formError}</p>}
            <div className="modal-actions">
              <button type="button" className="button secondary" onClick={closeModal} disabled={busy}>Annuler</button>
              <button className="button primary" disabled={busy}>{busy ? "Création…" : "Créer la catégorie"}</button>
            </div>
          </form>
        </Modal>
      )}

      {show === "product" && (
        <Modal title="Nouveau plat" description="Le plat sera immédiatement visible sur le menu." onClose={closeModal} size="lg" locked={busy}>
          <form onSubmit={createProduct} className="stack">
            <div className="field-row">
              <div className="field">
                <label htmlFor="product-name">Nom du plat</label>
                <input id="product-name" name="name" required autoFocus placeholder="Ex. Ndolé crevettes" />
              </div>
              <div className="field">
                <label htmlFor="product-price">Prix</label>
                <div className="input-group">
                  <input id="product-price" name="price" type="number" inputMode="numeric" min="0" step="50" required />
                  <span className="input-suffix">FCFA</span>
                </div>
              </div>
            </div>
            <div className="field">
              <label htmlFor="product-category">Catégorie</label>
              <select id="product-category" name="categoryId" required defaultValue="">
                <option value="" disabled>Choisir une catégorie</option>
                {categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="product-description">Description <span className="optional">facultatif</span></label>
              <textarea id="product-description" name="description" rows={3} placeholder="Ingrédients, accompagnement, quantité…" />
            </div>

            <fieldset className="upload-field">
              <legend>Photos <span className="optional">{selectedImages.length}/{MAX_IMAGES} · JPG, PNG ou WebP</span></legend>
              <div className="upload-grid">
                {selectedImages.map((image, index) => (
                  <figure key={image.preview} className="upload-preview">
                    <img src={image.preview} alt={`Aperçu ${index + 1}`} />
                    {index === 0 && <figcaption>Principale</figcaption>}
                    <button type="button" onClick={() => removeImage(index)} aria-label={`Retirer la photo ${index + 1}`}><Trash2 /></button>
                  </figure>
                ))}
                {selectedImages.length < MAX_IMAGES && (
                  <label className="upload-drop">
                    <Upload aria-hidden="true" />
                    <span>{selectedImages.length ? "Ajouter" : "Choisir des photos"}</span>
                    <input ref={imageInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={selectImages} className="sr-only" />
                  </label>
                )}
              </div>
              <small className="field-hint">La première photo sert de vignette sur le menu.</small>
            </fieldset>

            {formError && <p className="field-error" role="alert">{formError}</p>}
            <div className="modal-actions">
              <button type="button" className="button secondary" onClick={closeModal} disabled={busy}>Annuler</button>
              <button className="button primary" disabled={busy}>{busy ? "Ajout en cours…" : "Ajouter au menu"}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
