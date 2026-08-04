import { defineManifest } from "@crxjs/vite-plugin";

import pkg from "../package.json" with { type: "json" };

/*
 * MV3 manifest. Built by CRXJS from this object rather than a static
 * manifest.json so the version tracks the npm package's — CI publishes the
 * extension off the same changesets version bump as the Figma plugin.
 *
 * No `content_scripts` entry on purpose: the panel is a React bundle, and
 * declaring it here would load it into every page the user visits. It is
 * injected on demand instead (see src/background.ts), which is also what
 * lets the extension get by on `activeTab` — no host permissions, no
 * access to anything until the toolbar button is clicked.
 */
export default defineManifest({
  manifest_version: 3,
  name: "Material Theme Builder",
  description:
    "Rebuild any shadcn site's theme from a single source color, the Material You way — live, on the page.",
  version: pkg.version,
  // None of the three carries a user-facing warning. `activeTab` is the
  // reason there are no `host_permissions`: it grants access to one tab,
  // on click, and expires. `clipboardWrite` is for the panel's copy-install-
  // command button — the async Clipboard API is unreliable from an isolated
  // world without it.
  permissions: ["scripting", "activeTab", "clipboardWrite"],
  background: {
    service_worker: "src/background.ts",
    type: "module",
  },
  action: {
    default_title: "Material Theme Builder",
    default_icon: {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png",
    },
  },
  icons: {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png",
  },
});
