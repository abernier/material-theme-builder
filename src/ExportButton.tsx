import { Fab } from "./components/m3/Fab";
import type { MtbConfig } from "./lib/builder";
import { builder } from "./lib/builder";

interface ExportButtonProps {
  /** Current theme configuration used to generate the exported tokens. */
  config: MtbConfig;
}

/**
 * FAB that exports the current theme as Figma DTCG token JSON files.
 */
export function ExportButton({ config }: ExportButtonProps) {
  const handleExport = () => {
    try {
      const { source, ...rest } = config;
      const result = builder(source, rest);

      const files = result.toFigmaTokens();

      // Download each file
      for (const [filename, content] of Object.entries(files)) {
        const blob = new Blob([JSON.stringify(content, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      console.log("Figma tokens exported successfully");
    } catch (error) {
      console.error("Failed to export Figma tokens:", error);
      alert(
        "Failed to export: " +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  };

  return (
    <Fab
      onClick={handleExport}
      title="Export Figma Tokens"
      aria-label="Export Figma Tokens"
    >
      {/* The Figma mark: what comes down is a Figma tokens file, not a
          generic download, and this is the one place a logo says which. */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="M8 24a4 4 0 0 1-4-4 4 4 0 0 1 4-4h4v4a4 4 0 0 1-4 4Zm0-6.5A2.5 2.5 0 0 0 5.5 20 2.5 2.5 0 0 0 8 22.5 2.5 2.5 0 0 0 10.5 20v-2.5H8ZM8 16a4 4 0 0 1-4-4 4 4 0 0 1 4-4h4v8H8Zm0-6.5A2.5 2.5 0 0 0 5.5 12 2.5 2.5 0 0 0 8 14.5h2.5v-5H8ZM8 8a4 4 0 0 1-4-4 4 4 0 0 1 4-4h4v8H8Zm0-6.5A2.5 2.5 0 0 0 5.5 4 2.5 2.5 0 0 0 8 6.5h2.5v-5H8Zm8 6.5h-4V0h4a4 4 0 0 1 4 4 4 4 0 0 1-4 4Zm-2.5-1.5H16A2.5 2.5 0 0 0 18.5 4 2.5 2.5 0 0 0 16 1.5h-2.5v5ZM16 16a4 4 0 0 1-4-4 4 4 0 0 1 4-4 4 4 0 0 1 4 4 4 4 0 0 1-4 4Zm0-6.5a2.5 2.5 0 0 0-2.5 2.5 2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 16 9.5Z" />
      </svg>
    </Fab>
  );
}
