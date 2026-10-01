import { Compass } from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { EmptyState } from "../components/ui";

export function NotFoundPage() {
  return (
    <>
      <Header />
      <main id="contenu" className="container page narrow">
        <EmptyState icon={Compass} title="Cette page n’existe pas" action={<Link className="button primary" to="/">Retour au menu</Link>}>
          Le lien est peut-être incomplet, ou la page a été déplacée.
        </EmptyState>
      </main>
    </>
  );
}
