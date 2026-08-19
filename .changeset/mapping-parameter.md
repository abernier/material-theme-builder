---
"material-theme-builder": minor
---

feat: mapping as a first-class concept, shadcn as its first citizen

`toMapping()` and `toMappingAliases()` project the M3 scheme onto any CSS
variable vocabulary — concrete `oklch()` values, or a `var()` block that follows
whichever `<Mtb>` is above it. Every sys-color token is mappable, custom colors
included.

shadcn is now one preset over that: `toShadcn()`, `toShadcnAliases()`,
`toShadcnRegistryItem()` and `toTailwind({ shadcn })` all take a `mapping`,
merged over the defaults, so naming `--primary` redirects that one variable and
leaves the rest alone. A name shadcn does not have is added rather than refused.
The CLI reads the same thing off disk with `--mapping <file.json>`, on both
`material-theme-builder` and `shadcn-apply`.

A mapping that names a token the scheme does not carry now throws, where the
alias renderings used to emit a `var()` nothing declares.
