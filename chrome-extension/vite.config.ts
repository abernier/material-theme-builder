import { crx } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

import manifest from "./manifest.config";

const dir = import.meta.dirname;
const repo = resolve(dir, "..");

export default defineConfig({
  // Not the cwd: this config is run from the repo root
  // (`vite build --config chrome-extension/vite.config.ts`).
  root: dir,
  plugins: [
    react(),
    crx({ manifest }),
    // The panel is `src/` code — @/ThemePanel, @/Mtb, @/components/ui/*.
    tsconfigPaths({ root: repo }),
  ],
  // The repo's postcss.config.js (@tailwindcss/postcss), pinned rather than
  // discovered: Vite would search upward from `root` and find it anyway, but
  // only by walking out of this directory.
  css: { postcss: repo },
  build: {
    outDir: resolve(dir, "dist"),
    emptyOutDir: true,
  },
});
