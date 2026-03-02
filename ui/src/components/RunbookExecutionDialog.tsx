import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Switch,
  FormControlLabel,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import type { ExecProcess } from "@docker/extension-api-client-types/dist/v1/exec";
import type { Runbook, CommandResult, ExecutionStatus } from "../types";
import { useDockerDesktopClient } from "../App";
import { getDestructiveWarnings, type DestructiveWarning } from "../utils/destructive-commands";
import { recordExecution } from "../utils/execution-history";
import { hasVariables } from "../utils/variables";
import { ParameterInputDialog } from "./ParameterInputDialog";

interface RunbookExecutionDialogProps {
  open: boolean;
  onClose: () => void;
  runbook: Runbook;
}

function parseCommand(raw: string): string[] {
  const tokens = raw.split(/\s+/).filter(Boolean);
  if (tokens[0]?.toLowerCase() === "docker") {
    tokens.shift();
  }
  return tokens;
}

export function RunbookExecutionDialog({ open, onClose, runbook }: RunbookExecutionDialogProps) {
  const ddClient = useDockerDesktopClient();
  const [status, setStatus] = useState<ExecutionStatus>("idle");
  const [results, setResults] = useState<CommandResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [warnings, setWarnings] = useState<DestructiveWarning[]>([]);
  const [needsParameters, setNeedsParameters] = useState(false);
  const [resolvedCommands, setResolvedCommands] = useState<string[] | null>(null);
  const [streamOutput, setStreamOutput] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);
  const abortRef = useRef(false);
  const processRef = useRef<ExecProcess | null>(null);
  const outputContainerRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    setElapsedSeconds(0);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current != null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    if (autoScroll && outputContainerRef.current != null) {
      outputContainerRef.current.scrollTop = outputContainerRef.current.scrollHeight;
    }
  }, [autoScroll]);

  const execStreaming = useCallback(
    (cmd: string, args: string[], rawCommand: string): Promise<CommandResult> => {
      return new Promise((resolve) => {
        let stdout = "";
        let stderr = "";
        const startTime = Date.now();

        const process = ddClient.docker.cli.exec(cmd, args, {
          stream: {
            onOutput: (data) => {
              if (data.stdout) {
                stdout += data.stdout;
                setStreamOutput((prev) => prev + data.stdout);
              }
              if (data.stderr) {
                stderr += data.stderr;
                setStreamOutput((prev) => prev + data.stderr);
              }
            },
            onClose: (exitCode) => {
              processRef.current = null;
              resolve({
                command: rawCommand,
                stdout,
                stderr,
                exitCode,
                duration: Date.now() - startTime,
              });
            },
            onError: (error) => {
              processRef.current = null;
              resolve({
                command: rawCommand,
                stdout,
                stderr: stderr || String(error),
                exitCode: 1,
                duration: Date.now() - startTime,
              });
            },
            splitOutputLines: true,
          },
        });

        processRef.current = process;
      });
    },
    [ddClient],
  );

  const execute = useCallback(
    async (cmds?: string[]) => {
      const commands = cmds ?? resolvedCommands ?? runbook.commands;
      abortRef.current = false;
      processRef.current = null;
      setStatus("running");
      setResults([]);
      setCurrentIndex(0);
      setStreamOutput("");
      startTimer();

      const collected: CommandResult[] = [];

      for (let i = 0; i < commands.length; i++) {
        if (abortRef.current) break;
        setCurrentIndex(i);
        setStreamOutput("");

        const raw = commands[i].trim();
        const tokens = parseCommand(raw);

        const result = await execStreaming(tokens[0], tokens.slice(1), raw);

        collected.push(result);
        setResults([...collected]);

        if (result.exitCode !== 0) {
          stopTimer();
          setCurrentIndex(i);
          setStatus("failed");
          const totalDuration = collected.reduce((sum, r) => sum + r.duration, 0);
          const allOutput = collected.map((r) => r.stdout).join("\n");
          recordExecution(runbook.id, result.exitCode, totalDuration, commands.length, allOutput);
          ddClient.desktopUI.toast.error(`Runbook failed: ${runbook.name}`);
          return;
        }
      }

      stopTimer();

      if (abortRef.current) {
        setStatus("idle");
      } else {
        setStatus("completed");
        const totalDuration = collected.reduce((sum, r) => sum + r.duration, 0);
        const allOutput = collected.map((r) => r.stdout).join("\n");
        recordExecution(runbook.id, 0, totalDuration, commands.length, allOutput);
        ddClient.desktopUI.toast.success(`Runbook completed: ${runbook.name}`);
      }
      setCurrentIndex(-1);
      setStreamOutput("");
    },
    [ddClient, runbook, resolvedCommands, execStreaming, startTimer, stopTimer],
  );

  // Auto-scroll when streamOutput changes
  useEffect(() => {
    scrollToBottom();
  }, [streamOutput, scrollToBottom]);

  useEffect(() => {
    if (open) {
      if (hasVariables(runbook.commands)) {
        setNeedsParameters(true);
      } else {
        const detected = getDestructiveWarnings(runbook.commands);
        if (detected.length > 0) {
          setWarnings(detected);
          setNeedsConfirmation(true);
        } else {
          execute();
        }
      }
    }
    return () => {
      abortRef.current = true;
      processRef.current?.close();
      stopTimer();
    };
    // Run once when dialog opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = () => {
    abortRef.current = true;
    processRef.current?.close();
    processRef.current = null;
    stopTimer();
    setStatus("idle");
    setResults([]);
    setCurrentIndex(-1);
    setNeedsConfirmation(false);
    setNeedsParameters(false);
    setResolvedCommands(null);
    setWarnings([]);
    setStreamOutput("");
    setElapsedSeconds(0);
    onClose();
  };

  const handleAbort = useCallback(() => {
    abortRef.current = true;
    processRef.current?.close();
    processRef.current = null;
  }, []);

  useEffect(() => {
    if (status !== "running") return;
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "c") {
        e.preventDefault();
        handleAbort();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [status, handleAbort]);

  const handleConfirm = () => {
    setNeedsConfirmation(false);
    execute();
  };

  const handleParameterSubmit = (resolved: string[]) => {
    setNeedsParameters(false);
    setResolvedCommands(resolved);
    const detected = getDestructiveWarnings(resolved);
    if (detected.length > 0) {
      setWarnings(detected);
      setNeedsConfirmation(true);
    } else {
      execute(resolved);
    }
  };

  if (needsParameters) {
    return (
      <ParameterInputDialog
        open={open}
        onClose={handleClose}
        onRun={handleParameterSubmit}
        runbook={runbook}
      />
    );
  }

  if (needsConfirmation) {
    return (
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <WarningAmberIcon color="warning" />
          Destructive Commands Detected
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            The following commands in <strong>{runbook.name}</strong> may delete data or remove
            Docker resources:
          </Typography>
          <List dense disablePadding>
            {warnings.map((w, i) => (
              <ListItem key={i} disableGutters sx={{ alignItems: "flex-start" }}>
                <ListItemText
                  primary={
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{ fontFamily: "monospace", fontWeight: 600 }}
                    >
                      $ {w.command}
                    </Typography>
                  }
                  secondary={w.description}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleConfirm} color="error" variant="contained">
            Execute Anyway
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  const commands = resolvedCommands ?? runbook.commands;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        Running: {runbook.name}
        {status === "running" && <CircularProgress size={20} />}
        {status === "running" && (
          <Typography variant="body2" color="text.secondary" sx={{ ml: "auto" }}>
            Elapsed: {elapsedSeconds}s
          </Typography>
        )}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {commands.map((cmd, i) => {
            const isCurrentCommand = i === currentIndex && status === "running";

            return (
              <Box key={i}>
                <Typography variant="subtitle2" sx={{ fontFamily: "monospace" }}>
                  $ {cmd}
                  {isCurrentCommand && " (running...)"}
                </Typography>

                {/* Live streaming output for the currently running command */}
                {isCurrentCommand && streamOutput !== "" && (
                  <Box
                    ref={outputContainerRef}
                    sx={{
                      bgcolor: "action.hover",
                      color: "text.primary",
                      p: 1.5,
                      borderRadius: 1,
                      fontSize: "0.8rem",
                      fontFamily: "monospace",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                      overflow: "auto",
                      maxHeight: 300,
                      m: 0,
                      mt: 0.5,
                    }}
                  >
                    {streamOutput}
                  </Box>
                )}

                {/* Final result for completed commands */}
                {results[i] != null && (
                  <Box
                    component="pre"
                    sx={{
                      bgcolor: results[i].exitCode === 0 ? "action.hover" : "error.main",
                      color: results[i].exitCode === 0 ? "text.primary" : "error.contrastText",
                      p: 1.5,
                      borderRadius: 1,
                      fontSize: "0.8rem",
                      overflow: "auto",
                      maxHeight: 200,
                      m: 0,
                      mt: 0.5,
                    }}
                  >
                    {results[i].stdout || results[i].stderr || "(no output)"}
                  </Box>
                )}
              </Box>
            );
          })}
        </Stack>
      </DialogContent>
      <DialogActions>
        {status === "completed" && (
          <Typography variant="body2" color="success.main" sx={{ mr: "auto", ml: 2 }}>
            All commands completed successfully
          </Typography>
        )}
        {status === "failed" && (
          <Typography variant="body2" color="error" sx={{ mr: "auto", ml: 2 }}>
            Execution stopped due to error
          </Typography>
        )}
        {status === "running" && (
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
              />
            }
            label={<Typography variant="body2">Auto-scroll</Typography>}
            sx={{ mr: "auto", ml: 1 }}
          />
        )}
        {status === "running" ? (
          <Button onClick={handleAbort} color="error">
            Abort
          </Button>
        ) : (
          <Button onClick={handleClose}>Close</Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
