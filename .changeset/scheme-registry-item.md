---
"material-theme-builder": minor
---

Publish `<Scheme>` and `<Shades>` — the color-role poster and the tonal palettes that Storybook has been drawing all along — as a shadcn registry item, so a docs or demo page can show a theme without re-drawing it:

```sh
npx shadcn@latest add abernier/material-theme-builder/scheme
```

```tsx
import { Scheme, Shades } from "@/components/m3/scheme";
import { Mtb } from "material-theme-builder/react";

<Mtb
  source="#769CDF"
  customColors={[{ name: "teal", hex: "#00A39B", blend: true }]}
>
  <Scheme theme="light" title="Light scheme" />
  <Scheme theme="dark" title="Dark scheme" />
  <Shades />
</Mtb>;
```

A registry item rather than an export: the source is copied into your project, every part (`SchemeRoot`, `SchemeRoles`, `SchemeAccents`, `Swatch`, `Palette`…) is exported and takes a `className` merged through `cn`. The colors still come from the `--md-*` CSS variables, so nothing drifts for being copied.

The item is declared in a `registry.json` at the root of the repository, which is what that command reads off GitHub; the package also ships it built, as `material-theme-builder/r/scheme.json`.

To support it, the package now also exports:

- `MtbContext` from `material-theme-builder/react` — `useContext(MtbContext)` is `null` outside an `<Mtb>`, where `useMtb()` throws;
- `STANDARD_TONES`, `CORE_PALETTES`, `DEFAULT_PREFIX` and the `TokenName` type from `material-theme-builder`.
