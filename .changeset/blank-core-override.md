---
"material-theme-builder": patch
---

A blank core-color override now reads as no override, instead of throwing.

`primary` and the other five are optional, but `builder(source, { primary: "" })`
used to refuse `""` as an invalid hex — which is what a UI hands over for
"cleared". Clearing a color picker now falls back to the palette generated from
`source`. `source` itself is still required, so `""` there stays an error.
