import { copyFileSync } from "fs";
import { defineConfig } from "tsup";

export default defineConfig([
  {
    entryPoints: ["src/index.ts"],
    format: ["esm"],
    dts: true,
    outDir: "dist",
    clean: true,
    external: ["react", "react-dom"],
    banner: {
      js: '"use client";',
    },
    esbuildOptions(options) {
      options.jsx = "automatic";
    },
    onSuccess: async () => {
      // Copy tailwind.css to dist
      copyFileSync("src/tailwind.css", "dist/tailwind.css");
    },
  },
  {
    entryPoints: ["src/tailwind-plugin.ts"],
    format: ["esm"],
    dts: true,
    outDir: "dist",
    clean: false,
    external: ["tailwindcss", "tailwindcss/plugin"],
  },
  {
    entryPoints: ["src/cli.ts"],
    format: ["esm"],
    dts: false,
    outDir: "dist",
    clean: false,
  },
]);
