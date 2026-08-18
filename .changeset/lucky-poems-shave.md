---
"material-theme-builder": major
---

The Tailwind stylesheet is gone — the plugin was already carrying everything it
did:

```diff
  @import "tailwindcss";

- @import "material-theme-builder/tailwind.css";
  @plugin "material-theme-builder/tailwind" {
    custom-colors: myCustomColor1, myCustomColor2;
  }
```

`material-theme-builder/tailwind.css` no longer resolves. `@plugin` declares
the same 115 names it did, inlined the same way, and the custom colors it never
could. The Tailwind recipe is one line now, and the `@plugin` line is no longer
the optional half of a pair.

One behaviour changes with it: theme values a plugin contributes are defaults,
so an `@theme` block of your own wins over them whatever the order — where a
later `@import` of the stylesheet would have won. Only colliding names are
affected. Against shadcn there are exactly three (`background`, `primary`,
`secondary`), and `shadcn.css` points those back at M3 anyway, so the
documented recipe comes out unchanged.

`toTailwind()` and `--format tailwind` are untouched: given a real source
color, they emit the `@theme inline` block plus your custom colors, which is
what the shipped file could never do.
