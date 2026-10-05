---
"material-theme-builder": minor
---

`material-theme-builder/react` exports the stories' color-scheme poster —
`Poster`, `Scheme` and `Shades` — to render under an `<Mtb>`:

```tsx
import { Mtb, Poster, Scheme, Shades } from "material-theme-builder/react";

<Mtb source="#769CDF">
  <Poster style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
    <Scheme theme="light" title="Light scheme" />
    <Scheme theme="dark" title="Dark scheme" />
    <Shades />
  </Poster>
</Mtb>;
```

Its layout is inline styles, so it needs no Tailwind, nor any `@source` for
`node_modules`.
