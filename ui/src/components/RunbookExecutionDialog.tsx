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
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import type { Runbook, CommandResult, ExecutionStatus } from "../types";
import { useDockerDesktopClient } from "../App";
import { getDestructiveWarnings, type DestructiveWarning } from "../utils/destructive-commands";

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
  const abortRef = useRef(false);

  const execute = useCallback(async () => {
    abortRef.current = false;
    setStatus("running");
    setResults([]);
    setCurrentIndex(0);

    const collected: CommandResult[] = [];

    for (let i = 0; i < runbook.commands.length; i++) {
      if (abortRef.current) break;
      setCurrentIndex(i);

      const raw = runbook.commands[i].trim();
      const tokens = parseCommand(raw);
      const start = performance.now();

      try {
        const result = await ddClient.docker.cli.exec(tokens[0], tokens.slice(1));
        const duration = Math.round(performance.now() - start);
        collected.push({
          command: raw,
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: 0,
          duration,
        });
      } catch (err: unknown) {
        const duration = Math.round(performance.now() - start);
        const message = err instanceof Error ? err.message : String(err);
        collected.push({
          command: raw,
          stdout: "",
          stderr: message,
          exitCode: 1,
          duration,
        });
        setResults([...collected]);
        setCurrentIndex(i);
        setStatus("failed");
        ddClient.desktopUI.toast.error(`Runbook failed: ${runbook.name}`);
        return;
      }

      setResults([...collected]);
    }

    if (abortRef.current) {
      setStatus("idle");
    } else {
      setStatus("completed");
      ddClient.desktopUI.toast.success(`Runbook completed: ${runbook.name}`);
    }
    setCurrentIndex(-1);
  }, [ddClient, runbook]);

  useEffect(() => {
    if (open) {
      const detected = getDestructiveWarnings(runbook.commands);
      if (detected.length > 0) {
        setWarnings(detected);
        setNeedsConfirmation(true);
      } else {
        execute();
      }
    }
    return () => {
      abortRef.current = true;
    };
    // Run once when dialog opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = () => {
    abortRef.current = true;
    setStatus("idle");
    setResults([]);
    setCurrentIndex(-1);
    setNeedsConfirmation(false);
    setWarnings([]);
    onClose();
  };

  const handleConfirm = () => {
    setNeedsConfirmation(false);
    execute();
  };

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

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        Running: {runbook.name}
        {status === "running" && <CircularProgress size={20} />}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {runbook.commands.map((cmd, i) => (
            <Box key={i}>
              <Typography variant="subtitle2" sx={{ fontFamily: "monospace" }}>
                $ {cmd}
                {i === currentIndex && status === "running" && " (running...)"}
              </Typography>
              {results[i] && (
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
          ))}
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
        {status === "running" ? (
          <Button onClick={() => { abortRef.current = true; }} color="error">
            Abort
          </Button>
        ) : (
          <Button onClick={handleClose}>Close</Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
