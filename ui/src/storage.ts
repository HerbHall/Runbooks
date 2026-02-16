import type { Runbook } from "./types";

const STORAGE_KEY = "runbooks-data";
const PREFS_KEY = "runbooks-prefs";

const DEFAULT_RUNBOOKS: Runbook[] = [
  {
    id: "example-1",
    name: "Running Containers",
    description: "Show all running containers with key details",
    commands: [
      'ps --format "table {{.Names}}\\t{{.Image}}\\t{{.Status}}\\t{{.Ports}}"',
    ],
    tags: ["info"],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "example-2",
    name: "Disk Usage",
    description: "Check how much disk space Docker is using",
    commands: ["system df"],
    tags: ["info"],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "example-3",
    name: "Quick Cleanup",
    description: "Remove stopped containers and dangling images",
    commands: ["container prune -f", "image prune -f"],
    tags: ["cleanup"],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "example-4",
    name: "Full Reset",
    description: "Remove all unused containers, networks, images, and volumes",
    commands: ["system prune -af --volumes"],
    tags: ["cleanup", "caution"],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "example-5",
    name: "Network Overview",
    description: "List all Docker networks",
    commands: ["network ls"],
    tags: ["info"],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "example-6",
    name: "Volume Inventory",
    description: "List all volumes and check for dangling ones",
    commands: [
      "volume ls",
      'volume ls --filter "dangling=true"',
    ],
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

export function exportRunbooks(runbooks: Runbook[]): void {
  const json = JSON.stringify(runbooks, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `runbooks-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
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

export function importRunbooks(file: File): Promise<Runbook[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!Array.isArray(data)) {
          reject(new Error("Invalid format: expected an array"));
          return;
        }
        resolve(data as Runbook[]);
      } catch {
        reject(new Error("Invalid JSON file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
