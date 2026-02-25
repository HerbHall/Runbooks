import { useState, useRef } from "react";
import { createDockerDesktopClient } from "@docker/extension-api-client";
import { Box, Typography, Stack, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import UploadIcon from "@mui/icons-material/Upload";
import SettingsIcon from "@mui/icons-material/Settings";
import RestoreIcon from "@mui/icons-material/Restore";
import { RunbookList } from "./components/RunbookList";
import { RunbookFormDialog } from "./components/RunbookFormDialog";
import { CategoryManagementDialog } from "./components/CategoryManagementDialog";
import { useRunbooks } from "./context/RunbookContext";
import { useCategories } from "./context/CategoryContext";
import { exportRunbooks, importRunbooks } from "./storage";

const ddClient = createDockerDesktopClient();

export function useDockerDesktopClient() {
  return ddClient;
}

export default function App() {
  const { runbooks, replaceAll, restoreDefaults } = useRunbooks();
  const { categories, replaceAllCategories } = useCategories();
  const [formOpen, setFormOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    exportRunbooks(runbooks, categories);
    ddClient.desktopUI.toast.success("Runbooks exported");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await importRunbooks(file);
      replaceAll(result.runbooks);
      if (result.categories) {
        replaceAllCategories(result.categories);
      }
      ddClient.desktopUI.toast.success(`Imported ${result.runbooks.length} runbooks`);
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
          <Button size="small" startIcon={<RestoreIcon />} onClick={() => {
            const count = restoreDefaults();
            if (count > 0) {
              ddClient.desktopUI.toast.success(`Restored ${count} example runbooks`);
            } else {
              ddClient.desktopUI.toast.success("All example runbooks already present");
            }
          }}>
            Examples
          </Button>
          <Button size="small" startIcon={<SettingsIcon />} onClick={() => setCategoryDialogOpen(true)}>
            Categories
          </Button>
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
        <Typography component="span" variant="caption" color="text.disabled" sx={{ ml: 1 }}>
          v{__APP_VERSION__}
        </Typography>
      </Typography>

      <RunbookList />

      <RunbookFormDialog open={formOpen} onClose={() => setFormOpen(false)} />
      <CategoryManagementDialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)} />

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
