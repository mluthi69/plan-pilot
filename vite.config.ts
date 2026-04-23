import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Bake the Kendo UI license JWT into the bundle at build time.
    // The value comes from the `KENDO_UI_LICENSE` build secret.
    __KENDO_UI_LICENSE__: JSON.stringify(process.env.KENDO_UI_LICENSE ?? ""),
  },
}));
