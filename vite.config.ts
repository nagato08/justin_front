import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  server: { port: 3001 },
  plugins: [react(), VitePWA({
    registerType: "autoUpdate",
    includeAssets: ["app-icon.svg", "pwa-192x192.png", "pwa-512x512.png", "pwa-maskable-512x512.png", "push-handler.js"],
    manifest: {
      name: "Ma cuisine",
      short_name: "Ma cuisine",
      description: "Commandez vos plats et suivez leur livraison.",
      theme_color: "#151916",
      background_color: "#f8f6f1",
      display: "standalone",
      id: "/",
      scope: "/",
      start_url: "/",
      orientation: "portrait-primary",
      lang: "fr",
      icons: [
        { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/pwa-maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    workbox: { importScripts: ["push-handler.js"], navigateFallback: "/index.html", runtimeCaching: [{ urlPattern: /^https:\/\/demotiles\.maplibre\.org\//, handler: "CacheFirst", options: { cacheName: "map-tiles", expiration: { maxEntries: 150, maxAgeSeconds: 86400 } } }] },
  })],
});
