import type { Runbook, Category, GlobalVariable } from "./types";
import { DEFAULT_CATEGORIES } from "./category-defaults";

const STORAGE_KEY = "runbooks-data";
const CATEGORIES_KEY = "runbooks-categories";
const GLOBALS_KEY = "runbooks-globals";
const PREFS_KEY = "runbooks-prefs";

export const DEFAULT_RUNBOOKS: Runbook[] = [
  {
    id: "example-1",
    name: "Running Containers",
    description: "Show all running containers with key details. Uses Go template formatting.",
    commands: [
      "docker ps --format table\\t{{.Names}}\\t{{.Image}}\\t{{.Status}}\\t{{.Ports}}",
    ],
    tags: ["monitoring"],
    categoryId: "cat-operations",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "example-2",
    name: "Container Logs",
    description: "View recent logs for a container. Demonstrates variable options dropdown and container autocomplete.",
    commands: ["docker logs --tail {{lines=100|50,100,500,1000}} {{container}}"],
    tags: ["monitoring"],
    categoryId: "cat-operations",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "example-3",
    name: "Container Shell",
    description: "Open an interactive shell in a running container. Uses option dropdown and container autocomplete.",
    commands: ["docker exec -it {{container}} {{shell=/bin/sh|/bin/sh,/bin/bash,/bin/zsh}}"],
    tags: ["debug"],
    categoryId: "cat-development",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "example-4",
    name: "Image Inspector",
    description: "Inspect an image's metadata and layer history. Uses image autocomplete and multi-command.",
    commands: [
      "docker inspect {{image}} --format {{.Id}}\\n{{.RepoTags}}\\nSize:\\t{{.Size}}",
      "docker history {{image}}",
    ],
    tags: ["debug"],
    categoryId: "cat-development",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "example-5",
    name: "Disk Usage Report",
    description: "Full breakdown of Docker disk usage across images, containers, and volumes.",
    commands: [
      "docker system df",
      "docker image ls",
      "docker volume ls",
    ],
    tags: ["maintenance"],
    categoryId: "cat-maintenance",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "example-6",
    name: "Quick Cleanup",
    description: "Remove stopped containers and dangling images to free disk space.",
    commands: ["docker container prune -f", "docker image prune -f"],
    tags: ["maintenance", "destructive"],
    categoryId: "cat-maintenance",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "example-7",
    name: "Full Reset",
    description: "Remove ALL unused containers, networks, images, and volumes. Use with caution!",
    commands: ["docker system prune -af --volumes"],
    tags: ["maintenance", "destructive"],
    categoryId: "cat-maintenance",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "example-8",
    name: "Network Diagnostics",
    description: "Inspect a Docker network and its connected containers. Uses network autocomplete.",
    commands: [
      "docker network ls",
      "docker network inspect {{network}}",
    ],
    tags: ["monitoring"],
    categoryId: "cat-operations",
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

export function loadGlobalVariables(): GlobalVariable[] {
  const raw = localStorage.getItem(GLOBALS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as GlobalVariable[];
  } catch {
    return [];
  }
}

export function saveGlobalVariables(globals: GlobalVariable[]): void {
  localStorage.setItem(GLOBALS_KEY, JSON.stringify(globals));
}

export function exportRunbooks(runbooks: Runbook[], categories?: Category[], globals?: GlobalVariable[]): void {
  const exportedGlobals = (globals ?? []).map((g) => ({
    ...g,
    value: g.isSecret ? "" : g.value,
  }));
  const payload = { runbooks, categories: categories ?? [], globals: exportedGlobals };
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `runbooks-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function resetExamples(current: Runbook[]): Runbook[] {
  const withoutExamples = current.filter((r) => !r.id.startsWith("example-"));
  return [...DEFAULT_RUNBOOKS, ...withoutExamples];
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
  globals?: GlobalVariable[];
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
            globals: Array.isArray(data.globals) ? data.globals as GlobalVariable[] : undefined,
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
