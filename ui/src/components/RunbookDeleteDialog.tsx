import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import type { Runbook } from "../types";
import { useRunbooks } from "../context/RunbookContext";
import { useDockerDesktopClient } from "../App";

interface RunbookDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  runbook: Runbook;
}

export function RunbookDeleteDialog({ open, onClose, runbook }: RunbookDeleteDialogProps) {
  const { deleteRunbook } = useRunbooks();
  const ddClient = useDockerDesktopClient();

  const handleDelete = () => {
    deleteRunbook(runbook.id);
    ddClient.desktopUI.toast.success(`Deleted "${runbook.name}"`);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete Runbook</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete &quot;{runbook.name}&quot;? This cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button color="error" variant="contained" onClick={handleDelete}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
