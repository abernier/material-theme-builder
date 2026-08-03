import { copyFileSync, rmSync } from "fs";
import { defineConfig } from "tsup";

// Clean once, up front, instead of `clean: true`: the configs below build in
// parallel, and a `clean: true` dts build deletes every `*.d.ts` in outDir
// when it completes -- wiping whichever sibling dts happened to finish first.
rmSync("dist", { recursive: true, force: true });

// Three bundles rather than one, so that `"use client"` lands only on the
// React surface -- and so that nothing on the root entry points at it:
//
//   dist/index.js            no directive -- `builder`, the package root
//   dist/tailwind-plugin.js  no directive -- the Tailwind 4 plugin (Node-only)
//   dist/react.js            "use client" -- Mtb, useMcu, ExportButton
//   dist/cli.js              the CLI
//
// The two are independent: `index.js` does not import `react.js`, which is
// what keeps `import { builder } from "material-theme-builder"` free of React
// in a client bundle. A framework that splits server and client graphs
// registers every export of a client module it reaches, re-export included,
// so a barrel spanning both surfaces cannot be tree-shaken back apart.

const shared = {
  format: ["esm"] as const,
  outDir: "dist",
  external: ["react", "react-dom", /^tailwindcss/],
  esbuildOptions(options: { jsx?: string }) {
    options.jsx = "automatic";
  },
};

export default defineConfig([
  {
    ...shared,
    entryPoints: ["src/index.ts", "src/tailwind-plugin.ts"],
    dts: true,
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
