import { defineConfig, type Options } from "tsup";

// Three bundles rather than one, so that `"use client"` lands only on the
// React surface -- and so that nothing on the root entry points at it:
//
//   dist/index.js           no directive -- `builder`, the package root
//   dist/react.js           "use client" -- Mtb, useMtb, ExportButton
//   dist/cli.js             the CLI
//   dist/tailwind-plugin.js the Tailwind v4 plugin, loaded from a stylesheet
//
// The two are independent: `index.js` does not import `react.js`, which is
// what keeps `import { builder } from "material-theme-builder"` free of React
// in a client bundle. A framework that splits server and client graphs
// registers every export of a client module it reaches, re-export included,
// so a barrel spanning both surfaces cannot be tree-shaken back apart.

const shared = {
  format: ["esm"],
  outDir: "dist",
  external: ["react", "react-dom"],
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
} satisfies Options;

export default defineConfig([
  {
    ...shared,
    entryPoints: ["src/index.ts"],
    dts: true,
    clean: true,
    // `dist/tailwind.css`, `dist/shadcn.css` and `dist/registry-item.json`
    // are generated from the exporters this entry is what builds -- so they
    // regenerate here, off the bundle they need.
    onSuccess: "node scripts/generate.mjs",
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
  {
    ...shared,
    entryPoints: ["src/tailwind-plugin.ts"],
    // `tailwindcss` is a devDependency here, so it is not externalized by
    // default -- and bundling the consumer's own Tailwind into a plugin it
    // loads would be absurd. It resolves from their install at build time.
    external: [...shared.external, "tailwindcss"],
    dts: true,
    clean: false,
  },
]);
