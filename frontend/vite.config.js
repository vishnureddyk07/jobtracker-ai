import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/auth": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/resume": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/jobs": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/applications": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/ai": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
