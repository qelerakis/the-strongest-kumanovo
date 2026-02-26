export type UserRole = "admin" | "member";

export type BeltRank = "white" | "blue" | "purple" | "brown" | "black";

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const BELT_COLORS: Record<BeltRank, string> = {
  white: "#FFFFFF",
  blue: "#2563EB",
  purple: "#7C3AED",
  brown: "#92400E",
  black: "#000000",
};
