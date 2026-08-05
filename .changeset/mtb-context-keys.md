---
"material-theme-builder": minor
---

Finish the `Mcu` → `Mtb` rename in the value `useMtb()` returns: `mcuConfig`,
`setMcuConfig` and `getMcuColor` are now `mtbConfig`, `setMtbConfig` and
`getMtbColor`.

The `mcu*` keys stay on the context value as deprecated aliases holding the very
same references as their `mtb*` counterparts, so existing destructuring keeps
working until the next major.

```diff
- const { setMcuConfig, getMcuColor } = useMtb();
+ const { setMtbConfig, getMtbColor } = useMtb();
```

The `id` of the injected `<style>` tag stays `mcu-styles`, since user CSS and
scripts may target it.
