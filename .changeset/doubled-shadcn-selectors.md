---
"material-theme-builder": minor
---

`toShadcnAliases()` now emits `:root:root, .dark.dark` instead of `:root, .dark`.

The block outranks shadcn's own `:root` and `.dark` on specificity rather than
on source order, so `@import "material-theme-builder/shadcn.css"` goes with your
other imports — where CSS requires an `@import` to be. It previously had to come
after shadcn's blocks, below other rules, which a conforming CSS parser drops:
Vite's `postcss-import` does exactly that, and the mapping vanished with no
error.

If you already import it at the bottom of your `globals.css`, move it up with
the others. Leaving it where it is still works.
