import { ArrowUpRight, Check, Clock3, MapPin, Plus, ShoppingBag, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import heroFood from "../assets/hero-food-v2.webp";
import { Header } from "../components/Header";
import { useCart } from "../contexts/CartContext";
import { api, assetUrl, money } from "../lib/api";
import type { Category, StoreStatus } from "../lib/types";

export function HomePage() {
  const [catalog, setCatalog] = useState<Category[]>([]);
  const [store, setStore] = useState<StoreStatus | null>(null);
  const [active, setActive] = useState("all");
  const [loading, setLoading] = useState(true);
  const { add, count } = useCart();
  useEffect(() => { Promise.all([api<Category[]>("/catalog"), api<StoreStatus>("/store/status")]).then(([categories,status]) => { setCatalog(categories); setStore(status); }).finally(() => setLoading(false)); }, []);
  const visible = active === "all" ? catalog : catalog.filter((category) => category.id === active);
  return <><Header/><main className="home-v2">
    <section className="hero-v2"><div className="container hero-v2-grid">
      <div className="hero-v2-copy">
        <div className={store?.isOpen ? "availability open" : "availability closed"}><span/>{store?.message || "Vérification des commandes…"}</div>
        <span className="hero-kicker"><Sparkles/> Cuisine maison · Douala</span>
        <h1>Ce soir,<br/>on cuisine <em>pour vous.</em></h1>
        <p>Des plats généreux, préparés à la commande et livrés exactement là où vous le souhaitez.</p>
        <div className="hero-v2-actions"><a href="#menu" className="button primary">Découvrir le menu <ArrowUpRight/></a><Link to="/orders" className="hero-link">Suivre une commande</Link></div>
        <div className="hero-proof"><div><b>500 F</b><span>livraison minimum</span></div><div><b>GPS</b><span>suivi en direct</span></div><div><b>Maison</b><span>préparé avec soin</span></div></div>
      </div>
      <div className="hero-photo-wrap">
        <img src={heroFood} alt="Plat maison composé de riz, poulet grillé, plantain et crudités"/>
        <div className="hero-photo-label"><span>Au menu</span><strong>Frais. Généreux. Prêt pour vous.</strong></div>
        <div className="hero-number">01</div>
      </div>
    </div></section>

    <section className="menu-section-v2 container" id="menu">
      <div className="section-heading-v2"><div><span>Le menu du moment</span><h2>Choisissez votre plaisir.</h2></div><p>Chaque plat affiché est réellement disponible. Une fois épuisé, il disparaît du menu.</p></div>
      <div className="category-tabs-v2"><button className={active === "all" ? "active" : ""} onClick={() => setActive("all")}>Tout voir</button>{catalog.map((category) => <button key={category.id} className={active === category.id ? "active" : ""} onClick={() => setActive(category.id)}>{category.name}</button>)}</div>
      {loading ? <div className="product-grid-v2">{[1,2,3].map((item) => <div className="product-card-v2 skeleton" key={item}/>)}</div> : catalog.length === 0 ? <div className="empty-state-v2"><ShoppingBag/><h3>Le prochain menu se prépare.</h3><p>Revenez bientôt pour découvrir les plats disponibles.</p></div> : <div className="product-grid-v2">{visible.flatMap((category) => category.products.map((product,index) => <article className="product-card-v2" key={product.id}>
        <div className="product-photo-v2">{product.imageUrl ? <img src={assetUrl(product.imageUrl)} alt={product.name}/> : <div className="product-placeholder"><span>{String(index + 1).padStart(2,"0")}</span><small>Photo à venir</small></div>}<span className="product-category-v2">{category.name}</span></div>
        <div className="product-content-v2"><div><h3>{product.name}</h3><p>{product.description || "Une portion généreuse, préparée à la commande."}</p></div><footer><strong>{money(product.price)}</strong><button onClick={() => add(product)} disabled={!store?.isOpen} aria-label={`Ajouter ${product.name}`}><Plus/></button></footer></div>
      </article>))}</div>}
    </section>

    <section className="how-v2"><div className="container"><div className="section-heading-v2 light"><div><span>Comment ça marche</span><h2>Votre repas, sans complication.</h2></div></div><div className="how-grid-v2"><article><b>01</b><ShoppingBag/><h3>Vous choisissez</h3><p>Ajoutez les plats encore disponibles à votre panier.</p></article><article><b>02</b><MapPin/><h3>Vous placez le point</h3><p>Votre position GPS ou une autre adresse, c’est vous qui décidez.</p></article><article><b>03</b><Clock3/><h3>Vous suivez</h3><p>Recevez les nouvelles et regardez la livraison avancer en direct.</p></article></div><div className="how-bottom"><span><Check/> Commande avec compte sécurisé</span><span><Check/> Paiement espèces ou Mobile Money</span></div></div></section>
  </main>{count > 0 && <Link to="/panier" className="floating-cart"><ShoppingBag/><span>Voir mon panier</span><b>{count}</b></Link>}</>;
}
