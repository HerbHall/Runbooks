import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDockerResources } from "../hooks/useDockerResources";

vi.mock("../App", () => ({
  useDockerDesktopClient: vi.fn(() => ({
    docker: {
      listContainers: vi.fn(() =>
        Promise.resolve([
          { Names: ["/my-nginx"] },
          { Names: ["/my-redis"] },
        ]),
      ),
      listImages: vi.fn(() =>
        Promise.resolve([
          { RepoTags: ["nginx:latest", "nginx:1.25"] },
          { RepoTags: ["redis:7"] },
          { RepoTags: ["<none>:<none>"] },
        ]),
      ),
    },
  })),
}));

describe("useDockerResources", () => {
  it("fetches containers and images", async () => {
    const { result } = renderHook(() => useDockerResources());

    await waitFor(() => {
      expect(result.current.length).toBeGreaterThan(0);
    });

    const containers = result.current.filter((r) => r.type === "container");
    const images = result.current.filter((r) => r.type === "image");

    expect(containers).toContainEqual({ name: "my-nginx", type: "container" });
    expect(containers).toContainEqual({ name: "my-redis", type: "container" });
    expect(images).toContainEqual({ name: "nginx:latest", type: "image" });
    expect(images).toContainEqual({ name: "nginx:1.25", type: "image" });
    expect(images).toContainEqual({ name: "redis:7", type: "image" });
    // <none>:<none> should be filtered out
    expect(images).not.toContainEqual(
      expect.objectContaining({ name: "<none>:<none>" }),
    );
  });

  it("strips leading slash from container names", async () => {
    const { result } = renderHook(() => useDockerResources());

    await waitFor(() => {
      expect(result.current.length).toBeGreaterThan(0);
    });

    const containerNames = result.current
      .filter((r) => r.type === "container")
      .map((r) => r.name);

    for (const name of containerNames) {
      expect(name).not.toMatch(/^\//);
    }
  });
});
