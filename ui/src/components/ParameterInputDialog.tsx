import { useState, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Autocomplete,
  Chip,
  Stack,
  Box,
  Typography,
} from "@mui/material";
import type { Runbook } from "../types";
import { parseVariables, substituteVariables } from "../utils/variables";
import { useDockerResources, getResourceTypeForVariable } from "../hooks/useDockerResources";
import { useConstants } from "../context/ConstantContext";

interface ParameterInputDialogProps {
  open: boolean;
  onClose: () => void;
  onRun: (resolvedCommands: string[]) => void;
  runbook: Runbook;
}

export function ParameterInputDialog({ open, onClose, onRun, runbook }: ParameterInputDialogProps) {
  const variables = useMemo(() => parseVariables(runbook.commands), [runbook.commands]);
  const dockerResources = useDockerResources();
  const { getConstant } = useConstants();

  const initValues = useCallback(() => {
    const init: Record<string, string> = {};
    for (const v of parseVariables(runbook.commands)) {
      const constant = getConstant(v.name);
      init[v.name] = constant ? constant.value : v.defaultValue;
    }
    return init;
  }, [runbook.commands, getConstant]);

  const [values, setValues] = useState<Record<string, string>>(initValues);

  // Re-initialize values when dialog opens with different runbook
  const [lastRunbookId, setLastRunbookId] = useState(runbook.id);
  if (runbook.id !== lastRunbookId) {
    setLastRunbookId(runbook.id);
    setValues(initValues());
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
              {variables.map((v) => {
                const constant = getConstant(v.name);

                if (constant) {
                  return (
                    <Stack key={v.name} direction="row" alignItems="center" spacing={1}>
                      <TextField
                        label={v.name}
                        value={constant.isSecret ? "•••••••" : constant.value}
                        size="small"
                        fullWidth
                        disabled
                      />
                      <Chip
                        label={constant.isSecret ? "Secret" : "Global"}
                        size="small"
                        color={constant.isSecret ? "error" : "info"}
                        variant="outlined"
                      />
                    </Stack>
                  );
                }

                const resourceType = getResourceTypeForVariable(v.name);
                const suggestions = resourceType
                  ? dockerResources.filter((r) => r.type === resourceType).map((r) => r.name)
                  : [];

                if (v.options.length > 0) {
                  return (
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
                  );
                }

                if (suggestions.length > 0) {
                  return (
                    <Autocomplete
                      key={v.name}
                      freeSolo
                      options={suggestions}
                      value={values[v.name] ?? ""}
                      onInputChange={(_e, newValue) => handleChange(v.name, newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={v.name}
                          size="small"
                          placeholder={v.defaultValue || undefined}
                        />
                      )}
                    />
                  );
                }

                return (
                  <TextField
                    key={v.name}
                    label={v.name}
                    value={values[v.name] ?? ""}
                    onChange={(e) => handleChange(v.name, e.target.value)}
                    size="small"
                    fullWidth
                    placeholder={v.defaultValue || undefined}
                  />
                );
              })}
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
