import { useState, useEffect } from "react";
import { useDockerDesktopClient } from "../App";

export type DockerResourceType = "container" | "image" | "volume" | "network";

export interface DockerResource {
  name: string;
  type: DockerResourceType;
}

interface ContainerInfo {
  Names?: string[];
}

interface ImageInfo {
  RepoTags?: string[];
}

interface VolumeInfo {
  Name?: string;
}

interface NetworkInfo {
  Name?: string;
}

/**
 * Map a variable name to a Docker resource type for autocomplete suggestions.
 * Returns null if the name doesn't match any known resource pattern.
 */
export function getResourceTypeForVariable(name: string): DockerResourceType | null {
  const lower = name.toLowerCase();
  if (lower.includes("container")) return "container";
  if (lower.includes("image")) return "image";
  if (lower.includes("volume")) return "volume";
  if (lower.includes("network")) return "network";
  return null;
}

export function useDockerResources(): DockerResource[] {
  const ddClient = useDockerDesktopClient();
  const [resources, setResources] = useState<DockerResource[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchResources() {
      const items: DockerResource[] = [];

      try {
        const raw = await ddClient.docker.listContainers({ all: true });
        const containers = raw as ContainerInfo[];
        for (const c of containers) {
          const names = c.Names ?? [];
          for (const n of names) {
            items.push({ name: n.replace(/^\//, ""), type: "container" });
          }
        }
      } catch {
        // Not in Docker Desktop or API unavailable
      }

      try {
        const raw = await ddClient.docker.listImages();
        const images = raw as ImageInfo[];
        for (const img of images) {
          const tags = img.RepoTags ?? [];
          for (const tag of tags) {
            if (tag !== "<none>:<none>") {
              items.push({ name: tag, type: "image" });
            }
          }
        }
      } catch {
        // Not in Docker Desktop or API unavailable
      }

      try {
        const result = await ddClient.docker.cli.exec("volume", ["ls", "--format", "json"]);
        const lines = result.stdout.split("\n").filter(Boolean);
        for (const line of lines) {
          const vol = JSON.parse(line) as VolumeInfo;
          if (vol.Name) {
            items.push({ name: vol.Name, type: "volume" });
          }
        }
      } catch {
        // volume ls unavailable
      }

      try {
        const result = await ddClient.docker.cli.exec("network", ["ls", "--format", "json"]);
        const lines = result.stdout.split("\n").filter(Boolean);
        for (const line of lines) {
          const net = JSON.parse(line) as NetworkInfo;
          if (net.Name) {
            items.push({ name: net.Name, type: "network" });
          }
        }
      } catch {
        // network ls unavailable
      }

      if (!cancelled) {
        setResources(items);
      }
    }

    fetchResources();
    return () => {
      cancelled = true;
    };
  }, [ddClient]);

  return resources;
}
