import { hexFromArgb } from "@material/material-color-utilities";
import { kebabCase } from "lodash-es";
import { MoonIcon, SunIcon, X } from "lucide-react";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import { useDebounceCallback } from "usehooks-ts";
import { Button } from "./components/ui/button";
import { ButtonGroup } from "./components/ui/button-group";
import { Toggle } from "./components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./components/ui/tooltip";
import { Flowfield, type Peak } from "./Flowfield";
import { schemeNames } from "./lib/builder";
import { cn } from "./lib/utils";
import { useMtb } from "./Mtb.context";

function Pill({
  color,
  children,
  className,
  ...props
}: {
  /** Background color (hex string). */
  color?: string;
} & ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "size-6 rounded-full border overflow-hidden shrink-0",
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
 * Toggle that adds/removes the `dark` class on the closest `<html>` element.
 */
function DarkModeToggle() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );

  const toggle = useCallback((pressed: boolean) => {
    document.documentElement.classList.toggle("dark", pressed);
    setDark(pressed);
  }, []);

  return (
    <Toggle
      variant="outline"
      size="sm"
      pressed={dark}
      onPressedChange={toggle}
      aria-label="Toggle dark mode"
    >
      {dark ? <MoonIcon /> : <SunIcon />}
    </Toggle>
  );
}

/**
 * Color button
 */
function ButtonPill({
  color,
  onChange,
  ...rest
}: {
  /** Current color (hex string). */
  color?: string;
  /** Called with the newly picked hex color. */
  onChange: (hex: string) => void;
} & Omit<React.ComponentProps<typeof Button>, "color" | "onChange">) {
  const inputColorRef = useRef<HTMLInputElement>(null);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => {
        inputColorRef.current?.click();
      }}
      {...rest}
    >
      <Pill color={color}>
        <input
          tabIndex={-1}
          ref={inputColorRef}
          type="color"
          value={color ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="opacity-0"
        />
      </Pill>
    </Button>
  );
}

/**
 * Flowfield scene with color palette controls overlay.
 */
export function FlowfieldScene({ ...props }: ComponentProps<typeof Flowfield>) {
  const {
    allPalettes,
    mtbConfig,
    setMtbConfig: _setMtbConfig,
    initials,
  } = useMtb();

  const setMtbConfig = useDebounceCallback(_setMtbConfig, 50);

  const pendingAddIndexRef = useRef<number | null>(null);

  const baseColors = useMemo<Record<number, string>>(
    () => ({
      100: "var(--md-sys-color-surface-container-lowest)",
      200: "var(--md-sys-color-surface-container-low)",
      300: "var(--md-sys-color-surface-container)",
      400: "var(--md-sys-color-surface-container-high)",
      500: "var(--md-sys-color-surface-container-highest)",
    }),
    [],
  );

  const peaks = useMemo<Peak[]>(() => {
    const peakKeys = Object.keys(allPalettes).filter(
      (k) => k !== "neutral" && k !== "neutral-variant",
    );

    return peakKeys.flatMap((key) => {
      const palette = allPalettes[key];
      if (!palette) return [];

      const kebab = kebabCase(key);
      const colors: Record<number, string> = {
        600: `var(--md-sys-color-on-${kebab})`,
        700: `var(--md-sys-color-${kebab}-container)`,
        800: `var(--md-sys-color-${kebab})`,
        900: `var(--md-sys-color-on-${kebab}-container)`,
      };

      return {
        id: key,
        colors,
      };
    });
  }, [allPalettes]);

  return (
    <>
      <Flowfield peaks={peaks} baseColors={baseColors} {...props} />
      <div className={cn("fixed bottom-0 left-0 m-6", "flex items-end gap-2")}>
        <div className="flex flex-col-reverse">
          {(
            [
              {
                key: "primary",
                label: "Primary",
                color: mtbConfig.primary ?? initials.source,
              },
              {
                key: "secondary",
                label: "Secondary",
                color: mtbConfig.secondary,
              },
              { key: "tertiary", label: "Tertiary", color: mtbConfig.tertiary },
              { key: "error", label: "Error", color: mtbConfig.error },
              { key: "neutral", label: "Neutral", color: mtbConfig.neutral },
              {
                key: "neutralVariant",
                label: "Neutral variant",
                color: mtbConfig.neutralVariant,
              },
            ] as const
          ).map(({ key, label, color }) => {
            const paletteKey = kebabCase(key);
            const isInferred = mtbConfig[key] === undefined;
            const inferredHex = isInferred
              ? hexFromArgb(allPalettes[paletteKey]?.keyColor.toInt() ?? 0)
              : undefined;

            return (
              <Tooltip key={key}>
                <TooltipTrigger
                  render={
                    <ButtonPill
                      color={color}
                      onChange={(hex) => {
                        setMtbConfig({
                          ...mtbConfig,
                          [key]: hex,
                        });
                      }}
                    />
                  }
                />
                <TooltipContent side="right">
                  <span className="flex items-center gap-1">
                    {!isInferred && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() =>
                          setMtbConfig({ ...mtbConfig, [key]: undefined })
                        }
                        className="-ml-1"
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

          {/* Custom color */}

          <hr
            className="my-1 border-t w-6 mx-auto"
            style={{ borderColor: "var(--md-sys-color-outline-variant)" }}
          />

          {(mtbConfig.customColors ?? []).map(({ name, hex }, i) => (
            <Tooltip key={name}>
              <TooltipTrigger
                render={
                  <ButtonPill
                    color={hex}
                    onChange={(newHex) => {
                      const updated = (mtbConfig.customColors ?? []).map(
                        (c, j) => (j === i ? { ...c, hex: newHex } : c),
                      );
                      setMtbConfig({
                        ...mtbConfig,
                        customColors: updated,
                      });
                    }}
                  />
                }
              />
              <TooltipContent side="right">
                <span className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => {
                      const updated = (mtbConfig.customColors ?? []).filter(
                        (_, j) => j !== i,
                      );
                      setMtbConfig({ ...mtbConfig, customColors: updated });
                    }}
                    className="-ml-1"
                  >
                    <X />
                  </Button>
                  {name}
                </span>
              </TooltipContent>
            </Tooltip>
          ))}

          {/* Add new custom color */}

          <Tooltip>
            <TooltipTrigger
              render={
                <ButtonPill
                  onClick={() => {
                    pendingAddIndexRef.current = null;
                  }}
                  onChange={(hex) => {
                    const existing = mtbConfig.customColors ?? [];
                    const idx = pendingAddIndexRef.current;

                    if (idx !== null && idx < existing.length) {
                      // update the color being picked
                      const updated = existing.map((c, j) =>
                        j === idx ? { ...c, hex } : c,
                      );
                      setMtbConfig({ ...mtbConfig, customColors: updated });
                    } else {
                      // first change of this pick session — add a new color
                      pendingAddIndexRef.current = existing.length;
                      setMtbConfig({
                        ...mtbConfig,
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
                />
              }
            />
            <TooltipContent side="right">Add custom color</TooltipContent>
          </Tooltip>
        </div>
        <DarkModeToggle />

        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const levels = [
              { label: "Std", value: 0 },
              { label: "Med", value: 0.5 },
              { label: "Hi", value: 1 },
            ] as const;
            const current = mtbConfig.contrast ?? 0;
            const idx = levels.findIndex((l) => l.value === current);
            const next = levels[(idx + 1) % levels.length] ?? levels[0];
            setMtbConfig({ ...mtbConfig, contrast: next.value });
          }}
        >
          {(
            [
              { label: "Std", value: 0 },
              { label: "Med", value: 0.5 },
              { label: "Hi", value: 1 },
            ] as const
          ).find((l) => l.value === (mtbConfig.contrast ?? 0))?.label ?? "Std"}
        </Button>
        <div>
          <ButtonGroup>
            <Button
              size="sm"
              variant="outline"
              className="capitalize"
              onClick={() => {
                const currentScheme = mtbConfig.scheme ?? "tonalSpot";
                const idx = schemeNames.indexOf(currentScheme);
                const next = schemeNames[(idx + 1) % schemeNames.length];
                setMtbConfig({ ...mtbConfig, scheme: next });
              }}
            >
              {mtbConfig.scheme ?? "tonalSpot"}
            </Button>
          </ButtonGroup>
        </div>
      </div>
    </>
  );
}
