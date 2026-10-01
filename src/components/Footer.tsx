import { Link } from "react-router-dom";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <Logo />
        <p>Cuisine maison préparée à la commande, livrée à Douala.</p>
        <nav aria-label="Liens utiles">
          <Link to="/">Le menu</Link>
          <Link to="/orders">Suivre une commande</Link>
          <Link to="/connexion">Mon compte</Link>
        </nav>
        <small>© {new Date().getFullYear()} Ma cuisine</small>
      </div>
    </footer>
  );
}
