import { useState, useMemo, useEffect, useCallback } from "react";
import Editor from "react-simple-code-editor";
import {
  Box,
  FormHelperText,
  useTheme,
  Paper,
  MenuList,
  MenuItem,
  Typography,
  Popper,
  ClickAwayListener,
} from "@mui/material";
import { ALL_COMMANDS, MANAGEMENT_COMMANDS, DOCKER_COMMANDS } from "../docker-commands";
import { VARIABLE_REGEX, escapeHtml } from "../utils/variables";
import type { DockerResource } from "../hooks/useDockerResources";

/** Docker CLI commands that typically take a container name/ID as an argument */
const CONTAINER_COMMANDS = new Set([
  "exec", "start", "stop", "restart", "kill", "rm", "logs",
  "inspect", "attach", "commit", "cp", "diff", "export",
  "port", "rename", "top", "update", "wait",
]);

/** Docker CLI commands that typically take an image name as an argument */
const IMAGE_COMMANDS = new Set([
  "run", "pull", "push", "tag", "rmi", "save", "load", "history",
]);

/** Regex-based Docker CLI syntax highlighter */
function highlightDocker(code: string): string {
  return code
    .split("\n")
    .map((line) => {
      const escaped = escapeHtml(line);

      // Comment lines
      if (/^\s*#/.test(line)) {
        return `<span style="color:var(--docker-comment)">${escaped}</span>`;
      }

      const trimmed = line.trim();
      if (!trimmed) return escaped;

      // Tokenize: split on whitespace, highlight each token
      let result = "";
      let remaining = escaped;
      const tokens = trimmed.split(/\s+/);

      // Handle optional "docker" prefix — treat it as a neutral keyword
      let cmdOffset = 0;
      if (tokens[0].toLowerCase() === "docker" && tokens.length > 1) {
        cmdOffset = 1;
      }

      const cmdToken = tokens[cmdOffset]?.toLowerCase() ?? "";
      const isKnownCommand = ALL_COMMANDS.has(cmdToken);
      const isMgmtCommand = MANAGEMENT_COMMANDS.has(cmdToken);

      for (let i = 0; i < tokens.length; i++) {
        const token = escapeHtml(tokens[i]);
        const tokenIdx = remaining.indexOf(token);
        if (tokenIdx > 0) {
          result += remaining.slice(0, tokenIdx);
        }
        remaining = remaining.slice(tokenIdx + token.length);

        if (i < cmdOffset) {
          // "docker" prefix — dim keyword
          result += `<span style="color:var(--docker-comment)">${token}</span>`;
        } else if (i === cmdOffset && isKnownCommand) {
          result += `<span style="color:var(--docker-command)">${token}</span>`;
        } else if (i === cmdOffset + 1 && isMgmtCommand) {
          const subs = DOCKER_COMMANDS[cmdToken]?.subcommands;
          const isValidSub = subs && tokens[i].toLowerCase() in subs;
          if (isValidSub) {
            result += `<span style="color:var(--docker-subcommand)">${token}</span>`;
          } else {
            result += `<span style="color:var(--docker-unknown);text-decoration:wavy underline var(--docker-unknown)">${token}</span>`;
          }
        } else if (i === cmdOffset && !isKnownCommand) {
          result += `<span style="color:var(--docker-unknown);text-decoration:wavy underline var(--docker-unknown)">${token}</span>`;
        } else if (/^--?[a-zA-Z]/.test(tokens[i])) {
          result += `<span style="color:var(--docker-flag)">${token}</span>`;
        } else if (/^["']/.test(tokens[i])) {
          result += `<span style="color:var(--docker-string)">${token}</span>`;
        } else {
          result += token;
        }
      }
      result += remaining;
      return result;
    })
    .join("\n")
    .replace(
      new RegExp(VARIABLE_REGEX.source, "g"),
      (m) => `<span style="color:var(--docker-variable)">${m}</span>`,
    );
}

/**
 * Determine what type of Docker resource to suggest based on the
 * current line's command context.
 */
function getSuggestionType(line: string): "container" | "image" | null {
  const tokens = line.trim().split(/\s+/);
  let i = 0;
  if (tokens[i]?.toLowerCase() === "docker") i++;

  const cmd = tokens[i]?.toLowerCase();
  if (!cmd) return null;

  if (CONTAINER_COMMANDS.has(cmd)) return "container";
  if (IMAGE_COMMANDS.has(cmd)) return "image";

  // Management commands: "container <sub>" or "image <sub>"
  if (cmd === "container") return "container";
  if (cmd === "image") return "image";

  return null;
}

interface CommandEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  suggestions?: DockerResource[];
}

export function CommandEditor({ value, onChange, onSubmit, suggestions }: CommandEditorProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Use state for the anchor element so it can be read during render
  // without violating the React Compiler refs-during-render rule.
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const editorRefCallback = useCallback((node: HTMLDivElement | null) => {
    setAnchorEl(node);
  }, []);

  // Track whether the user dismissed the dropdown (Escape or click-away).
  const [dismissed, setDismissed] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reset dismissed state when the user types (value changes)
  useEffect(() => {
    setDismissed(false);
    setSelectedIndex(0);
  }, [value]);

  // Derive filtered suggestions from value + suggestions (pure computation)
  const filteredSuggestions = useMemo<DockerResource[]>(() => {
    if (!suggestions || suggestions.length === 0) return [];

    const lines = value.split("\n");
    const lastLine = lines[lines.length - 1] ?? "";
    const tokens = lastLine.trim().split(/\s+/);
    const lastToken = tokens[tokens.length - 1] ?? "";

    const type = getSuggestionType(lastLine);
    if (!type || tokens.length < 2 || lastToken.length === 0) return [];

    return suggestions
      .filter((s) => s.type === type && s.name.toLowerCase().includes(lastToken.toLowerCase()))
      .slice(0, 8);
  }, [value, suggestions]);

  const showSuggestions = filteredSuggestions.length > 0 && !dismissed;

  // Accept a suggestion by replacing the last token on the current line
  const acceptSuggestion = useCallback(
    (name: string) => {
      const lines = value.split("\n");
      const lastLine = lines[lines.length - 1] ?? "";
      const tokens = lastLine.trim().split(/\s+/);

      tokens[tokens.length - 1] = name;
      lines[lines.length - 1] = tokens.join(" ");

      onChange(lines.join("\n"));
      setDismissed(true);
    },
    [value, onChange],
  );

  const cssVars = {
    "--docker-command": isDark ? "#6cb6ff" : "#0550ae",
    "--docker-subcommand": isDark ? "#7ee787" : "#116329",
    "--docker-flag": isDark ? "#d2a8ff" : "#8250df",
    "--docker-string": isDark ? "#a5d6ff" : "#0a3069",
    "--docker-comment": isDark ? "#8b949e" : "#6e7781",
    "--docker-unknown": isDark ? "#f85149" : "#cf222e",
    "--docker-variable": isDark ? "#ffa657" : "#cf6b00",
  } as React.CSSProperties;

  return (
    <Box sx={cssVars}>
      <Box
        ref={editorRefCallback}
        sx={{
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          overflow: "auto",
          maxHeight: 200,
          "&:focus-within": {
            borderColor: "primary.main",
            borderWidth: 2,
            m: "-1px",
          },
        }}
      >
        <Editor
          value={value}
          onValueChange={onChange}
          highlight={highlightDocker}
          padding={12}
          onKeyDown={(e) => {
            if (showSuggestions && filteredSuggestions.length > 0) {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) =>
                  Math.min(prev + 1, filteredSuggestions.length - 1),
                );
                return;
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
                return;
              }
              if (e.key === "Tab" || e.key === "Enter") {
                e.preventDefault();
                acceptSuggestion(filteredSuggestions[selectedIndex].name);
                return;
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setDismissed(true);
                return;
              }
            }
            if (e.ctrlKey && e.key === "Enter" && onSubmit) {
              e.preventDefault();
              onSubmit();
            }
          }}
          style={{
            fontFamily: '"Roboto Mono", "Consolas", monospace',
            fontSize: 13,
            lineHeight: 1.5,
            minHeight: 80,
            color: theme.palette.text.primary,
            background: "transparent",
          }}
          textareaClassName="command-editor-textarea"
        />
      </Box>
      {showSuggestions && anchorEl != null && (
        <ClickAwayListener onClickAway={() => setDismissed(true)}>
          <Popper
            open={showSuggestions}
            anchorEl={anchorEl}
            placement="bottom-start"
            style={{ zIndex: 1301, width: anchorEl.clientWidth }}
          >
            <Paper elevation={8} sx={{ maxHeight: 200, overflow: "auto" }}>
              <MenuList dense>
                {filteredSuggestions.map((s, i) => (
                  <MenuItem
                    key={`${s.type}-${s.name}`}
                    selected={i === selectedIndex}
                    onClick={() => acceptSuggestion(s.name)}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}
                    >
                      {s.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ ml: 1 }}
                    >
                      {s.type}
                    </Typography>
                  </MenuItem>
                ))}
              </MenuList>
            </Paper>
          </Popper>
        </ClickAwayListener>
      )}
      <FormHelperText>
        &quot;docker&quot; prefix is optional. Use {"{{name}}"} for variables.
      </FormHelperText>
    </Box>
  );
}
