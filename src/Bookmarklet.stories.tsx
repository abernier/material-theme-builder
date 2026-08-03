import type { Meta, StoryObj } from "@storybook/react-vite";

/**
 * The `javascript:` snippet users paste (or drag) into their bookmarks bar.
 *
 * A bookmarklet URL can only hold a few KB, so it is a tiny loader: it
 * injects a `<script>` pointing at the self-contained IIFE bundle
 * (`dist/bookmarklet.global.js`, React included) served from jsDelivr.
 * Floating on the major (`@3`) keeps existing bookmarks up to date with
 * every release.
 *
 * NOT exported: Storybook treats every named export of a story file as a
 * story, and Chromatic chokes trying to hang `parameters` off a string.
 *
 * In dev the link targets the locally-built bundle, served by this very
 * Storybook (staticDirs) — run `pnpm build` to refresh it. The built
 * Storybook keeps the jsDelivr URL.
 */
const BUNDLE_URL = import.meta.env.DEV
  ? `${window.location.origin}/dist/bookmarklet.global.js`
  : "https://cdn.jsdelivr.net/npm/material-theme-builder@3/dist/bookmarklet.global.js";

// Dev only: cache-bust at CLICK time (Date.now() runs inside the
// bookmarklet) — the ad-hoc dev server sends no Cache-Control, and
// Chrome's heuristic caching would happily serve a stale bundle.
const BOOKMARKLET_HREF = import.meta.env.DEV
  ? `javascript:(()=>{var s=document.createElement("script");s.src="${BUNDLE_URL}?t="+Date.now();document.body.append(s)})()`
  : `javascript:(()=>{var s=document.createElement("script");s.src="${BUNDLE_URL}";document.body.append(s)})()`;

function BookmarkletLink() {
  return (
    <div className="prose p-8">
      <h1>ThemePanel bookmarklet</h1>
      <p>
        Drag the link below to your bookmarks bar, then click it on any
        shadcn-based site (try{" "}
        <a href="https://ui.shadcn.com/create" target="_blank" rel="noreferrer">
          ui.shadcn.com/create
        </a>
        ): the <code>ThemePanel</code> appears bottom-right and re-themes the
        page live. Click the bookmarklet again — or the ✕ button — to restore
        the site untouched.
      </p>
      <p>
        {/* React refuses javascript: URLs in a JSX href (it swaps in a
            thrower string), which is exactly what a bookmarklet is — so the
            attribute is set imperatively, outside React's sanitizer. */}
        <a
          ref={(el) => el?.setAttribute("href", BOOKMARKLET_HREF)}
          className="inline-block rounded-md border px-3 py-1.5 font-medium no-underline"
          onClick={(e) => e.preventDefault()}
        >
          🎨 MTB ThemePanel
        </a>
      </p>
      <p>
        Bundle: <code>{BUNDLE_URL}</code>
        {import.meta.env.DEV && " (local build — run pnpm build to refresh)"}
      </p>
      <p>
        (Clicking it here is a no-op — Storybook runs in an iframe. Drag it to
        the bookmarks bar instead, or copy the snippet from the README.)
      </p>
    </div>
  );
}

const meta = {
  title: "Bookmarklet",
  component: BookmarkletLink,
} satisfies Meta<typeof BookmarkletLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
