import { useMemo, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, List, ListItem, ListItemText, ListItemSecondaryAction,
  IconButton, Tooltip, Typography, Stack, Divider,
} from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { useRunbooks } from "../context/RunbookContext";

interface TrashDialogProps {
  open: boolean;
  onClose: () => void;
}

function formatDeletedDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function TrashDialog({ open, onClose }: TrashDialogProps) {
  const { trashedRunbooks, restoreRunbook, permanentDeleteRunbook, emptyTrash } = useRunbooks();
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  const sorted = useMemo(
    () => [...trashedRunbooks].sort((a, b) =>
      (b.deletedAt ?? "").localeCompare(a.deletedAt ?? ""),
    ),
    [trashedRunbooks],
  );

  const handleEmptyTrashClick = () => {
    if (confirmEmpty) {
      emptyTrash();
      setConfirmEmpty(false);
    } else {
      setConfirmEmpty(true);
    }
  };

  const handleClose = () => {
    setConfirmEmpty(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Trash</Typography>
          {sorted.length > 0 && (
            <Button
              size="small"
              color="error"
              variant={confirmEmpty ? "contained" : "text"}
              startIcon={<DeleteForeverIcon />}
              onClick={handleEmptyTrashClick}
            >
              {confirmEmpty
                ? `Permanently delete ${sorted.length} runbook${sorted.length === 1 ? "" : "s"}`
                : "Empty Trash"}
            </Button>
          )}
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {sorted.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
            Trash is empty.
          </Typography>
        ) : (
          <List disablePadding>
            {sorted.map((runbook, idx) => (
              <div key={runbook.id}>
                {idx > 0 && <Divider />}
                <ListItem>
                  <ListItemText
                    primary={runbook.name}
                    secondary={`Deleted ${formatDeletedDate(runbook.deletedAt!)}`}
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Restore">
                      <IconButton edge="end" onClick={() => restoreRunbook(runbook.id)} aria-label="Restore" sx={{ mr: 0.5 }}>
                        <RestoreIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete permanently">
                      <IconButton edge="end" onClick={() => permanentDeleteRunbook(runbook.id)} aria-label="Delete permanently">
                        <DeleteForeverIcon color="error" />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              </div>
            ))}
          </List>
        )}
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
          Items in trash are automatically removed after 30 days.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
