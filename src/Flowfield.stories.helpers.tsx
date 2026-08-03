import { kebabCase } from "lodash-es";
import { MoonIcon, SunIcon } from "lucide-react";
import { useCallback, useMemo, useState, type ComponentProps } from "react";
import { Toggle } from "./components/ui/toggle";
import { Flowfield, type Peak } from "./Flowfield";
import { cn } from "./lib/utils";
import { useMcu } from "./Mcu.context";
import { ThemePanel } from "./ThemePanel";

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
 * Flowfield scene with color palette controls overlay.
 */
export function FlowfieldScene({ ...props }: ComponentProps<typeof Flowfield>) {
  const { allPalettes } = useMcu();

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
      <div className={cn("fixed top-0 left-0 m-6", "flex items-center gap-2")}>
        <ThemePanel />
        <DarkModeToggle />
      </div>
    </>
  );
}
