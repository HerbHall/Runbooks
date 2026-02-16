import Editor from "react-simple-code-editor";
import { Box, FormHelperText, useTheme } from "@mui/material";
import { ALL_COMMANDS, MANAGEMENT_COMMANDS, DOCKER_COMMANDS } from "../docker-commands";

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

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
      const firstToken = tokens[0].toLowerCase();

      // Check if first token is a known command or management command
      const isKnownCommand = ALL_COMMANDS.has(firstToken);
      const isMgmtCommand = MANAGEMENT_COMMANDS.has(firstToken);

      for (let i = 0; i < tokens.length; i++) {
        const token = escapeHtml(tokens[i]);
        const tokenIdx = remaining.indexOf(token);
        if (tokenIdx > 0) {
          result += remaining.slice(0, tokenIdx);
        }
        remaining = remaining.slice(tokenIdx + token.length);

        if (i === 0 && isKnownCommand) {
          // First token: known command (blue)
          result += `<span style="color:var(--docker-command)">${token}</span>`;
        } else if (i === 1 && isMgmtCommand) {
          // Second token after management command: sub-command
          const subs = DOCKER_COMMANDS[firstToken]?.subcommands;
          const isValidSub = subs && tokens[1].toLowerCase() in subs;
          if (isValidSub) {
            result += `<span style="color:var(--docker-subcommand)">${token}</span>`;
          } else {
            result += `<span style="color:var(--docker-unknown);text-decoration:wavy underline var(--docker-unknown)">${token}</span>`;
          }
        } else if (i === 0 && !isKnownCommand && trimmed.length > 0) {
          // Unknown first token
          result += `<span style="color:var(--docker-unknown);text-decoration:wavy underline var(--docker-unknown)">${token}</span>`;
        } else if (/^--?[a-zA-Z]/.test(tokens[i])) {
          // Flags
          result += `<span style="color:var(--docker-flag)">${token}</span>`;
        } else if (/^["']/.test(tokens[i])) {
          // Quoted strings
          result += `<span style="color:var(--docker-string)">${token}</span>`;
        } else {
          result += token;
        }
      }
      result += remaining;
      return result;
    })
    .join("\n");
}

interface CommandEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function CommandEditor({ value, onChange }: CommandEditorProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const cssVars = {
    "--docker-command": isDark ? "#6cb6ff" : "#0550ae",
    "--docker-subcommand": isDark ? "#7ee787" : "#116329",
    "--docker-flag": isDark ? "#d2a8ff" : "#8250df",
    "--docker-string": isDark ? "#a5d6ff" : "#0a3069",
    "--docker-comment": isDark ? "#8b949e" : "#6e7781",
    "--docker-unknown": isDark ? "#f85149" : "#cf222e",
  } as React.CSSProperties;

  return (
    <Box sx={cssVars}>
      <Box
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
      <FormHelperText>
        Each line is a Docker command, e.g. &apos;container prune -f&apos;
      </FormHelperText>
    </Box>
  );
}
