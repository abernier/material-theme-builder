---
"material-theme-builder": minor
---

New `material-theme-builder/builder` export, for calling `builder` without
shipping React to the client.

2.2.0 made `builder` callable from a server component, but not free: the main
entry re-exports the React components, and a framework that splits server and
client graphs registers every export of a `"use client"` module it sees. So
`import { builder } from "material-theme-builder"` in a Next.js server
component still put `Mcu` and the color utilities in the browser bundle — 32 kB
gzip, for a component the page never renders.

The subpath doesn't reference the React entry at all. Measured on a Next
`output: "export"` app that only calls `builder(...).toCss()` in its layout,
switching the import drops the client bundle from 269 668 to 237 542 bytes
gzip, with identical server-rendered CSS.

Nothing changes for existing imports — `material-theme-builder` still exports
`builder`, `Mcu`, `useMcu` and `ExportButton`.
