import { defineConfig } from "tsup";

export default defineConfig({
  entryPoints: ["src/figma-plugin/code.ts"],
  format: ["iife"],
  target: "es2015",
  dts: false,
  outDir: "src/figma-plugin/dist",
  clean: false,
  outExtension: () => ({ js: ".js" }),
});
