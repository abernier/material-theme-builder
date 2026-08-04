import { hexFromArgb } from "@material/material-color-utilities";
import { kebabCase } from "lodash-es";
import { Contrast, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import { useDebounceCallback } from "usehooks-ts";
import { Button } from "./components/ui/button";
import { ButtonGroup } from "./components/ui/button-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./components/ui/tooltip";
import { schemeNames, type MtbConfig } from "./lib/builder";
import { cn } from "./lib/utils";
import { useMtb } from "./Mtb.context";

const CONTRAST_LEVELS = [
  { label: "Standard", value: 0 },
  { label: "Medium", value: 0.5 },
  { label: "High", value: 1 },
] as const;

function clickColorInput(e: React.MouseEvent<HTMLButtonElement>) {
  e.currentTarget
    .querySelector<HTMLInputElement>('input[type="color"]')
    ?.click();
}

/**
 * A small round colour swatch — the visual face of every colour-picker button.
 */
function Pill({
  color,
  children,
  className,
  ...props
}: {
  /** The swatch colour (any CSS colour, vars included) — transparent when absent. */
  color?: string;
} & ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "size-4 rounded-full border overflow-hidden shrink-0",
        className,
      )}
      style={{ backgroundColor: color ?? "transparent" }}
      {...props}
    >
      {children}
    </span>
  );
}

/**
 * Theme configuration panel — a debug UI for the MCU theme.
 *
 * Lets users customise the Material color scheme: source color,
 * palette overrides, custom colors, scheme variant, and contrast level.
 *
 * Must be rendered inside `<Mtb>` (it drives the theme via {@link useMtb}).
 *
 * @example
 * ```tsx
 * <Mtb source="#769CDF">
 *   <ThemePanel />
 * </Mtb>
 * ```
 */
export function ThemePanel({
  customColors = true,
  size = "default",
  ...props
}: {
  /**
   * Whether the expanded panel offers custom colors. Turn them off where
   * they can't show up in the output — the Chrome extension, for one, only
   * ever writes the core shadcn variables, which no custom color maps to.
   */
  customColors?: boolean;
  /** Control scale — `"lg"` for an overlay meant to be hit on any page. */
  size?: "default" | "lg";
} & ComponentProps<typeof ButtonGroup>) {
  const { initials, setMcuConfig, allPalettes } = useMtb();
  const iconSize = size === "lg" ? "icon-lg" : "icon";

  const [config, setConfig] = useState<MtbConfig>(() => initials);

  const pendingAddIndexRef = useRef<number | null>(null);
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(false);

  const update = useCallback((patch: Partial<MtbConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  // Apply the config whenever it changes — debounced, since dragging a color
  // input fires on every frame and each application rebuilds the whole theme
  const applyConfig = useDebounceCallback(setMcuConfig, 50);
  useEffect(() => {
    applyConfig(config);
  }, [config, applyConfig]);

  const paletteRows = useMemo(
    () =>
      [
        { key: "primary", label: "Primary", color: config.primary },
        { key: "secondary", label: "Secondary", color: config.secondary },
        { key: "tertiary", label: "Tertiary", color: config.tertiary },
        { key: "error", label: "Error", color: config.error },
        { key: "neutral", label: "Neutral", color: config.neutral },
        {
          key: "neutralVariant",
          label: "Neutral variant",
          color: config.neutralVariant,
        },
      ] as const,
    [config],
  );

  const effectiveColor = expanded
    ? config.source
    : (config.primary ?? config.source);

  return (
    <ButtonGroup {...props}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size={iconSize}
            className="relative"
            onClick={() => setExpanded((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                sourceInputRef.current?.click();
              }
            }}
          >
            <Pill
              color={effectiveColor}
              onClick={(e) => {
                e.stopPropagation();
                sourceInputRef.current?.click();
              }}
            />
            <input
              tabIndex={-1}
              ref={sourceInputRef}
              type="color"
              value={effectiveColor ?? ""}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                if (expanded || config.primary === undefined) {
                  update({ source: e.target.value });
                } else {
                  update({ primary: e.target.value });
                }
              }}
              className="opacity-0 absolute bottom-0 left-0 right-0 h-0 pointer-events-none"
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Source color</TooltipContent>
      </Tooltip>

      {expanded && (
        <>
          {paletteRows.map(({ key, label, color }) => {
            const paletteKey = kebabCase(key);
            const isInferred = config[key] === undefined;
            const inferredHex = isInferred
              ? hexFromArgb(allPalettes[paletteKey]?.keyColor.toInt() ?? 0)
              : undefined;

            return (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size={iconSize}
                    className="relative"
                    onClick={clickColorInput}
                  >
                    <Pill color={color} />
                    <input
                      tabIndex={-1}
                      type="color"
                      value={color ?? inferredHex ?? ""}
                      onChange={(e) => update({ [key]: e.target.value })}
                      className="opacity-0 absolute bottom-0 left-0 right-0 h-0 pointer-events-none"
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <span className="flex items-center gap-1">
                    {!isInferred && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => update({ [key]: undefined })}
                      >
                        <X />
                      </Button>
                    )}
                    {label}
                    {inferredHex && (
                      <Pill color={inferredHex} className="size-3" />
                    )}
                  </span>
                </TooltipContent>
              </Tooltip>
            );
          })}

          {/* Custom colors */}

          {customColors && (
            <>
              {(config.customColors ?? []).map(({ name, hex }, i) => (
                <Tooltip key={name}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size={iconSize}
                      className="relative"
                      onClick={clickColorInput}
                    >
                      <Pill color={hex} />
                      <input
                        tabIndex={-1}
                        type="color"
                        value={hex}
                        onChange={(e) => {
                          const updated = (config.customColors ?? []).map(
                            (c, j) =>
                              j === i ? { ...c, hex: e.target.value } : c,
                          );
                          update({ customColors: updated });
                        }}
                        className="opacity-0 absolute bottom-0 left-0 right-0 h-0 pointer-events-none"
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <span className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => {
                          const updated = (config.customColors ?? []).filter(
                            (_, j) => j !== i,
                          );
                          update({ customColors: updated });
                        }}
                      >
                        <X />
                      </Button>
                      {name}
                    </span>
                  </TooltipContent>
                </Tooltip>
              ))}

              {/* Add custom color */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size={iconSize}
                    className="relative"
                    onClick={clickColorInput}
                  >
                    <Pill />
                    <input
                      tabIndex={-1}
                      type="color"
                      onChange={(e) => {
                        const hex = e.target.value;
                        const existing = config.customColors ?? [];
                        const idx = pendingAddIndexRef.current;

                        if (idx !== null && idx < existing.length) {
                          const updated = existing.map((c, j) =>
                            j === idx ? { ...c, hex } : c,
                          );
                          update({ customColors: updated });
                        } else {
                          pendingAddIndexRef.current = existing.length;
                          update({
                            customColors: [
                              ...existing,
                              {
                                name: `customColor${existing.length + 1}`,
                                hex,
                                blend: true,
                              },
                            ],
                          });
                        }
                      }}
                      className="opacity-0 absolute bottom-0 left-0 right-0 h-0 pointer-events-none"
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Add custom color</TooltipContent>
              </Tooltip>
            </>
          )}
        </>
      )}

      <ContrastToggle
        contrast={config.contrast}
        onChange={(v) => update({ contrast: v })}
        size={iconSize}
      />

      <SchemeToggle
        scheme={config.scheme}
        onChange={(v) => update({ scheme: v })}
        size={size}
      />
    </ButtonGroup>
  );
}

const CONTRAST_ICON_SIZE: Record<number, string> = {
  0: "size-4",
  0.5: "size-5",
  1: "size-6",
};

/**
 * Cycles through contrast levels on click.
 */
function ContrastToggle({
  contrast,
  onChange,
  size,
}: {
  contrast?: number;
  onChange: (v: number) => void;
  size: ComponentProps<typeof Button>["size"];
}) {
  const current = contrast ?? 0;
  const currentLevel =
    CONTRAST_LEVELS.find((l) => l.value === current) ?? CONTRAST_LEVELS[0];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size={size}
          onClick={() => {
            const i = CONTRAST_LEVELS.findIndex((l) => l.value === current);
            const next =
              CONTRAST_LEVELS[(i + 1) % CONTRAST_LEVELS.length] ??
              CONTRAST_LEVELS[0];
            onChange(next.value);
          }}
        >
          <Contrast className={CONTRAST_ICON_SIZE[current] ?? "size-4"} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        Contrast: {currentLevel.label}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Cycles through scheme variants on click.
 */
function SchemeToggle({
  scheme,
  onChange,
  size,
}: {
  scheme?: (typeof schemeNames)[number];
  onChange: (v: (typeof schemeNames)[number]) => void;
  size: ComponentProps<typeof Button>["size"];
}) {
  const current = scheme ?? "tonalSpot";
  const i = schemeNames.indexOf(current);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size={size}
          onClick={() =>
            onChange(
              schemeNames[(i + 1) % schemeNames.length] ?? schemeNames[0],
            )
          }
        >
          {current === "tonalSpot"
            ? "TonalSpot"
            : current.charAt(0).toUpperCase() + current.slice(1)}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">Scheme variant</TooltipContent>
    </Tooltip>
  );
}
