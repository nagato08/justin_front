import { ChevronRight, PackageOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { Alert, Badge, EmptyState, PageHeader, Skeleton } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { api, dateTime, money } from "../lib/api";
import { ACTIVE_ORDER_STATUSES, orderStatusLabel, orderStatusTone } from "../lib/labels";
import type { Order } from "../lib/types";

export function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Order[]>("/orders/me", {}, token)
      .then(setOrders)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Chargement impossible."))
      .finally(() => setLoading(false));
  }, [token]);

  const current = orders.filter((order) => ACTIVE_ORDER_STATUSES.includes(order.status));
  const past = orders.filter((order) => !ACTIVE_ORDER_STATUSES.includes(order.status));

  return (
    <>
      <Header />
      <main id="contenu" className="container page narrow">
        <PageHeader title="Mes commandes" description="Suivez vos commandes en cours et retrouvez votre historique." />
        {error && <Alert tone="danger">{error}</Alert>}
        {loading ? (
          <div className="stack">{[1, 2, 3].map((item) => <Skeleton key={item} className="skeleton-row" />)}</div>
        ) : !orders.length && !error ? (
          <EmptyState icon={PackageOpen} title="Aucune commande pour le moment" action={<Link className="button primary" to="/">Découvrir le menu</Link>}>
            Votre prochain bon repas n’est qu’à quelques clics.
          </EmptyState>
        ) : (
          <>
            {current.length > 0 && <OrderGroup title="En cours" orders={current} highlight />}
            {past.length > 0 && <OrderGroup title="Historique" orders={past} />}
          </>
        )}
      </main>
    </>
  );
}

function OrderGroup({ title, orders, highlight = false }: { title: string; orders: Order[]; highlight?: boolean }) {
  return (
    <section className="order-group" aria-label={title}>
      <h2 className="group-title">{title} <span>{orders.length}</span></h2>
      <ul className="order-list">
        {orders.map((order) => (
          <li key={order.id}>
            <Link to={`/orders/${order.reference}`} className={highlight ? "order-card highlight" : "order-card"}>
              <div className="order-card-main">
                <div className="order-card-top">
                  <Badge tone={orderStatusTone(order.status)}>{orderStatusLabel(order.status)}</Badge>
                  <span className="muted">{dateTime(order.createdAt)}</span>
                </div>
                <p className="order-card-items">{order.items.map((item) => `${item.quantity}× ${item.productName}`).join(" · ")}</p>
                <span className="order-card-ref">{order.reference}</span>
              </div>
              <strong className="price">{money(order.total)}</strong>
              <ChevronRight aria-hidden="true" className="chevron" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
