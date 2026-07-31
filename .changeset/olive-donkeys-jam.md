---
"material-theme-builder": minor
---

`builder` is now callable from a React Server Component.

`dist/index.js` carried a `"use client"` banner over the whole bundle, so any
import from the package — `builder` included — was a client module. Calling it
from a server component threw `Attempted to call builder() from the server but
builder is on the client`, which left generating the CSS at build time to the
CLI.

The React surface is built into its own `dist/react.js`, which is where the
directive lands now; `dist/index.js` re-exports it. Nothing moves in the public
API: `builder`, `Mcu`, `useMcu` and `ExportButton` are all still imported from
`material-theme-builder`, and importing `Mcu` into a server component still
works — it becomes a client reference, as it did before.
