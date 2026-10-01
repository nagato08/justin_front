import { Clock3, MapPin, Search, ShoppingBag, Smartphone, Store, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import heroFood from "../assets/hero-food-v2.webp";
import { CartBar } from "../components/CartBar";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { ProductCard } from "../components/ProductCard";
import { Alert, EmptyState, Skeleton } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import type { Category, StoreStatus } from "../lib/types";

export function HomePage() {
  const { user } = useAuth();
  const [catalog, setCatalog] = useState<Category[]>([]);
  const [store, setStore] = useState<StoreStatus | null>(null);
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api<Category[]>("/catalog"), api<StoreStatus>("/store/status")])
      .then(([categories, status]) => {
        setCatalog(categories.filter((category) => category.products.length > 0));
        setStore(status);
      })
      .catch(() => setError("Le menu n’a pas pu être chargé. Vérifiez votre connexion puis rechargez la page."))
      .finally(() => setLoading(false));
  }, []);

  const sections = useMemo(() => {
    const search = query.trim().toLowerCase();
    return catalog
      .filter((category) => active === "all" || category.id === active)
      .map((category) => ({
        ...category,
        products: search
          ? category.products.filter((product) => `${product.name} ${product.description ?? ""}`.toLowerCase().includes(search))
          : category.products,
      }))
      .filter((category) => category.products.length > 0);
  }, [catalog, active, query]);

  const orderable = Boolean(store?.isOpen);

  return (
    <>
      <Header />
      <main id="contenu" className="home">
        <section className="hero container">
          <div className="hero-copy">
            <StoreStatusPill store={store} />
            <h1>
              La cuisine de la maison, <em>livrée chez vous.</em>
            </h1>
            <p>Des plats généreux préparés à la commande à Douala. Choisissez, placez votre point sur la carte, suivez le livreur en direct.</p>
            <div className="hero-actions">
              <a href="#menu" className="button primary lg">Voir le menu</a>
              {user && <Link to="/orders" className="button secondary lg">Suivre ma commande</Link>}
            </div>
          </div>
          <figure className="hero-media">
            <img src={heroFood} alt="Assiette de riz, poulet grillé, plantain et crudités" width={720} height={720} />
            <figcaption className="hero-note">
              <MapPin aria-hidden="true" />
              <span><strong>Livraison dès 500 FCFA</strong> selon votre quartier</span>
            </figcaption>
          </figure>
        </section>

        <section className="menu container" id="menu" aria-labelledby="menu-title">
          <div className="menu-head">
            <div>
              <h2 id="menu-title">Le menu du moment</h2>
              <p>Tout ce qui est affiché est réellement disponible aujourd’hui.</p>
            </div>
            <div className="search-field">
              <Search aria-hidden="true" />
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un plat" aria-label="Rechercher un plat" />
              {query && <button type="button" onClick={() => setQuery("")} aria-label="Effacer la recherche"><X /></button>}
            </div>
          </div>

          {store && !store.isOpen && (
            <Alert tone="warning">
              <strong>Les commandes sont fermées pour le moment.</strong> {store.message} Vous pouvez parcourir le menu en attendant.
            </Alert>
          )}
          {error && <Alert tone="danger">{error}</Alert>}

          {catalog.length > 1 && (
            <div className="chips-bar">
              <div className="chips" role="tablist" aria-label="Catégories">
                <button type="button" role="tab" aria-selected={active === "all"} className="chip" onClick={() => setActive("all")}>Tout</button>
                {catalog.map((category) => (
                  <button key={category.id} type="button" role="tab" aria-selected={active === category.id} className="chip" onClick={() => setActive(category.id)}>
                    {category.name}
                    <span className="chip-count">{category.products.length}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="product-grid">
              {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="product-card-skeleton" />)}
            </div>
          ) : !error && catalog.length === 0 ? (
            <EmptyState icon={ShoppingBag} title="Le prochain menu se prépare">
              Aucun plat n’est disponible pour l’instant. Revenez un peu plus tard.
            </EmptyState>
          ) : sections.length === 0 && !error ? (
            <EmptyState icon={Search} title="Aucun plat ne correspond" action={<button type="button" className="button secondary" onClick={() => { setQuery(""); setActive("all"); }}>Tout afficher</button>}>
              Essayez un autre mot ou une autre catégorie.
            </EmptyState>
          ) : (
            sections.map((category) => (
              <section key={category.id} className="menu-section" aria-labelledby={`cat-${category.id}`}>
                <h3 id={`cat-${category.id}`} className="menu-section-title">{category.name}</h3>
                <div className="product-grid">
                  {category.products.map((product) => <ProductCard key={product.id} product={product} orderable={orderable} />)}
                </div>
              </section>
            ))
          )}
        </section>

        <section className="how container" aria-labelledby="how-title">
          <h2 id="how-title">Comment ça marche</h2>
          <ol className="how-steps">
            <li>
              <span className="how-icon"><ShoppingBag aria-hidden="true" /></span>
              <div><h3>Vous choisissez</h3><p>Ajoutez les plats du jour à votre panier.</p></div>
            </li>
            <li>
              <span className="how-icon"><MapPin aria-hidden="true" /></span>
              <div><h3>Vous placez le point</h3><p>Votre position GPS ou n’importe quel repère sur la carte.</p></div>
            </li>
            <li>
              <span className="how-icon"><Clock3 aria-hidden="true" /></span>
              <div><h3>Vous suivez</h3><p>Chaque étape en direct, jusqu’à la position du livreur.</p></div>
            </li>
            <li>
              <span className="how-icon"><Smartphone aria-hidden="true" /></span>
              <div><h3>Vous payez simplement</h3><p>En espèces à la réception ou par Mobile Money.</p></div>
            </li>
          </ol>
        </section>
      </main>
      <Footer />
      <CartBar />
    </>
  );
}

function StoreStatusPill({ store }: { store: StoreStatus | null }) {
  if (!store) return <span className="status-pill"><Store aria-hidden="true" /> Vérification des commandes…</span>;
  return (
    <span className={store.isOpen ? "status-pill open" : "status-pill closed"}>
      <span className="status-dot" aria-hidden="true" />
      {store.isOpen ? "Commandes ouvertes" : "Commandes fermées"}
    </span>
  );
}
