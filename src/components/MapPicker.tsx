import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { LocateFixed } from "lucide-react";
import { useEffect, useRef } from "react";

export interface Coordinates { latitude: number; longitude: number }
const DEFAULT: Coordinates = { latitude: 4.0511, longitude: 9.7679 };
const STYLE = (import.meta.env.VITE_MAP_STYLE_URL as string | undefined) || "https://demotiles.maplibre.org/style.json";
export function MapPicker({ value, onChange }: { value?: Coordinates; onChange(value: Coordinates): void }) {
  const container = useRef<HTMLDivElement>(null); const map = useRef<maplibregl.Map | null>(null); const marker = useRef<maplibregl.Marker | null>(null);
  useEffect(() => {
    if (!container.current || map.current) return;
    const initial = value || DEFAULT;
    map.current = new maplibregl.Map({ container: container.current, style: STYLE, center: [initial.longitude, initial.latitude], zoom: 12 });
    map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    marker.current = new maplibregl.Marker({ color: "#ec6a2c", draggable: true }).setLngLat([initial.longitude, initial.latitude]).addTo(map.current);
    marker.current.on("dragend", () => { const p = marker.current!.getLngLat(); onChange({ latitude: p.lat, longitude: p.lng }); });
    map.current.on("click", ({ lngLat }: maplibregl.MapMouseEvent) => { marker.current!.setLngLat(lngLat); onChange({ latitude: lngLat.lat, longitude: lngLat.lng }); });
    return () => { map.current?.remove(); map.current = null; };
  }, []);
  const locate = () => navigator.geolocation.getCurrentPosition(({ coords }) => { const next = { latitude: coords.latitude, longitude: coords.longitude }; marker.current?.setLngLat([next.longitude, next.latitude]); map.current?.flyTo({ center: [next.longitude, next.latitude], zoom: 15 }); onChange(next); }, () => undefined, { enableHighAccuracy: true, timeout: 12000 });
  return <div className="map-picker"><div ref={container} className="map-canvas"/><button type="button" className="map-locate" onClick={locate}><LocateFixed size={18}/> Utiliser ma position</button><p>Cliquez sur la carte ou déplacez le repère pour choisir une autre destination.</p></div>;
}
