/*
 * Content script — mounts <ThemePanel> on any shadcn site and applies the
 * tweaked theme to the page as forced shadcn variables.
 *
 * Injected on demand by the service worker (src/background.ts), never
 * declared in the manifest: React on every page the user browses would be
 * a poor trade for a panel they open now and then.
 *
 * The panel lives in a shadow root: its Tailwind styles (preflight
 * included) stay confined there, and the host page's styles can't reach
 * it. Custom properties DO inherit through the shadow boundary, so the
 * panel is styled by the very shadcn variables it edits.
 */

import { ArrowDownToLine, Check, Info, Terminal, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createRoot, type Root } from "react-dom/client";

// `?inline` (not `?raw`): Vite runs the file through Tailwind first and
// hands back the compiled CSS as a string, which goes into the shadow root.
import cssText from "./content.css?inline";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Flowfield, type Peak } from "@/Flowfield";
import { builder, type MtbConfig } from "@/lib/builder";
import { PortalContainerContext } from "@/lib/extension.portalContainer";
import { shadcnStyleSheet } from "@/lib/extension.shadcnStyle";
import { Mtb } from "@/Mtb";
import { useMtb } from "@/Mtb.context";
import { ThemePanel } from "@/ThemePanel";

import {
  PANEL_CLOSED,
  PANEL_TOGGLE,
  type PanelMessage,
  type PanelState,
} from "./messages";

const HOST_ID = "mtb-panel";
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
    const css = shadcnStyleSheet(toShadcn(), { important: true });

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

const THEME_FILENAME = "globals.css";

// The current theme as a shadcn registry item — installable as-is with the
// standard shadcn CLI (toShadcn() already matches the cssVars field).
function registryItem(config: MtbConfig) {
  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: "mtb-theme",
    type: "registry:theme",
    cssVars: builder(config.source, config).toShadcn(),
  };
}

// Self-contained install command: the registry item rides along as a
// base64 data: URL, so there is nothing to download or host first. `add`
// fetches data: URLs fine; `apply` would corrupt them by appending its
// ?base=…&rtl=… params into the payload.
function installCommand(config: MtbConfig) {
  const b64 = btoa(JSON.stringify(registryItem(config)));
  return `npx shadcn@latest add "data:application/json;base64,${b64}"`;
}

const REPO_URL = "https://github.com/abernier/material-theme-builder";

/*
 * The flowfield behind the About popover, painted with the host page's own
 * shadcn variables — they inherit through the shadow boundary, so the
 * backdrop is itself a live preview of the theme being edited, dark mode
 * included. Base thresholds stay below the peaks', as in Flowfield's own
 * defaults: the base grid is the terrain, each peak paints over it.
 */
const FLOWFIELD_BASE_COLORS: Record<number, string> = {
  100: "var(--popover)",
  200: "var(--muted)",
  300: "var(--accent)",
  400: "var(--secondary)",
  500: "var(--border)",
};

const FLOWFIELD_PEAKS: Peak[] = [
  { id: "primary", colors: { 600: "var(--chart-4)", 900: "var(--chart-1)" } },
  { id: "secondary", colors: { 600: "var(--chart-5)", 900: "var(--chart-2)" } },
  { id: "tertiary", colors: { 600: "var(--chart-3)", 900: "var(--primary)" } },
];

/**
 * The About popover — what this thing is and where it comes from, over an
 * animated flowfield backdrop.
 */
function InfoPopover() {
  return (
    <Popover>
      <ButtonGroup>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon-lg" aria-label="About">
                <Info />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">About</TooltipContent>
        </Tooltip>
      </ButtonGroup>

      <PopoverContent
        side="top"
        align="start"
        className="relative overflow-hidden p-0"
        // Only the info button dismisses it. Every tweak on the panel next
        // to it repaints the backdrop, which an outside click closing the
        // popover would make impossible to watch.
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Dimmed — at full strength the peaks swallow the text, more so in
            dark mode where they are the lightest thing on screen. */}
        <div
          className="absolute inset-0 opacity-60 dark:opacity-40"
          aria-hidden="true"
        >
          <Flowfield
            peaks={FLOWFIELD_PEAKS}
            baseColors={FLOWFIELD_BASE_COLORS}
            gridScale={8}
          />
        </div>

        {/* Later sibling: paints over the backdrop, no z-index needed. */}
        <div className="relative flex flex-col gap-1.5 p-4">
          <p className="text-sm font-medium">Material Theme Builder</p>
          <p className="text-xs text-muted-foreground">
            Rebuilds this page's shadcn theme from a single source color, the
            Material&nbsp;You way. Tweak it, grab the CSS or the install
            command, close to restore the site untouched.
          </p>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium underline underline-offset-2"
          >
            github.com/abernier/material-theme-builder
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * The action cluster after the panel: download the theme as a globals.css
 * snippet, copy the shadcn CLI install command, close.
 */
function Actions({ onClose }: { onClose: () => void }) {
  const { mcuConfig } = useMtb();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  const copyCommand = async () => {
    await navigator.clipboard.writeText(installCommand(mcuConfig));
    setCopied(true);
  };

  // The globals.css snippet, à la ui.shadcn.com/create's "Copy Theme" —
  // plain declarations (no !important): it's meant to be merged into the
  // user's stylesheet, not to fight one.
  const downloadTheme = () => {
    const css = shadcnStyleSheet(
      builder(mcuConfig.source, mcuConfig).toShadcn(),
    );
    const blob = new Blob([css], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = THEME_FILENAME;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <ButtonGroup>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-lg"
              aria-label="Download theme"
              onClick={downloadTheme}
            >
              <ArrowDownToLine />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Download theme CSS ({THEME_FILENAME})
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-lg"
              aria-label="Copy install command"
              onClick={copyCommand}
            >
              {copied ? <Check /> : <Terminal />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {copied
              ? "Copied!"
              : 'Copy install command — npx shadcn add "data:…" (theme embedded)'}
          </TooltipContent>
        </Tooltip>
      </ButtonGroup>

      <ButtonGroup>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-lg"
              aria-label="Close"
              onClick={onClose}
            >
              <X />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Close</TooltipContent>
        </Tooltip>
      </ButtonGroup>
    </>
  );
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
    <PortalContainerContext.Provider value={container}>
      <TooltipProvider>
        <Mtb source={source}>
          <ApplyToHost />
          <div className="flex items-center gap-1">
            <InfoPopover />

            {/* No custom colors: they map to no shadcn variable, so on a
                host page they would be a control that does nothing. */}
            <ThemePanel customColors={false} size="lg" />
            <Actions onClose={onClose} />
          </div>
        </Mtb>
      </TooltipProvider>
    </PortalContainerContext.Provider>
  );
}

function open() {
  const host = document.createElement("div") as MtbHost;
  host.id = HOST_ID;
  // Centered at the bottom: a full-width strip that centers the panel,
  // rather than `left:50%` + a translate — a transformed ancestor would
  // become the containing block of the fixed-positioned Radix popper
  // inside the shadow root. Click-through, since the strip spans the page.
  host.style.cssText =
    "position:fixed;bottom:16px;left:0;right:0;display:flex;" +
    "justify-content:center;pointer-events:none;z-index:2147483647;";
  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = cssText;
  shadow.appendChild(style);

  const wrapper = document.createElement("div");
  // Re-enables what the click-through host strip turned off.
  wrapper.style.pointerEvents = "auto";
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
    // The ✕ button closes without the service worker's knowledge; its badge
    // would otherwise still read ON.
    void chrome.runtime
      .sendMessage({ type: PANEL_CLOSED } satisfies PanelMessage)
      .catch(() => {});
  };
  // Stashed on the element so the toggle below needs no module state of its
  // own — and keeps working even if this script is ever executed twice.
  host.__mtbCleanup = close;

  root.render(
    <App
      container={wrapper}
      source={readHostColor("--primary") ?? FALLBACK_SOURCE}
      onClose={close}
    />,
  );
}

/** Opens the panel, or tears down the one already on the page. */
function toggle(): PanelState {
  const existing = document.getElementById(HOST_ID) as MtbHost | null;
  if (existing) {
    existing.__mtbCleanup?.();
    return { open: false };
  }
  open();
  return { open: true };
}

// Injection is a one-off: every later click on the toolbar button arrives
// here as a message, because re-running this file would not re-run this
// module (see src/background.ts).
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if ((message as PanelMessage).type !== PANEL_TOGGLE) return;
  sendResponse(toggle());
});

toggle();
