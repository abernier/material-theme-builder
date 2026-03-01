import { cva, type VariantProps } from "class-variance-authority";

/**
 * M3 State Layer — visual feedback for interactive states
 *
 * Uses a `::before` pseudo-element with the current text color.
 * Requires `relative overflow-hidden` on the parent.
 *
 * @see https://m3.material.io/foundations/interaction/states/overview
 */
export const stateLayer = cva(
  [
    "relative overflow-hidden",
    // Pseudo-element state layer
    "before:absolute before:inset-0 before:rounded-[inherit] before:bg-current before:opacity-0 before:transition-opacity",
  ],
  {
    variants: {
      /**
       * Interaction mode — determines which states apply
       */
      interaction: {
        /** Hover 8%, focus 10%, pressed 10% */
        default:
          "hover:before:opacity-8 focus-visible:before:opacity-10 active:before:opacity-10",
        /** Dragged 16% */
        dragged: "before:opacity-16",
      },
    },
    defaultVariants: {
      interaction: "default",
    },
  },
);

export type StateLayerProps = VariantProps<typeof stateLayer>;
