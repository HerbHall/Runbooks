import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDockerResources, getResourceTypeForVariable } from "../hooks/useDockerResources";

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
      cli: {
        exec: vi.fn((cmd: string) => {
          if (cmd === "volume") {
            return Promise.resolve({
              stdout: '{"Name":"my-data"}\n{"Name":"pg-volume"}\n',
            });
          }
          if (cmd === "network") {
            return Promise.resolve({
              stdout: '{"Name":"bridge"}\n{"Name":"my-network"}\n',
            });
          }
          return Promise.resolve({ stdout: "" });
        }),
      },
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

  it("fetches volumes and networks", async () => {
    const { result } = renderHook(() => useDockerResources());

    await waitFor(() => {
      expect(result.current.some((r) => r.type === "volume")).toBe(true);
    });

    const volumes = result.current.filter((r) => r.type === "volume");
    const networks = result.current.filter((r) => r.type === "network");

    expect(volumes).toContainEqual({ name: "my-data", type: "volume" });
    expect(volumes).toContainEqual({ name: "pg-volume", type: "volume" });
    expect(networks).toContainEqual({ name: "bridge", type: "network" });
    expect(networks).toContainEqual({ name: "my-network", type: "network" });
  });
});

describe("getResourceTypeForVariable", () => {
  it("maps container-related names", () => {
    expect(getResourceTypeForVariable("container")).toBe("container");
    expect(getResourceTypeForVariable("container_name")).toBe("container");
    expect(getResourceTypeForVariable("my_container")).toBe("container");
  });

  it("maps image-related names", () => {
    expect(getResourceTypeForVariable("image")).toBe("image");
    expect(getResourceTypeForVariable("image_name")).toBe("image");
    expect(getResourceTypeForVariable("base_image")).toBe("image");
  });

  it("maps volume-related names", () => {
    expect(getResourceTypeForVariable("volume")).toBe("volume");
    expect(getResourceTypeForVariable("volume_name")).toBe("volume");
    expect(getResourceTypeForVariable("data_volume")).toBe("volume");
  });

  it("maps network-related names", () => {
    expect(getResourceTypeForVariable("network")).toBe("network");
    expect(getResourceTypeForVariable("network_name")).toBe("network");
    expect(getResourceTypeForVariable("my_network")).toBe("network");
  });

  it("returns null for non-resource variable names", () => {
    expect(getResourceTypeForVariable("lines")).toBeNull();
    expect(getResourceTypeForVariable("tag")).toBeNull();
    expect(getResourceTypeForVariable("port")).toBeNull();
    expect(getResourceTypeForVariable("name")).toBeNull();
  });
});
