import { Fab } from "./components/ui/Fab";
import type { McuConfig } from "./lib/builder";
import { builder } from "./lib/builder";

interface ExportButtonProps {
  config: McuConfig;
}

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
      className="fixed z-50 bottom-6 right-6"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    </Fab>
  );
}
