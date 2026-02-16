export interface Runbook {
  id: string;
  name: string;
  description: string;
  commands: string[];
  tags: string[];
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

export type SortOption = "name-asc" | "name-desc" | "created-desc" | "created-asc" | "modified-desc" | "modified-asc";

export type LayoutMode = "grid" | "list";
