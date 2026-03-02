import { describe, it, expect, beforeEach } from "vitest";
import type { Runbook } from "../types";
import { purgeExpiredTrash } from "../storage";

const makeRunbook = (overrides: Partial<Runbook> = {}): Runbook => ({
  id: crypto.randomUUID(),
  name: "Test Runbook",
  description: "A test",
  commands: ["docker ps"],
  tags: [],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

beforeEach(() => {
  localStorage.clear();
});

describe("purgeExpiredTrash", () => {
  it("keeps active runbooks (no deletedAt)", () => {
    const runbooks = [makeRunbook({ name: "Active" })];
    const result = purgeExpiredTrash(runbooks);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Active");
  });

  it("keeps recently trashed runbooks within retention period", () => {
    const recent = new Date().toISOString();
    const runbooks = [makeRunbook({ name: "Recent Trash", deletedAt: recent })];
    const result = purgeExpiredTrash(runbooks);
    expect(result).toHaveLength(1);
  });

  it("removes runbooks trashed beyond retention period", () => {
    const old = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
    const runbooks = [makeRunbook({ name: "Old Trash", deletedAt: old })];
    const result = purgeExpiredTrash(runbooks);
    expect(result).toHaveLength(0);
  });

  it("preserves mix of active and recently trashed", () => {
    const recent = new Date().toISOString();
    const old = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
    const runbooks = [
      makeRunbook({ name: "Active" }),
      makeRunbook({ name: "Recent", deletedAt: recent }),
      makeRunbook({ name: "Expired", deletedAt: old }),
    ];
    const result = purgeExpiredTrash(runbooks);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.name)).toContain("Active");
    expect(result.map((r) => r.name)).toContain("Recent");
  });

  it("respects custom retention days", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const runbooks = [makeRunbook({ deletedAt: twoDaysAgo })];
    expect(purgeExpiredTrash(runbooks, 1)).toHaveLength(0);
    expect(purgeExpiredTrash(runbooks, 3)).toHaveLength(1);
  });
});

describe("soft delete context behavior", () => {
  it("deletedAt field is optional on Runbook type", () => {
    const rb = makeRunbook();
    expect(rb.deletedAt).toBeUndefined();
  });

  it("deletedAt can be set to ISO string", () => {
    const rb = makeRunbook({ deletedAt: "2026-03-01T12:00:00Z" });
    expect(rb.deletedAt).toBe("2026-03-01T12:00:00Z");
  });

  it("runbook without deletedAt is treated as active", () => {
    const rb = makeRunbook();
    expect(!rb.deletedAt).toBe(true);
  });

  it("runbook with deletedAt is treated as trashed", () => {
    const rb = makeRunbook({ deletedAt: "2026-03-01T12:00:00Z" });
    expect(!!rb.deletedAt).toBe(true);
  });
});
