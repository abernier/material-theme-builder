import tailwindPostcss from "@tailwindcss/postcss";
import type { Plugin } from "esbuild";
import { copyFileSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";
import postcss from "postcss";
import { defineConfig } from "tsup";

// Three bundles rather than one, so that `"use client"` lands only on the
// React surface -- and so that nothing on the root entry points at it:
//
//   dist/index.js   no directive -- `builder`, the package root
//   dist/react.js   "use client" -- Mtb, useMtb, ExportButton
//   dist/cli.js     the CLI
//
// The two are independent: `index.js` does not import `react.js`, which is
// what keeps `import { builder } from "material-theme-builder"` free of React
// in a client bundle. A framework that splits server and client graphs
// registers every export of a client module it reaches, re-export included,
// so a barrel spanning both surfaces cannot be tree-shaken back apart.

// Resolves `import css from "./x.css?raw"` by running the file through
// Tailwind (postcss) and inlining the compiled CSS as a string — the
// bookmarklet injects it into its shadow root at runtime.
const tailwindAsText: Plugin = {
  name: "tailwind-as-text",
  setup(build) {
    // The resolved path keeps its `?raw` suffix on purpose: tsup registers
    // its own onLoad for /\.css$/ with no namespace restriction, which
    // would otherwise claim the file before ours runs.
    build.onResolve({ filter: /\.css\?raw$/ }, (args) => ({
      path: path.resolve(args.resolveDir, args.path),
      namespace: "tailwind-as-text",
    }));
    build.onLoad(
      { filter: /.*/, namespace: "tailwind-as-text" },
      async (args) => {
        const file = args.path.replace(/\?raw$/, "");
        const source = await readFile(file, "utf8");
        const result = await postcss([
          tailwindPostcss({ optimize: true }),
        ]).process(source, { from: file });
        // Watch mode: recompile when the css itself OR any file it
        // @source-scans changes — esbuild would otherwise serve the cached
        // text while the scanned classes drift.
        const scanned = [...source.matchAll(/@source "(.+?)";/g)].map((m) =>
          path.resolve(path.dirname(file), m[1] ?? ""),
        );
        return {
          contents: result.css,
          loader: "text",
          watchFiles: [file, ...scanned],
        };
      },
    );
  },
};

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
  // The bookmarklet: a self-contained IIFE — React and every dependency
  // bundled, no externals — fetched at runtime from a CDN by the tiny
  // `javascript:` loader (see README). Ships as dist/bookmarklet.global.js.
  {
    entryPoints: ["src/bookmarklet.tsx"],
    format: ["iife"],
    outDir: "dist",
    dts: false,
    clean: false,
    minify: true,
    esbuildPlugins: [tailwindAsText],
    esbuildOptions(options) {
      options.jsx = "automatic";
      // react-dom reads process.env.NODE_ENV, which doesn't exist in a
      // browser IIFE — pin it to the production build.
      options.define = {
        ...options.define,
        "process.env.NODE_ENV": '"production"',
      };
    },
  },
]);
