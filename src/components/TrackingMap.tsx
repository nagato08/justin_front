import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../lib/api";
import type { DeliveryLocation } from "../lib/types";

const STYLE = (import.meta.env.VITE_MAP_STYLE_URL as string | undefined) || "https://demotiles.maplibre.org/style.json";
const DRIVER_COLOR = "#d63c22";
const DESTINATION_COLOR = "#1f2547";

interface TrackingMapProps {
  token: string;
  reference: string;
  initial?: DeliveryLocation | null;
  destination?: [number, number];
}

export function TrackingMap({ token, reference, initial, destination }: TrackingMapProps) {
  const element = useRef<HTMLDivElement>(null);
  const driver = useRef<maplibregl.Marker | null>(null);
  const start = useRef({ initial, destination });

  useEffect(() => {
    if (!element.current) return;
    const { initial: first, destination: target } = start.current;
    const point: [number, number] = first ? [Number(first.longitude), Number(first.latitude)] : target ?? [9.7679, 4.0511];
    const map = new maplibregl.Map({ container: element.current, style: STYLE, center: point, zoom: 13 });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }));
    if (target) {
      new maplibregl.Marker({ color: DESTINATION_COLOR })
        .setLngLat(target)
        .setPopup(new maplibregl.Popup().setText("Votre destination"))
        .addTo(map);
    }
    if (first) driver.current = new maplibregl.Marker({ color: DRIVER_COLOR }).setLngLat(point).addTo(map);

    const socket = io(`${SOCKET_URL}/delivery`, { auth: { token, reference }, transports: ["websocket"] });
    socket.on("delivery:location", (location: DeliveryLocation) => {
      const position: [number, number] = [Number(location.longitude), Number(location.latitude)];
      if (!driver.current) driver.current = new maplibregl.Marker({ color: DRIVER_COLOR }).setLngLat(position).addTo(map);
      else driver.current.setLngLat(position);
      map.easeTo({ center: position, duration: 700 });
    });
    return () => {
      socket.disconnect();
      map.remove();
      driver.current = null;
    };
  }, [token, reference]);

  return (
    <div className="tracking">
      <div className="tracking-map" ref={element} aria-label="Carte du suivi de livraison" />
      <div className="tracking-legend" aria-hidden="true">
        <span><i className="dot-driver" /> Livreur</span>
        <span><i className="dot-destination" /> Vous</span>
      </div>
    </div>
  );
}
