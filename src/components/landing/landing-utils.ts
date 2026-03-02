/**
 * Pure utility functions for landing page components.
 * Extracted for testability — no React or Framer Motion dependencies.
 */

export type Alignment = "left" | "right" | "center";

export type SportConfig = {
  nameKey: "bjj" | "kickboxing" | "mma";
  color: string;
  align: Alignment;
};

/** Sports showcase configuration */
export const SPORTS: SportConfig[] = [
  { nameKey: "bjj", color: "#B91C1C", align: "left" },
  { nameKey: "kickboxing", color: "#A16207", align: "right" },
  { nameKey: "mma", color: "#22C55E", align: "center" },
];

/** Days displayed in the schedule (Mon-Sat, JS convention) */
export const DISPLAY_DAYS = [1, 2, 3, 4, 5, 6] as const;

/** Tailwind classes for sport block alignment — centered on mobile, varied on desktop */
export function getAlignmentClasses(align: Alignment): string {
  switch (align) {
    case "left":
      return "items-center text-center lg:items-start lg:text-left";
    case "right":
      return "items-center text-center lg:items-end lg:text-right";
    case "center":
      return "items-center text-center";
  }
}

/** Tailwind classes for accent line margin — centered on mobile, aligned on desktop */
export function getAccentLineClasses(align: Alignment): string {
  switch (align) {
    case "left":
      return "mx-auto lg:ml-0 lg:mr-auto";
    case "right":
      return "mx-auto lg:mr-0 lg:ml-auto";
    case "center":
      return "mx-auto";
  }
}

/** Initial slide direction for sport block entrance animation */
export function getSlideDirection(align: Alignment): { x: number; y: number } {
  switch (align) {
    case "left":
      return { x: -60, y: 0 };
    case "right":
      return { x: 60, y: 0 };
    case "center":
      return { x: 0, y: 40 };
  }
}

/** Map a sport hex color to its muted theme variant */
export function mutedColor(color: string | null): string {
  if (!color) return "#A8A29E";
  const c = color.toLowerCase();
  if (c.includes("dc2626") || c.includes("ef4444") || c.includes("b91c1c")) return "#B91C1C";
  if (c.includes("eab308") || c.includes("facc15") || c.includes("ca8a04") || c.includes("a16207")) return "#A16207";
  if (c.includes("22c55e") || c.includes("16a34a")) return "#22C55E";
  return "#A8A29E";
}
