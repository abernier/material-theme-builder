---
"material-theme-builder": minor
---

`colorMatch` is now implemented: Material Theme Builder's "Color match - Stay
true to my color inputs". It was declared but ignored.

```ts
builder("#6750A4", { secondary: "#B03A3A", colorMatch: true });
```

With `colorMatch: true`, each core color is rendered with the content variant of
its own input, and `toJson().schemes` matches Material Theme Builder's export
with Color match on (`background` and `onBackground` aside, as before). Also
available as `--color-match` on the CLI (`shadcn-apply` included) and as the
`colorMatch` prop of `<Mtb>`.

It takes precedence over `scheme`: Material Theme Builder has no scheme selector,
Color match off is `tonalSpot` and on is `content`. Custom colors are unaffected.

The default stays `false`, with which nothing changes.
