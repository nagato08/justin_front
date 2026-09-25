import { Bike, LocateFixed, MapPin, Plus, Route } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { api, dateTime } from "../../lib/api";
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
  const [busy, setBusy] = useState(false);
  const [coords, setCoords] = useState({ latitude: 4.0511, longitude: 9.7679 });

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

  useEffect(() => { void load(); }, [load]);

  const locate = () => {
    if (!navigator.geolocation) return setError("La géolocalisation n’est pas disponible.");
    navigator.geolocation.getCurrentPosition(
      ({ coords: current }) => setCoords({ latitude: current.latitude, longitude: current.longitude }),
      () => setError("Autorisez la position GPS pour utiliser le point de départ actuel."),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected.length) return setError("Sélectionnez au moins une commande prête.");
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await api("/admin/delivery/assignments", {
        method: "POST",
        body: JSON.stringify({ driverId: data.get("driverId"), orderIds: selected, startLatitude: coords.latitude, startLongitude: coords.longitude }),
      }, token);
      setShow(false);
      setSelected([]);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Création impossible.");
    } finally { setBusy(false); }
  };

  const toggleOrder = (id: string) => setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);

  return <div>
    <div className="admin-page-head">
      <div><span className="eyebrow">Terrain</span><h1>Livraisons</h1><p>Créez les tournées et suivez leur progression.</p></div>
      <button className="button primary" onClick={() => setShow(true)} disabled={!drivers.length || !orders.length}><Plus/> Créer une tournée</button>
    </div>
    {error && <div className="error-banner">{error}</div>}
    {(!drivers.length || !orders.length) && <div className="info-banner"><Route/> {!drivers.length ? "Invitez d’abord un livreur actif." : "Aucune commande en livraison n’est prête pour une tournée."}</div>}
    <div className="assignment-grid">
      {items.map((assignment) => <article className="panel assignment" key={assignment.id}>
        <header><span><Bike/></span><div><h3>{assignment.driver.displayName}</h3><small>{dateTime(assignment.createdAt)}</small></div><b>{assignment.status}</b></header>
        {assignment.stops.map((stop) => <div className="stop" key={stop.id}><em>{stop.sequence}</em><div><strong>{stop.order.reference} · {stop.order.customerName}</strong><small><MapPin/>{stop.order.deliveryAddress || "Position GPS"}</small></div><span>{stop.status}</span></div>)}
      </article>)}
      {!items.length && <div className="empty-state large"><Bike/><h2>Aucune tournée</h2><p>Les tournées créées apparaîtront ici.</p></div>}
    </div>
    {show && <div className="modal-backdrop" onMouseDown={() => setShow(false)}><div className="modal delivery-modal" onMouseDown={(event) => event.stopPropagation()}>
      <span className="eyebrow">Nouvelle tournée</span><h2>Organiser les livraisons</h2><p>L’ordre choisi sera optimisé par le serveur à partir du point de départ.</p>
      <form onSubmit={create}>
        <label>Livreur<select name="driverId" required defaultValue=""><option value="" disabled>Choisir un livreur</option>{drivers.map((driver) => <option value={driver.id} key={driver.id}>{driver.displayName}</option>)}</select></label>
        <fieldset className="order-picker"><legend>Commandes prêtes</legend>{orders.map((order) => <label key={order.id} className={selected.includes(order.id) ? "selected" : ""}><input type="checkbox" checked={selected.includes(order.id)} onChange={() => toggleOrder(order.id)}/><span><strong>{order.reference} · {order.customerName}</strong><small><MapPin/>{order.deliveryAddress || "Point GPS sélectionné"}</small></span></label>)}</fieldset>
        <div className="fields two"><label>Latitude<input type="number" step="any" value={coords.latitude} onChange={(event) => setCoords((current) => ({ ...current, latitude: Number(event.target.value) }))} required/></label><label>Longitude<input type="number" step="any" value={coords.longitude} onChange={(event) => setCoords((current) => ({ ...current, longitude: Number(event.target.value) }))} required/></label></div>
        <button type="button" className="button subtle wide" onClick={locate}><LocateFixed/> Utiliser ma position actuelle</button>
        <button className="button primary wide" disabled={busy || !selected.length}>{busy ? "Création…" : `Créer la tournée (${selected.length})`}</button>
      </form>
    </div></div>}
  </div>;
}
