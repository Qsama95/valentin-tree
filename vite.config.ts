import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  // Repo name for GitHub Pages project site base path
  // In GitHub Actions: owner/repo
  const repoName =
    process.env.GITHUB_REPOSITORY?.split("/")[1] ||
    env.VITE_REPO_NAME ||
    "valentin-tree";

  // For project pages: https://username.github.io/<repoName>/
  const base = mode === "production" ? `/${repoName}/` : "/";

  // Allow API key to come from .env OR CI env vars
  const apiKey =
    env.GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    env.VITE_GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    "";

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
