import { LogOut, Package, ShoppingBag, UserRound, UtensilsCrossed } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { Logo } from "./Logo";

export function Header() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const isCustomer = !user || user.role === "CUSTOMER";
  const home = user?.role === "ADMIN" ? "/admin" : user?.role === "DELIVERER" ? "/driver" : "/";

  return (
    <>
      <a className="skip-link" href="#contenu">Aller au contenu</a>
      <header className="site-header">
        <div className="container header-inner">
          <Link to={home} className="header-logo" aria-label="Ma cuisine — accueil">
            <Logo />
          </Link>

          <nav className="header-nav" aria-label="Navigation principale">
            {isCustomer && (
              <>
                <NavLink to="/" end>Le menu</NavLink>
                {user && <NavLink to="/orders">Mes commandes</NavLink>}
              </>
            )}
            {user?.role === "ADMIN" && <NavLink to="/admin">Espace gestion</NavLink>}
            {user?.role === "DELIVERER" && <NavLink to="/driver">Mes livraisons</NavLink>}
          </nav>

          <div className="header-actions">
            {isCustomer ? (
              <>
                <Link to={user ? "/compte" : "/connexion"} className="header-account">
                  <UserRound aria-hidden="true" />
                  <span>{user ? user.displayName.split(" ")[0] : "Se connecter"}</span>
                </Link>
                <Link to="/panier" className="header-cart" aria-label={`Panier, ${count} article${count > 1 ? "s" : ""}`}>
                  <ShoppingBag aria-hidden="true" />
                  <span className="header-cart-label">Panier</span>
                  {count > 0 && <span className="count-badge">{count}</span>}
                </Link>
              </>
            ) : (
              <button type="button" className="header-account" onClick={logout} aria-label="Se déconnecter">
                <LogOut aria-hidden="true" />
                <span>Déconnexion</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {isCustomer && (
        <nav className="tabbar" aria-label="Navigation mobile">
          <NavLink to="/" end><UtensilsCrossed aria-hidden="true" /><span>Menu</span></NavLink>
          <NavLink to="/orders"><Package aria-hidden="true" /><span>Commandes</span></NavLink>
          <NavLink to="/panier">
            <span className="tabbar-icon">
              <ShoppingBag aria-hidden="true" />
              {count > 0 && <span className="count-badge">{count}</span>}
            </span>
            <span>Panier</span>
          </NavLink>
          <NavLink to={user ? "/compte" : "/connexion"}><UserRound aria-hidden="true" /><span>Compte</span></NavLink>
        </nav>
      )}
    </>
  );
}
