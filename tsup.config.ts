import { copyFileSync } from "fs";
import { defineConfig } from "tsup";

// Three bundles rather than one, so that `"use client"` lands only on the
// React surface:
//
//   dist/index.js    no directive -- re-exports the two below
//   dist/builder.js  no directive -- `builder`, and nothing that pulls React
//   dist/react.js    "use client" -- Mcu, useMcu, ExportButton
//   dist/cli.js      the CLI
//
// `dist/index.js` keeps both re-exports external so esbuild leaves the imports
// alone instead of inlining the modules and dropping `react.js`'s directive.
//
// The split is what makes `material-theme-builder/builder` cost the client
// nothing: a framework that registers client references sees every export of
// `react.js` through the barrel, so importing `builder` from `.` ships the
// React bundle even when `<Mcu>` is never rendered.

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
    external: [...shared.external, "./builder.js", "./react.js"],
    onSuccess: async () => {
      // Copy tailwind.css to dist
      copyFileSync("src/tailwind.css", "dist/tailwind.css");
    },
  },
  {
    ...shared,
    entryPoints: ["src/builder.ts"],
    dts: true,
    clean: false,
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
