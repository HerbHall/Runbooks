import { describe, it, expect } from "vitest";
import { getDestructiveWarnings } from "./destructive-commands";

describe("getDestructiveWarnings", () => {
  it("returns empty array for non-destructive commands", () => {
    expect(getDestructiveWarnings(["docker ps"])).toEqual([]);
    expect(getDestructiveWarnings(["docker run nginx"])).toEqual([]);
    expect(getDestructiveWarnings(["docker pull alpine"])).toEqual([]);
    expect(getDestructiveWarnings([])).toEqual([]);
  });

  it("detects docker system prune", () => {
    const warnings = getDestructiveWarnings(["docker system prune"]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].command).toBe("docker system prune");
    expect(warnings[0].description).toMatch(/unused data/i);
  });

  it("detects docker rm", () => {
    const warnings = getDestructiveWarnings(["docker rm mycontainer"]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].command).toBe("docker rm mycontainer");
    expect(warnings[0].description).toMatch(/container/i);
  });

  it("detects docker container rm", () => {
    const warnings = getDestructiveWarnings(["docker container rm mycontainer"]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].description).toMatch(/container/i);
  });

  it("detects docker rmi", () => {
    const warnings = getDestructiveWarnings(["docker rmi myimage"]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].command).toBe("docker rmi myimage");
    expect(warnings[0].description).toMatch(/image/i);
  });

  it("detects docker image rm", () => {
    const warnings = getDestructiveWarnings(["docker image rm myimage"]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].description).toMatch(/image/i);
  });

  it("detects docker image remove", () => {
    const warnings = getDestructiveWarnings(["docker image remove myimage"]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].description).toMatch(/image/i);
  });

  it("detects docker volume rm", () => {
    const warnings = getDestructiveWarnings(["docker volume rm myvolume"]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].command).toBe("docker volume rm myvolume");
    expect(warnings[0].description).toMatch(/volume/i);
  });

  it("detects docker volume prune", () => {
    const warnings = getDestructiveWarnings(["docker volume prune"]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].description).toMatch(/volume/i);
  });

  it("detects commands with extra flags", () => {
    const warnings = getDestructiveWarnings(["docker system prune -af --volumes"]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].command).toBe("docker system prune -af --volumes");
  });

  it("returns all warnings for multiple destructive commands", () => {
    const warnings = getDestructiveWarnings([
      "docker ps",
      "docker system prune",
      "docker volume rm data",
      "docker rmi alpine",
    ]);
    expect(warnings).toHaveLength(3);
    const commands = warnings.map((w) => w.command);
    expect(commands).toContain("docker system prune");
    expect(commands).toContain("docker volume rm data");
    expect(commands).toContain("docker rmi alpine");
  });

  it("deduplicates identical commands", () => {
    const warnings = getDestructiveWarnings([
      "docker system prune",
      "docker system prune",
    ]);
    expect(warnings).toHaveLength(1);
  });

  it("returns empty array for non-docker commands", () => {
    expect(getDestructiveWarnings(["rm -rf /tmp/test"])).toEqual([]);
    expect(getDestructiveWarnings(["kubectl delete pod mypod"])).toEqual([]);
  });

  it("is case-insensitive for command detection", () => {
    const warnings = getDestructiveWarnings(["Docker System Prune"]);
    expect(warnings).toHaveLength(1);
  });

  it("trims whitespace from commands before matching", () => {
    const warnings = getDestructiveWarnings(["  docker system prune  "]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].command).toBe("docker system prune");
  });
});
