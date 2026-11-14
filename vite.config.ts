import devServer from "@hono/vite-dev-server"
import path from "path"
const __dirname = import.meta.dirname
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    devServer({ entry: "api/boot.ts", exclude: [/^\/(?!api\/).*$/] }),
    inspectAttr(), react()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@contracts": path.resolve(__dirname, "./contracts"),
      "@db": path.resolve(__dirname, "./db"),
      "db": path.resolve(__dirname, "./db"),
    },
  },
  envDir: path.resolve(__dirname),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("react-router") || id.includes("react-dom") || id.includes("/react/")) {
            return "vendor-react";
          }
          if (id.includes("@trpc") || id.includes("@tanstack/react-query") || id.includes("superjson")) {
            return "vendor-trpc";
          }
          if (id.includes("@radix-ui") || id.includes("cmdk") || id.includes("sonner")) {
            return "vendor-radix";
          }
          if (id.includes("lucide-react")) {
            return "vendor-icons";
          }
          return undefined;
        },
      },
    },
  },
});
