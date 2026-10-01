import { ChevronRight, LogOut, Mail, Package, Phone, UtensilsCrossed } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { useAuth } from "../contexts/AuthContext";

export function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const signOut = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <>
      <Header />
      <main id="contenu" className="container page narrow">
        <section className="profile-card">
          <span className="avatar lg" aria-hidden="true">{user.displayName.charAt(0).toUpperCase()}</span>
          <div>
            <h1>{user.displayName}</h1>
            {user.phone && <p><Phone aria-hidden="true" /> {user.phone}</p>}
            {user.email && <p><Mail aria-hidden="true" /> {user.email}</p>}
          </div>
        </section>

        <nav className="menu-list" aria-label="Mon compte">
          <Link to="/orders"><Package aria-hidden="true" /><span>Mes commandes</span><ChevronRight aria-hidden="true" /></Link>
          <Link to="/"><UtensilsCrossed aria-hidden="true" /><span>Le menu du jour</span><ChevronRight aria-hidden="true" /></Link>
        </nav>

        <button type="button" className="button secondary block danger-text" onClick={signOut}>
          <LogOut aria-hidden="true" /> Se déconnecter
        </button>
      </main>
    </>
  );
}
