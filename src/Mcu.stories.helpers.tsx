import { cva, type VariantProps } from "class-variance-authority";
import { kebabCase, upperFirst } from "lodash-es";
import { type ComponentProps } from "react";
import { ExportButton } from "./ExportButton";
import { STANDARD_TONES } from "./lib/builder";
import { cn } from "./lib/utils";
import type { Mcu } from "./Mcu";
import { useMcu } from "./Mcu.context";

function Foo({ children, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-id="Foo"
      {...props}
      className={cn("grid grid-cols-1 gap-0", props.className)}
    >
      {children}
    </div>
  );
}
function FooTop({ children, ...props }: ComponentProps<"div">) {
  return <div {...props}>{children || "FooTop"}</div>;
}
function FooBottom({ children, ...props }: ComponentProps<"div">) {
  return <div {...props}>{children || "FooBottom"}</div>;
}

/**
 * Storybook layout wrapper with optional source-color label and export button.
 */
export function Layout({
  notext,
  noExport,
  children,
}: {
  /** Hide the source-color text label. */
  notext?: boolean;
  /** Hide the export button. */
  noExport?: boolean;
  /** Story content to render inside the layout. */
  children: React.ReactNode;
}) {
  const { initials } = useMcu();

  return (
    <div className="flex flex-col gap-6 max-w-208 mx-auto">
      <style>{`
        @scope {
          & {
            --gap1:0.5rem;
            --gap2:1px;
            
            --fs:${notext ? 0 : ".8rem"};
            @media (max-width: 768px) {--fs:0;}

            @media (max-width: 768px) {
              --gap1:2px;
            }


            p {
              font-family:sans-serif;
              color:white;mix-blend-mode:difference;
              white-space:nowrap;overflow:hidden;text-overflow:ellipsis;

              font-size:var(--fs);
              margin:.35rem;

            }

            [class*="h-20"],[class*="h-16"] {
              @media (max-width: 768px) {
                height:45px;
              }
            }
          }
        }
      `}</style>
      {!noExport && <ExportButton config={initials} />}
      {children}
    </div>
  );
}

const schemeVariants = cva(
  "flex flex-col gap-4 [--light:#fbfbfb] [--dark:#1c1b1f]",
  {
    variants: {
      theme: {
        light: "bg-[var(--light)] text-[var(--dark)]",
        dark: ["dark", "bg-[var(--dark)] text-[var(--light)]"],
      },
    },
    compoundVariants: [
      {
        theme: ["light", "dark"],
        className: "p-2 md:p-4",
      },
    ],
  },
);

/**
 * Renders a light or dark color scheme grid with all M3 tokens.
 */
export function Scheme({
  theme,
  title = "",
  customColors,
  children,
  className,
  ...props
}: {
  /** Heading displayed above the scheme. */
  title?: string;
  /** Custom colors forwarded to the inner `<Mcu>`. */
  customColors?: ComponentProps<typeof Mcu>["customColors"];
} & VariantProps<typeof schemeVariants> &
  Omit<ComponentProps<"div">, "title">) {
  return (
    <div className={cn(schemeVariants({ theme }), className)} {...props}>
      {title && <h3 className="font-bold capitalize">{title}</h3>}

      <div className="grid grid-cols-[3fr_1fr] gap-(--gap1)">
        {
          //
          //  █████
          // ██   ██
          // ███████
          // ██   ██
          // ██   ██
          //
        }

        <div className="grid grid-cols-3 grid-rows-2 gap-(--gap2)">
          <Foo>
            <FooTop className="h-20 bg-primary" title="primary">
              <p>Primary</p>
            </FooTop>
            <FooBottom className="bg-on-primary" title="on-primary">
              <p>On Primary</p>
            </FooBottom>
          </Foo>
          <Foo>
            <FooTop className="h-20 bg-secondary" title="secondary">
              <p>Secondary</p>
            </FooTop>
            <FooBottom className="bg-on-secondary" title="on-secondary">
              <p>On Secondary</p>
            </FooBottom>
          </Foo>
          <Foo>
            <FooTop className="h-20 bg-tertiary" title="tertiary">
              <p>Tertiary</p>
            </FooTop>
            <FooBottom className="bg-on-tertiary" title="on-tertiary">
              <p>On Tertiary</p>
            </FooBottom>
          </Foo>
          <Foo>
            <FooTop
              className="h-20 bg-primary-container"
              title="primary-container"
            >
              <p>Primary Container</p>
            </FooTop>
            <FooBottom
              className="bg-on-primary-container"
              title="on-primary-container"
            >
              <p>On Primary Container</p>
            </FooBottom>
          </Foo>
          <Foo>
            <FooTop
              className="h-20 bg-secondary-container"
              title="secondary-container"
            >
              <p>Secondary Container</p>
            </FooTop>
            <FooBottom
              className="bg-on-secondary-container"
              title="on-secondary-container"
            >
              <p>On Secondary Container</p>
            </FooBottom>
          </Foo>
          <Foo>
            <FooTop
              className="h-20 bg-tertiary-container"
              title="tertiary-container"
            >
              <p>Tertiary Container</p>
            </FooTop>
            <FooBottom
              className="bg-on-tertiary-container"
              title="on-tertiary-container"
            >
              <p>On Tertiary Container</p>
            </FooBottom>
          </Foo>
        </div>

        {
          //
          // ██████
          // ██   ██
          // ██████
          // ██   ██
          // ██████
          //
        }

        <div className="grid grid-cols-1 grid-rows-2 gap-(--gap2)">
          <Foo>
            <FooTop className="h-20 bg-error" title="error">
              <p>Error</p>
            </FooTop>
            <FooBottom className="bg-on-error" title="on-error">
              <p>On Error</p>
            </FooBottom>
          </Foo>
          <Foo>
            <FooTop className="h-20 bg-error-container" title="error-container">
              <p>Error Container</p>
            </FooTop>
            <FooBottom
              className="bg-on-error-container"
              title="on-error-container"
            >
              <p>On Error Container</p>
            </FooBottom>
          </Foo>
        </div>

        {
          //
          //  ██████
          // ██
          // ██
          // ██
          //  ██████
          //
        }

        <div className="grid grid-cols-3 grid-rows-1 gap-(--gap2)">
          <Foo>
            <FooTop className="h-20 grid grid-cols-2 grid-rows-1">
              <div className="bg-primary-fixed" title="primary-fixed">
                <p>Primary Fixed</p>
              </div>
              <div className="bg-primary-fixed-dim" title="primary-fixed-dim">
                <p>Primary Fixed Dim</p>
              </div>
            </FooTop>
            <FooBottom className="grid grid-cols-1 grid-rows-2">
              <div className="bg-on-primary-fixed" title="on-primary-fixed">
                <p>On Primary Fixed</p>
              </div>
              <div
                className="bg-on-primary-fixed-variant"
                title="on-primary-fixed-variant"
              >
                <p>On Primary Fixed Variant</p>
              </div>
            </FooBottom>
          </Foo>
          <Foo>
            <FooTop className="h-20 grid grid-cols-2 grid-rows-1">
              <div className="bg-secondary-fixed" title="secondary-fixed">
                <p>Secondary Fixed</p>
              </div>
              <div
                className="bg-secondary-fixed-dim"
                title="secondary-fixed-dim"
              >
                <p>Secondary Fixed Dim</p>
              </div>
            </FooTop>
            <FooBottom className="grid grid-cols-1 grid-rows-2">
              <div className="bg-on-secondary-fixed" title="on-secondary-fixed">
                <p>On Secondary Fixed</p>
              </div>
              <div
                className="bg-on-secondary-fixed-variant"
                title="on-secondary-fixed-variant"
              >
                <p>On Secondary Fixed Variant</p>
              </div>
            </FooBottom>
          </Foo>
          <Foo>
            <FooTop className="h-20 grid grid-cols-2 grid-rows-1">
              <div className="bg-tertiary-fixed" title="tertiary-fixed">
                <p>Tertiary Fixed</p>
              </div>
              <div className="bg-tertiary-fixed-dim" title="tertiary-fixed-dim">
                <p>Tertiary Fixed Dim</p>
              </div>
            </FooTop>
            <FooBottom className="grid grid-cols-1 grid-rows-2">
              <div className="bg-on-tertiary-fixed" title="on-tertiary-fixed">
                <p>On Tertiary Fixed</p>
              </div>
              <div
                className="bg-on-tertiary-fixed-variant"
                title="on-tertiary-fixed-variant"
              >
                <p>On Tertiary Fixed Variant</p>
              </div>
            </FooBottom>
          </Foo>
        </div>

        {
          //
          // ██████
          // ██   ██
          // ██   ██
          // ██   ██
          // ██████
          //
        }

        <div></div>

        {
          //
          // ███████
          // ██
          // █████
          // ██
          // ███████
          //
        }

        <div className="grid grid-cols-1 gap-(--gap2)">
          <div className="h-20 grid grid-cols-3 grid-rows-1">
            <div className="bg-surface-dim" title="surface-dim">
              <p>Surface Dim</p>
            </div>
            <div className="bg-surface" title="surface">
              <p>Surface</p>
            </div>
            <div className="bg-surface-bright" title="surface-bright">
              <p>Surface Bright</p>
            </div>
          </div>
          <div className="h-20 grid grid-cols-5 grid-rows-1">
            <div
              className="bg-surface-container-lowest"
              title="surface-container-lowest"
            >
              <p>Surface Container Lowest</p>
            </div>
            <div
              className="bg-surface-container-low"
              title="surface-container-low"
            >
              <p>Surface Container Low</p>
            </div>
            <div className="bg-surface-container" title="surface-container">
              <p>Surface Container</p>
            </div>
            <div
              className="bg-surface-container-high"
              title="surface-container-high"
            >
              <p>Surface Container High</p>
            </div>
            <div
              className="bg-surface-container-highest"
              title="surface-container-highest"
            >
              <p>Surface Container Highest</p>
            </div>
          </div>
          <div className="grid grid-cols-4 grid-rows-1">
            <div className="bg-on-surface" title="on-surface">
              <p>On Surface</p>
            </div>
            <div className="bg-on-surface-variant" title="on-surface-variant">
              <p>On Surface Variant</p>
            </div>
            <div className="bg-outline" title="outline">
              <p>Outline</p>
            </div>
            <div className="bg-outline-variant" title="outline-variant">
              <p>Outline Variant</p>
            </div>
          </div>
        </div>

        {
          //
          // ███████
          // ██
          // █████
          // ██
          // ██
          //
        }

        <div className="flex flex-col gap-1">
          <Foo>
            <FooTop className="h-20 bg-inverse-surface" title="inverse-surface">
              <p>Inverse Surface</p>
            </FooTop>
            <FooBottom
              className="bg-inverse-on-surface"
              title="inverse-on-surface"
            >
              <p>Inverse On Surface</p>
            </FooBottom>
          </Foo>
          <Foo>
            <FooTop className="bg-inverse-primary" title="inverse-primary">
              <p>Inverse Primary</p>
            </FooTop>
          </Foo>
          <div className="grid grid-cols-2 gap-(--gap2)">
            <div className="bg-scrim" title="scrim">
              <p>Scrim</p>
            </div>
            <div className="bg-shadow" title="shadow">
              <p>Shadow</p>
            </div>
          </div>
        </div>
      </div>
      {
        //
        //  ██████ ██    ██ ███████ ████████  ██████  ███    ███      ██████  ██████  ██       ██████  ██████  ███████
        // ██      ██    ██ ██         ██    ██    ██ ████  ████     ██      ██    ██ ██      ██    ██ ██   ██ ██
        // ██      ██    ██ ███████    ██    ██    ██ ██ ████ ██     ██      ██    ██ ██      ██    ██ ██████  ███████
        // ██      ██    ██      ██    ██    ██    ██ ██  ██  ██     ██      ██    ██ ██      ██    ██ ██   ██      ██
        //  ██████  ██████  ███████    ██     ██████  ██      ██      ██████  ██████  ███████  ██████  ██   ██ ███████
        //
      }
      {customColors && customColors.length > 0 && (
        <div className="flex flex-col gap-(--gap2)">
          {customColors?.map((customColor) => (
            <div key={customColor.name} className="grid grid-cols-4">
              <Foo>
                <FooTop
                  title={kebabCase(customColor.name)}
                  className="h-20"
                  style={{
                    backgroundColor: `var(--md-sys-color-${kebabCase(customColor.name)})`,
                  }}
                >
                  <p>{upperFirst(customColor.name)}</p>
                </FooTop>
              </Foo>
              <Foo>
                <FooTop
                  title={`on-${kebabCase(customColor.name)}`}
                  className="h-20"
                  style={{
                    backgroundColor: `var(--md-sys-color-on-${kebabCase(customColor.name)})`,
                  }}
                >
                  <p>On {upperFirst(customColor.name)}</p>
                </FooTop>
              </Foo>
              <Foo>
                <FooTop
                  title={`${kebabCase(customColor.name)}-container`}
                  className="h-20"
                  style={{
                    backgroundColor: `var(--md-sys-color-${kebabCase(customColor.name)}-container)`,
                  }}
                >
                  <p>{upperFirst(customColor.name)} Container</p>
                </FooTop>
              </Foo>
              <Foo>
                <FooTop
                  title={`on-${kebabCase(customColor.name)}-container`}
                  className="h-20"
                  style={{
                    backgroundColor: `var(--md-sys-color-on-${kebabCase(customColor.name)}-container)`,
                  }}
                >
                  <p>On {upperFirst(customColor.name)} Container</p>
                </FooTop>
              </Foo>
            </div>
          ))}
        </div>
      )}

      {children}
    </div>
  );
}

/**
 * Renders tonal palette shades for all core and custom palettes.
 */
export function Shades({
  customColors,
  noTitle,
}: {
  /** Hide the palette group titles. */
  noTitle?: boolean;
  /** Custom colors forwarded to the inner `<Mcu>`. */
  customColors?: ComponentProps<typeof Mcu>["customColors"];
}) {
  return (
    <div className="flex flex-col gap-(--gap2)">
      {[
        ...[
          "primary",
          "secondary",
          "tertiary",
          "error",
          "neutral",
          "neutral-variant",
        ].map((name) => ({ name, isCustom: false })),
        ...(customColors?.map((cc) => ({ name: cc.name, isCustom: true })) ||
          []),
      ].map(({ name, isCustom }) => (
        <div key={name}>
          {!noTitle && (
            <h3 className="font-bold capitalize">
              {isCustom ? upperFirst(name) : name.replace("-", " ")}
            </h3>
          )}

          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${STANDARD_TONES.length}, 1fr)`,
            }}
          >
            {STANDARD_TONES.slice()
              .reverse()
              .map((tone) => (
                <div
                  key={tone}
                  title={`${isCustom ? kebabCase(name) : name}-${tone}`}
                  className="h-16 flex items-center justify-center"
                  style={{
                    backgroundColor: `var(--md-ref-palette-${isCustom ? kebabCase(name) : name}-${tone})`,
                  }}
                >
                  <p>{tone}</p>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Renders a grid of Tailwind CSS utility classes mapped to M3 tokens.
 */
export function TailwindScheme() {
  return (
    <div className="p-6 space-y-6">
      {/* Primary Colors */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-primary text-on-primary p-4 rounded">primary</div>
          <div className="bg-primary-container text-on-primary-container p-4 rounded">
            primary-container
          </div>
        </div>
      </div>

      {/* Secondary Colors */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-secondary text-on-secondary p-4 rounded">
            secondary
          </div>
          <div className="bg-secondary-container text-on-secondary-container p-4 rounded">
            secondary-container
          </div>
        </div>
      </div>

      {/* Tertiary Colors */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-tertiary text-on-tertiary p-4 rounded">
            tertiary
          </div>
          <div className="bg-tertiary-container text-on-tertiary-container p-4 rounded">
            tertiary-container
          </div>
        </div>
      </div>

      {/* Surface Colors */}
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-surface-dim text-on-surface p-4 rounded">
            surface-dim
          </div>
          <div className="bg-surface text-on-surface p-4 rounded">surface</div>
          <div className="bg-surface-bright text-on-surface p-4 rounded">
            surface-bright
          </div>
        </div>
      </div>

      {/* Error Colors */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-error text-on-error p-4 rounded">error</div>
          <div className="bg-error-container text-on-error-container p-4 rounded">
            error-container
          </div>
        </div>
      </div>

      {/* Outline */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-surface text-on-surface p-4 rounded border-2 border-outline">
            outline
          </div>
          <div className="bg-surface text-on-surface p-4 rounded border-2 border-outline-variant">
            outline-variant
          </div>
        </div>
      </div>

      {/* myCustomColor1 */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-myCustomColor1 text-on-myCustomColor1 p-4 rounded">
            myCustomColor1
          </div>
          <div className="bg-myCustomColor1-container text-on-myCustomColor1-container p-4 rounded">
            myCustomColor1-container
          </div>
        </div>
      </div>

      {/* myCustomColor2 */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-myCustomColor2 text-on-myCustomColor2 p-4 rounded">
            myCustomColor2
          </div>
          <div className="bg-myCustomColor2-container text-on-myCustomColor2-container p-4 rounded">
            myCustomColor2-container
          </div>
        </div>
      </div>

      {/* Shades */}
      <div className="space-y-4">
        {/* Primary Shades */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Primary</h4>
          <div className="grid grid-cols-11 rounded-md overflow-hidden">
            <div className="bg-primary-50 aspect-square flex items-center justify-center text-center text-xs">
              50
            </div>
            <div className="bg-primary-100 aspect-square flex items-center justify-center text-center text-xs">
              100
            </div>
            <div className="bg-primary-200 aspect-square flex items-center justify-center text-center text-xs">
              200
            </div>
            <div className="bg-primary-300 aspect-square flex items-center justify-center text-center text-xs">
              300
            </div>
            <div className="bg-primary-400 aspect-square flex items-center justify-center text-center text-xs">
              400
            </div>
            <div className="bg-primary-500 aspect-square flex items-center justify-center text-center text-xs">
              500
            </div>
            <div className="bg-primary-600 aspect-square flex items-center justify-center text-center text-xs">
              600
            </div>
            <div className="bg-primary-700 aspect-square flex items-center justify-center text-center text-xs">
              700
            </div>
            <div className="bg-primary-800 aspect-square flex items-center justify-center text-center text-xs">
              800
            </div>
            <div className="bg-primary-900 aspect-square flex items-center justify-center text-center text-xs">
              900
            </div>
            <div className="bg-primary-950 aspect-square flex items-center justify-center text-center text-xs">
              950
            </div>
          </div>
        </div>

        {/* Secondary Shades */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Secondary</h4>
          <div className="grid grid-cols-11 rounded-md overflow-hidden">
            <div className="bg-secondary-50 aspect-square flex items-center justify-center text-center text-xs">
              50
            </div>
            <div className="bg-secondary-100 aspect-square flex items-center justify-center text-center text-xs">
              100
            </div>
            <div className="bg-secondary-200 aspect-square flex items-center justify-center text-center text-xs">
              200
            </div>
            <div className="bg-secondary-300 aspect-square flex items-center justify-center text-center text-xs">
              300
            </div>
            <div className="bg-secondary-400 aspect-square flex items-center justify-center text-center text-xs">
              400
            </div>
            <div className="bg-secondary-500 aspect-square flex items-center justify-center text-center text-xs">
              500
            </div>
            <div className="bg-secondary-600 aspect-square flex items-center justify-center text-center text-xs">
              600
            </div>
            <div className="bg-secondary-700 aspect-square flex items-center justify-center text-center text-xs">
              700
            </div>
            <div className="bg-secondary-800 aspect-square flex items-center justify-center text-center text-xs">
              800
            </div>
            <div className="bg-secondary-900 aspect-square flex items-center justify-center text-center text-xs">
              900
            </div>
            <div className="bg-secondary-950 aspect-square flex items-center justify-center text-center text-xs">
              950
            </div>
          </div>
        </div>

        {/* Tertiary Shades */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Tertiary</h4>
          <div className="grid grid-cols-11 rounded-md overflow-hidden">
            <div className="bg-tertiary-50 aspect-square flex items-center justify-center text-center text-xs">
              50
            </div>
            <div className="bg-tertiary-100 aspect-square flex items-center justify-center text-center text-xs">
              100
            </div>
            <div className="bg-tertiary-200 aspect-square flex items-center justify-center text-center text-xs">
              200
            </div>
            <div className="bg-tertiary-300 aspect-square flex items-center justify-center text-center text-xs">
              300
            </div>
            <div className="bg-tertiary-400 aspect-square flex items-center justify-center text-center text-xs">
              400
            </div>
            <div className="bg-tertiary-500 aspect-square flex items-center justify-center text-center text-xs">
              500
            </div>
            <div className="bg-tertiary-600 aspect-square flex items-center justify-center text-center text-xs">
              600
            </div>
            <div className="bg-tertiary-700 aspect-square flex items-center justify-center text-center text-xs">
              700
            </div>
            <div className="bg-tertiary-800 aspect-square flex items-center justify-center text-center text-xs">
              800
            </div>
            <div className="bg-tertiary-900 aspect-square flex items-center justify-center text-center text-xs">
              900
            </div>
            <div className="bg-tertiary-950 aspect-square flex items-center justify-center text-center text-xs">
              950
            </div>
          </div>
        </div>

        {/* Error Shades */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Error</h4>
          <div className="grid grid-cols-11 rounded-md overflow-hidden">
            <div className="bg-error-50 aspect-square flex items-center justify-center text-center text-xs">
              50
            </div>
            <div className="bg-error-100 aspect-square flex items-center justify-center text-center text-xs">
              100
            </div>
            <div className="bg-error-200 aspect-square flex items-center justify-center text-center text-xs">
              200
            </div>
            <div className="bg-error-300 aspect-square flex items-center justify-center text-center text-xs">
              300
            </div>
            <div className="bg-error-400 aspect-square flex items-center justify-center text-center text-xs">
              400
            </div>
            <div className="bg-error-500 aspect-square flex items-center justify-center text-center text-xs">
              500
            </div>
            <div className="bg-error-600 aspect-square flex items-center justify-center text-center text-xs">
              600
            </div>
            <div className="bg-error-700 aspect-square flex items-center justify-center text-center text-xs">
              700
            </div>
            <div className="bg-error-800 aspect-square flex items-center justify-center text-center text-xs">
              800
            </div>
            <div className="bg-error-900 aspect-square flex items-center justify-center text-center text-xs">
              900
            </div>
            <div className="bg-error-950 aspect-square flex items-center justify-center text-center text-xs">
              950
            </div>
          </div>
        </div>

        {/* Neutral Shades */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Neutral</h4>
          <div className="grid grid-cols-11 rounded-md overflow-hidden">
            <div className="bg-neutral-50 aspect-square flex items-center justify-center text-center text-xs">
              50
            </div>
            <div className="bg-neutral-100 aspect-square flex items-center justify-center text-center text-xs">
              100
            </div>
            <div className="bg-neutral-200 aspect-square flex items-center justify-center text-center text-xs">
              200
            </div>
            <div className="bg-neutral-300 aspect-square flex items-center justify-center text-center text-xs">
              300
            </div>
            <div className="bg-neutral-400 aspect-square flex items-center justify-center text-center text-xs">
              400
            </div>
            <div className="bg-neutral-500 aspect-square flex items-center justify-center text-center text-xs">
              500
            </div>
            <div className="bg-neutral-600 aspect-square flex items-center justify-center text-center text-xs">
              600
            </div>
            <div className="bg-neutral-700 aspect-square flex items-center justify-center text-center text-xs">
              700
            </div>
            <div className="bg-neutral-800 aspect-square flex items-center justify-center text-center text-xs">
              800
            </div>
            <div className="bg-neutral-900 aspect-square flex items-center justify-center text-center text-xs">
              900
            </div>
            <div className="bg-neutral-950 aspect-square flex items-center justify-center text-center text-xs">
              950
            </div>
          </div>
        </div>

        {/* Neutral Variant Shades */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Neutral Variant</h4>
          <div className="grid grid-cols-11 rounded-md overflow-hidden">
            <div className="bg-neutral-variant-50 aspect-square flex items-center justify-center text-center text-xs">
              50
            </div>
            <div className="bg-neutral-variant-100 aspect-square flex items-center justify-center text-center text-xs">
              100
            </div>
            <div className="bg-neutral-variant-200 aspect-square flex items-center justify-center text-center text-xs">
              200
            </div>
            <div className="bg-neutral-variant-300 aspect-square flex items-center justify-center text-center text-xs">
              300
            </div>
            <div className="bg-neutral-variant-400 aspect-square flex items-center justify-center text-center text-xs">
              400
            </div>
            <div className="bg-neutral-variant-500 aspect-square flex items-center justify-center text-center text-xs">
              500
            </div>
            <div className="bg-neutral-variant-600 aspect-square flex items-center justify-center text-center text-xs">
              600
            </div>
            <div className="bg-neutral-variant-700 aspect-square flex items-center justify-center text-center text-xs">
              700
            </div>
            <div className="bg-neutral-variant-800 aspect-square flex items-center justify-center text-center text-xs">
              800
            </div>
            <div className="bg-neutral-variant-900 aspect-square flex items-center justify-center text-center text-xs">
              900
            </div>
            <div className="bg-neutral-variant-950 aspect-square flex items-center justify-center text-center text-xs">
              950
            </div>
          </div>
        </div>

        {/* myCustomColor1 Shades */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">myCustomColor1</h4>
          <div className="grid grid-cols-11 rounded-md overflow-hidden">
            <div className="bg-myCustomColor1-50 aspect-square flex items-center justify-center text-center text-xs">
              50
            </div>
            <div className="bg-myCustomColor1-100 aspect-square flex items-center justify-center text-center text-xs">
              100
            </div>
            <div className="bg-myCustomColor1-200 aspect-square flex items-center justify-center text-center text-xs">
              200
            </div>
            <div className="bg-myCustomColor1-300 aspect-square flex items-center justify-center text-center text-xs">
              300
            </div>
            <div className="bg-myCustomColor1-400 aspect-square flex items-center justify-center text-center text-xs">
              400
            </div>
            <div className="bg-myCustomColor1-500 aspect-square flex items-center justify-center text-center text-xs">
              500
            </div>
            <div className="bg-myCustomColor1-600 aspect-square flex items-center justify-center text-center text-xs">
              600
            </div>
            <div className="bg-myCustomColor1-700 aspect-square flex items-center justify-center text-center text-xs">
              700
            </div>
            <div className="bg-myCustomColor1-800 aspect-square flex items-center justify-center text-center text-xs">
              800
            </div>
            <div className="bg-myCustomColor1-900 aspect-square flex items-center justify-center text-center text-xs">
              900
            </div>
            <div className="bg-myCustomColor1-950 aspect-square flex items-center justify-center text-center text-xs">
              950
            </div>
          </div>
        </div>

        {/* myCustomColor2 Shades */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">myCustomColor2</h4>
          <div className="grid grid-cols-11 rounded-md overflow-hidden">
            <div className="bg-myCustomColor2-50 aspect-square flex items-center justify-center text-center text-xs">
              50
            </div>
            <div className="bg-myCustomColor2-100 aspect-square flex items-center justify-center text-center text-xs">
              100
            </div>
            <div className="bg-myCustomColor2-200 aspect-square flex items-center justify-center text-center text-xs">
              200
            </div>
            <div className="bg-myCustomColor2-300 aspect-square flex items-center justify-center text-center text-xs">
              300
            </div>
            <div className="bg-myCustomColor2-400 aspect-square flex items-center justify-center text-center text-xs">
              400
            </div>
            <div className="bg-myCustomColor2-500 aspect-square flex items-center justify-center text-center text-xs">
              500
            </div>
            <div className="bg-myCustomColor2-600 aspect-square flex items-center justify-center text-center text-xs">
              600
            </div>
            <div className="bg-myCustomColor2-700 aspect-square flex items-center justify-center text-center text-xs">
              700
            </div>
            <div className="bg-myCustomColor2-800 aspect-square flex items-center justify-center text-center text-xs">
              800
            </div>
            <div className="bg-myCustomColor2-900 aspect-square flex items-center justify-center text-center text-xs">
              900
            </div>
            <div className="bg-myCustomColor2-950 aspect-square flex items-center justify-center text-center text-xs">
              950
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm italic text-center">
        Non-exhaustive list, for a complete list see the light story
      </p>
    </div>
  );
}
