import { useState, useRef } from "react";
import { createDockerDesktopClient } from "@docker/extension-api-client";
import { Box, Typography, Stack, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import UploadIcon from "@mui/icons-material/Upload";
import { RunbookList } from "./components/RunbookList";
import { RunbookFormDialog } from "./components/RunbookFormDialog";
import { useRunbooks } from "./context/RunbookContext";
import { exportRunbooks, importRunbooks } from "./storage";

const ddClient = createDockerDesktopClient();

export function useDockerDesktopClient() {
  return ddClient;
}

export default function App() {
  const { runbooks, replaceAll } = useRunbooks();
  const [formOpen, setFormOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    exportRunbooks(runbooks);
    ddClient.desktopUI.toast.success("Runbooks exported");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importRunbooks(file);
      replaceAll(imported);
      ddClient.desktopUI.toast.success(`Imported ${imported.length} runbooks`);
    } catch (err) {
      ddClient.desktopUI.toast.error(err instanceof Error ? err.message : "Import failed");
    }
    e.target.value = "";
  };

  return (
    <Box sx={{ p: 3, height: "100vh", display: "flex", flexDirection: "column" }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Typography variant="h3">Runbooks</Typography>
        <Stack direction="row" spacing={1}>
          {runbooks.length > 0 && (
            <Button size="small" startIcon={<DownloadIcon />} onClick={handleExport}>
              Export
            </Button>
          )}
          <Button size="small" startIcon={<UploadIcon />} onClick={handleImportClick}>
            Import
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>
            New Runbook
          </Button>
        </Stack>
      </Stack>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Saved command scripts for Docker Desktop. Create, organize, and execute
        Docker commands with one click.
      </Typography>

      <RunbookList />

      <RunbookFormDialog open={formOpen} onClose={() => setFormOpen(false)} />

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        hidden
        onChange={handleFileChange}
      />
    </Box>
  );
}
