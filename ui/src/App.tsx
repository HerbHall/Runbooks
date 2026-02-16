import React from "react";
import { createDockerDesktopClient } from "@docker/extension-api-client";
import {
  Box,
  Typography,
  Stack,
  Button,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AddIcon from "@mui/icons-material/Add";
import { RunbookList } from "./components/RunbookList";

// Initialize the Docker Desktop extension client.
// This gives us access to docker.cli.exec() for running commands
// and docker.desktopUI for toast notifications.
const ddClient = createDockerDesktopClient();

export function useDockerDesktopClient() {
  return ddClient;
}

export default function App() {
  return (
    <Box sx={{ p: 3, height: "100vh", display: "flex", flexDirection: "column" }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Typography variant="h3">Runbooks</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          New Runbook
        </Button>
      </Stack>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Saved command scripts for Docker Desktop. Create, organize, and execute
        Docker commands with one click.
      </Typography>

      <RunbookList />
    </Box>
  );
}
