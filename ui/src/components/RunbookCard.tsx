import { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Stack,
  Box,
  Collapse,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import type { Runbook } from "../types";
import { RunbookFormDialog } from "./RunbookFormDialog";
import { RunbookDeleteDialog } from "./RunbookDeleteDialog";
import { RunbookExecutionDialog } from "./RunbookExecutionDialog";

interface RunbookCardProps {
  runbook: Runbook;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function RunbookCard({ runbook, collapsed = false, onToggleCollapse }: RunbookCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [execOpen, setExecOpen] = useState(false);

  return (
    <>
      <Card variant="outlined">
        <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: collapsed ? 0 : 0.5 }}>
            {onToggleCollapse && (
              <IconButton size="small" onClick={onToggleCollapse} title={collapsed ? "Expand" : "Collapse"}>
                {collapsed ? (
                  <ExpandMoreIcon sx={{ fontSize: "1rem" }} />
                ) : (
                  <ExpandLessIcon sx={{ fontSize: "1rem" }} />
                )}
              </IconButton>
            )}
            <Typography variant="subtitle1" component="div" sx={{ flexShrink: 0, fontWeight: 600, lineHeight: 1.3 }}>
              {runbook.name}
            </Typography>
            {runbook.tags.map((tag) => (
              <Chip key={tag} label={tag} size="small" />
            ))}
            <Box sx={{ flex: 1 }} />
            <IconButton size="small" color="primary" title="Run" onClick={() => setExecOpen(true)}>
              <PlayArrowIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" title="Edit" onClick={() => setEditOpen(true)}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" title="Delete" color="error" onClick={() => setDeleteOpen(true)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>
          <Collapse in={!collapsed}>
            <>
              {runbook.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {runbook.description}
                </Typography>
              )}
              <Box
                component="pre"
                sx={{
                  bgcolor: "action.hover",
                  p: 1,
                  borderRadius: 1,
                  fontSize: "0.8rem",
                  lineHeight: 1.4,
                  maxHeight: "calc(0.8rem * 1.4 * 3 + 16px)",
                  overflowY: "auto",
                  overflowX: "auto",
                  m: 0,
                }}
              >
                {runbook.commands.join("\n")}
              </Box>
            </>
          </Collapse>
        </CardContent>
      </Card>

      <RunbookFormDialog open={editOpen} onClose={() => setEditOpen(false)} runbook={runbook} />
      <RunbookDeleteDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} runbook={runbook} />
      <RunbookExecutionDialog open={execOpen} onClose={() => setExecOpen(false)} runbook={runbook} />
    </>
  );
}
