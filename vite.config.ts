import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  // GitHub Actions provides: owner/repo
  const repoName =
    process.env.GITHUB_REPOSITORY?.split("/")[1] ||
    env.VITE_REPO_NAME ||
    "google-gemini-gesture";

  // Project site base: https://username.github.io/<repoName>/
  const base = mode === "production" ? `/${repoName}/` : "/";

  // Allow API key from either .env (local) or Actions secrets (CI)
  const apiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || "";

  return {
    base,
    plugins: [react()],
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    define: {
      "process.env.API_KEY": JSON.stringify(apiKey),
      "process.env.GEMINI_API_KEY": JSON.stringify(apiKey),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
