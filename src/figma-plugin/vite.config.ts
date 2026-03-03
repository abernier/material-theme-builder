import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import tsconfigPaths from "vite-tsconfig-paths";

const dir = import.meta.dirname;

export default defineConfig({
  root: dir,
  plugins: [
    react(),
    viteSingleFile(),
    tsconfigPaths({ root: resolve(dir, "../..") }),
  ],
  build: {
    outDir: resolve(dir, "dist"),
    emptyOutDir: true,
  },
});
