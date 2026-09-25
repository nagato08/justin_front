import { Bell, BellRing, CheckCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { api, dateTime } from "../../lib/api";
import { subscribeAdminPush } from "../../lib/push";
interface Notification { id: string; title: string; body: string; readAt?: string; createdAt: string }
export function AdminNotificationsPage() {
  const { token } = useAuth();
  const [data, setData] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => api<{ data: Notification[]; unreadCount: number }>("/admin/notifications/in-app", {}, token).then((result) => { setData(result.data); setUnread(result.unreadCount); }), [token]);
  useEffect(() => { void load(); }, [load]);
  const readAll = async () => { await api("/admin/notifications/in-app/read-all", { method: "PATCH" }, token); await load(); };
  const enablePush = async () => {
    if (!token) return;
    setBusy(true); setError(""); setMessage("");
    try { await subscribeAdminPush(token); setMessage("Notifications activées sur cet appareil."); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Activation impossible."); }
    finally { setBusy(false); }
  };
  return <div>
    <div className="admin-page-head"><div><span className="eyebrow">Centre d’alertes</span><h1>Notifications</h1><p>{unread} notification(s) non lue(s).</p></div><div className="head-actions"><button className="button primary" onClick={enablePush} disabled={busy}><BellRing/> {busy ? "Activation…" : "Activer sur cet appareil"}</button><button className="button subtle" onClick={readAll}><CheckCheck/> Tout marquer comme lu</button></div></div>
    {message && <div className="success-banner"><BellRing/>{message}</div>}{error && <div className="error-banner">{error}</div>}
    <section className="panel notification-list">{data.map((notification) => <article className={!notification.readAt ? "unread" : ""} key={notification.id}><span><Bell/></span><div><h3>{notification.title}</h3><p>{notification.body}</p><small>{dateTime(notification.createdAt)}</small></div></article>)}{!data.length && <div className="panel-empty">Aucune notification.</div>}</section>
  </div>;
}
