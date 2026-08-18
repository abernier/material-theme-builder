---
"material-theme-builder": major
---

`shadcn-init` is removed, and `shadcn-apply` is a plain forwarder.

`shadcn-init` scaffolded a shadcn app, themed it and started its dev server.
Three jobs, and only the middle one was ours — scaffolding is what
`shadcn init` already does, better and with its own eighteen options, and
starting a dev server is not a theming tool's business. Everything it needed to
hold those together (a default `--preset b0 --template vite`, a merge that
injected them only where you had not, reading the project name back out of the
merged argv to know where to `cd`) went with it:

```sh
# before
$ npx material-theme-builder shadcn-init "#6750A4"

# now
$ npx shadcn@latest init --preset b0 --template vite
$ cd material-theme-app && npx material-theme-builder shadcn-apply "#6750A4"
```

`shadcn-apply` is unchanged in what it does — generate a registry item for your
source color, `shadcn add` it, delete it — and simpler in how it treats you.
Everything after a `--` now goes to `shadcn add` untouched, with no exception:

- `--print` is gone. It rendered the chain as a shell one-liner instead of
  running it, and required describing that chain as data so the two could not
  disagree. On a single `shadcn add`, there is nothing left to disagree about.
- An option of ours written after the `--` is no longer refused with an
  explanation. It is forwarded, and shadcn answers for it. "Everything after the
  separator is shadcn's" is now true without an asterisk.
- `--shadcn-cli` no longer validates its argument. Whatever `npx` resolves,
  it runs.

The theme options (`--scheme`, `--contrast`, the color overrides, `--prefix`,
`--no-fallback`) are unchanged, and so is `--format registry-item` for piping it
somewhere else yourself.

Unrelated to shadcn, and in this release because it is breaking too:
`--format` now declares its own list, so `--format bananas` is refused by name
instead of silently producing JSON.
