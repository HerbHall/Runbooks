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
