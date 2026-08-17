---
"material-theme-builder": patch
---

Fix: a source color that is not a color no longer produces a theme.

Material Color Utilities validates hex by length alone — it strips a leading `#`,
accepts 3, 6 or 8 characters, then runs `parseInt` on each pair, where a pair that
is not hex yields `NaN` and lands as zero. So `banana` was accepted, and themed
as `#ba0000`:

```sh
$ material-theme-builder banana --format shadcn     # primary oklch(0.495 0.095 30.297)
$ material-theme-builder ba0000 --format shadcn     # primary oklch(0.495 0.095 30.297)
```

Identical, to the value. `bananas` was rejected only for being seven characters
long, and by a `throw` from inside `node_modules` that reached the terminal as a
stack trace.

`builder()` now checks every hex it takes — `source`, the six core-color
overrides, and each `customColors[].hex` — against the characters as well as the
length, at its entry, before anything is converted. The message names the input:
`source` and `customColors[2].hex` are very different things to be told about.
`<Mtb source="banana">` is covered by the same fix, being the same call.

The CLI states the rule a second time, as commander's parser for `<source>` and
the core-color flags, and as a refinement on the `--custom-colors` schema. Not a
redundant check but a second presentation: the library has to refuse garbage on
its own account, for programmatic callers and for `<Mtb>`, while someone at a
terminal should be told about a typo in one line rather than in a stack trace.

```
$ material-theme-builder banana
error: command-argument value 'banana' is invalid for argument 'source'. Expected a hex color — 3, 6 or 8 hex digits, with or without '#' (e.g. #6750A4).
```

This does reject input that previously "worked", which is why it is worth stating
plainly rather than leaving to be discovered: `banana`, `zzz`, and every other 3,
6 or 8 character string that is not hex used to render. They rendered a color
nobody chose — the argument for the change, not an omission from it. Everything
Material Color Utilities reads as the color it spells is still accepted, `#`
optional, 3, 6 and 8 digits, any case.
