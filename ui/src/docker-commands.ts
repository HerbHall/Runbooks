/**
 * Static Docker CLI command tree for validation and syntax highlighting.
 * Covers core engine commands + compose + buildx.
 * Unknown top-level commands produce warnings (not errors) to handle new plugins.
 */

export interface DockerCommand {
  description: string;
  subcommands?: Record<string, string>;
  aliasOf?: string;
}

/** Core management commands and their sub-commands */
export const DOCKER_COMMANDS: Record<string, DockerCommand> = {
  // ── Core Management Commands ──
  container: {
    description: "Manage containers",
    subcommands: {
      attach: "Attach to a running container",
      commit: "Create image from container changes",
      cp: "Copy files between container and host",
      create: "Create a new container",
      diff: "Inspect filesystem changes",
      exec: "Execute a command in a container",
      export: "Export container filesystem",
      inspect: "Display container info",
      kill: "Kill running containers",
      logs: "Fetch container logs",
      ls: "List containers",
      pause: "Pause container processes",
      port: "List port mappings",
      prune: "Remove stopped containers",
      rename: "Rename a container",
      restart: "Restart containers",
      rm: "Remove containers",
      run: "Create and run a container",
      start: "Start stopped containers",
      stats: "Display resource usage",
      stop: "Stop running containers",
      top: "Display running processes",
      unpause: "Unpause containers",
      update: "Update container configuration",
      wait: "Block until containers stop",
    },
  },
  image: {
    description: "Manage images",
    subcommands: {
      build: "Build from a Dockerfile",
      history: "Show image history",
      import: "Import from tarball",
      inspect: "Display image info",
      load: "Load from tar archive",
      ls: "List images",
      prune: "Remove unused images",
      pull: "Download from registry",
      push: "Upload to registry",
      rm: "Remove images",
      save: "Save to tar archive",
      tag: "Tag an image",
    },
  },
  network: {
    description: "Manage networks",
    subcommands: {
      connect: "Connect container to network",
      create: "Create a network",
      disconnect: "Disconnect from network",
      inspect: "Display network info",
      ls: "List networks",
      prune: "Remove unused networks",
      rm: "Remove networks",
    },
  },
  volume: {
    description: "Manage volumes",
    subcommands: {
      create: "Create a volume",
      inspect: "Display volume info",
      ls: "List volumes",
      prune: "Remove unused volumes",
      rm: "Remove volumes",
    },
  },
  system: {
    description: "Manage Docker",
    subcommands: {
      df: "Show disk usage",
      events: "Get real-time events",
      info: "Display system info",
      prune: "Remove unused data",
    },
  },
  context: {
    description: "Manage contexts",
    subcommands: {
      create: "Create a context",
      inspect: "Display context info",
      ls: "List contexts",
      rm: "Remove contexts",
      show: "Show current context",
      update: "Update a context",
      use: "Set current context",
    },
  },
  builder: {
    description: "Manage builds",
    subcommands: {
      build: "Build from a Dockerfile",
      prune: "Remove build cache",
    },
  },
  plugin: {
    description: "Manage plugins",
    subcommands: {
      create: "Create a plugin",
      disable: "Disable a plugin",
      enable: "Enable a plugin",
      inspect: "Display plugin info",
      install: "Install a plugin",
      ls: "List plugins",
      push: "Push a plugin",
      rm: "Remove a plugin",
      set: "Change plugin settings",
      upgrade: "Upgrade a plugin",
    },
  },

  // ── Docker Desktop Plugin Commands ──
  compose: {
    description: "Docker Compose",
    subcommands: {
      build: "Build or rebuild services",
      config: "Validate and view Compose file",
      cp: "Copy files between service and host",
      create: "Create service containers",
      down: "Stop and remove containers",
      events: "Receive real-time events",
      exec: "Execute in a running container",
      images: "List images used by services",
      kill: "Kill service containers",
      logs: "View service output",
      ls: "List Compose projects",
      pause: "Pause services",
      port: "Print port binding for a port",
      ps: "List containers",
      pull: "Pull service images",
      push: "Push service images",
      restart: "Restart service containers",
      rm: "Remove stopped containers",
      run: "Run a one-off command",
      start: "Start services",
      stop: "Stop services",
      top: "Display running processes",
      unpause: "Unpause services",
      up: "Create and start containers",
      version: "Show Compose version",
      watch: "Watch build context and rebuild",
    },
  },
  buildx: {
    description: "Docker Buildx",
    subcommands: {
      bake: "Build from a Bake file",
      build: "Build from a Dockerfile",
      create: "Create a builder instance",
      du: "Disk usage",
      inspect: "Inspect builder instance",
      ls: "List builder instances",
      prune: "Remove build cache",
      rm: "Remove a builder instance",
      stop: "Stop builder instance",
      use: "Set current builder",
      version: "Show Buildx version",
    },
  },

  // ── Top-Level Shortcut Aliases ──
  attach: { description: "Attach to a running container", aliasOf: "container attach" },
  build: { description: "Build an image", aliasOf: "image build" },
  commit: { description: "Create image from container", aliasOf: "container commit" },
  cp: { description: "Copy files", aliasOf: "container cp" },
  create: { description: "Create a container", aliasOf: "container create" },
  diff: { description: "Inspect filesystem changes", aliasOf: "container diff" },
  events: { description: "Get real-time events", aliasOf: "system events" },
  exec: { description: "Execute in a container", aliasOf: "container exec" },
  export: { description: "Export container filesystem", aliasOf: "container export" },
  history: { description: "Show image history", aliasOf: "image history" },
  images: { description: "List images", aliasOf: "image ls" },
  import: { description: "Import from tarball", aliasOf: "image import" },
  info: { description: "Display system info", aliasOf: "system info" },
  inspect: { description: "Display object info" },
  kill: { description: "Kill containers", aliasOf: "container kill" },
  load: { description: "Load image from archive", aliasOf: "image load" },
  login: { description: "Log in to a registry" },
  logout: { description: "Log out from a registry" },
  logs: { description: "Fetch container logs", aliasOf: "container logs" },
  pause: { description: "Pause containers", aliasOf: "container pause" },
  port: { description: "List port mappings", aliasOf: "container port" },
  ps: { description: "List containers", aliasOf: "container ls" },
  pull: { description: "Download image", aliasOf: "image pull" },
  push: { description: "Upload image", aliasOf: "image push" },
  rename: { description: "Rename a container", aliasOf: "container rename" },
  restart: { description: "Restart containers", aliasOf: "container restart" },
  rm: { description: "Remove containers", aliasOf: "container rm" },
  rmi: { description: "Remove images", aliasOf: "image rm" },
  run: { description: "Create and run a container", aliasOf: "container run" },
  save: { description: "Save image to archive", aliasOf: "image save" },
  search: { description: "Search Docker Hub" },
  start: { description: "Start containers", aliasOf: "container start" },
  stats: { description: "Display resource usage", aliasOf: "container stats" },
  stop: { description: "Stop containers", aliasOf: "container stop" },
  tag: { description: "Tag an image", aliasOf: "image tag" },
  top: { description: "Display running processes", aliasOf: "container top" },
  unpause: { description: "Unpause containers", aliasOf: "container unpause" },
  update: { description: "Update container config", aliasOf: "container update" },
  version: { description: "Show Docker version" },
  wait: { description: "Block until containers stop", aliasOf: "container wait" },
};

/** All valid top-level command names (for highlighting and validation) */
export const ALL_COMMANDS = new Set(Object.keys(DOCKER_COMMANDS));

/** Management commands that have sub-commands */
export const MANAGEMENT_COMMANDS = new Set(
  Object.entries(DOCKER_COMMANDS)
    .filter(([, cmd]) => cmd.subcommands)
    .map(([name]) => name),
);

/**
 * Simple Levenshtein distance for "did you mean?" suggestions.
 * Only computes for short strings (command names are short).
 */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0) as number[]);
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/** Find the closest command name within a max distance of 2 */
export function findClosest(input: string, candidates: Iterable<string>): string | null {
  let best: string | null = null;
  let bestDist = 3;
  for (const candidate of candidates) {
    const d = levenshtein(input, candidate);
    if (d < bestDist) {
      bestDist = d;
      best = candidate;
    }
  }
  return best;
}
