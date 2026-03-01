import { cva, type VariantProps } from "class-variance-authority";
import { type ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { stateLayer } from "./state-layer";

/**
 * M3 Floating Action Button
 *
 * @see https://m3.material.io/components/floating-action-button/specs
 */
const fabVariants = cva(
  [
    "flex items-center justify-center cursor-pointer",
    // Elevation
    "shadow-lg hover:shadow-xl active:shadow-md transition-shadow",
    // Focus ring
    "outline-none focus-visible:ring-2 focus-visible:ring-current/50",
  ],
  {
    variants: {
      /**
       * FAB size — controls container dimensions and corner radius
       * @see https://m3.material.io/components/floating-action-button/specs#:~:text=Copy%20link-,Variants,-link
       */
      size: {
        default: "size-14 rounded-2xl", // 56dp
        medium: "size-20 rounded-3xl", // 80dp
        large: "size-24 rounded-[28px]", // 96dp
      },
      /**
       * FAB color style — container & icon color mapping
       * @see https://m3.material.io/components/floating-action-button/specs#:~:text=Copy%20link-,Color,-Color%20values%20are
       */
      color: {
        "primary-container": "bg-primary-container text-on-primary-container",
        "secondary-container":
          "bg-secondary-container text-on-secondary-container",
        "tertiary-container":
          "bg-tertiary-container text-on-tertiary-container",
        primary: "bg-primary text-on-primary",
        secondary: "bg-secondary text-on-secondary",
        tertiary: "bg-tertiary text-on-tertiary",
      },
    },
    defaultVariants: {
      size: "default",
      color: "primary-container",
    },
  },
);

export type FabProps = ComponentProps<"button"> &
  VariantProps<typeof fabVariants>;

/** Material 3 Floating Action Button. */
export function Fab({ className, size, color, children, ...props }: FabProps) {
  return (
    <button
      className={cn(stateLayer(), fabVariants({ size, color }), className)}
      {...props}
    >
      {children}
    </button>
  );
}
