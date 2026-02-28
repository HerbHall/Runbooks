import { describe, it, expect } from "vitest";
import { levenshtein, findClosest, DOCKER_COMMANDS, ALL_COMMANDS } from "./docker-commands";

describe("levenshtein", () => {
  it("returns 0 for identical strings", () => {
    expect(levenshtein("ps", "ps")).toBe(0);
    expect(levenshtein("", "")).toBe(0);
  });

  it("returns length of non-empty string when other is empty", () => {
    expect(levenshtein("abc", "")).toBe(3);
    expect(levenshtein("", "xyz")).toBe(3);
  });

  it("returns 1 for single insertion", () => {
    expect(levenshtein("run", "runs")).toBe(1);
    expect(levenshtein("pull", "pul")).toBe(1);
  });

  it("returns 1 for single deletion", () => {
    expect(levenshtein("stop", "top")).toBe(1);
  });

  it("returns 1 for single substitution", () => {
    expect(levenshtein("run", "fun")).toBe(1);
  });

  it("computes distance for completely different strings", () => {
    expect(levenshtein("ps", "volume")).toBe(6);
  });

  it("is symmetric", () => {
    expect(levenshtein("exec", "exek")).toBe(levenshtein("exek", "exec"));
  });
});

describe("findClosest", () => {
  const candidates = Array.from(ALL_COMMANDS);

  it("returns exact match for a known command", () => {
    expect(findClosest("ps", candidates)).toBe("ps");
    expect(findClosest("run", candidates)).toBe("run");
  });

  it("returns closest match for a one-character typo", () => {
    // "pss" is distance 1 from "ps"
    const result = findClosest("pss", candidates);
    expect(result).toBe("ps");
  });

  it("returns closest match for a two-character typo", () => {
    // "runn" -> "run" (distance 1); should still find "run"
    const result = findClosest("runn", candidates);
    expect(result).toBe("run");
  });

  it("returns null when input is too far from all candidates", () => {
    // "zzzzzzzzz" is far from every Docker command
    const result = findClosest("zzzzzzzzz", ["ps", "run", "stop"]);
    expect(result).toBeNull();
  });

  it("returns null for empty candidates", () => {
    expect(findClosest("run", [])).toBeNull();
  });
});

describe("DOCKER_COMMANDS data integrity", () => {
  it("all entries have a description", () => {
    for (const [name, cmd] of Object.entries(DOCKER_COMMANDS)) {
      expect(cmd.description, `${name} is missing description`).toBeTruthy();
    }
  });

  it("management commands have non-empty subcommands", () => {
    for (const [name, cmd] of Object.entries(DOCKER_COMMANDS)) {
      if (cmd.subcommands !== undefined) {
        expect(
          Object.keys(cmd.subcommands).length,
          `${name} has empty subcommands`
        ).toBeGreaterThan(0);
      }
    }
  });

  it("has no duplicate keys in ALL_COMMANDS", () => {
    const keys = Object.keys(DOCKER_COMMANDS);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });

  it("ALL_COMMANDS contains well-known Docker commands", () => {
    expect(ALL_COMMANDS.has("ps")).toBe(true);
    expect(ALL_COMMANDS.has("run")).toBe(true);
    expect(ALL_COMMANDS.has("stop")).toBe(true);
    expect(ALL_COMMANDS.has("pull")).toBe(true);
    expect(ALL_COMMANDS.has("compose")).toBe(true);
    expect(ALL_COMMANDS.has("volume")).toBe(true);
    expect(ALL_COMMANDS.has("network")).toBe(true);
  });

  it("alias entries reference valid aliasOf strings", () => {
    for (const [name, cmd] of Object.entries(DOCKER_COMMANDS)) {
      if (cmd.aliasOf !== undefined) {
        expect(typeof cmd.aliasOf, `${name}.aliasOf should be a string`).toBe("string");
        expect(cmd.aliasOf.length, `${name}.aliasOf should not be empty`).toBeGreaterThan(0);
      }
    }
  });
});
