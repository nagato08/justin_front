import { Box, Images, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { api, money } from "../../lib/api";
import { productImageUrls } from "../../lib/products";
import type { Category, Product } from "../../lib/types";

interface SelectedImage {
  file: File;
  preview: string;
}

export function AdminCatalogPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [show, setShow] = useState<"product" | "category" | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
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
    ]).then(([nextCategories, nextProducts]) => {
      setCategories(nextCategories);
      setProducts(nextProducts.data);
    }), [token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(
    () => () => selectedImagesRef.current.forEach((image) => URL.revokeObjectURL(image.preview)),
    [],
  );

  const clearSelectedImages = () => {
    selectedImagesRef.current.forEach((image) => URL.revokeObjectURL(image.preview));
    replaceSelectedImages([]);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const closeModal = () => {
    clearSelectedImages();
    setError("");
    setShow(null);
  };

  const selectImages = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const remaining = 8 - selectedImages.length;
    if (remaining <= 0) {
      setError("Vous pouvez ajouter jusqu’à 8 photos par produit.");
      event.target.value = "";
      return;
    }
    const accepted = files.slice(0, remaining);
    if (accepted.length < files.length) {
      setError("Seules les 8 premières photos ont été conservées.");
    } else {
      setError("");
    }
    replaceSelectedImages([
      ...selectedImages,
      ...accepted.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
    event.target.value = "";
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
    setError("");
    try {
      await api(
        "/admin/catalog/categories",
        { method: "POST", body: JSON.stringify({ name: data.get("name"), isActive: true }) },
        token,
      );
      closeModal();
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const createProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
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
      setError(reason instanceof Error ? reason.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (product: Product) => {
    await api(
      `/admin/catalog/products/${product.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ status: product.status === "ACTIVE" ? "UNAVAILABLE" : "ACTIVE" }),
      },
      token,
    );
    await load();
  };

  const visible = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <span className="eyebrow">Votre offre</span>
          <h1>Catalogue</h1>
          <p>Gérez les plats visibles par vos clients.</p>
        </div>
        <div className="head-actions">
          <button className="button subtle" onClick={() => setShow("category")}><Plus /> Catégorie</button>
          <button className="button primary" onClick={() => setShow("product")}><Plus /> Nouveau plat</button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box"><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un plat" /></div>
        <div className="category-count">{categories.length} catégorie(s) · {products.length} plat(s)</div>
      </div>
      {error && !show && <div className="error-banner">{error}</div>}

      <div className="admin-products">
        {visible.map((product) => {
          const images = productImageUrls(product);
          return (
            <article key={product.id}>
              <Link className="admin-product-image" to={`/admin/catalogue/${product.id}`}>
                {images[0] ? <img src={images[0]} alt={product.name} /> : <span>🍛</span>}
                <i className={product.status.toLowerCase()}>{product.status === "ACTIVE" ? "En ligne" : product.status}</i>
                {images.length > 1 && <b className="admin-photo-count"><Images /> {images.length}</b>}
              </Link>
              <div>
                <small>{product.category?.name}</small>
                <Link to={`/admin/catalogue/${product.id}`}><h3>{product.name}</h3></Link>
                <p>{product.description || "Aucune description"}</p>
                <footer>
                  <div><strong>{money(product.price)}</strong><Link className="product-detail-link" to={`/admin/catalogue/${product.id}`}>Voir le détail</Link></div>
                  <button className="text-button" onClick={() => toggle(product)}>
                    {product.status === "ACTIVE" ? "Rendre indisponible" : "Mettre en ligne"}
                  </button>
                </footer>
              </div>
            </article>
          );
        })}
      </div>
      {!visible.length && <div className="empty-state"><Box /><h3>Aucun plat</h3></div>}

      {show && (
        <div className="modal-backdrop" onMouseDown={closeModal}>
          <div className="modal catalog-modal" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={closeModal} aria-label="Fermer"><X /></button>
            <span className="eyebrow">Ajouter</span>
            <h2>{show === "category" ? "Nouvelle catégorie" : "Nouveau plat"}</h2>
            {error && <div className="error-banner">{error}</div>}
            {show === "category" ? (
              <form onSubmit={createCategory}>
                <label>Nom<input name="name" required autoFocus /></label>
                <button className="button primary wide" disabled={busy}>{busy ? "Création…" : "Créer la catégorie"}</button>
              </form>
            ) : (
              <form onSubmit={createProduct}>
                <label>Nom du plat<input name="name" required autoFocus /></label>
                <label>Catégorie
                  <select name="categoryId" required>
                    <option value="">Choisir</option>
                    {categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
                  </select>
                </label>
                <label>Description<textarea name="description" rows={3} /></label>
                <label>Prix (FCFA)<input name="price" type="number" min="0" required /></label>
                <div className="multi-image-field">
                  <div className="multi-image-label">
                    <div><strong>Photos du plat</strong><small>Jusqu’à 8 photos · JPG, PNG ou WebP</small></div>
                    <span>{selectedImages.length}/8</span>
                  </div>
                  <label className="image-upload-button">
                    <Upload />
                    <span>{selectedImages.length ? "Ajouter d’autres photos" : "Choisir les photos"}</span>
                    <input ref={imageInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={selectImages} />
                  </label>
                  {selectedImages.length > 0 && (
                    <div className="image-preview-grid">
                      {selectedImages.map((image, index) => (
                        <figure key={image.preview}>
                          <img src={image.preview} alt={`Aperçu ${index + 1}`} />
                          {index === 0 && <figcaption>Principale</figcaption>}
                          <button type="button" onClick={() => removeImage(index)} aria-label={`Retirer la photo ${index + 1}`}><Trash2 /></button>
                        </figure>
                      ))}
                    </div>
                  )}
                </div>
                <button className="button primary wide" disabled={busy || categories.length === 0}>
                  {busy ? "Ajout en cours…" : "Ajouter au menu"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
