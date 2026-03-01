/** Parsed variable extracted from command text */
export interface ParsedVariable {
  name: string;
  defaultValue: string;
  options: string[];
  fullMatch: string;
}

/**
 * Regex for matching Runbook variables in command text.
 *
 * Matches: {{name}}, {{name=default}}, {{name|a,b}}, {{name=default|a,b}}
 * Skips:   {{.Names}} (Go template — dot prefix), \{{escaped}} (backslash escape)
 *
 * Capture groups:
 *   1: variable name (required)
 *   2: default value (optional, after =, before | if present)
 *   3: options list (optional, after |, comma-separated)
 */
export const VARIABLE_REGEX =
  /(?<!\\)\{\{([a-zA-Z_][a-zA-Z0-9_]*)(?:=([^|}]*))?(?:\|([^}]+))?\}\}/g;

/** Non-global version for test/match use */
const VARIABLE_REGEX_TEST =
  /(?<!\\)\{\{([a-zA-Z_][a-zA-Z0-9_]*)(?:=([^|}]*))?(?:\|([^}]+))?\}\}/;

/**
 * Parse all unique variables from an array of command strings.
 * Deduplicates by name — first occurrence wins for default/options.
 */
export function parseVariables(commands: string[]): ParsedVariable[] {
  const seen = new Map<string, ParsedVariable>();

  for (const cmd of commands) {
    const regex = new RegExp(VARIABLE_REGEX.source, "g");
    let match;
    while ((match = regex.exec(cmd)) !== null) {
      const name = match[1];
      if (!seen.has(name)) {
        seen.set(name, {
          name,
          defaultValue: match[2] ?? "",
          options: match[3] ? match[3].split(",").map((o) => o.trim()) : [],
          fullMatch: match[0],
        });
      }
    }
  }

  return Array.from(seen.values());
}

/** Fast check: do any commands contain at least one variable? */
export function hasVariables(commands: string[]): boolean {
  return commands.some((cmd) => VARIABLE_REGEX_TEST.test(cmd));
}

/**
 * Substitute variable values into command strings.
 * - Replaces all {{name}}/{{name=default}}/{{name|opts}} with values[name]
 * - Falls back to defaultValue if values[name] is undefined
 * - Unescapes \{{ to {{ after substitution
 * - Leaves Go template {{.Field}} untouched
 */
export function substituteVariables(
  commands: string[],
  values: Record<string, string>,
): string[] {
  return commands.map((cmd) => {
    const substituted = cmd.replace(
      new RegExp(VARIABLE_REGEX.source, "g"),
      (_fullMatch, name: string, defaultValue?: string) => {
        if (name in values && values[name] !== "") {
          return values[name];
        }
        return defaultValue ?? "";
      },
    );
    // Unescape \{{ to {{
    return substituted.replace(/\\\{\{/g, "{{");
  });
}

/** Escape HTML special characters for safe innerHTML rendering */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
