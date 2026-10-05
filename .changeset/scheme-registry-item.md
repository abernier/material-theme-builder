---
"material-theme-builder": minor
---

The stories' color-scheme poster ships as a shadcn registry item, so a project
can install the real one instead of hand-rolling a copy:

```sh
npx shadcn@latest add https://unpkg.com/material-theme-builder/r/scheme.json
```

It installs `components/mtb/scheme.tsx`, with `Poster`, `Scheme` and `Shades`,
to render under an `<Mtb>`:

```tsx
<Mtb source="#769CDF">
  <Poster className="flex flex-col gap-6">
    <Scheme theme="light" title="Light scheme" />
    <Scheme theme="dark" title="Dark scheme" />
    <Shades />
  </Poster>
</Mtb>
```

The package root now also exports what it is written against: `STANDARD_TONES`,
and the `TokenName` and `HexCustomColor` types.
