import { Bell, Bike, ClipboardList, LayoutDashboard, LogOut, PackageOpen, Settings, Users } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Logo } from "./Logo";

const LINKS = [
  { to: "/admin", label: "Vue d’ensemble", icon: LayoutDashboard },
  { to: "/admin/commandes", label: "Commandes", icon: ClipboardList },
  { to: "/admin/catalogue", label: "Catalogue", icon: PackageOpen },
  { to: "/admin/livraisons", label: "Livraisons", icon: Bike },
  { to: "/admin/clients", label: "Utilisateurs", icon: Users },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/reglages", label: "Réglages", icon: Settings },
] as const;

export function AdminShell() {
  const { user, logout } = useAuth();
  return (
    <div className="admin-layout">
      <a className="skip-link" href="#contenu">Aller au contenu</a>
      <aside className="admin-sidebar">
        <NavLink to="/admin" className="admin-brand" aria-label="Vue d’ensemble">
          <Logo />
          <small>Espace gestion</small>
        </NavLink>
        <nav className="admin-nav" aria-label="Administration">
          {LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === "/admin"}>
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="admin-user">
          <span className="avatar" aria-hidden="true">{user?.displayName.charAt(0).toUpperCase()}</span>
          <div>
            <strong>{user?.displayName}</strong>
            <small>Administratrice</small>
          </div>
          <button type="button" className="icon-button ghost" onClick={logout} aria-label="Se déconnecter" title="Se déconnecter">
            <LogOut />
          </button>
        </div>
      </aside>
      <main className="admin-main" id="contenu">
        <Outlet />
      </main>
    </div>
  );
}
