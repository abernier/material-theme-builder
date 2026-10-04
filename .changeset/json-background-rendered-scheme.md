---
"material-theme-builder": patch
---

`toJson().schemes.*.background` and `onBackground` now come from the rendered
scheme, like `toCss()`. When the `neutral` core color is overridden, they used to
reproduce Material Theme Builder's export, which takes them from the scheme of
`primary` alone; they now equal `surface` and `onSurface` (at standard contrast
for `onBackground`), as in `toCss()`. Without a `neutral` override, nothing
changes.
