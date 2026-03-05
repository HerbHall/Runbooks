import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Stack,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useConstants } from "../context/ConstantContext";

interface GlobalVariablesDialogProps {
  open: boolean;
  onClose: () => void;
}

const VARIABLE_NAME_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export function GlobalVariablesDialog({ open, onClose }: GlobalVariablesDialogProps) {
  const { constants, addConstant, updateConstant, deleteConstant } = useConstants();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [isSecret, setIsSecret] = useState(false);
  const [nameError, setNameError] = useState("");
  const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setName("");
    setValue("");
    setIsSecret(false);
    setNameError("");
  };

  const validateName = (n: string): string => {
    if (!n.trim()) return "Name is required";
    if (!VARIABLE_NAME_REGEX.test(n)) return "Must start with a letter or underscore, then letters/digits/underscores";
    const existing = constants.find((c) => c.name === n && c.id !== editId);
    if (existing) return "A variable with this name already exists";
    return "";
  };

  const handleSave = () => {
    const error = validateName(name);
    if (error) {
      setNameError(error);
      return;
    }

    if (editId) {
      updateConstant(editId, { name, value, isSecret });
    } else {
      addConstant({ name, value, isSecret });
    }
    resetForm();
  };

  const handleEdit = (id: string) => {
    const c = constants.find((v) => v.id === id);
    if (!c) return;
    setEditId(id);
    setName(c.name);
    setValue(c.value);
    setIsSecret(c.isSecret);
    setNameError("");
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    deleteConstant(id);
    setDeleteConfirm(null);
  };

  const toggleReveal = (id: string) => {
    setRevealedSecrets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleClose = () => {
    resetForm();
    setRevealedSecrets(new Set());
    setDeleteConfirm(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>Global Variables</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Define variables that auto-fill across all runbooks. Use <code>{"{{name}}"}</code> in
          commands to reference them. Secret values are masked in the UI and excluded from exports.
        </Typography>

        {constants.length === 0 && !showForm ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              No global variables defined yet.
            </Typography>
            <Button startIcon={<AddIcon />} variant="outlined" onClick={() => setShowForm(true)}>
              Add Variable
            </Button>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell align="center" sx={{ width: 80 }}>Type</TableCell>
                    <TableCell align="right" sx={{ width: 100 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {constants.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 600 }}>
                          {c.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {c.isSecret ? (
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                              {revealedSecrets.has(c.id) ? c.value : "•••••••"}
                            </Typography>
                            <IconButton size="small" onClick={() => toggleReveal(c.id)} aria-label={revealedSecrets.has(c.id) ? "Hide secret" : "Reveal secret"}>
                              {revealedSecrets.has(c.id) ? (
                                <VisibilityOffIcon sx={{ fontSize: "1rem" }} />
                              ) : (
                                <VisibilityIcon sx={{ fontSize: "1rem" }} />
                              )}
                            </IconButton>
                          </Stack>
                        ) : (
                          <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                            {c.value}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {c.isSecret ? (
                          <Chip label="Secret" size="small" color="error" variant="outlined" />
                        ) : (
                          <Chip label="Plain" size="small" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {deleteConfirm === c.id ? (
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Button size="small" color="error" onClick={() => handleDelete(c.id)}>
                              Delete
                            </Button>
                            <Button size="small" onClick={() => setDeleteConfirm(null)}>
                              Cancel
                            </Button>
                          </Stack>
                        ) : (
                          <>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => handleEdit(c.id)} aria-label="Edit">
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" onClick={() => setDeleteConfirm(c.id)} aria-label="Delete">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {!showForm && (
              <Button
                startIcon={<AddIcon />}
                size="small"
                onClick={() => setShowForm(true)}
                sx={{ mt: 1 }}
              >
                Add Variable
              </Button>
            )}
          </>
        )}

        {showForm && (
          <Stack spacing={2} sx={{ mt: 2, p: 2, border: 1, borderColor: "divider", borderRadius: 1 }}>
            <Typography variant="subtitle2">
              {editId ? "Edit Variable" : "New Variable"}
            </Typography>
            <TextField
              label="Name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError("");
              }}
              error={!!nameError}
              helperText={nameError || "Letters, digits, and underscores (e.g., registry_url)"}
              size="small"
              fullWidth
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") resetForm();
              }}
            />
            <TextField
              label="Value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              type={isSecret ? "password" : "text"}
              size="small"
              fullWidth
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") resetForm();
              }}
            />
            <FormControlLabel
              control={
                <Switch checked={isSecret} onChange={(e) => setIsSecret(e.target.checked)} size="small" />
              }
              label={
                <Typography variant="body2">
                  Secret — value will be masked in the UI and excluded from exports
                </Typography>
              }
            />
            <Stack direction="row" spacing={1}>
              <Button variant="contained" size="small" onClick={handleSave}>
                {editId ? "Update" : "Add"}
              </Button>
              <Button size="small" onClick={resetForm}>
                Cancel
              </Button>
            </Stack>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
