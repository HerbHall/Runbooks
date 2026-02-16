import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
} from "@mui/material";
import type { Runbook } from "../types";
import { useRunbooks } from "../context/RunbookContext";

interface RunbookFormDialogProps {
  open: boolean;
  onClose: () => void;
  runbook?: Runbook;
}

export function RunbookFormDialog({ open, onClose, runbook }: RunbookFormDialogProps) {
  const { addRunbook, updateRunbook } = useRunbooks();
  const isEdit = Boolean(runbook);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [commands, setCommands] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (open && runbook) {
      setName(runbook.name);
      setDescription(runbook.description);
      setCommands(runbook.commands.join("\n"));
      setTags(runbook.tags.join(", "));
    } else if (open) {
      setName("");
      setDescription("");
      setCommands("");
      setTags("");
    }
  }, [open, runbook]);

  const handleSave = () => {
    const commandList = commands
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean);
    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (!name.trim() || commandList.length === 0) return;

    if (isEdit && runbook) {
      updateRunbook(runbook.id, {
        name: name.trim(),
        description: description.trim(),
        commands: commandList,
        tags: tagList,
      });
    } else {
      addRunbook({
        name: name.trim(),
        description: description.trim(),
        commands: commandList,
        tags: tagList,
      });
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
          <TextField
            label="Tags (comma-separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            fullWidth
            placeholder="cleanup, dev, production"
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
