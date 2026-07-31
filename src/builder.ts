// The non-React surface, on its own entry point and exported as
// `material-theme-builder/builder`.
//
// `index.ts` re-exports `./react.js`, which carries "use client". A framework
// that splits server and client graphs registers every export of a client
// module it sees, so importing `builder` from the barrel drags the React
// bundle -- Mcu, the color utilities, all of it -- into the browser, even in a
// server component that never renders `<Mcu>`. This entry doesn't touch
// `./react.js`, so it costs the client nothing.

export { builder } from "./lib/builder";
export type { McuConfig } from "./lib/builder";
