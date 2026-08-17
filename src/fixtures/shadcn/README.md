Frozen `@theme inline` block from a nominal shadcn scaffold — what shadcn
declares when nobody has touched it. `src/styles/shadcn.css` is _this repo's_
remapped copy and drifts from upstream, so it cannot answer "which names does
shadcn claim?" on its own.

`tailwind-plugin.test.ts` intersects it with the plugin's own color names, to
pin the set that a shadcn user has to hand back (see the Tailwind section of
the README). Captured from `shadcn@4.18.0` / `tailwindcss@4.3.3`.

Regenerate with:

```sh
cd "$(mktemp -d)"
pnpm dlx shadcn@latest init --preset b0 --template vite --name probe --yes
awk '/^@theme inline \{/,/^\}/' probe/src/index.css
```
