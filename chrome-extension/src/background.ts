/*
 * MV3 service worker — the toolbar button, and nothing else.
 *
 * Clicking it toggles the panel on the active tab. The panel is not a
 * declared content script (see manifest.config.ts): it is injected the
 * first time, then driven by messages.
 *
 * Injection is not the toggle. `executeScript` re-runs the loader file, but
 * the module it dynamic-imports stays cached in that tab's isolated world,
 * so a second click would be a no-op. The live instance toggles itself
 * instead, and a failed ping is what tells us there is no instance yet.
 */

// CRXJS emits a loader for this entry and hands back its filename — HMR
// included, so editing the panel updates it in place. Swap for `?iife` if a
// page's CSP ever rejects the loader's dynamic import.
import contentScript from "./content?script";

import {
  PANEL_CLOSED,
  PANEL_TOGGLE,
  type PanelMessage,
  type PanelState,
} from "./messages";

const BADGE_TEXT = "ON";

async function toggle(tabId: number) {
  const state: PanelState | undefined = await chrome.tabs
    .sendMessage(tabId, { type: PANEL_TOGGLE })
    .catch(() => undefined);

  if (state) return setBadge(tabId, state.open);

  await chrome.scripting.executeScript({
    target: { tabId },
    files: [contentScript],
  });
  setBadge(tabId, true);
}

function setBadge(tabId: number, open: boolean) {
  void chrome.action.setBadgeText({ tabId, text: open ? BADGE_TEXT : "" });
}

chrome.action.onClicked.addListener((tab) => {
  if (tab.id !== undefined) void toggle(tab.id);
});

// The ✕ button closes the panel without going through us.
chrome.runtime.onMessage.addListener((message, sender) => {
  const tabId = sender.tab?.id;
  if (tabId !== undefined && (message as PanelMessage).type === PANEL_CLOSED) {
    setBadge(tabId, false);
  }
});

// A navigation takes the panel with it; the badge is per-tab and would
// otherwise outlive it.
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") setBadge(tabId, false);
});
