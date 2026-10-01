import { ImageOff, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { money } from "../lib/api";
import { productImageUrls } from "../lib/products";
import type { Product } from "../lib/types";
import { QuantityStepper } from "./ui";

export function ProductCard({ product, orderable }: { product: Product; orderable: boolean }) {
  const { lines, add, setQuantity } = useCart();
  const quantity = lines.find((line) => line.product.id === product.id)?.quantity ?? 0;
  const image = productImageUrls(product)[0];
  const href = `/produit/${product.slug}`;

  return (
    <article className={quantity > 0 ? "product-card in-cart" : "product-card"}>
      <Link to={href} className="product-card-media" tabIndex={-1} aria-hidden="true">
        {image ? <img src={image} alt="" loading="lazy" /> : <span className="media-empty"><ImageOff /></span>}
        {product.portions > 1 && <span className="product-card-portions">{product.portions} pers.</span>}
      </Link>
      <div className="product-card-body">
        <h3><Link to={href}>{product.name}</Link></h3>
        <p>{product.description || "Portion généreuse, préparée à la commande."}</p>
        <div className="product-card-footer">
          <strong className="price">{money(product.price)}</strong>
          {quantity > 0 ? (
            <QuantityStepper size="sm" value={quantity} onChange={(next) => setQuantity(product.id, next)} label={product.name} />
          ) : (
            <button type="button" className="add-button" onClick={() => add(product)} disabled={!orderable} aria-label={`Ajouter ${product.name} au panier`}>
              <Plus aria-hidden="true" />
              <span>Ajouter</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
