export type NavigationTarget = "containers" | "images" | "volumes";

export interface NavigationAction {
  label: string;
  target: NavigationTarget;
}

/**
 * Analyze commands to determine relevant navigation actions.
 * Returns contextual navigation buttons based on command types.
 */
export function getNavigationActions(
  commands: string[],
): NavigationAction[] {
  const actions: NavigationAction[] = [];
  const seen = new Set<NavigationTarget>();

  for (const cmd of commands) {
    const lower = cmd.toLowerCase().trim();
    const normalized = lower.startsWith("docker ")
      ? lower.slice(7)
      : lower;

    if (
      !seen.has("containers") &&
      /^(run|start|stop|restart|kill|rm|exec|create|pause|unpause)\b/.test(
        normalized,
      )
    ) {
      actions.push({ label: "View Containers", target: "containers" });
      seen.add("containers");
    }

    if (
      !seen.has("images") &&
      /^(pull|build|push|rmi|tag|image|load|save)\b/.test(normalized)
    ) {
      actions.push({ label: "View Images", target: "images" });
      seen.add("images");
    }

    if (!seen.has("volumes") && /^(volume)\b/.test(normalized)) {
      actions.push({ label: "View Volumes", target: "volumes" });
      seen.add("volumes");
    }
  }

  return actions;
}
