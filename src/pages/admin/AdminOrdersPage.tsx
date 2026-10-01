import { Bike, MapPin, Phone, RefreshCw, Search, Store } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Alert, Badge, ConfirmDialog, EmptyState, PageHeader, Skeleton } from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import { api, dateTime, money } from "../../lib/api";
import { canCancelOrder, nextOrderAction, orderStatusLabel, orderStatusTone, paymentMethodLabel, paymentStatusLabel, paymentStatusTone } from "../../lib/labels";
import type { Order } from "../../lib/types";

const FILTERS = [
  { value: "", label: "Toutes" },
  { value: "PENDING", label: "À confirmer" },
  { value: "CONFIRMED", label: "Confirmées" },
  { value: "PREPARING", label: "En préparation" },
  { value: "READY", label: "Prêtes" },
  { value: "OUT_FOR_DELIVERY", label: "En livraison" },
  { value: "DELIVERED", label: "Livrées" },
  { value: "CANCELLED", label: "Annulées" },
];

export function AdminOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: "1", limit: "100" });
    if (filter) params.set("status", filter);
    if (appliedSearch) params.set("search", appliedSearch);
    try {
      const result = await api<{ data: Order[] }>(`/admin/orders?${params}`, {}, token);
      setOrders(result.data);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }, [filter, appliedSearch, token]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 30000);
    return () => window.clearInterval(timer);
  }, [load]);

  const change = async (order: Order, status: string) => {
    setPending(order.id);
    try {
      await api(`/admin/orders/${order.id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }, token);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Action impossible.");
    } finally {
      setPending(null);
      setCancelTarget(null);
    }
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setAppliedSearch(search.trim());
  };

  return (
    <div className="admin-page">
      <PageHeader
        title="Commandes"
        description="Faites avancer chaque commande d’un geste. La liste s’actualise toute seule."
        actions={<button type="button" className="button secondary" onClick={() => void load()}><RefreshCw aria-hidden="true" /> Actualiser</button>}
      />

      <div className="toolbar">
        <form className="search-field" onSubmit={submitSearch} role="search">
          <Search aria-hidden="true" />
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Référence, nom ou téléphone" aria-label="Rechercher une commande" />
        </form>
        <div className="chips scroll" role="tablist" aria-label="Filtrer par statut">
          {FILTERS.map((item) => (
            <button key={item.value} type="button" role="tab" aria-selected={filter === item.value} className="chip" onClick={() => { setLoading(true); setFilter(item.value); }}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {error && <Alert tone="danger" onClose={() => setError("")}>{error}</Alert>}

      {loading ? (
        <div className="stack">{[1, 2, 3].map((item) => <Skeleton key={item} className="skeleton-block" />)}</div>
      ) : !orders.length ? (
        <EmptyState icon={Search} title="Aucune commande">
          {filter || appliedSearch ? "Aucune commande ne correspond à ce filtre." : "Les nouvelles commandes apparaîtront ici."}
        </EmptyState>
      ) : (
        <ul className="admin-order-list">
          {orders.map((order) => {
            const action = nextOrderAction(order.status, order.fulfillmentType);
            const payment = order.payments?.[0];
            const isDelivery = order.fulfillmentType === "DELIVERY";
            return (
              <li key={order.id} className={`admin-order status-${order.status.toLowerCase()}`}>
                <div className="admin-order-head">
                  <div>
                    <strong className="admin-order-name">{order.customerName}</strong>
                    <small className="muted">{order.reference} · {dateTime(order.createdAt)}</small>
                  </div>
                  <Badge tone={orderStatusTone(order.status)}>{orderStatusLabel(order.status)}</Badge>
                </div>

                <p className="admin-order-items">
                  {order.items.map((item) => <span key={item.productName}><b>{item.quantity}×</b> {item.productName}</span>)}
                </p>

                <div className="admin-order-meta">
                  <span>{isDelivery ? <Bike aria-hidden="true" /> : <Store aria-hidden="true" />}{isDelivery ? "Livraison" : "Retrait"}</span>
                  {order.deliveryAddress && <span><MapPin aria-hidden="true" />{order.deliveryAddress}</span>}
                  <a href={`tel:${order.customerPhone}`}><Phone aria-hidden="true" />{order.customerPhone}</a>
                  {payment && <Badge tone={paymentStatusTone(payment.status)}>{paymentMethodLabel(payment.method)} · {paymentStatusLabel(payment.status)}</Badge>}
                </div>

                <div className="admin-order-foot">
                  <strong className="price lg">{money(order.total)}</strong>
                  <div className="admin-order-actions">
                    {canCancelOrder(order.status) && (
                      <button type="button" className="button ghost sm danger-text" onClick={() => setCancelTarget(order)} disabled={pending === order.id}>Annuler</button>
                    )}
                    {action && (
                      <button type="button" className="button primary sm" onClick={() => change(order, action.status)} disabled={pending === order.id}>
                        {pending === order.id ? "…" : action.label}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {cancelTarget && (
        <ConfirmDialog
          title={`Annuler la commande de ${cancelTarget.customerName} ?`}
          confirmLabel="Annuler la commande"
          busy={pending === cancelTarget.id}
          onCancel={() => setCancelTarget(null)}
          onConfirm={() => change(cancelTarget, "CANCELLED")}
        >
          {cancelTarget.reference} · {money(cancelTarget.total)}. Cette action est définitive.
        </ConfirmDialog>
      )}
    </div>
  );
}
