import { Bike, Check, LocateFixed, MapPin, Plus, Route } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Alert, Badge, EmptyState, Modal, PageHeader } from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import { api, dateTime } from "../../lib/api";
import { assignmentStatusLabel, assignmentStatusTone, stopStatusLabel, stopStatusTone } from "../../lib/labels";
import type { Order, User } from "../../lib/types";

interface Assignment {
  id: string;
  status: string;
  createdAt: string;
  driver: { displayName: string };
  stops: Array<{ id: string; sequence: number; status: string; order: { reference: string; customerName: string; deliveryAddress?: string } }>;
}
interface AdminUser extends User { isActive: boolean }

export function AdminDeliveriesPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<Assignment[]>([]);
  const [drivers, setDrivers] = useState<AdminUser[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [coords, setCoords] = useState({ latitude: 4.0511, longitude: 9.7679 });
  const [located, setLocated] = useState(false);

  const load = useCallback(async () => {
    try {
      const [assignments, users, ready] = await Promise.all([
        api<Assignment[]>("/admin/delivery/assignments", {}, token),
        api<AdminUser[]>("/admin/users", {}, token),
        api<{ data: Order[] }>("/admin/orders?page=1&limit=100&status=READY", {}, token),
      ]);
      setItems(assignments);
      setDrivers(users.filter((user) => user.role === "DELIVERER" && user.isActive));
      setOrders(ready.data.filter((order) => order.fulfillmentType === "DELIVERY"));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Chargement impossible.");
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const locate = () => {
    if (!navigator.geolocation) return setFormError("La géolocalisation n’est pas disponible.");
    navigator.geolocation.getCurrentPosition(
      ({ coords: current }) => {
        setCoords({ latitude: current.latitude, longitude: current.longitude });
        setLocated(true);
      },
      () => setFormError("Autorisez la position GPS pour utiliser votre point de départ actuel."),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected.length) return setFormError("Sélectionnez au moins une commande prête.");
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setFormError("");
    try {
      await api("/admin/delivery/assignments", {
        method: "POST",
        body: JSON.stringify({ driverId: data.get("driverId"), orderIds: selected, startLatitude: coords.latitude, startLongitude: coords.longitude }),
      }, token);
      setShow(false);
      setSelected([]);
      await load();
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : "Création impossible.");
    } finally {
      setBusy(false);
    }
  };

  const toggleOrder = (id: string) => setSelected((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  const active = items.filter((item) => item.status === "PLANNED" || item.status === "IN_PROGRESS");
  const done = items.filter((item) => item.status !== "PLANNED" && item.status !== "IN_PROGRESS");

  return (
    <div className="admin-page">
      <PageHeader
        title="Livraisons"
        description="Regroupez les commandes prêtes en tournées. L’ordre de passage est optimisé automatiquement."
        actions={
          <button type="button" className="button primary" onClick={() => { setFormError(""); setShow(true); }} disabled={!drivers.length || !orders.length}>
            <Plus aria-hidden="true" /> Nouvelle tournée
            {orders.length > 0 && <span className="count-badge light">{orders.length}</span>}
          </button>
        }
      />
      {error && <Alert tone="danger" onClose={() => setError("")}>{error}</Alert>}
      {!drivers.length ? (
        <Alert tone="info">Invitez d’abord un livreur depuis la page Utilisateurs.</Alert>
      ) : !orders.length && (
        <Alert tone="info">Aucune commande à livrer n’est prête. Passez une commande au statut « Prête » pour l’ajouter à une tournée.</Alert>
      )}

      {!items.length ? (
        <EmptyState icon={Route} title="Aucune tournée">Les tournées créées apparaîtront ici avec leur progression.</EmptyState>
      ) : (
        <>
          {active.length > 0 && <AssignmentGroup title="En cours" items={active} />}
          {done.length > 0 && <AssignmentGroup title="Terminées" items={done} />}
        </>
      )}

      {show && (
        <Modal title="Nouvelle tournée" description="Choisissez le livreur et les commandes à lui confier." onClose={() => setShow(false)} size="lg" locked={busy}>
          <form onSubmit={create} className="stack">
            <div className="field">
              <label htmlFor="driver">Livreur</label>
              <select id="driver" name="driverId" required defaultValue="">
                <option value="" disabled>Choisir un livreur</option>
                {drivers.map((driver) => <option value={driver.id} key={driver.id}>{driver.displayName}</option>)}
              </select>
            </div>

            <fieldset className="select-list">
              <legend>Commandes prêtes <span className="optional">{selected.length} sélectionnée{selected.length > 1 ? "s" : ""}</span></legend>
              {orders.map((order) => (
                <label key={order.id} className={selected.includes(order.id) ? "select-item selected" : "select-item"}>
                  <input type="checkbox" checked={selected.includes(order.id)} onChange={() => toggleOrder(order.id)} />
                  <span className="select-check" aria-hidden="true"><Check /></span>
                  <span>
                    <strong>{order.customerName}</strong>
                    <small><MapPin aria-hidden="true" />{order.deliveryAddress || "Point GPS"} · {order.reference}</small>
                  </span>
                </label>
              ))}
            </fieldset>

            <div className="field">
              <span className="field-label">Point de départ</span>
              <button type="button" className={located ? "button secondary block success-text" : "button secondary block"} onClick={locate}>
                <LocateFixed aria-hidden="true" /> {located ? "Position actuelle utilisée" : "Utiliser ma position actuelle"}
              </button>
              <details className="advanced">
                <summary>Saisir les coordonnées</summary>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="start-lat">Latitude</label>
                    <input id="start-lat" type="number" step="any" value={coords.latitude} onChange={(event) => setCoords((current) => ({ ...current, latitude: Number(event.target.value) }))} required />
                  </div>
                  <div className="field">
                    <label htmlFor="start-lng">Longitude</label>
                    <input id="start-lng" type="number" step="any" value={coords.longitude} onChange={(event) => setCoords((current) => ({ ...current, longitude: Number(event.target.value) }))} required />
                  </div>
                </div>
              </details>
            </div>

            {formError && <p className="field-error" role="alert">{formError}</p>}
            <div className="modal-actions">
              <button type="button" className="button secondary" onClick={() => setShow(false)} disabled={busy}>Annuler</button>
              <button className="button primary" disabled={busy || !selected.length}>{busy ? "Création…" : `Créer la tournée (${selected.length})`}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function AssignmentGroup({ title, items }: { title: string; items: Assignment[] }) {
  return (
    <section aria-label={title}>
      <h2 className="group-title">{title} <span>{items.length}</span></h2>
      <div className="assignment-grid">
        {items.map((assignment) => {
          const delivered = assignment.stops.filter((stop) => stop.status === "DELIVERED").length;
          return (
            <article className="card assignment" key={assignment.id}>
              <header className="assignment-head">
                <span className="card-icon"><Bike aria-hidden="true" /></span>
                <div>
                  <h3>{assignment.driver.displayName}</h3>
                  <small className="muted">{dateTime(assignment.createdAt)} · {delivered}/{assignment.stops.length} livrée{delivered > 1 ? "s" : ""}</small>
                </div>
                <Badge tone={assignmentStatusTone(assignment.status)}>{assignmentStatusLabel(assignment.status)}</Badge>
              </header>
              <div className="bar" aria-hidden="true"><span style={{ width: `${(delivered / Math.max(1, assignment.stops.length)) * 100}%` }} /></div>
              <ol className="stop-list">
                {assignment.stops.map((stop) => (
                  <li key={stop.id} className={stop.status === "DELIVERED" ? "done" : undefined}>
                    <span className="stop-index">{stop.sequence}</span>
                    <div>
                      <strong>{stop.order.customerName}</strong>
                      <small>{stop.order.deliveryAddress || "Position GPS"}</small>
                    </div>
                    <Badge tone={stopStatusTone(stop.status)}>{stopStatusLabel(stop.status)}</Badge>
                  </li>
                ))}
              </ol>
            </article>
          );
        })}
      </div>
    </section>
  );
}
