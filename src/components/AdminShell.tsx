import { Bell, Bike, ClipboardList, LayoutDashboard, PackageOpen, Settings, Store, Users } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { Header } from "./Header";
export function AdminShell() {
  const links = [
    ["/admin", "Vue d’ensemble", LayoutDashboard], ["/admin/commandes", "Commandes", ClipboardList],
    ["/admin/catalogue", "Catalogue", PackageOpen], ["/admin/livraisons", "Livraisons", Bike],
    ["/admin/clients", "Utilisateurs", Users], ["/admin/notifications", "Notifications", Bell],
    ["/admin/reglages", "Réglages", Settings],
  ] as const;
  return <><Header/><div className="admin-layout"><aside className="admin-sidebar"><div className="sidebar-title"><Store size={18}/> Espace gestion</div>{links.map(([to,label,Icon]) => <NavLink key={to} to={to} end={to === "/admin"}><Icon size={18}/>{label}</NavLink>)}</aside><main className="admin-main"><Outlet/></main></div></>;
}
