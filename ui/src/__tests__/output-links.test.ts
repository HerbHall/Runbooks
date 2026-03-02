import { describe, it, expect } from "vitest";
import { getNavigationActions } from "../utils/output-links";

describe("getNavigationActions", () => {
  it("returns empty array for unknown commands", () => {
    expect(getNavigationActions(["docker version"])).toEqual([]);
  });

  it("returns empty array for empty input", () => {
    expect(getNavigationActions([])).toEqual([]);
  });

  it("suggests View Containers for run commands", () => {
    const actions = getNavigationActions(["docker run nginx"]);
    expect(actions).toEqual([
      { label: "View Containers", target: "containers" },
    ]);
  });

  it("suggests View Images for pull commands", () => {
    const actions = getNavigationActions(["docker pull nginx"]);
    expect(actions).toEqual([
      { label: "View Images", target: "images" },
    ]);
  });

  it("suggests View Volumes for volume commands", () => {
    const actions = getNavigationActions(["docker volume create mydata"]);
    expect(actions).toEqual([
      { label: "View Volumes", target: "volumes" },
    ]);
  });

  it("deduplicates actions", () => {
    const actions = getNavigationActions(["docker run a", "docker run b"]);
    expect(actions).toHaveLength(1);
  });

  it("returns multiple targets for mixed commands", () => {
    const actions = getNavigationActions([
      "docker run nginx",
      "docker pull alpine",
      "docker volume ls",
    ]);
    expect(actions).toHaveLength(3);
    expect(actions[0].target).toBe("containers");
    expect(actions[1].target).toBe("images");
    expect(actions[2].target).toBe("volumes");
  });

  it("handles commands without docker prefix", () => {
    const actions = getNavigationActions(["run nginx"]);
    expect(actions).toEqual([
      { label: "View Containers", target: "containers" },
    ]);
  });

  it("handles start/stop/restart/kill/exec/create/pause/unpause commands", () => {
    for (const sub of [
      "start",
      "stop",
      "restart",
      "kill",
      "exec",
      "create",
      "pause",
      "unpause",
    ]) {
      const actions = getNavigationActions([`docker ${sub} mycontainer`]);
      expect(actions[0]?.target).toBe("containers");
    }
  });

  it("handles build/push/rmi/tag/image/load/save commands", () => {
    for (const sub of ["build", "push", "rmi", "tag", "image", "load", "save"]) {
      const actions = getNavigationActions([`docker ${sub} myimage`]);
      expect(actions[0]?.target).toBe("images");
    }
  });

  it("handles rm command as container action", () => {
    const actions = getNavigationActions(["docker rm mycontainer"]);
    expect(actions[0]?.target).toBe("containers");
  });

  it("is case-insensitive", () => {
    const actions = getNavigationActions(["Docker RUN nginx"]);
    expect(actions).toEqual([
      { label: "View Containers", target: "containers" },
    ]);
  });
});
