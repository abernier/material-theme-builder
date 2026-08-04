# Chrome extension

`ThemePanel` on any shadcn site, from the toolbar. See the
[main README](../README.md#chrome-extension) for what it does and how to install a build.

## Layout

| File                 | What                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------- |
| `manifest.config.ts` | The MV3 manifest, built by CRXJS. Version tracks `package.json`.                          |
| `src/background.ts`  | Service worker. The toolbar button, the badge, and injecting the panel the first time.    |
| `src/content.tsx`    | The panel itself, in a shadow root. Injected on demand, never a declared content script.  |
| `src/content.css`    | Tailwind for the shadow root, imported `?inline` (a string) so it never reaches the page. |
| `src/messages.ts`    | The two messages crossing between the two.                                                |
| `icons/`             | Generated — `node scripts/make-extension-icons.mjs` (needs ImageMagick).                  |

## Develop

```sh
pnpm dev-extension
```

Vite writes `chrome-extension/dist/` and keeps it live: load that folder once via
`chrome://extensions` → Developer mode → **Load unpacked**, and edits to `content.tsx` (or
anything under `src/` it imports) hot-reload in the page with the panel open.

Two things are not HMR: `content.css` and the manifest. Both trigger a rebuild, but you
have to close and reopen the panel to see the CSS change, and reload the extension for a
manifest change.

## Build & package

```sh
pnpm build-extension   # -> chrome-extension/dist/
pnpm zip-extension     # -> chrome-extension/material-theme-builder-chrome.zip
```

CI attaches that zip to every GitHub release, and uploads it to the Chrome Web Store when
the store credentials are configured (see below).

## Publishing to the Chrome Web Store

One-time setup, all of it outside this repo:

1. Register a developer account (one-off $5 fee) at the
   [Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Upload `material-theme-builder-chrome.zip` by hand once — the API can only update an
   item that already exists. Fill in the listing (copy below), submit for review.
3. Enable the Chrome Web Store API in a Google Cloud project, create an OAuth client
   (type: Desktop), and mint a refresh token — see
   [the official guide](https://developer.chrome.com/docs/webstore/using-api).
4. Add to the repo: variable `CHROME_EXTENSION_ID`, secrets `CHROME_CLIENT_ID`,
   `CHROME_CLIENT_SECRET`, `CHROME_REFRESH_TOKEN`.

With those set, `.github/workflows/ci.yml` uploads and publishes a new version on every
release. Without them the job is skipped, and only the GitHub release zip is produced.

### Listing

**Category** Developer Tools — **Language** English

**Short description** (132 char max)

> Rebuild any shadcn site's theme from a single source color, the Material You way — live, on the page.

**Detailed description**

> Material Theme Builder brings Google's Material You color system to shadcn/ui.
>
> Open it on any shadcn-based site and the page's theme is regenerated from a single source
> color: pick a color, a scheme (tonal spot, vibrant, expressive, …) and a contrast level,
> and every shadcn variable on the page updates live — light and dark mode, same-origin
> preview iframes included.
>
> When you like what you see, download the theme as a `globals.css` snippet, or copy a
> one-line `npx shadcn add` command with the theme embedded — nothing to host first. Close
> the panel and the site is exactly as you found it.
>
> The same color engine is available as an npm package, a CLI and a Figma plugin:
> https://github.com/abernier/material-theme-builder
>
> Open source, MIT.

**Permission justifications**

- `activeTab` — the panel is injected into the page you are on, and only when you click the
  toolbar button. This is what lets the extension read that page's shadcn variables and
  restyle it.
- `scripting` — required to perform that injection.
- `clipboardWrite` — the panel's "copy install command" button writes an `npx shadcn add`
  line to the clipboard.
- No host permissions, no remote code, no network requests, no analytics. Nothing leaves
  your browser.

**Privacy** Single purpose: preview a Material You color theme on the current page. The
extension collects and transmits no user data.

**Screenshots** (1280×800 or 640×400, at least one) — the panel open on
`ui.shadcn.com/create`, collapsed and expanded, in light and dark mode.
