import { Bike, CheckCircle2, MapPin, Navigation, Phone, Play, Radio, SkipForward } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { Header } from "../../components/Header";
import { Alert, Badge, EmptyState, Spinner } from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import { api, SOCKET_URL } from "../../lib/api";
import { assignmentStatusLabel, assignmentStatusTone, stopStatusLabel, stopStatusTone } from "../../lib/labels";

interface Stop {
  id: string;
  sequence: number;
  status: string;
  estimatedDistanceKm?: string;
  estimatedDurationMin?: number;
  order: { reference: string; customerName: string; customerPhone: string; deliveryAddress?: string; deliveryLatitude?: string; deliveryLongitude?: string };
}
interface Assignment { id: string; status: string; stops: Stop[] }

export function DriverPage() {
  const { token, user } = useAuth();
  const [items, setItems] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState<string>();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const socket = useRef<Socket | undefined>(undefined);
  const watch = useRef<number | undefined>(undefined);
  const lastSent = useRef(0);

  const load = useCallback(() =>
    api<Assignment[]>("/driver/delivery/assignments", {}, token)
      .then(setItems)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Chargement impossible."))
      .finally(() => setLoading(false)), [token]);

  useEffect(() => {
    void load();
    return () => {
      if (watch.current !== undefined) navigator.geolocation.clearWatch(watch.current);
      socket.current?.disconnect();
    };
  }, [load]);

  const startSharing = (assignmentId: string) => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n’est pas disponible sur cet appareil.");
      return;
    }
    socket.current?.disconnect();
    if (watch.current !== undefined) navigator.geolocation.clearWatch(watch.current);
    socket.current = io(`${SOCKET_URL}/delivery`, { auth: { token }, transports: ["websocket"] });
    watch.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        if (Date.now() - lastSent.current < 5000) return;
        lastSent.current = Date.now();
        socket.current?.emit("driver:location", { assignmentId, latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy, heading: coords.heading, speed: coords.speed });
      },
      () => setError("Autorisez la position GPS pour que les clients suivent votre tournée."),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 },
    );
    setSharing(assignmentId);
  };

  const start = async (id: string) => {
    setPending(id);
    try {
      await api(`/driver/delivery/assignments/${id}/start`, { method: "PATCH" }, token);
      startSharing(id);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Démarrage impossible.");
    } finally {
      setPending(null);
    }
  };

  const updateStop = async (id: string, status: "ARRIVED" | "DELIVERED" | "SKIPPED") => {
    setPending(id);
    try {
      await api(`/driver/delivery/stops/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }, token);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Mise à jour impossible.");
    } finally {
      setPending(null);
    }
  };

  return (
    <>
      <Header />
      <main id="contenu" className="container page narrow driver-page">
        <div className="page-header">
          <div>
            <span className="eyebrow">Bonjour {user?.displayName.split(" ")[0]}</span>
            <h1>Mes livraisons</h1>
            <p>Gardez cet écran ouvert pendant la tournée pour partager votre position.</p>
          </div>
        </div>
        {error && <Alert tone="danger" onClose={() => setError("")}>{error}</Alert>}

        {loading ? (
          <div className="screen-center"><Spinner /></div>
        ) : !items.length ? (
          <EmptyState icon={Bike} title="Aucune livraison pour l’instant">Les nouvelles tournées apparaîtront ici dès qu’elles vous seront confiées.</EmptyState>
        ) : (
          items.map((assignment) => {
            const remaining = assignment.stops.filter((stop) => stop.status === "PENDING" || stop.status === "ARRIVED").length;
            const nextStop = assignment.stops.find((stop) => stop.status === "PENDING" || stop.status === "ARRIVED");
            return (
              <section className="card driver-assignment" key={assignment.id} aria-label="Tournée">
                <header className="driver-assignment-head">
                  <div>
                    <strong>{remaining} livraison{remaining > 1 ? "s" : ""} restante{remaining > 1 ? "s" : ""}</strong>
                    <small className="muted">sur {assignment.stops.length} dans cette tournée</small>
                  </div>
                  <Badge tone={assignmentStatusTone(assignment.status)}>{assignmentStatusLabel(assignment.status)}</Badge>
                </header>

                {assignment.status === "PLANNED" ? (
                  <button type="button" className="button primary block lg" onClick={() => start(assignment.id)} disabled={pending === assignment.id}>
                    <Play aria-hidden="true" /> Démarrer la tournée
                  </button>
                ) : sharing === assignment.id ? (
                  <div className="gps-banner"><Radio aria-hidden="true" className="pulse" /> Position partagée en direct</div>
                ) : (
                  <button type="button" className="button secondary block lg" onClick={() => startSharing(assignment.id)}>
                    <Navigation aria-hidden="true" /> Reprendre le partage GPS
                  </button>
                )}

                <ol className="driver-stops">
                  {assignment.stops.map((stop) => {
                    const isNext = stop.id === nextStop?.id;
                    const done = stop.status === "DELIVERED" || stop.status === "SKIPPED";
                    return (
                      <li key={stop.id} className={done ? "driver-stop done" : isNext ? "driver-stop next" : "driver-stop"}>
                        <span className="stop-index">{stop.status === "DELIVERED" ? <CheckCircle2 aria-hidden="true" /> : stop.status === "SKIPPED" ? <SkipForward aria-hidden="true" /> : stop.sequence}</span>
                        <div className="driver-stop-body">
                          <div className="driver-stop-top">
                            <strong>{stop.order.customerName}</strong>
                            <Badge tone={stopStatusTone(stop.status)}>{stopStatusLabel(stop.status)}</Badge>
                          </div>
                          <p className="with-icon"><MapPin aria-hidden="true" /> {stop.order.deliveryAddress || "Position GPS"}</p>
                          {(stop.estimatedDistanceKm || stop.estimatedDurationMin) && (
                            <small className="muted">
                              {stop.estimatedDistanceKm && `${stop.estimatedDistanceKm} km`}
                              {stop.estimatedDistanceKm && stop.estimatedDurationMin ? " · " : ""}
                              {stop.estimatedDurationMin && `environ ${stop.estimatedDurationMin} min`}
                            </small>
                          )}
                          {!done && (
                            <div className="driver-actions">
                              <a className="button secondary" href={`tel:${stop.order.customerPhone}`}><Phone aria-hidden="true" /> Appeler</a>
                              <a className="button secondary" href={`https://www.google.com/maps/dir/?api=1&destination=${stop.order.deliveryLatitude},${stop.order.deliveryLongitude}`} target="_blank" rel="noreferrer">
                                <Navigation aria-hidden="true" /> Itinéraire
                              </a>
                              {/* Le serveur exige l’arrivée sur place avant la livraison. */}
                              {stop.status === "PENDING" ? (
                                <button type="button" className="button primary grow" onClick={() => updateStop(stop.id, "ARRIVED")} disabled={pending === stop.id}>
                                  <MapPin aria-hidden="true" /> Je suis arrivé
                                </button>
                              ) : (
                                <button type="button" className="button primary grow" onClick={() => updateStop(stop.id, "DELIVERED")} disabled={pending === stop.id}>
                                  <CheckCircle2 aria-hidden="true" /> Livré
                                </button>
                              )}
                              <button type="button" className="icon-button" onClick={() => updateStop(stop.id, "SKIPPED")} disabled={pending === stop.id} aria-label="Passer cet arrêt" title="Passer cet arrêt">
                                <SkipForward />
                              </button>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })
        )}
      </main>
    </>
  );
}
