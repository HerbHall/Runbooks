import type { Runbook, Category } from "./types";
import { DEFAULT_CATEGORIES } from "./category-defaults";

const STORAGE_KEY = "runbooks-data";
const CATEGORIES_KEY = "runbooks-categories";
const PREFS_KEY = "runbooks-prefs";

export const DEFAULT_RUNBOOKS: Runbook[] = [
  {
    id: "example-1",
    name: "Running Containers",
    description: "Show all running containers with key details",
    commands: [
      'docker ps --format "table {{.Names}}\\t{{.Image}}\\t{{.Status}}\\t{{.Ports}}"',
    ],
    tags: ["info"],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "example-2",
    name: "Disk Usage",
    description: "Check how much disk space Docker is using",
    commands: ["docker system df"],
    tags: ["info"],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "example-3",
    name: "Quick Cleanup",
    description: "Remove stopped containers and dangling images",
    commands: ["docker container prune -f", "docker image prune -f"],
    tags: ["cleanup"],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "example-4",
    name: "Full Reset",
    description: "Remove all unused containers, networks, images, and volumes",
    commands: ["docker system prune -af --volumes"],
    tags: ["cleanup", "caution"],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "example-5",
    name: "Network Overview",
    description: "List all Docker networks",
    commands: ["docker network ls"],
    tags: ["info"],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "example-6",
    name: "Volume Inventory",
    description: "List all volumes and check for dangling ones",
    commands: [
      "docker volume ls",
      'docker volume ls --filter "dangling=true"',
    ],
    tags: ["info"],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "example-7",
    name: "Container Logs",
    description: "View recent logs for a specific container",
    commands: ["docker logs --tail {{lines=100}} {{container}}"],
    tags: ["info"],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
];

export function loadRunbooks(): Runbook[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_RUNBOOKS;
  try {
    return JSON.parse(raw) as Runbook[];
  } catch {
    return DEFAULT_RUNBOOKS;
  }
}

export function saveRunbooks(runbooks: Runbook[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(runbooks));
}

export function loadCategories(): Category[] {
  const raw = localStorage.getItem(CATEGORIES_KEY);
  if (!raw) return DEFAULT_CATEGORIES;
  try {
    return JSON.parse(raw) as Category[];
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function saveCategories(categories: Category[]): void {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

export function exportRunbooks(runbooks: Runbook[], categories?: Category[]): void {
  const payload = { runbooks, categories: categories ?? [] };
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `runbooks-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function getMissingDefaults(current: Runbook[]): Runbook[] {
  const ids = new Set(current.map((r) => r.id));
  return DEFAULT_RUNBOOKS.filter((r) => !ids.has(r.id));
}

export function loadPreference<T>(key: string, fallback: T): T {
  try {
    const prefs = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}");
    return key in prefs ? prefs[key] : fallback;
  } catch {
    return fallback;
  }
}

export function savePreference(key: string, value: unknown): void {
  try {
    const prefs = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}");
    prefs[key] = value;
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // silently ignore
  }
}

export interface ImportResult {
  runbooks: Runbook[];
  categories?: Category[];
}

export function importRunbooks(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        // Support old format (plain array) and new format ({ runbooks, categories })
        if (Array.isArray(data)) {
          resolve({ runbooks: data as Runbook[] });
        } else if (data && Array.isArray(data.runbooks)) {
          resolve({
            runbooks: data.runbooks as Runbook[],
            categories: Array.isArray(data.categories) ? data.categories as Category[] : undefined,
          });
        } else {
          reject(new Error("Invalid format: expected runbooks array or { runbooks, categories }"));
        }
      } catch {
        reject(new Error("Invalid JSON file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
