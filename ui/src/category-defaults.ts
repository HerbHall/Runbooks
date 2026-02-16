import type { Category } from "./types";

export const PRESET_COLORS = [
  "#1976d2", // blue
  "#2e7d32", // green
  "#ed6c02", // orange
  "#d32f2f", // red
  "#7b1fa2", // purple
  "#0288d1", // light blue
  "#c2185b", // pink
  "#455a64", // blue-grey
];

export const PRESET_ICONS = [
  "rocket",
  "wrench",
  "shield",
  "terminal",
  "database",
  "globe",
  "alert",
  "package",
  "refresh",
  "trash",
  "eye",
  "heart",
];

export const ICON_LABELS: Record<string, string> = {
  rocket: "\u{1F680}",
  wrench: "\u{1F527}",
  shield: "\u{1F6E1}\uFE0F",
  terminal: "\u{1F4BB}",
  database: "\u{1F5C4}\uFE0F",
  globe: "\u{1F310}",
  alert: "\u26A0\uFE0F",
  package: "\u{1F4E6}",
  refresh: "\u{1F504}",
  trash: "\u{1F5D1}\uFE0F",
  eye: "\u{1F441}\uFE0F",
  heart: "\u2764\uFE0F",
};

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "cat-operations",
    name: "Operations",
    color: "#1976d2",
    icon: "terminal",
    parentId: null,
    order: 0,
  },
  {
    id: "cat-development",
    name: "Development",
    color: "#2e7d32",
    icon: "rocket",
    parentId: null,
    order: 1,
  },
  {
    id: "cat-maintenance",
    name: "Maintenance",
    color: "#ed6c02",
    icon: "wrench",
    parentId: null,
    order: 2,
  },
];
