import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

process.env.VITE_APP_VERSION = Date.now().toString(36).toUpperCase();

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifest: {
        name: "Painel de Dados",
        short_name: "Painel",
        display: "standalone",
        theme_color: "#ec4899",
      },
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-charts": ["recharts", "react-simple-maps"],
          "vendor-ui": ["framer-motion", "lucide-react", "sonner", "vaul", "next-themes"],
          "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],
          "vendor-xlsx": ["xlsx"],
        },
      },
    },
  },
});
