import { ArrowRight, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { money } from "../lib/api";

/** Rappel du panier, fixé en bas d’écran tant qu’il contient des plats. */
export function CartBar() {
  const { count, total } = useCart();
  if (count === 0) return null;
  return (
    <Link to="/panier" className="cart-bar">
      <span className="cart-bar-icon">
        <ShoppingBag aria-hidden="true" />
        <span className="count-badge">{count}</span>
      </span>
      <span className="cart-bar-text">
        <strong>Voir mon panier</strong>
        <small>{count} article{count > 1 ? "s" : ""}</small>
      </span>
      <span className="cart-bar-total">{money(total)}</span>
      <ArrowRight aria-hidden="true" />
    </Link>
  );
}
