import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // Bind IPv6 dual-stack (covers both localhost/::1 and 127.0.0.1) on a port
    // outside Windows' excluded ranges (the default 5173 sits inside a reserved
    // range on this machine, and IPv4-only binding makes localhost refuse).
    host: "::",
    port: 5400,
    strictPort: true,
    proxy: {
      // Proxy all /api calls to the backend
      "/api": {
        target: "http://localhost:9080",
        changeOrigin: true,
      },
      // Auth routes live at /auth/* on the backend (not under /api)
      "/auth": {
        target: "http://localhost:9080",
        changeOrigin: true,
      },
    },
  },
});
