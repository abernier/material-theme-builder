import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS class names with conflict resolution (shadcn).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
