import { useState, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Box,
  Typography,
} from "@mui/material";
import type { Runbook } from "../types";
import { parseVariables, substituteVariables } from "../utils/variables";

interface ParameterInputDialogProps {
  open: boolean;
  onClose: () => void;
  onRun: (resolvedCommands: string[]) => void;
  runbook: Runbook;
}

export function ParameterInputDialog({ open, onClose, onRun, runbook }: ParameterInputDialogProps) {
  const variables = useMemo(() => parseVariables(runbook.commands), [runbook.commands]);

  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const v of parseVariables(runbook.commands)) {
      init[v.name] = v.defaultValue;
    }
    return init;
  });

  // Re-initialize values when dialog opens with different runbook
  const [lastRunbookId, setLastRunbookId] = useState(runbook.id);
  if (runbook.id !== lastRunbookId) {
    setLastRunbookId(runbook.id);
    const init: Record<string, string> = {};
    for (const v of variables) {
      init[v.name] = v.defaultValue;
    }
    setValues(init);
  }

  const preview = useMemo(
    () => substituteVariables(runbook.commands, values),
    [runbook.commands, values],
  );

  const handleChange = useCallback((name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleRun = () => {
    onRun(preview);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(preview.join("\n"));
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Parameters: {runbook.name}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", gap: 2, mt: 1, minHeight: 200 }}>
          {/* Left panel: live preview */}
          <Box sx={{ flex: 3, minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
              Preview
            </Typography>
            <Box
              component="pre"
              sx={{
                bgcolor: "action.hover",
                p: 1.5,
                borderRadius: 1,
                fontSize: "0.85rem",
                lineHeight: 1.6,
                overflow: "auto",
                maxHeight: 300,
                m: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {preview.map((cmd, i) => (
                <div key={i}>
                  <Typography
                    component="span"
                    sx={{ color: "text.secondary", fontSize: "0.85rem", fontFamily: "inherit" }}
                  >
                    ${" "}
                  </Typography>
                  {cmd}
                </div>
              ))}
            </Box>
          </Box>

          {/* Right panel: input form */}
          <Box sx={{ flex: 2, minWidth: 200 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
              Variables
            </Typography>
            <Stack spacing={2}>
              {variables.map((v) =>
                v.options.length > 0 ? (
                  <TextField
                    key={v.name}
                    select
                    label={v.name}
                    value={values[v.name] ?? ""}
                    onChange={(e) => handleChange(v.name, e.target.value)}
                    size="small"
                    fullWidth
                  >
                    {v.options.map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
                  </TextField>
                ) : (
                  <TextField
                    key={v.name}
                    label={v.name}
                    value={values[v.name] ?? ""}
                    onChange={(e) => handleChange(v.name, e.target.value)}
                    size="small"
                    fullWidth
                    placeholder={v.defaultValue || undefined}
                  />
                ),
              )}
            </Stack>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCopy} size="small">
          Copy
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleRun}>
          Run
        </Button>
      </DialogActions>
    </Dialog>
  );
}
