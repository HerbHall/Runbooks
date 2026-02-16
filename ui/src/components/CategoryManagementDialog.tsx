import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import AddIcon from "@mui/icons-material/Add";
import { useCategories } from "../context/CategoryContext";
import { PRESET_COLORS, PRESET_ICONS, ICON_LABELS } from "../category-defaults";
import type { Category } from "../types";

interface CategoryManagementDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CategoryManagementDialog({ open, onClose }: CategoryManagementDialogProps) {
  const { categories, addCategory, updateCategory, deleteCategory, reorderCategories } = useCategories();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState(PRESET_COLORS[0]);
  const [formIcon, setFormIcon] = useState(PRESET_ICONS[0]);

  const sorted = [...categories].sort((a, b) => a.order - b.order);

  const resetForm = () => {
    setFormName("");
    setFormColor(PRESET_COLORS[0]);
    setFormIcon(PRESET_ICONS[0]);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (cat: Category) => {
    setFormName(cat.name);
    setFormColor(cat.color);
    setFormIcon(cat.icon);
    setEditingId(cat.id);
    setShowForm(true);
  };

  const startAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formName.trim()) return;

    if (editingId) {
      updateCategory(editingId, { name: formName.trim(), color: formColor, icon: formIcon });
    } else {
      addCategory({ name: formName.trim(), color: formColor, icon: formIcon, parentId: null });
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteCategory(id);
    if (editingId === id) resetForm();
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const ids = sorted.map((c) => c.id);
    [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
    reorderCategories(ids);
  };

  const moveDown = (index: number) => {
    if (index >= sorted.length - 1) return;
    const ids = sorted.map((c) => c.id);
    [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
    reorderCategories(ids);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Manage Categories</DialogTitle>
      <DialogContent>
        <List dense>
          {sorted.map((cat, i) => (
            <ListItem
              key={cat.id}
              secondaryAction={
                <Stack direction="row" spacing={0.5}>
                  <IconButton size="small" onClick={() => moveUp(i)} disabled={i === 0}>
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => moveDown(i)} disabled={i === sorted.length - 1}>
                    <ArrowDownwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => startEdit(cat)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(cat.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              }
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  bgcolor: cat.color,
                  mr: 1,
                  flexShrink: 0,
                }}
              />
              <ListItemText
                primary={
                  <span>
                    {ICON_LABELS[cat.icon] ?? ""} {cat.name}
                  </span>
                }
              />
            </ListItem>
          ))}
        </List>

        {sorted.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
            No categories yet. Add one below.
          </Typography>
        )}

        <Divider sx={{ my: 1 }} />

        {showForm ? (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="subtitle2">
              {editingId ? "Edit Category" : "New Category"}
            </Typography>
            <TextField
              label="Name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              size="small"
              fullWidth
              autoFocus
            />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Color
              </Typography>
              <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: "wrap" }}>
                {PRESET_COLORS.map((color) => (
                  <Box
                    key={color}
                    onClick={() => setFormColor(color)}
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      bgcolor: color,
                      cursor: "pointer",
                      border: formColor === color ? "3px solid" : "2px solid transparent",
                      borderColor: formColor === color ? "text.primary" : "transparent",
                    }}
                  />
                ))}
              </Stack>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Icon
              </Typography>
              <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: "wrap" }}>
                {PRESET_ICONS.map((icon) => (
                  <Box
                    key={icon}
                    onClick={() => setFormIcon(icon)}
                    sx={{
                      width: 32,
                      height: 32,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 1,
                      cursor: "pointer",
                      fontSize: "1.2rem",
                      border: formIcon === icon ? "2px solid" : "1px solid",
                      borderColor: formIcon === icon ? "primary.main" : "divider",
                      bgcolor: formIcon === icon ? "action.selected" : "transparent",
                    }}
                  >
                    {ICON_LABELS[icon]}
                  </Box>
                ))}
              </Stack>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button size="small" onClick={resetForm}>
                Cancel
              </Button>
              <Button size="small" variant="contained" onClick={handleSave} disabled={!formName.trim()}>
                {editingId ? "Update" : "Add"}
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Button size="small" startIcon={<AddIcon />} onClick={startAdd} sx={{ mt: 1 }}>
            Add Category
          </Button>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Done</Button>
      </DialogActions>
    </Dialog>
  );
}
