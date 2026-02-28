import { useState, useRef } from "react";
import { createDockerDesktopClient } from "@docker/extension-api-client";
import {
  Box, Typography, Stack, Button, IconButton, Tooltip,
  Menu, MenuItem, Divider, ListItemIcon, ListItemText, Link,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import UploadIcon from "@mui/icons-material/Upload";
import SettingsIcon from "@mui/icons-material/Settings";
import RestoreIcon from "@mui/icons-material/Restore";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import BugReportIcon from "@mui/icons-material/BugReport";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import FeedbackIcon from "@mui/icons-material/Feedback";
import GitHubIcon from "@mui/icons-material/GitHub";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { RunbookList } from "./components/RunbookList";
import { RunbookFormDialog } from "./components/RunbookFormDialog";
import { CategoryManagementDialog } from "./components/CategoryManagementDialog";
import { DiagnosticDialog } from "./components/DiagnosticDialog";
import { useRunbooks } from "./context/RunbookContext";
import { useCategories } from "./context/CategoryContext";
import { exportRunbooks, importRunbooks } from "./storage";

const REPO_URL = "https://github.com/HerbHall/Runbooks";

const ddClient = createDockerDesktopClient();

export function useDockerDesktopClient() {
  return ddClient;
}

export default function App() {
  const { runbooks, replaceAll, restoreDefaults } = useRunbooks();
  const { categories, replaceAllCategories } = useCategories();
  const [formOpen, setFormOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [helpAnchor, setHelpAnchor] = useState<null | HTMLElement>(null);
  const [diagnosticType, setDiagnosticType] = useState<"bug" | "feature" | null>(null);
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

  const handleLinkClick = (url: string) => (e: React.MouseEvent) => {
		e.preventDefault();
		ddClient.host.openExternal(url);
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
      <DiagnosticDialog
        open={diagnosticType !== null}
        onClose={() => setDiagnosticType(null)}
        type={diagnosticType ?? "bug"}
      />

	    <Box sx={{ mt: "auto", pt: 2, pb: 1, textAlign: "center" }}>
				<Typography variant="caption" color="text.secondary">
					Runbooks v{__APP_VERSION__}&nbsp;•&nbsp;
					<Link
						href="#"
						onClick={handleLinkClick(
							"https://github.com/HerbHall/Runbooks/issues/new?template=bug_report.yml",
						)}
						sx={{
							color: "text.secondary",
							cursor: "pointer",
							textDecoration: "underline",
						}}
					>
						Report a Bug
					</Link>
					&nbsp;•&nbsp;
					<Link
						href="#"
						onClick={handleLinkClick("https://github.com/HerbHall/Runbooks")}
						sx={{
							color: "text.secondary",
							cursor: "pointer",
							textDecoration: "underline",
						}}
					>
						GitHub
					</Link>
				</Typography>
			</Box>

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
