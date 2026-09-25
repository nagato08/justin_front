import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  server: { port: 3001 },
  plugins: [react(), VitePWA({
    registerType: "autoUpdate",
    includeAssets: ["favicon.svg", "app-icon.svg", "push-handler.js"],
    manifest: {
      name: "Ma cuisine",
      short_name: "Ma cuisine",
      description: "Commandez vos plats et suivez leur livraison.",
      theme_color: "#151916",
      background_color: "#f8f6f1",
      display: "standalone",
      start_url: "/",
      lang: "fr",
      icons: [{ src: "/app-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }],
    },
    workbox: { importScripts: ["push-handler.js"], navigateFallback: "/index.html", runtimeCaching: [{ urlPattern: /^https:\/\/demotiles\.maplibre\.org\//, handler: "CacheFirst", options: { cacheName: "map-tiles", expiration: { maxEntries: 150, maxAgeSeconds: 86400 } } }] },
  })],
});
