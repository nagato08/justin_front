import { ArrowRight, Banknote, ChefHat, ClipboardList, ShoppingBag, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Badge, PageHeader, Skeleton } from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import { api, dateTime, money } from "../../lib/api";
import { orderStatusLabel, orderStatusTone } from "../../lib/labels";
import type { DashboardData, Order, StoreStatus } from "../../lib/types";

export function AdminDashboard() {
  const { token, user } = useAuth();
  const [data, setData] = useState<DashboardData>();
  const [recent, setRecent] = useState<Order[]>([]);
  const [store, setStore] = useState<StoreStatus>();
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api<DashboardData>("/admin/reports/dashboard", {}, token),
      api<{ data: Order[] }>("/admin/orders?limit=6&page=1", {}, token),
      api<StoreStatus>("/store/status"),
    ])
      .then(([dashboard, orders, status]) => {
        setData(dashboard);
        setRecent(orders.data);
        setStore(status);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Chargement impossible."));
  }, [token]);

  const byStatus = data?.orders.byStatus ?? {};
  const toHandle = (byStatus.PENDING ?? 0) + (byStatus.CONFIRMED ?? 0) + (byStatus.PREPARING ?? 0) + (byStatus.READY ?? 0);
  const stats = [
    { label: "À traiter", value: String(toHandle), note: `${byStatus.PENDING ?? 0} en attente de confirmation`, icon: ChefHat, emphasis: toHandle > 0 },
    { label: "Commandes", value: String(data?.orders.total ?? 0), note: "30 derniers jours", icon: ClipboardList },
    { label: "Chiffre d’affaires", value: money(data?.orders.grossValue ?? 0), note: `Panier moyen ${money(Math.round(Number(data?.orders.averageValue ?? 0)))}`, icon: TrendingUp },
    { label: "Encaissé", value: money(data?.payments.receivedAmount ?? 0), note: `${data?.payments.receivedCount ?? 0} paiement(s) reçu(s)`, icon: Banknote },
  ];

  return (
    <div className="admin-page">
      <PageHeader
        eyebrow={`Bonjour ${user?.displayName.split(" ")[0] ?? ""}`}
        title="Vue d’ensemble"
        actions={<Link className="button primary" to="/admin/commandes">Traiter les commandes <ArrowRight aria-hidden="true" /></Link>}
      />
      {error && <Alert tone="danger">{error}</Alert>}

      {store && (
        <div className={store.isOpen ? "store-banner open" : "store-banner closed"}>
          <span className="status-dot" aria-hidden="true" />
          <div>
            <strong>{store.isOpen ? "Les commandes sont ouvertes" : "Les commandes sont fermées"}</strong>
            <span>{store.isOpen ? "Les clients peuvent commander en ce moment." : store.message}</span>
          </div>
          <Link to="/admin/reglages" className="button secondary sm">{store.isOpen ? "Fermer" : "Rouvrir"}</Link>
        </div>
      )}

      <div className="stat-grid">
        {stats.map(({ label, value, note, icon: Icon, emphasis }) => (
          <article className={emphasis ? "stat-card emphasis" : "stat-card"} key={label}>
            <span className="stat-icon"><Icon aria-hidden="true" /></span>
            <small>{label}</small>
            {data ? <strong>{value}</strong> : <Skeleton className="skeleton-line" />}
            <p>{note}</p>
          </article>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="card" aria-labelledby="recent-title">
          <header className="card-head">
            <h2 id="recent-title">Dernières commandes</h2>
            <Link to="/admin/commandes" className="link">Tout voir</Link>
          </header>
          {recent.length ? (
            <ul className="compact-list">
              {recent.map((order) => (
                <li key={order.id}>
                  <div>
                    <strong>{order.customerName}</strong>
                    <small>{order.reference} · {dateTime(order.createdAt)}</small>
                  </div>
                  <Badge tone={orderStatusTone(order.status)}>{orderStatusLabel(order.status)}</Badge>
                  <span className="price">{money(order.total)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="card-empty"><ShoppingBag aria-hidden="true" /> Aucune commande récente.</p>
          )}
        </section>

        <section className="card" aria-labelledby="popular-title">
          <header className="card-head">
            <h2 id="popular-title">Plats les plus vendus</h2>
            <span className="muted small">30 jours</span>
          </header>
          {data?.popularProducts.length ? (
            <ol className="ranking">
              {data.popularProducts.map((product, index) => {
                const max = data.popularProducts[0].quantity || 1;
                return (
                  <li key={product.name}>
                    <span className="rank">{index + 1}</span>
                    <div className="ranking-body">
                      <div className="ranking-row"><strong>{product.name}</strong><span className="price">{money(product.amount)}</span></div>
                      <div className="bar" aria-hidden="true"><span style={{ width: `${(product.quantity / max) * 100}%` }} /></div>
                      <small>{product.quantity} vendu{product.quantity > 1 ? "s" : ""}</small>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="card-empty">Les ventes apparaîtront ici.</p>
          )}
        </section>
      </div>
    </div>
  );
}
