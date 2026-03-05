import { useState, memo } from "react";
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
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import type { Runbook, Category } from "../types";
import { useRunbooks } from "../context/RunbookContext";
import { getLastRun, formatTimeAgo } from "../utils/execution-history";
import { VARIABLE_REGEX, escapeHtml } from "../utils/variables";
import { RunbookFormDialog } from "./RunbookFormDialog";
import { RunbookDeleteDialog } from "./RunbookDeleteDialog";
import { RunbookExecutionDialog } from "./RunbookExecutionDialog";
import { CategoryBadge } from "./CategoryBadge";

interface RunbookCardProps {
  runbook: Runbook;
  category?: Category;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  compact?: boolean;
}

export const RunbookCard = memo(function RunbookCard({ runbook, category, collapsed = false, onToggleCollapse, compact = false }: RunbookCardProps) {
  const { togglePin } = useRunbooks();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [execOpen, setExecOpen] = useState(false);
  const lastRun = getLastRun(runbook.id);

  return (
    <>
      <Card variant="outlined" sx={{ overflow: "hidden" }}>
        <CardContent sx={{ p: compact ? 0.75 : 1, "&:last-child": { pb: compact ? 0.75 : 1 }, minWidth: 0 }}>
          {/* Row 1: collapse + title + action buttons */}
          <Stack direction="row" alignItems="center" spacing={0.5}>
            {onToggleCollapse && (
              <IconButton size="small" onClick={onToggleCollapse} title={collapsed ? "Expand" : "Collapse"} aria-label={collapsed ? "Expand" : "Collapse"}>
                {collapsed ? (
                  <ExpandMoreIcon sx={{ fontSize: "1rem" }} />
                ) : (
                  <ExpandLessIcon sx={{ fontSize: "1rem" }} />
                )}
              </IconButton>
            )}
            <Typography
              variant={compact ? "body1" : "subtitle1"}
              component="div"
              sx={{
                fontWeight: 600,
                lineHeight: 1.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                minWidth: 0,
                flex: 1,
              }}
            >
              {runbook.name}
            </Typography>
            <Stack direction="row" spacing={0} sx={{ flexShrink: 0 }}>
              <IconButton
                size="small"
                title={runbook.pinned ? "Unpin" : "Pin"}
                aria-label={runbook.pinned ? "Unpin" : "Pin"}
                onClick={() => togglePin(runbook.id)}
                color={runbook.pinned ? "warning" : "default"}
              >
                {runbook.pinned ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
              </IconButton>
              <IconButton size="small" color="primary" title="Run" aria-label="Run" onClick={() => setExecOpen(true)}>
                <PlayArrowIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                title="Copy commands"
                aria-label="Copy commands"
                onClick={() => {
                  navigator.clipboard.writeText(runbook.commands.join("\n")).catch((err) => {
                    console.error("Failed to copy to clipboard:", err);
                  });
                }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" title="Edit" aria-label="Edit" onClick={() => setEditOpen(true)}>
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" title="Delete" aria-label="Delete" color="error" onClick={() => setDeleteOpen(true)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
          {/* Row 2: category + tags */}
          {(category || runbook.tags.length > 0) && (
            <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", rowGap: 0.5, mb: collapsed ? 0 : 0.5 }}>
              {category && <CategoryBadge category={category} />}
              {runbook.tags.map((tag) => (
                <Chip key={tag} label={tag} size="small" />
              ))}
            </Stack>
          )}
          <Collapse in={!collapsed}>
            <>
              {runbook.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {runbook.description}
                </Typography>
              )}
              {lastRun != null && (
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                  Last run: {formatTimeAgo(lastRun.timestamp)} ({lastRun.exitCode === 0 ? "success" : "failed"})
                </Typography>
              )}
              <Box
                component="pre"
                sx={{
                  bgcolor: "action.hover",
                  p: compact ? 0.75 : 1,
                  borderRadius: 1,
                  fontSize: compact ? "0.75rem" : "0.8rem",
                  lineHeight: 1.4,
                  maxHeight: compact ? "calc(0.75rem * 1.4 * 2 + 12px)" : "calc(0.8rem * 1.4 * 3 + 16px)",
                  overflowY: "auto",
                  overflowX: "auto",
                  m: 0,
                }}
              >
                <code
                  dangerouslySetInnerHTML={{
                    __html: escapeHtml(runbook.commands.join("\n")).replace(
                      new RegExp(VARIABLE_REGEX.source, "g"),
                      (m) => `<span style="color:#cf6b00">${m}</span>`,
                    ),
                  }}
                />
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
});
