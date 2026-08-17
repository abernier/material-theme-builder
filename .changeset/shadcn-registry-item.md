---
"material-theme-builder": minor
---

Ship the shadcn mapping as a registry item, so it installs the way every other
shadcn theme does:

```sh
$ npx shadcn@latest add https://unpkg.com/material-theme-builder/registry-item.json
```

The CLI rewrites the values inside your existing `:root` and `.dark` blocks, in
place. That removes the one thing `material-theme-builder/shadcn.css` asked you
to get right: the stylesheet has to be imported _after_ shadcn's own blocks to
win the cascade, and the natural place for an `@import` is at the top of the file
with the others — which is exactly where it silently loses.

The values stay `var()` references, so this is not `toShadcn()` under another
name: the colors still follow whichever `<Mtb>` is above them at runtime, where
`toShadcn()` freezes them at build time. Both halves are generated off one
mapping, so they cannot drift.

The stylesheet is unchanged and stays supported, for setups that would rather
keep the mapping in one line they can delete.

New API: `builder(...).toShadcnRegistryItem()`, the `ShadcnRegistryItem` type,
and a `material-theme-builder/registry-item.json` export.
