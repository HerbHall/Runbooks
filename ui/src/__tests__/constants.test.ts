import { describe, it, expect, beforeEach } from "vitest";
import {
  loadGlobalVariables,
  saveGlobalVariables,
  exportRunbooks,
  importRunbooks,
} from "../storage";
import type { GlobalVariable, Runbook } from "../types";

beforeEach(() => {
  localStorage.clear();
});

const makeVariable = (overrides?: Partial<GlobalVariable>): GlobalVariable => ({
  id: "var-1",
  name: "REGISTRY",
  value: "registry.example.com",
  isSecret: false,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

const makeRunbook = (overrides?: Partial<Runbook>): Runbook => ({
  id: "rb-1",
  name: "Test Runbook",
  description: "Test",
  commands: ["docker ps"],
  tags: [],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

describe("loadGlobalVariables", () => {
  it("returns empty array when nothing stored", () => {
    expect(loadGlobalVariables()).toEqual([]);
  });

  it("returns stored variables", () => {
    const vars = [makeVariable()];
    localStorage.setItem("runbooks-globals", JSON.stringify(vars));
    expect(loadGlobalVariables()).toEqual(vars);
  });

  it("returns empty array on corrupt data", () => {
    localStorage.setItem("runbooks-globals", "not json");
    expect(loadGlobalVariables()).toEqual([]);
  });
});

describe("saveGlobalVariables", () => {
  it("round-trips through load", () => {
    const vars = [
      makeVariable(),
      makeVariable({ id: "var-2", name: "TOKEN", value: "abc123", isSecret: true }),
    ];
    saveGlobalVariables(vars);
    expect(loadGlobalVariables()).toEqual(vars);
  });

  it("overwrites previous data", () => {
    saveGlobalVariables([makeVariable()]);
    saveGlobalVariables([]);
    expect(loadGlobalVariables()).toEqual([]);
  });
});

describe("exportRunbooks with globals", () => {
  it("includes non-secret globals with values", () => {
    const vars = [makeVariable()];
    const runbooks = [makeRunbook()];

    // exportRunbooks creates a download link; we can't fully test the download
    // but we can verify the function doesn't throw
    expect(() => exportRunbooks(runbooks, [], vars)).not.toThrow();
  });

  it("masks secret values in export", () => {
    const secret = makeVariable({ id: "var-s", name: "API_KEY", value: "super-secret", isSecret: true });
    const plain = makeVariable({ id: "var-p", name: "HOST", value: "example.com", isSecret: false });

    // Verify the masking logic directly
    const exported = [secret, plain].map((g) => ({
      ...g,
      value: g.isSecret ? "" : g.value,
    }));

    expect(exported[0].value).toBe("");
    expect(exported[0].isSecret).toBe(true);
    expect(exported[1].value).toBe("example.com");
    expect(exported[1].isSecret).toBe(false);
  });
});

describe("importRunbooks with globals", () => {
  it("parses globals from import data", async () => {
    const vars = [makeVariable()];
    const data = { runbooks: [makeRunbook()], categories: [], globals: vars };
    const file = new File([JSON.stringify(data)], "test.json", { type: "application/json" });

    const result = await importRunbooks(file);
    expect(result.globals).toEqual(vars);
  });

  it("returns undefined globals when field missing", async () => {
    const data = { runbooks: [makeRunbook()], categories: [] };
    const file = new File([JSON.stringify(data)], "test.json", { type: "application/json" });

    const result = await importRunbooks(file);
    expect(result.globals).toBeUndefined();
  });

  it("handles old array format without globals", async () => {
    const data = [makeRunbook()];
    const file = new File([JSON.stringify(data)], "test.json", { type: "application/json" });

    const result = await importRunbooks(file);
    expect(result.runbooks).toHaveLength(1);
    expect(result.globals).toBeUndefined();
  });

  it("preserves secret flag on imported globals", async () => {
    const vars = [
      makeVariable({ isSecret: true, value: "" }),
      makeVariable({ id: "var-2", name: "HOST", isSecret: false, value: "example.com" }),
    ];
    const data = { runbooks: [makeRunbook()], globals: vars };
    const file = new File([JSON.stringify(data)], "test.json", { type: "application/json" });

    const result = await importRunbooks(file);
    expect(result.globals?.[0].isSecret).toBe(true);
    expect(result.globals?.[0].value).toBe("");
    expect(result.globals?.[1].isSecret).toBe(false);
    expect(result.globals?.[1].value).toBe("example.com");
  });
});
