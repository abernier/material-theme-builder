import { defineConfig } from "tsup";

export default defineConfig({
  entryPoints: ["figma-plugin/code.ts"],
  format: ["iife"],
  target: "es2015",
  dts: false,
  outDir: "figma-plugin",
  clean: false,
  outExtension: () => ({ js: ".js" }),
});
