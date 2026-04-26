import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ mode }) => {
  const workspaceRoot = path.resolve(import.meta.dirname, "..", "..");
  const env = loadEnv(mode, workspaceRoot, "");

  const basePath = env.BASE_PATH ?? "/";
  const webPort = Number(env.WEB_PORT ?? 5173);
  const apiPort = Number(env.API_PORT ?? env.PORT ?? 8080);

  return {
    envDir: workspaceRoot,
    base: basePath,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
      },
      dedupe: ["react", "react-dom"],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      port: webPort,
      strictPort: true,
      host: "0.0.0.0",
      allowedHosts: true,
      fs: {
        strict: true,
      },
      proxy: {
        "/api": {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: webPort,
      host: "0.0.0.0",
      allowedHosts: true,
    },
  };
});
