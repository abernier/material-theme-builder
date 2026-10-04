// The package root: `builder`, and nothing that reaches React.
//
// The React bindings live at `material-theme-builder/react` (src/react.ts).
// Keeping them out of this barrel is the whole point: a framework that splits
// server and client graphs registers every export of a `"use client"` module
// it sees, including through a re-export. While this file re-exported them,
// `import { builder } from "material-theme-builder"` in a server component
// still shipped `Mtb` and the color utilities to the browser, for a component
// the page never rendered.

export { builder } from "./lib/builder";
export type {
  McuConfig,
  MtbConfig,
  ShadcnRegistryItem,
  ShadcnTheme,
  ShadcnVarName,
} from "./lib/builder";

// The vocabulary, for code that draws a theme rather than builds one -- the
// `scheme` registry item (src/components/mtb/scheme.tsx) is copied into other
// projects, and would otherwise carry its own lists of palettes and tones, free
// to drift from these. Constants and a type: still nothing that reaches React.
export { STANDARD_TONES } from "./lib/builder";
export { CORE_PALETTES, DEFAULT_PREFIX } from "./lib/tokens";
export type { TokenName } from "./lib/tokens";
