import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Fab } from "../../src/components/ui/Fab";
import { Mcu } from "../../src/Mcu";
import { useMcu } from "../../src/Mcu.context";
import { Layout, Scheme, Shades } from "../../src/Mcu.stories.helpers";

import "../../src/tailwind.css";
import "./figma.css";

function SyncButton() {
  const { figmaTokens } = useMcu();
  const [syncing, setSyncing] = useState(false);

  function handleSync() {
    setSyncing(true);
    parent.postMessage(
      { pluginMessage: { type: "sync-variables", tokens: figmaTokens } },
      "*",
    );
  }

  // Listen for sync completion from plugin
  useEffect(() => {
    const controller = new AbortController();
    window.addEventListener(
      "message",
      (event: MessageEvent) => {
        const msg = event.data?.pluginMessage;
        if (msg?.type === "sync-done" || msg?.type === "sync-error") {
          setSyncing(false);
        }
      },
      { signal: controller.signal },
    );
    return () => controller.abort();
  }, []);

  return (
    <Fab
      onClick={!syncing ? handleSync : undefined}
      title="Sync to Figma Variables"
      className="fixed z-50 bottom-6 right-6"
    >
      <span className={syncing ? "animate-spin" : ""}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0 0 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 0 0 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
        </svg>
      </span>
    </Fab>
  );
}

function App() {
  return (
    <Mcu source="#769CDF" contrast={0}>
      <Layout notext noExport>
        <SyncButton />
        <Scheme>
          <Shades noTitle />
        </Scheme>
      </Layout>
    </Mcu>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
