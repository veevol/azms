import { defineConfig, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import type { IncomingMessage, ServerResponse } from "node:http";
import nodeTangani from "./server/node.js";

function sambungkanMcp() {
  return {
    name: "azms-mcp",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const path = (req.url || "").split("?")[0];
        const kena =
          path.startsWith("/api/") || path === "/mcp" || path.startsWith("/.well-known/");
        if (!kena) return next();
        await nodeTangani(req, res);
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    sambungkanMcp(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Kas",
        short_name: "Kas",
        description: "Catat uang dari HP, Claude, Gemini, atau Cursor.",
        lang: "id",
        display: "standalone",
        background_color: "#F6F4EF",
        theme_color: "#0F766E",
        start_url: "/",
        icons: [{ src: "favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
      },
      workbox: {
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "font", expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
        ],
      },
    }),
  ],
});
