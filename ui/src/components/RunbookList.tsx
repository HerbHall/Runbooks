import React from "react";
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Chip,
  Stack,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

// Placeholder type — will be refined as the data model solidifies.
// See ADR-003 for storage architecture decisions.
export interface Runbook {
  id: string;
  name: string;
  description: string;
  commands: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Sample data to demonstrate the UI concept.
// Replace with real storage once ADR-003 storage backend is implemented.
const SAMPLE_RUNBOOKS: Runbook[] = [
  {
    id: "1",
    name: "Dev Cleanup",
    description: "Remove stopped containers and dangling images",
    commands: [
      "docker container prune -f",
      "docker image prune -f",
    ],
    tags: ["cleanup", "dev"],
    createdAt: "2025-02-16T00:00:00Z",
    updatedAt: "2025-02-16T00:00:00Z",
  },
  {
    id: "2",
    name: "Full Reset",
    description: "Nuclear option — remove everything and start fresh",
    commands: [
      "docker stop $(docker ps -aq)",
      "docker system prune -af --volumes",
    ],
    tags: ["cleanup", "dangerous"],
    createdAt: "2025-02-16T00:00:00Z",
    updatedAt: "2025-02-16T00:00:00Z",
  },
];

export function RunbookList() {
  return (
    <Box sx={{ flex: 1, overflow: "auto" }}>
      <Stack spacing={2}>
        {SAMPLE_RUNBOOKS.map((runbook) => (
          <Card key={runbook.id} variant="outlined">
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <Typography variant="h6" component="div">
                  {runbook.name}
                </Typography>
                {runbook.tags.map((tag) => (
                  <Chip key={tag} label={tag} size="small" />
                ))}
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {runbook.description}
              </Typography>
              <Box
                component="pre"
                sx={{
                  bgcolor: "action.hover",
                  p: 1.5,
                  borderRadius: 1,
                  fontSize: "0.85rem",
                  overflow: "auto",
                  m: 0,
                }}
              >
                {runbook.commands.join("\n")}
              </Box>
            </CardContent>
            <CardActions>
              <IconButton color="primary" title="Run">
                <PlayArrowIcon />
              </IconButton>
              <IconButton title="Edit">
                <EditIcon />
              </IconButton>
              <IconButton title="Delete" color="error">
                <DeleteIcon />
              </IconButton>
            </CardActions>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
