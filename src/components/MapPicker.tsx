import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { LocateFixed, MousePointerClick } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface Coordinates { latitude: number; longitude: number }

const DEFAULT: Coordinates = { latitude: 4.0511, longitude: 9.7679 };
const STYLE = (import.meta.env.VITE_MAP_STYLE_URL as string | undefined) || "https://demotiles.maplibre.org/style.json";
const MARKER_COLOR = "#c2521f";

export function MapPicker({ value, onChange }: { value?: Coordinates; onChange(value: Coordinates): void }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const change = useRef(onChange);
  const initial = useRef(value);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");

  useEffect(() => {
    change.current = onChange;
  });

  useEffect(() => {
    if (!container.current || map.current) return;
    const start = initial.current ?? DEFAULT;
    const instance = new maplibregl.Map({ container: container.current, style: STYLE, center: [start.longitude, start.latitude], zoom: 12 });
    instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    const pin = new maplibregl.Marker({ color: MARKER_COLOR, draggable: true }).setLngLat([start.longitude, start.latitude]).addTo(instance);
    pin.on("dragend", () => {
      const point = pin.getLngLat();
      change.current({ latitude: point.lat, longitude: point.lng });
    });
    instance.on("click", ({ lngLat }: maplibregl.MapMouseEvent) => {
      pin.setLngLat(lngLat);
      change.current({ latitude: lngLat.lat, longitude: lngLat.lng });
    });
    map.current = instance;
    marker.current = pin;
    return () => {
      instance.remove();
      map.current = null;
    };
  }, []);

  const locate = () => {
    if (!navigator.geolocation) {
      setLocateError("La géolocalisation n’est pas disponible sur cet appareil.");
      return;
    }
    setLocating(true);
    setLocateError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const next = { latitude: coords.latitude, longitude: coords.longitude };
        marker.current?.setLngLat([next.longitude, next.latitude]);
        map.current?.flyTo({ center: [next.longitude, next.latitude], zoom: 16 });
        change.current(next);
        setLocating(false);
      },
      () => {
        setLocateError("Position introuvable. Autorisez la localisation ou placez le repère à la main.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  return (
    <div className="map-picker">
      <div className="map-frame">
        <div ref={container} className="map-canvas" aria-label="Carte de choix du lieu de livraison" />
        <button type="button" className="map-locate" onClick={locate} disabled={locating}>
          <LocateFixed aria-hidden="true" />
          {locating ? "Localisation…" : "Ma position"}
        </button>
      </div>
      <p className={value ? "map-hint done" : "map-hint"}>
        <MousePointerClick aria-hidden="true" />
        {value ? "Point de livraison enregistré. Vous pouvez encore le déplacer." : "Touchez la carte ou faites glisser le repère jusqu’au lieu exact."}
      </p>
      {locateError && <p className="field-error" role="alert">{locateError}</p>}
    </div>
  );
}
