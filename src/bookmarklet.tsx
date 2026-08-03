/*
 * Bookmarklet entry — a self-contained IIFE (React bundled, see
 * tsup.config.ts) that mounts <ThemePanel> on any shadcn site and applies
 * the tweaked theme to the page as forced shadcn variables.
 *
 * The panel lives in a shadow root: its Tailwind styles (preflight
 * included) stay confined there, and the host page's styles can't reach
 * it. Custom properties DO inherit through the shadow boundary, so the
 * panel is styled by the very shadcn variables it edits.
 */

import { X } from "lucide-react";
import { useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";

// Compiled by Tailwind at build time and inlined as a string (tsup plugin).
import cssText from "./bookmarklet.css?raw";

import { Button } from "./components/ui/button";
import {
  TooltipPortalContainerContext,
  TooltipProvider,
} from "./components/ui/tooltip";
import { builder } from "./lib/builder";
import { shadcnStyleSheet } from "./lib/shadcnStyle";
import { Mtb } from "./Mtb";
import { useMtb } from "./Mtb.context";
import { ThemePanel } from "./ThemePanel";

const HOST_ID = "mtb-bookmarklet";
const STYLE_ID = "mtb-shadcn";
const FALLBACK_SOURCE = "#769CDF";

type MtbHost = HTMLDivElement & { __mtbCleanup?: () => void };

/**
 * Resolve a CSS variable of the host page to a hex color.
 *
 * The computed value may serialize as `oklch(…)`; painting it on a 1×1
 * canvas and reading the pixel back normalizes any color the browser can
 * parse to sRGB bytes.
 */
function readHostColor(varName: string): string | null {
  if (
    !getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  ) {
    return null;
  }

  const probe = document.createElement("span");
  probe.style.color = `var(${varName})`;
  document.body.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  probe.remove();

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = computed;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map((c) => (c ?? 0).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * The host document plus every same-origin iframe document — sites like
 * ui.shadcn.com/create render their preview in an iframe, which has its
 * own <head> our variables would never reach. Cross-origin frames throw
 * on access and are skipped.
 */
function themableDocuments(): Document[] {
  const docs = [document];
  for (const frame of Array.from(document.querySelectorAll("iframe"))) {
    try {
      if (frame.contentDocument?.head) docs.push(frame.contentDocument);
    } catch {
      // cross-origin
    }
  }
  return docs;
}

function removeInjectedStyles() {
  for (const doc of themableDocuments()) {
    doc.getElementById(STYLE_ID)?.remove();
  }
}

/**
 * Applies the panel's config to the host page as forced shadcn variables
 * (see {@link shadcnStyleSheet}) — but not before the first actual tweak:
 * the regenerated theme differs from the site's own even when seeded from
 * it, and opening the panel must not repaint the page.
 */
function ApplyToHost() {
  const { initials, mcuConfig } = useMtb();

  useEffect(() => {
    if (JSON.stringify(mcuConfig) === JSON.stringify(initials)) return;

    const { toShadcn } = builder(mcuConfig.source, mcuConfig);
    const css = shadcnStyleSheet(toShadcn());

    for (const doc of themableDocuments()) {
      let style = doc.getElementById(STYLE_ID) as HTMLStyleElement | null;
      if (!style) {
        style = doc.createElement("style");
        style.id = STYLE_ID;
      }
      style.textContent = css;
      // (Re-)append: staying last in <head> wins the source-order fight
      // against the site's own unlayered styles. Also re-themes an iframe
      // that reloaded since the previous update.
      doc.head.append(style);
    }
  }, [initials, mcuConfig]);

  return null;
}

function App({
  container,
  source,
  onClose,
}: {
  container: HTMLElement;
  source: string;
  onClose: () => void;
}) {
  return (
    <TooltipPortalContainerContext.Provider value={container}>
      <TooltipProvider>
        <Mtb source={source}>
          <ApplyToHost />
          <div className="flex items-center gap-1">
            <ThemePanel />
            <Button
              variant="outline"
              size="icon"
              aria-label="Close"
              onClick={onClose}
            >
              <X />
            </Button>
          </div>
        </Mtb>
      </TooltipProvider>
    </TooltipPortalContainerContext.Provider>
  );
}

function open() {
  const host = document.createElement("div") as MtbHost;
  host.id = HOST_ID;
  host.style.cssText =
    "position:fixed;bottom:16px;right:16px;z-index:2147483647;";
  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = cssText;
  shadow.appendChild(style);

  const wrapper = document.createElement("div");
  shadow.appendChild(wrapper);

  // Mirror the page's `.dark` class onto the in-shadow wrapper: compiled
  // `dark:` variants match ancestors, and the page's <html> is outside the
  // shadow boundary.
  const syncDark = () =>
    wrapper.classList.toggle(
      "dark",
      document.documentElement.classList.contains("dark"),
    );
  syncDark();
  const observer = new MutationObserver(syncDark);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  document.body.appendChild(host);

  let root: Root | null = createRoot(wrapper);

  const close = () => {
    observer.disconnect();
    root?.unmount();
    root = null;
    host.remove();
    removeInjectedStyles();
  };
  // Stashed on the element so a later load of this script (fresh module
  // scope) can tear this instance down — that's what makes it a toggle.
  host.__mtbCleanup = close;

  root.render(
    <App
      container={wrapper}
      source={readHostColor("--primary") ?? FALLBACK_SOURCE}
      onClose={close}
    />,
  );
}

const existing = document.getElementById(HOST_ID) as MtbHost | null;
if (existing) {
  existing.__mtbCleanup?.();
} else {
  open();
}
