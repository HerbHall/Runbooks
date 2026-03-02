import { useState, useRef, useEffect } from "react";
import { createDockerDesktopClient } from "@docker/extension-api-client";
import {
  Box, Typography, Stack, Button, IconButton, Tooltip,
  Menu, MenuItem, Divider, ListItemIcon, ListItemText,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import UploadIcon from "@mui/icons-material/Upload";
import TuneIcon from "@mui/icons-material/Tune";
import SettingsIcon from "@mui/icons-material/Settings";
import DataObjectIcon from "@mui/icons-material/DataObject";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import BugReportIcon from "@mui/icons-material/BugReport";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import FeedbackIcon from "@mui/icons-material/Feedback";
import GitHubIcon from "@mui/icons-material/GitHub";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { RunbookList } from "./components/RunbookList";
import { RunbookFormDialog } from "./components/RunbookFormDialog";
import { CategoryManagementDialog } from "./components/CategoryManagementDialog";
import { GlobalVariablesDialog } from "./components/GlobalVariablesDialog";
import { DiagnosticDialog } from "./components/DiagnosticDialog";
import { SettingsDialog } from "./components/SettingsDialog";
import { GettingStartedDialog } from "./components/GettingStartedDialog";
import { useRunbooks } from "./context/RunbookContext";
import { useCategories } from "./context/CategoryContext";
import { useConstants } from "./context/ConstantContext";
import { exportRunbooks, importRunbooks } from "./storage";

const REPO_URL = "https://github.com/HerbHall/Runbooks";

const ddClient = createDockerDesktopClient();

export function useDockerDesktopClient() {
  return ddClient;
}

export default function App() {
  const { runbooks, replaceAll } = useRunbooks();
  const { categories, replaceAllCategories } = useCategories();
  const { constants, replaceAllConstants } = useConstants();
  const [formOpen, setFormOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [variablesDialogOpen, setVariablesDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [gettingStartedOpen, setGettingStartedOpen] = useState(false);
  const [helpAnchor, setHelpAnchor] = useState<null | HTMLElement>(null);
  const [diagnosticType, setDiagnosticType] = useState<"bug" | "feature" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "n") {
        e.preventDefault();
        setFormOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleExport = () => {
    exportRunbooks(runbooks, categories, constants);
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
      if (result.globals) {
        replaceAllConstants(result.globals);
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
          <Button size="small" startIcon={<TuneIcon />} onClick={() => setSettingsOpen(true)}>
            Settings
          </Button>
          <Button size="small" startIcon={<DataObjectIcon />} onClick={() => setVariablesDialogOpen(true)}>
            Variables
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
          <Tooltip title="Help & Feedback">
            <IconButton size="small" onClick={(e) => setHelpAnchor(e.currentTarget)}>
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={helpAnchor}
            open={Boolean(helpAnchor)}
            onClose={() => setHelpAnchor(null)}
          >
            <MenuItem onClick={() => { setGettingStartedOpen(true); setHelpAnchor(null); }}>
              <ListItemIcon><InfoOutlinedIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Getting Started</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { setDiagnosticType("bug"); setHelpAnchor(null); }}>
              <ListItemIcon><BugReportIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Report a Bug</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { setDiagnosticType("feature"); setHelpAnchor(null); }}>
              <ListItemIcon><LightbulbIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Request a Feature</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { ddClient.host.openExternal(`${REPO_URL}/issues/new?template=feedback.yml`); setHelpAnchor(null); }}>
              <ListItemIcon><FeedbackIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Send Feedback</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { ddClient.host.openExternal(REPO_URL); setHelpAnchor(null); }}>
              <ListItemIcon><GitHubIcon fontSize="small" /></ListItemIcon>
              <ListItemText>View on GitHub</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { ddClient.host.openExternal("https://github.com/sponsors/HerbHall"); setHelpAnchor(null); }}>
              <ListItemIcon><FavoriteIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Support this Project</ListItemText>
            </MenuItem>
          </Menu>
          <Tooltip title="Create a new runbook (Ctrl+N)">
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>
              New Runbook
            </Button>
          </Tooltip>
        </Stack>
      </Stack>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Saved command scripts for Docker Desktop. Create, organize, and execute
        Docker commands with one click.
      </Typography>

      <RunbookList />

      <Stack
        direction="row"
        spacing={1}
        justifyContent="center"
        alignItems="center"
        sx={{ mt: "auto", pt: 1, pb: 0.5 }}
      >
        {[
          { label: "Feedback", url: `${REPO_URL}/issues/new?template=feedback.yml` },
          { label: "GitHub", url: REPO_URL },
          { label: "Support", url: "https://github.com/sponsors/HerbHall" },
        ].map((link, i) => (
          <Stack key={link.label} direction="row" spacing={1} alignItems="center">
            {i > 0 && <Typography variant="caption" color="text.disabled">·</Typography>}
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline", color: "text.secondary" } }}
              onClick={() => ddClient.host.openExternal(link.url)}
            >
              {link.label}
            </Typography>
          </Stack>
        ))}
        <Typography variant="caption" color="text.disabled">·</Typography>
        <Typography variant="caption" color="text.disabled">
          v{__APP_VERSION__}
        </Typography>
      </Stack>

      <RunbookFormDialog open={formOpen} onClose={() => setFormOpen(false)} />
      <CategoryManagementDialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)} />
      <GlobalVariablesDialog open={variablesDialogOpen} onClose={() => setVariablesDialogOpen(false)} />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <GettingStartedDialog open={gettingStartedOpen} onClose={() => setGettingStartedOpen(false)} />
      <DiagnosticDialog
        open={diagnosticType !== null}
        onClose={() => setDiagnosticType(null)}
        type={diagnosticType ?? "bug"}
      />

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
