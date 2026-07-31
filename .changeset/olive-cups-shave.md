---
"material-theme-builder": major
---

**Breaking:** the React bindings moved to `material-theme-builder/react`. The
package root now holds `builder` alone.

### Migration

Change the import path for `Mcu`, `useMcu` and `ExportButton`:

```diff
- import { Mcu, useMcu, ExportButton } from "material-theme-builder";
+ import { Mcu, useMcu, ExportButton } from "material-theme-builder/react";
```

`builder` is unchanged — it stays on the root:

```ts
import { builder } from "material-theme-builder"; // unchanged
```

Both can be mixed freely; importing from each entry in the same file is fine.
`material-theme-builder/tailwind.css` and the CLI are untouched. The root also
now exports the `McuConfig` type, which was previously unreachable.

### Why

2.2.0 made `builder` callable from a server component, but not free. The root
entry re-exported the React components, and a framework that splits server and
client graphs registers every export of a `"use client"` module it reaches —
re-export included, and tree-shaking can't undo it. So this:

```tsx
import { builder } from "material-theme-builder";
const css = builder("#5de4c7").toCss();
```

still shipped `Mcu` and the color utilities to the browser in a server
component that never renders `<Mcu>`.

Measured on a Next `output: "export"` app whose layout does nothing but call
`builder(...).toCss()` and render it into a `<style>`, same app source on both
sides, only the package shape differing:

|       | client chunks (gzip) | chunk files | `tonalSpot` in them | SSR'd CSS    |
| ----- | -------------------- | ----------- | ------------------- | ------------ |
| 2.2.0 | 198 715              | 9           | present             | 19 398 chars |
| 3.0.0 | **166 679**          | 8           | **absent**          | 19 398 chars |

−32 036 bytes gzip, byte-identical output. The saving exceeds what
`dist/react.js` weighs on its own (26 184 gzip) because dropping it also
collapses a whole chunk.

A subpath for the React-free half would have fixed the bundle while leaving the
default import the expensive one: you'd have to know about client-reference
registration to reach for it. Putting the framework-agnostic core at the root
and the bindings behind `/react` makes the cheap path the default, and matches
how the ecosystem splits this elsewhere (`motion` / `motion/react`,
`@floating-ui/dom` / `@floating-ui/react`).
