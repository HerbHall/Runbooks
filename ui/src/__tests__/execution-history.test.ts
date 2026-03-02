import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getHistory,
  recordExecution,
  getLastRun,
  formatTimeAgo,
} from "../utils/execution-history";

beforeEach(() => {
  localStorage.clear();
});

describe("getHistory", () => {
  it("returns empty array for unknown runbook", () => {
    expect(getHistory("nonexistent")).toEqual([]);
  });
});

describe("recordExecution", () => {
  it("stores an entry retrievable via getHistory", () => {
    recordExecution("rb-1", 0, 1500, 2, "some output");
    const history = getHistory("rb-1");
    expect(history).toHaveLength(1);
    expect(history[0].exitCode).toBe(0);
    expect(history[0].duration).toBe(1500);
    expect(history[0].commandCount).toBe(2);
    expect(history[0].outputSnippet).toBe("some output");
  });

  it("caps entries at 20", () => {
    for (let i = 0; i < 21; i++) {
      recordExecution("rb-cap", 0, 100, 1, `output-${i}`);
    }
    const history = getHistory("rb-cap");
    expect(history).toHaveLength(20);
    // Most recent entry should be first (output-20)
    expect(history[0].outputSnippet).toBe("output-20");
  });

  it("truncates output snippet to 200 chars", () => {
    const longOutput = "x".repeat(300);
    recordExecution("rb-trunc", 0, 100, 1, longOutput);
    const history = getHistory("rb-trunc");
    expect(history[0].outputSnippet).toHaveLength(200);
  });
});

describe("getLastRun", () => {
  it("returns null for no history", () => {
    expect(getLastRun("nonexistent")).toBeNull();
  });

  it("returns the most recent entry", () => {
    recordExecution("rb-last", 0, 100, 1, "first");
    recordExecution("rb-last", 1, 200, 2, "second");
    const last = getLastRun("rb-last");
    expect(last).not.toBeNull();
    expect(last!.outputSnippet).toBe("second");
    expect(last!.exitCode).toBe(1);
  });
});

describe("formatTimeAgo", () => {
  it('returns "just now" for recent timestamps', () => {
    const now = new Date().toISOString();
    expect(formatTimeAgo(now)).toBe("just now");
  });

  it('returns "Xm ago" for minutes', () => {
    vi.useFakeTimers();
    const base = new Date("2026-01-15T12:00:00Z");
    vi.setSystemTime(base);

    const fiveMinAgo = new Date(base.getTime() - 5 * 60 * 1000).toISOString();
    expect(formatTimeAgo(fiveMinAgo)).toBe("5m ago");

    vi.useRealTimers();
  });

  it('returns "Xh ago" for hours', () => {
    vi.useFakeTimers();
    const base = new Date("2026-01-15T12:00:00Z");
    vi.setSystemTime(base);

    const threeHoursAgo = new Date(base.getTime() - 3 * 60 * 60 * 1000).toISOString();
    expect(formatTimeAgo(threeHoursAgo)).toBe("3h ago");

    vi.useRealTimers();
  });

  it('returns "Xd ago" for days', () => {
    vi.useFakeTimers();
    const base = new Date("2026-01-15T12:00:00Z");
    vi.setSystemTime(base);

    const twoDaysAgo = new Date(base.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatTimeAgo(twoDaysAgo)).toBe("2d ago");

    vi.useRealTimers();
  });
});
