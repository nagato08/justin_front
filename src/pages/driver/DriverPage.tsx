import {
  Bike,
  CheckCircle2,
  LocateFixed,
  MapPin,
  Navigation,
  Play,
  Radio,
  SkipForward,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { Header } from "../../components/Header";
import { useAuth } from "../../contexts/AuthContext";
import { api, SOCKET_URL } from "../../lib/api";

type StopStatus = "PENDING" | "ARRIVED" | "DELIVERED" | "SKIPPED";

interface Stop {
  id: string;
  sequence: number;
  status: StopStatus;
  estimatedDistanceKm?: string;
  estimatedDurationMin?: number;
  order: {
    reference: string;
    customerName: string;
    customerPhone: string;
    deliveryAddress?: string;
    deliveryLatitude?: string;
    deliveryLongitude?: string;
  };
}

interface Assignment {
  id: string;
  status: string;
  stops: Stop[];
}

export function DriverPage() {
  const { token, user } = useAuth();
  const [items, setItems] = useState<Assignment[]>([]);
  const [sharing, setSharing] = useState<string>();
  const [error, setError] = useState("");
  const socket = useRef<Socket | undefined>(undefined);
  const watch = useRef<number | undefined>(undefined);
  const lastSent = useRef(0);

  const load = useCallback(
    () => api<Assignment[]>("/driver/delivery/assignments", {}, token).then(setItems),
    [token],
  );

  useEffect(() => {
    void load();
    return () => {
      if (watch.current !== undefined) navigator.geolocation.clearWatch(watch.current);
      socket.current?.disconnect();
    };
  }, [load]);

  const startSharing = (assignmentId: string) => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n’est pas disponible.");
      return;
    }
    socket.current = io(`${SOCKET_URL}/delivery`, {
      auth: { token },
      transports: ["websocket"],
    });
    watch.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        if (Date.now() - lastSent.current < 5000) return;
        lastSent.current = Date.now();
        socket.current?.emit("driver:location", {
          assignmentId,
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          heading: coords.heading,
          speed: coords.speed,
        });
      },
      () => setError("Autorisez la position GPS pour démarrer la tournée."),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 },
    );
    setSharing(assignmentId);
  };

  const start = async (id: string) => {
    try {
      setError("");
      await api(`/driver/delivery/assignments/${id}/start`, { method: "PATCH" }, token);
      startSharing(id);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Démarrage impossible");
    }
  };

  const updateStop = async (id: string, status: Exclude<StopStatus, "PENDING">) => {
    try {
      setError("");
      await api(
        `/driver/delivery/stops/${id}`,
        { method: "PATCH", body: JSON.stringify({ status }) },
        token,
      );
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Mise à jour impossible");
    }
  };

  return (
    <>
      <Header />
      <main className="page container driver-page">
        <div className="driver-welcome">
          <span className="eyebrow">Bonjour {user?.displayName}</span>
          <h1>Mes livraisons</h1>
          <p>Gardez cet écran ouvert pendant votre tournée.</p>
        </div>
        {error && <div className="error-banner">{error}</div>}
        {items.map((assignment) => (
          <section className="driver-assignment" key={assignment.id}>
            <header>
              <div>
                <span className={sharing === assignment.id ? "gps-pulse active" : "gps-pulse"}><Radio /></span>
                <div><small>Tournée</small><strong>{assignment.stops.length} livraison(s)</strong></div>
              </div>
              <span className="order-badge confirmed">{assignment.status}</span>
            </header>
            {assignment.status === "PLANNED" ? (
              <button className="button primary wide" onClick={() => start(assignment.id)}>
                <Play /> Démarrer et partager ma position
              </button>
            ) : sharing !== assignment.id ? (
              <button className="button primary wide" onClick={() => startSharing(assignment.id)}>
                <LocateFixed /> Reprendre le partage GPS
              </button>
            ) : (
              <div className="sharing-banner"><Navigation /> Position partagée en direct</div>
            )}
            <div className="driver-stops">
              {assignment.stops.map((stop) => {
                const finished = stop.status === "DELIVERED" || stop.status === "SKIPPED";
                return (
                  <article className={finished ? "delivered" : ""} key={stop.id}>
                    <div className="stop-index">
                      {stop.status === "DELIVERED" ? <CheckCircle2 /> : stop.status === "SKIPPED" ? <SkipForward /> : stop.sequence}
                    </div>
                    <div className="stop-content">
                      <span>{stop.order.reference}</span>
                      <h3>{stop.order.customerName}</h3>
                      <p><MapPin />{stop.order.deliveryAddress || "Coordonnées GPS disponibles"}</p>
                      <p>
                        {stop.estimatedDistanceKm && `${stop.estimatedDistanceKm} km · `}
                        {stop.estimatedDurationMin && `environ ${stop.estimatedDurationMin} min`}
                      </p>
                      {!finished && (
                        <div className="stop-actions">
                          <a
                            className="button subtle"
                            href={`https://www.google.com/maps/dir/?api=1&destination=${stop.order.deliveryLatitude},${stop.order.deliveryLongitude}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Navigation /> Itinéraire
                          </a>
                          {stop.status === "PENDING" && (
                            <button className="button primary" onClick={() => updateStop(stop.id, "ARRIVED")}>
                              <MapPin /> Je suis arrivé
                            </button>
                          )}
                          {stop.status === "ARRIVED" && (
                            <button className="button primary" onClick={() => updateStop(stop.id, "DELIVERED")}>
                              <CheckCircle2 /> Livré
                            </button>
                          )}
                          <button className="icon-button" onClick={() => updateStop(stop.id, "SKIPPED")} title="Passer cet arrêt">
                            <SkipForward />
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
        {!items.length && (
          <div className="empty-state large">
            <Bike /><h2>Aucune livraison assignée</h2>
            <p>Les nouvelles tournées apparaîtront ici.</p>
          </div>
        )}
      </main>
    </>
  );
}
