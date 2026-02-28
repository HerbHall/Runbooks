import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  FormControlLabel,
  Checkbox,
  Box,
} from "@mui/material";
import { useDockerDesktopClient } from "../App";

const REPO_URL = "https://github.com/HerbHall/Runbooks";

interface DiagnosticDialogProps {
  open: boolean;
  onClose: () => void;
  type: "bug" | "feature";
}

interface DiagnosticInfo {
  extensionVersion: string;
  platform: string;
  arch: string;
  dockerVersion: string;
}

function mapPlatformToOS(platform: string): string {
  switch (platform) {
    case "win32": return "Windows";
    case "darwin": return "macOS";
    case "linux": return "Linux";
    default: return platform;
  }
}

export function DiagnosticDialog({ open, onClose, type }: DiagnosticDialogProps) {
  const ddClient = useDockerDesktopClient();
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const [diagnostics, setDiagnostics] = useState<DiagnosticInfo | null>(null);

  useEffect(() => {
    if (!open) return;
    const gather = async () => {
      let dockerVersion = "unknown";
      try {
        const result = await ddClient.docker.cli.exec("version", [
          "--format", "{{.Client.Version}}",
        ]);
        dockerVersion = result.stdout.trim();
      } catch {
        // fall back to "unknown"
      }
      setDiagnostics({
        extensionVersion: __APP_VERSION__,
        platform: ddClient.host.platform,
        arch: ddClient.host.arch,
        dockerVersion,
      });
    };
    gather();
  }, [open, ddClient]);

  const diagnosticText = diagnostics
    ? [
        `Extension: v${diagnostics.extensionVersion}`,
        `Platform:  ${mapPlatformToOS(diagnostics.platform)} (${diagnostics.arch})`,
        `Docker:    ${diagnostics.dockerVersion}`,
      ].join("\n")
    : "Gathering...";

  const handleContinue = () => {
    let url: string;
    if (type === "bug") {
      if (includeDiagnostics && diagnostics) {
        const dockerField = `Docker Desktop ${diagnostics.dockerVersion}, Extension v${diagnostics.extensionVersion}`;
        const osField = mapPlatformToOS(diagnostics.platform);
        const params = new URLSearchParams({
          template: "bug_report.yml",
          "docker-version": dockerField,
          os: osField,
        });
        url = `${REPO_URL}/issues/new?${params.toString()}`;
      } else {
        url = `${REPO_URL}/issues/new?template=bug_report.yml`;
      }
    } else {
      if (includeDiagnostics && diagnostics) {
        const footer = `Extension v${diagnostics.extensionVersion} | ${mapPlatformToOS(diagnostics.platform)} ${diagnostics.arch} | Docker ${diagnostics.dockerVersion}`;
        const params = new URLSearchParams({
          template: "feature_request.yml",
          problem: `\n\n---\n${footer}`,
        });
        url = `${REPO_URL}/issues/new?${params.toString()}`;
      } else {
        url = `${REPO_URL}/issues/new?template=feature_request.yml`;
      }
    }
    ddClient.host.openExternal(url);
    onClose();
  };

  const title = type === "bug" ? "Report a Bug" : "Request a Feature";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Review the diagnostic information below. This helps us troubleshoot
          but is entirely optional.
        </Typography>
        {includeDiagnostics && (
          <Box
            component="pre"
            sx={{
              p: 1.5,
              borderRadius: 1,
              bgcolor: "action.hover",
              fontSize: "0.8rem",
              fontFamily: "monospace",
              whiteSpace: "pre",
              overflow: "auto",
              m: 0,
              mb: 2,
            }}
          >
            {diagnosticText}
          </Box>
        )}
        <FormControlLabel
          control={
            <Checkbox
              checked={includeDiagnostics}
              onChange={(e) => setIncludeDiagnostics(e.target.checked)}
              size="small"
            />
          }
          label={
            <Typography variant="body2">Include diagnostic information</Typography>
          }
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleContinue}>
          Continue to GitHub
        </Button>
      </DialogActions>
    </Dialog>
  );
}
