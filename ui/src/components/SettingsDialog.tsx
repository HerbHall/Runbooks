import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Stack,
} from "@mui/material";
import { useRunbooks } from "../context/RunbookContext";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const { showExamples, setShowExamples, resetExamplesToDefaults } = useRunbooks();
  const [confirmReset, setConfirmReset] = useState(false);

  const handleResetClick = () => {
    if (confirmReset) {
      resetExamplesToDefaults();
      setConfirmReset(false);
    } else {
      setConfirmReset(true);
    }
  };

  const handleClose = () => {
    setConfirmReset(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Settings</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={showExamples}
                onChange={(e) => setShowExamples(e.target.checked)}
              />
            }
            label="Show example runbooks"
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: -1 }}>
            Example runbooks demonstrate features like variables, option
            dropdowns, container autocomplete, and multi-command execution.
            Hiding them removes them from the list without deleting them.
          </Typography>

          <Divider />

          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              Replace all example runbooks with the latest defaults. Your custom
              runbooks are not affected.
            </Typography>
            <Button
              variant={confirmReset ? "contained" : "outlined"}
              color={confirmReset ? "error" : "primary"}
              size="small"
              onClick={handleResetClick}
              sx={{ alignSelf: "flex-start" }}
            >
              {confirmReset ? "Confirm Reset" : "Reset Examples to Defaults"}
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
