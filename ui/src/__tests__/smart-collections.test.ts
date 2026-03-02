import { describe, it, expect, beforeEach } from "vitest";
import { getExecutionCount, didLastRunFail, getHistory, getLastRun } from "../utils/execution-history";

// We test the real functions against localStorage (jsdom provides it)
beforeEach(() => {
  localStorage.clear();
});

function seedHistory(runbookId: string, entries: Array<{ exitCode: number; timestamp?: string }>) {
  const history = entries.map((e, i) => ({
    timestamp: e.timestamp ?? new Date(Date.now() - i * 60000).toISOString(),
    exitCode: e.exitCode,
    duration: 1000,
    commandCount: 1,
    outputSnippet: "",
  }));
  // Save to the preferences store (same mechanism as real code)
  const prefs = JSON.parse(localStorage.getItem("runbooks-prefs") ?? "{}");
  prefs[`exec-history-${runbookId}`] = history;
  localStorage.setItem("runbooks-prefs", JSON.stringify(prefs));
}

describe("getExecutionCount", () => {
  it("returns 0 for runbook with no history", () => {
    expect(getExecutionCount("no-history")).toBe(0);
  });

  it("returns correct count for runbook with history", () => {
    seedHistory("rb-1", [{ exitCode: 0 }, { exitCode: 0 }, { exitCode: 1 }]);
    expect(getExecutionCount("rb-1")).toBe(3);
  });
});

describe("didLastRunFail", () => {
  it("returns false for runbook with no history", () => {
    expect(didLastRunFail("no-history")).toBe(false);
  });

  it("returns false when last run succeeded", () => {
    seedHistory("rb-ok", [{ exitCode: 0 }, { exitCode: 1 }]);
    expect(didLastRunFail("rb-ok")).toBe(false);
  });

  it("returns true when last run failed", () => {
    seedHistory("rb-fail", [{ exitCode: 1 }, { exitCode: 0 }]);
    expect(didLastRunFail("rb-fail")).toBe(true);
  });

  it("returns true for non-zero exit codes other than 1", () => {
    seedHistory("rb-crash", [{ exitCode: 137 }]);
    expect(didLastRunFail("rb-crash")).toBe(true);
  });
});

describe("smart filter integration", () => {
  it("getLastRun returns null for no history", () => {
    expect(getLastRun("empty")).toBeNull();
  });

  it("getLastRun returns most recent entry", () => {
    seedHistory("rb-recent", [
      { exitCode: 0, timestamp: "2026-03-01T10:00:00Z" },
      { exitCode: 1, timestamp: "2026-02-28T10:00:00Z" },
    ]);
    const last = getLastRun("rb-recent");
    expect(last).not.toBeNull();
    expect(last!.exitCode).toBe(0);
    expect(last!.timestamp).toBe("2026-03-01T10:00:00Z");
  });

  it("getHistory returns all entries in order", () => {
    seedHistory("rb-multi", [
      { exitCode: 0, timestamp: "2026-03-01T10:00:00Z" },
      { exitCode: 1, timestamp: "2026-02-28T10:00:00Z" },
      { exitCode: 0, timestamp: "2026-02-27T10:00:00Z" },
    ]);
    const history = getHistory("rb-multi");
    expect(history).toHaveLength(3);
    expect(history[0].timestamp).toBe("2026-03-01T10:00:00Z");
  });
});
