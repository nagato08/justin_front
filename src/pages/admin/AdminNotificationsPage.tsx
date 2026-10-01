import { Bell, BellRing, CheckCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Alert, EmptyState, PageHeader } from "../../components/ui";
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

  const load = useCallback(() =>
    api<{ data: Notification[]; unreadCount: number }>("/admin/notifications/in-app", {}, token)
      .then((result) => {
        setData(result.data);
        setUnread(result.unreadCount);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Chargement impossible.")), [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const readAll = async () => {
    await api("/admin/notifications/in-app/read-all", { method: "PATCH" }, token);
    await load();
  };

  const enablePush = async () => {
    if (!token) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await subscribeAdminPush(token);
      setMessage("Notifications activées sur cet appareil.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Activation impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-page">
      <PageHeader
        title="Notifications"
        description={unread ? `${unread} non lue${unread > 1 ? "s" : ""}` : "Tout est lu."}
        actions={
          <>
            {unread > 0 && <button type="button" className="button secondary" onClick={readAll}><CheckCheck aria-hidden="true" /> Tout marquer comme lu</button>}
            <button type="button" className="button primary" onClick={enablePush} disabled={busy}><BellRing aria-hidden="true" /> {busy ? "Activation…" : "Alertes sur cet appareil"}</button>
          </>
        }
      />
      {message && <Alert tone="success" onClose={() => setMessage("")}>{message}</Alert>}
      {error && <Alert tone="danger" onClose={() => setError("")}>{error}</Alert>}
      {!data.length ? (
        <EmptyState icon={Bell} title="Aucune notification">Vous serez prévenue ici à chaque nouvelle commande.</EmptyState>
      ) : (
        <ul className="notification-list">
          {data.map((notification) => (
            <li className={notification.readAt ? "notification" : "notification unread"} key={notification.id}>
              <span className="notification-icon"><Bell aria-hidden="true" /></span>
              <div>
                <strong>{notification.title}</strong>
                <p>{notification.body}</p>
                <small className="muted">{dateTime(notification.createdAt)}</small>
              </div>
              {!notification.readAt && <span className="unread-dot" aria-label="Non lue" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
