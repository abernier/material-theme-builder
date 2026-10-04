// The React surface, built separately from `index.ts` so that the
// `"use client"` banner lands on this bundle only. `index.ts` re-exports it
// without inlining it, which keeps the directive intact and leaves `builder`
// callable from a server component. See tsup.config.ts.

export { ExportButton } from "./ExportButton";
export { Mcu, Mtb } from "./Mtb";
// `MtbContext` itself, for what must render with or without an `<Mtb>` above
// it: `useMtb` throws outside a provider, `useContext(MtbContext)` is `null`
// there. The `scheme` registry item reads its defaults that way.
export { MtbContext, useMcu, useMtb } from "./Mtb.context";
