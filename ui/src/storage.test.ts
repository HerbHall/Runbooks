import { describe, it, expect, beforeEach } from "vitest";
import {
  loadPreference,
  savePreference,
  resetExamples,
  DEFAULT_RUNBOOKS,
} from "./storage";
import type { Runbook } from "./types";

beforeEach(() => {
  localStorage.clear();
});

describe("savePreference / loadPreference", () => {
  it("stores and retrieves a string value", () => {
    savePreference("theme", "dark");
    expect(loadPreference("theme", "light")).toBe("dark");
  });

  it("stores and retrieves a boolean value", () => {
    savePreference("compact", true);
    expect(loadPreference("compact", false)).toBe(true);
  });

  it("stores and retrieves an object value", () => {
    const obj = { sort: "name", direction: "asc" };
    savePreference("sortConfig", obj);
    expect(loadPreference("sortConfig", {})).toEqual(obj);
  });

  it("returns the fallback when the key does not exist", () => {
    expect(loadPreference("nonexistent", "fallback")).toBe("fallback");
    expect(loadPreference("nonexistent2", 42)).toBe(42);
    expect(loadPreference("nonexistent3", false)).toBe(false);
  });

  it("returns the fallback when localStorage is corrupted", () => {
    localStorage.setItem("runbooks-prefs", "not-valid-json{{{");
    expect(loadPreference("theme", "light")).toBe("light");
  });

  it("overwrites an existing preference", () => {
    savePreference("layout", "grid");
    savePreference("layout", "list");
    expect(loadPreference("layout", "grid")).toBe("list");
  });

  it("stores multiple preferences independently", () => {
    savePreference("theme", "dark");
    savePreference("compact", true);
    savePreference("sort", "name");
    expect(loadPreference("theme", "light")).toBe("dark");
    expect(loadPreference("compact", false)).toBe(true);
    expect(loadPreference("sort", "date")).toBe("name");
  });
});

describe("DEFAULT_RUNBOOKS", () => {
  it("has the expected number of examples", () => {
    expect(DEFAULT_RUNBOOKS).toHaveLength(8);
  });

  it("all examples have example- id prefix", () => {
    for (const r of DEFAULT_RUNBOOKS) {
      expect(r.id).toMatch(/^example-/);
    }
  });

  it("all examples have a categoryId assigned", () => {
    for (const r of DEFAULT_RUNBOOKS) {
      expect(r.categoryId).toBeTruthy();
    }
  });
});

describe("resetExamples", () => {
  it("returns defaults when current list is empty", () => {
    const result = resetExamples([]);
    expect(result).toHaveLength(DEFAULT_RUNBOOKS.length);
    expect(result).toEqual(DEFAULT_RUNBOOKS);
  });

  it("replaces old examples with fresh defaults", () => {
    const modified: Runbook = {
      ...DEFAULT_RUNBOOKS[0],
      name: "Modified Name",
    };
    const result = resetExamples([modified]);
    expect(result).toHaveLength(DEFAULT_RUNBOOKS.length);
    const first = result.find((r: Runbook) => r.id === DEFAULT_RUNBOOKS[0].id);
    expect(first?.name).toBe(DEFAULT_RUNBOOKS[0].name);
  });

  it("preserves custom runbooks alongside fresh defaults", () => {
    const custom: Runbook = {
      id: "custom-1",
      name: "My Custom Runbook",
      description: "A custom one",
      commands: ["docker ps"],
      tags: [],
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    const result = resetExamples([...DEFAULT_RUNBOOKS, custom]);
    expect(result).toHaveLength(DEFAULT_RUNBOOKS.length + 1);
    expect(result.find((r: Runbook) => r.id === "custom-1")).toBeTruthy();
  });

  it("removes stale examples not in current defaults", () => {
    const stale: Runbook = {
      id: "example-99",
      name: "Old Example",
      description: "No longer a default",
      commands: ["docker version"],
      tags: [],
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    const result = resetExamples([stale]);
    expect(result.find((r: Runbook) => r.id === "example-99")).toBeUndefined();
    expect(result).toHaveLength(DEFAULT_RUNBOOKS.length);
  });
});
