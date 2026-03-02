import { loadPreference, savePreference } from "../storage";
import type { ExecutionHistoryEntry } from "../types";

const MAX_ENTRIES = 20;
const SNIPPET_MAX_LENGTH = 200;

export function getHistory(runbookId: string): ExecutionHistoryEntry[] {
  return loadPreference<ExecutionHistoryEntry[]>(`exec-history-${runbookId}`, []);
}

export function recordExecution(
  runbookId: string,
  exitCode: number,
  duration: number,
  commandCount: number,
  output: string,
): void {
  const history = getHistory(runbookId);
  const entry: ExecutionHistoryEntry = {
    timestamp: new Date().toISOString(),
    exitCode,
    duration,
    commandCount,
    outputSnippet: output.slice(0, SNIPPET_MAX_LENGTH),
  };
  const updated = [entry, ...history].slice(0, MAX_ENTRIES);
  savePreference(`exec-history-${runbookId}`, updated);
}

export function getLastRun(runbookId: string): ExecutionHistoryEntry | null {
  const history = getHistory(runbookId);
  return history.length > 0 ? history[0] : null;
}

export function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function getExecutionCount(runbookId: string): number {
  return getHistory(runbookId).length;
}

export function didLastRunFail(runbookId: string): boolean {
  const last = getLastRun(runbookId);
  return last !== null && last.exitCode !== 0;
}
