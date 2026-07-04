import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  optimizeDeps: {
    noDiscovery: true,
    include: ["react", "react-dom", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime"],
    exclude: ["web-push"],
  },
});
