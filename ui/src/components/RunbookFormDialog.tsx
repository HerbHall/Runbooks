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
} from "@mui/material";
import type { Runbook } from "../types";
import { useRunbooks } from "../context/RunbookContext";
import { CommandEditor } from "./CommandEditor";
import {
  DOCKER_COMMANDS,
  ALL_COMMANDS,
  MANAGEMENT_COMMANDS,
  findClosest,
} from "../docker-commands";

const COMMON_TAGS = ["info", "cleanup", "dev", "production", "maintenance", "monitoring", "caution"];

function validateCommands(raw: string): string[] {
  const warnings: string[] = [];
  const lines = raw.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;

    // Phase 1: Basic pattern checks
    if (/^docker\s+/i.test(line)) {
      warnings.push(`Line ${i + 1}: Remove leading "docker" — the extension adds it automatically.`);
      continue;
    }
    if (/[;&|]/.test(line)) {
      warnings.push(`Line ${i + 1}: Shell operators (;, &, |) may not work. Use separate lines instead.`);
    }
    if (/\$\{?\w/.test(line)) {
      warnings.push(`Line ${i + 1}: Variable substitution ($VAR) is not supported.`);
    }

    // Phase 2: Command tree validation
    const tokens = line.split(/\s+/);
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
        // Skip if it looks like a flag (e.g., compose --file)
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
  const isEdit = Boolean(runbook);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [commands, setCommands] = useState("");
  const [tagList, setTagList] = useState<string[]>([]);

  const commandWarnings = useMemo(() => validateCommands(commands), [commands]);

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
    } else if (open) {
      setName("");
      setDescription("");
      setCommands("");
      setTagList([]);
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
          <div>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
              Commands (one per line) *
            </Typography>
            <CommandEditor value={commands} onChange={setCommands} />
          </div>
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
