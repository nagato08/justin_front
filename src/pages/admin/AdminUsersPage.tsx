import { Mail, Phone, Plus, Search, UserRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Alert, Badge, ConfirmDialog, EmptyState, Modal, PageHeader, Skeleton } from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import { api, dateTime } from "../../lib/api";
import { ROLE_LABELS } from "../../lib/labels";
import { normalizePhone } from "../../lib/phone";
import type { User, UserRole } from "../../lib/types";

interface AdminUser extends User { isActive: boolean; createdAt: string; lastLoginAt?: string }

const ROLE_FILTERS: Array<{ value: UserRole | ""; label: string }> = [
  { value: "", label: "Tous" },
  { value: "CUSTOMER", label: "Clients" },
  { value: "DELIVERER", label: "Livreurs" },
  { value: "ADMIN", label: "Administration" },
];

export function AdminUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | "">("");
  const [search, setSearch] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [toggleTarget, setToggleTarget] = useState<AdminUser | null>(null);

  const load = useCallback(() =>
    api<AdminUser[]>("/admin/users", {}, token)
      .then(setUsers)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Chargement impossible."))
      .finally(() => setLoading(false)), [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setFormError("");
    try {
      await api("/admin/users", {
        method: "POST",
        body: JSON.stringify({
          displayName: data.get("name"),
          email: data.get("email") || undefined,
          phone: data.get("phone") ? normalizePhone(String(data.get("phone"))) : undefined,
          role: "DELIVERER",
        }),
      }, token);
      setShow(false);
      await load();
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : "Création impossible.");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (user: AdminUser) => {
    setBusy(true);
    try {
      await api(`/admin/users/${user.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !user.isActive }) }, token);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Modification impossible.");
    } finally {
      setBusy(false);
      setToggleTarget(null);
    }
  };

  const term = search.trim().toLowerCase();
  const visible = users.filter((user) =>
    (!role || user.role === role)
    && (!term || [user.displayName, user.phone, user.email].some((value) => value?.toLowerCase().includes(term))));

  return (
    <div className="admin-page">
      <PageHeader
        title="Utilisateurs"
        description="Clients, livreurs et administration."
        actions={<button type="button" className="button primary" onClick={() => { setFormError(""); setShow(true); }}><Plus aria-hidden="true" /> Inviter un livreur</button>}
      />

      <div className="toolbar">
        <div className="search-field">
          <Search aria-hidden="true" />
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom, téléphone ou e-mail" aria-label="Rechercher un utilisateur" />
        </div>
        <div className="chips scroll" role="tablist" aria-label="Filtrer par rôle">
          {ROLE_FILTERS.map((item) => (
            <button key={item.value} type="button" role="tab" aria-selected={role === item.value} className="chip" onClick={() => setRole(item.value)}>
              {item.label}
              <span className="chip-count">{item.value ? users.filter((user) => user.role === item.value).length : users.length}</span>
            </button>
          ))}
        </div>
      </div>

      {error && <Alert tone="danger" onClose={() => setError("")}>{error}</Alert>}

      {loading ? (
        <div className="stack">{[1, 2, 3].map((item) => <Skeleton key={item} className="skeleton-row" />)}</div>
      ) : !visible.length ? (
        <EmptyState icon={UserRound} title="Aucun utilisateur">Aucun compte ne correspond à cette recherche.</EmptyState>
      ) : (
        <ul className="user-list">
          {visible.map((user) => (
            <li key={user.id} className={user.isActive ? "user-row" : "user-row inactive"}>
              <span className="avatar" aria-hidden="true">{user.displayName.charAt(0).toUpperCase()}</span>
              <div className="user-main">
                <strong>{user.displayName}</strong>
                <div className="user-contact">
                  {user.phone && <a href={`tel:${user.phone}`}><Phone aria-hidden="true" />{user.phone}</a>}
                  {user.email && <span><Mail aria-hidden="true" />{user.email}</span>}
                </div>
              </div>
              <div className="user-side">
                <Badge tone={user.role === "ADMIN" ? "accent" : user.role === "DELIVERER" ? "info" : "neutral"}>{ROLE_LABELS[user.role]}</Badge>
                <small className="muted">Inscrit le {dateTime(user.createdAt)}</small>
              </div>
              <div className="user-actions">
                {!user.isActive && <Badge tone="danger">Désactivé</Badge>}
                {user.role !== "ADMIN" && (
                  <button type="button" className={user.isActive ? "button ghost sm danger-text" : "button secondary sm"} onClick={() => (user.isActive ? setToggleTarget(user) : toggle(user))} disabled={busy}>
                    {user.isActive ? "Désactiver" : "Réactiver"}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {show && (
        <Modal title="Inviter un livreur" description="Il se connectera avec un code SMS envoyé à ce numéro." onClose={() => setShow(false)} size="sm" locked={busy}>
          <form onSubmit={create} className="stack">
            <div className="field">
              <label htmlFor="driver-name">Nom</label>
              <input id="driver-name" name="name" required minLength={2} autoFocus />
            </div>
            <div className="field">
              <label htmlFor="driver-phone">Téléphone</label>
              <input id="driver-phone" name="phone" type="tel" inputMode="tel" required placeholder="6 90 00 00 00" />
              <small className="field-hint">Indicatif +237 ajouté automatiquement.</small>
            </div>
            <div className="field">
              <label htmlFor="driver-email">E-mail <span className="optional">facultatif</span></label>
              <input id="driver-email" name="email" type="email" />
            </div>
            {formError && <p className="field-error" role="alert">{formError}</p>}
            <div className="modal-actions">
              <button type="button" className="button secondary" onClick={() => setShow(false)} disabled={busy}>Annuler</button>
              <button className="button primary" disabled={busy}>{busy ? "Création…" : "Inviter"}</button>
            </div>
          </form>
        </Modal>
      )}

      {toggleTarget && (
        <ConfirmDialog title={`Désactiver ${toggleTarget.displayName} ?`} confirmLabel="Désactiver le compte" busy={busy} onConfirm={() => toggle(toggleTarget)} onCancel={() => setToggleTarget(null)}>
          Le compte ne pourra plus se connecter. Vous pourrez le réactiver à tout moment.
        </ConfirmDialog>
      )}
    </div>
  );
}
