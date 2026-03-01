import { defineConfig } from "tsup";

export default defineConfig({
  entryPoints: ["figma-plugin/src/code.ts"],
  format: ["iife"],
  target: "es2015",
  dts: false,
  outDir: "figma-plugin/dist",
  clean: false,
  outExtension: () => ({ js: ".js" }),
});
