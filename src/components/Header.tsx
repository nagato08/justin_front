import { LogOut, Menu, Package, ShoppingBag, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { Logo } from "./Logo";

export function Header() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const home = user?.role === "ADMIN" ? "/admin" : user?.role === "DELIVERER" ? "/driver" : "/";
  return <header className="site-header"><div className="container header-inner">
    <Link to={home} aria-label="Accueil"><Logo /></Link>
    <button className="icon-button mobile-only" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X/> : <Menu/>}</button>
    <nav className={open ? "main-nav open" : "main-nav"} onClick={() => setOpen(false)}>
      {(!user || user.role === "CUSTOMER") && <><NavLink to="/">Le menu</NavLink>{user && <NavLink to="/orders"><Package size={17}/> Mes commandes</NavLink>}</>}
      {user?.role === "ADMIN" && <NavLink to="/admin">Administration</NavLink>}
      {user?.role === "DELIVERER" && <NavLink to="/driver">Mes livraisons</NavLink>}
      {user ? <button className="nav-user" onClick={logout}><UserRound size={17}/>{user.displayName}<LogOut size={16}/></button> : <NavLink to="/connexion">Se connecter</NavLink>}
      {(!user || user.role === "CUSTOMER") && <Link className="cart-link" to="/panier"><ShoppingBag size={18}/><span>Panier</span>{count > 0 && <b>{count}</b>}</Link>}
    </nav>
  </div></header>;
}
