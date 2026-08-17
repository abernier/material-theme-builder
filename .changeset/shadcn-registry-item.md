---
"material-theme-builder": minor
---

Ship the shadcn mapping as a registry item, so it installs the way every other
shadcn theme does — generated for your source color:

```sh
$ npx material-theme-builder "#6750A4" --format registry-item > mtb.json
$ npx shadcn@latest add ./mtb.json && rm mtb.json
```

The CLI rewrites the values inside your existing `:root` and `.dark` blocks, in
place. That removes the one thing `material-theme-builder/shadcn.css` asked you
to get right: the stylesheet has to be imported _after_ shadcn's own blocks to
win the cascade, and the natural place for an `@import` is at the top of the file
with the others — which is exactly where it silently loses.

Values keep pointing at the M3 custom properties, so this is not `toShadcn()`
under another name: the colors still follow whichever `<Mtb>` is above them at
runtime. But the CLI knows your source color, so it also writes that theme's own
colors in as the `var()` fallbacks — which means the same install renders
correctly server-side with no client JS at all, and only gets _more_ correct
under an `<Mtb>`. `--no-fallback` opts out.

A colorless item is published as well, for `shadcn add` straight off a URL:

```sh
$ npx shadcn@latest add https://unpkg.com/material-theme-builder/registry-item.json
```

That one is the mapping and nothing else — the same 31 `var()` references
whatever the theme, since the colors arrive from `<Mtb>` at runtime. Which is
also its requirement: with no `<Mtb>` and no fallbacks, nothing resolves.

The stylesheet is unchanged and stays supported, for setups that would rather
keep the mapping in one line they can delete. All three are generated off one
mapping, so they cannot drift.

New API: `builder(...).toShadcnRegistryItem({ fallback })`, the
`ShadcnRegistryItem` and `ShadcnRegistryItemOptions` types, a
`material-theme-builder/registry-item.json` export, and `--format registry-item`
/ `--no-fallback` on the CLI.
