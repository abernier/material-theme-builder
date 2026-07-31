import { copyFileSync } from "fs";
import { defineConfig } from "tsup";

// Three bundles rather than one, so that `"use client"` lands only on the
// React surface:
//
//   dist/index.js   no directive -- `builder` is callable from a server
//                   component; re-exports the React entry points, which a
//                   framework turns into client references
//   dist/react.js   "use client" -- Mcu, useMcu, ExportButton
//   dist/cli.js     the CLI
//
// `dist/index.js` keeps `./react.js` external so esbuild leaves the import
// alone instead of inlining the module and dropping its directive.

const shared = {
  format: ["esm"] as const,
  outDir: "dist",
  external: ["react", "react-dom"],
  esbuildOptions(options: { jsx?: string }) {
    options.jsx = "automatic";
  },
};

export default defineConfig([
  {
    ...shared,
    entryPoints: ["src/index.ts"],
    dts: true,
    clean: true,
    external: [...shared.external, "./react.js"],
    onSuccess: async () => {
      // Copy tailwind.css to dist
      copyFileSync("src/tailwind.css", "dist/tailwind.css");
    },
  },
  {
    ...shared,
    entryPoints: ["src/react.ts"],
    dts: true,
    clean: false,
    banner: {
      js: '"use client";',
    },
  },
  {
    entryPoints: ["src/cli.ts"],
    format: ["esm"],
    dts: false,
    outDir: "dist",
    clean: false,
  },
]);
