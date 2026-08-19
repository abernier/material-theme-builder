// The package root: `builder`, and nothing that reaches React.
//
// The React bindings live at `material-theme-builder/react` (src/react.ts).
// Keeping them out of this barrel is the whole point: a framework that splits
// server and client graphs registers every export of a `"use client"` module
// it sees, including through a re-export. While this file re-exported them,
// `import { builder } from "material-theme-builder"` in a server component
// still shipped `Mtb` and the color utilities to the browser, for a component
// the page never rendered.

export { SHADCN_MAPPING, builder } from "./lib/builder";
export type {
  Mapping,
  MappingAliasesOptions,
  MappingVars,
  McuConfig,
  MtbConfig,
  ShadcnOptions,
  ShadcnRegistryItem,
  ShadcnRegistryItemOptions,
  ShadcnTheme,
  ShadcnVarName,
} from "./lib/builder";
