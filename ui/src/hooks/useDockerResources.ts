import { useState, useEffect } from "react";
import { useDockerDesktopClient } from "../App";

export interface DockerResource {
  name: string;
  type: "container" | "image";
}

interface ContainerInfo {
  Names?: string[];
}

interface ImageInfo {
  RepoTags?: string[];
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
