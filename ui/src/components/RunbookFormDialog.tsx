import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Autocomplete,
  Chip,
  Alert,
  Typography,
  Select,
  MenuItem,
  Box,
  FormControl,
  InputLabel,
} from "@mui/material";
import type { Runbook } from "../types";
import { useRunbooks } from "../context/RunbookContext";
import { useCategories } from "../context/CategoryContext";
import { ICON_LABELS } from "../category-defaults";
import { CommandEditor } from "./CommandEditor";
import {
  DOCKER_COMMANDS,
  ALL_COMMANDS,
  MANAGEMENT_COMMANDS,
  findClosest,
} from "../docker-commands";
import { parseVariables } from "../utils/variables";

const COMMON_TAGS = ["info", "cleanup", "dev", "production", "maintenance", "monitoring", "caution"];

function validateCommands(raw: string): string[] {
  const warnings: string[] = [];
  const lines = raw.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;

    // Phase 1: Basic pattern checks
    if (/[;&|]/.test(line)) {
      warnings.push(`Line ${i + 1}: Shell operators (;, &, |) may not work. Use separate lines instead.`);
    }
    if (/\$\{?\w/.test(line)) {
      warnings.push(`Line ${i + 1}: Variable substitution ($VAR) is not supported.`);
    }

    // Strip optional "docker" prefix for command tree validation
    const stripped = line.replace(/^docker\s+/i, "");
    const tokens = stripped.split(/\s+/);
    const cmd = tokens[0].toLowerCase();

    if (!ALL_COMMANDS.has(cmd)) {
      const suggestion = findClosest(cmd, ALL_COMMANDS);
      if (suggestion) {
        warnings.push(`Line ${i + 1}: Unknown command "${tokens[0]}". Did you mean "${suggestion}"?`);
      } else {
        warnings.push(`Line ${i + 1}: Unknown command "${tokens[0]}".`);
      }
      continue;
    }

    // Check sub-commands for management commands
    if (MANAGEMENT_COMMANDS.has(cmd)) {
      const subs = DOCKER_COMMANDS[cmd].subcommands;
      if (subs && tokens.length > 1) {
        const sub = tokens[1].toLowerCase();
        if (!sub.startsWith("-") && !(sub in subs)) {
          const subSuggestion = findClosest(sub, Object.keys(subs));
          if (subSuggestion) {
            warnings.push(
              `Line ${i + 1}: Unknown sub-command "${tokens[1]}" for "${cmd}". Did you mean "${subSuggestion}"?`,
            );
          }
        }
      }
    }
  }
  return warnings;
}

interface RunbookFormDialogProps {
  open: boolean;
  onClose: () => void;
  runbook?: Runbook;
}

export function RunbookFormDialog({ open, onClose, runbook }: RunbookFormDialogProps) {
  const { runbooks, addRunbook, updateRunbook } = useRunbooks();
  const { categories } = useCategories();
  const isEdit = Boolean(runbook);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [commands, setCommands] = useState("");
  const [tagList, setTagList] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState("");

  const commandWarnings = useMemo(() => validateCommands(commands), [commands]);
  const variableCount = useMemo(
    () => parseVariables(commands.split("\n").map((c) => c.trim()).filter(Boolean)).length,
    [commands],
  );

  const allTags = useMemo(() => {
    const tagSet = new Set(COMMON_TAGS);
    for (const r of runbooks) {
      for (const t of r.tags) {
        tagSet.add(t);
      }
    }
    return [...tagSet].sort();
  }, [runbooks]);

  useEffect(() => {
    if (open && runbook) {
      setName(runbook.name);
      setDescription(runbook.description);
      setCommands(runbook.commands.join("\n"));
      setTagList([...runbook.tags]);
      setCategoryId(runbook.categoryId ?? "");
    } else if (open) {
      setName("");
      setDescription("");
      setCommands("");
      setTagList([]);
      setCategoryId("");
    }
  }, [open, runbook]);

  const handleSave = () => {
    const commandList = commands
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean);

    if (!name.trim() || commandList.length === 0) return;

    const data = {
      name: name.trim(),
      description: description.trim(),
      commands: commandList,
      tags: tagList,
      categoryId: categoryId || undefined,
    };

    if (isEdit && runbook) {
      updateRunbook(runbook.id, data);
    } else {
      addRunbook(data);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? "Edit Runbook" : "New Runbook"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
            autoFocus
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
          />
          {categories.length > 0 && (
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                label="Category"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {[...categories].sort((a, b) => a.order - b.order).map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: cat.color }} />
                      {ICON_LABELS[cat.icon] ?? ""} {cat.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <div>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
              Commands (one per line) *
            </Typography>
            <CommandEditor value={commands} onChange={setCommands} />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
              Paste commands directly from terminals or docs. The &quot;docker&quot; prefix is optional.
            </Typography>
          </div>
          {variableCount > 0 && (
            <Alert severity="info" sx={{ py: 0, "& .MuiAlert-message": { fontSize: "0.8rem" } }}>
              {variableCount} variable{variableCount > 1 ? "s" : ""} detected — values will be
              prompted before execution.
            </Alert>
          )}
          {commandWarnings.length > 0 && (
            <Alert severity="warning" sx={{ py: 0, "& .MuiAlert-message": { fontSize: "0.8rem" } }}>
              {commandWarnings.map((w) => (
                <div key={w}>{w}</div>
              ))}
            </Alert>
          )}
          <Autocomplete
            multiple
            freeSolo
            options={allTags}
            value={tagList}
            onChange={(_e, newValue) => setTagList(newValue)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...rest } = getTagProps({ index });
                return <Chip key={key} label={option} size="small" {...rest} />;
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tags"
                placeholder={tagList.length === 0 ? "Type to search or add tags..." : ""}
                helperText="First tag = group, second tag = sub-group when grouping is enabled"
              />
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!name.trim() || !commands.trim()}
        >
          {isEdit ? "Save" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
