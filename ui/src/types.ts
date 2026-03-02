export interface Runbook {
  id: string;
  name: string;
  description: string;
  commands: string[];
  tags: string[];
  categoryId?: string;
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommandResult {
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
}

export type ExecutionStatus = "idle" | "running" | "completed" | "failed";

export interface ExecutionHistoryEntry {
  timestamp: string;
  exitCode: number;
  duration: number;
  commandCount: number;
  outputSnippet: string;
}

export type SortOption = "name-asc" | "name-desc" | "created-desc" | "created-asc" | "modified-desc" | "modified-asc" | "last-run-desc";

export type LayoutMode = "grid" | "list";

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  parentId: string | null;
  order: number;
}

export type GroupMode = "none" | "tag" | "category";

export type SmartFilter = "none" | "recent" | "most-used" | "failed";

export interface GlobalVariable {
  id: string;
  name: string;
  value: string;
  isSecret: boolean;
  createdAt: string;
  updatedAt: string;
}
