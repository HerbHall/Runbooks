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
} from "@mui/material";
import type { Runbook } from "../types";
import { useRunbooks } from "../context/RunbookContext";

const COMMON_TAGS = ["info", "cleanup", "dev", "production", "maintenance", "monitoring", "caution"];

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
          <TextField
            label="Commands (one per line)"
            value={commands}
            onChange={(e) => setCommands(e.target.value)}
            multiline
            minRows={3}
            required
            fullWidth
            inputProps={{ style: { fontFamily: "monospace" } }}
            helperText="Each line is a Docker command, e.g. 'container prune -f'"
          />
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
