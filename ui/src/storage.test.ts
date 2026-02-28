import { describe, it, expect, beforeEach } from "vitest";
import {
  loadPreference,
  savePreference,
  getMissingDefaults,
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

describe("getMissingDefaults", () => {
  it("returns all defaults when current list is empty", () => {
    const missing = getMissingDefaults([]);
    expect(missing).toHaveLength(DEFAULT_RUNBOOKS.length);
    expect(missing).toEqual(DEFAULT_RUNBOOKS);
  });

  it("returns empty array when all defaults are present", () => {
    const missing = getMissingDefaults(DEFAULT_RUNBOOKS);
    expect(missing).toHaveLength(0);
  });

  it("returns only the missing defaults", () => {
    const current = [DEFAULT_RUNBOOKS[0], DEFAULT_RUNBOOKS[1]];
    const missing = getMissingDefaults(current);
    expect(missing).toHaveLength(DEFAULT_RUNBOOKS.length - 2);
    const missingIds = missing.map((r) => r.id);
    expect(missingIds).not.toContain(DEFAULT_RUNBOOKS[0].id);
    expect(missingIds).not.toContain(DEFAULT_RUNBOOKS[1].id);
  });

  it("does not include custom runbooks in missing defaults", () => {
    const custom: Runbook = {
      id: "custom-1",
      name: "My Custom Runbook",
      description: "A custom one",
      commands: ["docker ps"],
      tags: [],
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    const missing = getMissingDefaults([...DEFAULT_RUNBOOKS, custom]);
    expect(missing).toHaveLength(0);
  });

  it("returns defaults missing by id even if runbook content changed", () => {
    // A runbook with default id but different content still counts as "present"
    const modified: Runbook = {
      ...DEFAULT_RUNBOOKS[0],
      name: "Modified Name",
    };
    const missing = getMissingDefaults([modified]);
    const missingIds = missing.map((r) => r.id);
    expect(missingIds).not.toContain(DEFAULT_RUNBOOKS[0].id);
  });
});
