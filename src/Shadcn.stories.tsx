import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties } from "react";
import { allModes } from "../.storybook/modes";
import { AppSidebar } from "./components/app-sidebar";
import { ChartAreaInteractive } from "./components/chart-area-interactive";
import { DataTable } from "./components/data-table";
import { SectionCards } from "./components/section-cards";
import { SiteHeader } from "./components/site-header";
import { SidebarInset, SidebarProvider } from "./components/ui/sidebar";
import { Mtb } from "./Mtb";
import { mtbArgs, mtbArgTypes } from "./Mtb.stories.helpers";

// Where `shadcn add dashboard-01` put it. Left there rather than tidied into
// `fixtures/`, so that re-running the command diffs to nothing.
import data from "./app/dashboard/data.json";

/**
 * shadcn's `dashboard-01` under `<Mtb>` — the end-to-end check on the shadcn
 * mapping.
 *
 * Every other story paints from the M3 vocabulary directly, so all of them
 * would still pass with `shadcn.css` mapping the wrong variable to the wrong
 * token. This one paints from shadcn's: unmodified upstream components, over
 * the `:root`/`.dark` blocks the shadcn CLI maintains at the top of
 * `src/styles/globals.css`, and then `src/shadcn.css` (ours, remapping them
 * onto `--md-sys-color-*`) imported below them. If a name is missed,
 * misspelled or aliased to the wrong role, it shows up here as a wrong color
 * rather than as nothing at all.
 *
 * Which is also why the components are the real ones from the registry and not
 * a hand-written approximation — an approximation only ever exercises the
 * variables whoever wrote it remembered.
 */
const meta = {
  component: Mtb,
  parameters: {
    layout: "fullscreen",
    chromatic: {
      // Both, because the mapping is one `:root, .dark` block: a token that
      // reads right in light and wrong in dark is exactly the kind of mistake
      // a single-mode snapshot lets through.
      modes: {
        light: allModes["light"],
        dark: allModes["dark"],
      },
      // The area chart animates in on mount over recharts' default 1500ms,
      // from JS rather than CSS, so there is nothing for Chromatic to pause --
      // only to wait out. (Measuring it in a background tab will suggest far
      // longer: Chrome throttles `requestAnimationFrame` to ~1fps there.)
      delay: 2000,
    },
  },
  args: mtbArgs,
  argTypes: mtbArgTypes,
} satisfies Meta<typeof Mtb>;

export default meta;

export const Dashboard01: StoryObj<typeof meta> = {
  name: "dashboard-01",
  args: {
    source: "#769CDF",
  },
  render: (args) => (
    <Mtb {...args}>
      {/* `dashboard-01`'s own page, verbatim from the registry item apart from
          the import paths -- see https://ui.shadcn.com/blocks */}
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <SectionCards />
                <div className="px-4 lg:px-6">
                  <ChartAreaInteractive />
                </div>
                <DataTable data={data} />
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </Mtb>
  ),
};
