import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Box,
} from "@mui/material";

interface GettingStartedDialogProps {
  open: boolean;
  onClose: () => void;
}

const kbdStyle = {
  display: "inline-block",
  px: 0.75,
  py: 0.25,
  border: 1,
  borderColor: "divider",
  borderRadius: 1,
  bgcolor: "action.hover",
  fontFamily: "monospace",
  fontSize: "0.8rem",
  lineHeight: 1.4,
};

export function GettingStartedDialog({ open, onClose }: GettingStartedDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Getting Started</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <section>
            <Typography variant="subtitle2" gutterBottom>
              What are Runbooks?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Runbooks are saved Docker command scripts you can organize, customize,
              and execute with one click directly from Docker Desktop.
            </Typography>
          </section>

          <section>
            <Typography variant="subtitle2" gutterBottom>
              Features
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div">
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>Variables with defaults and option dropdowns</li>
                <li>Container, image, volume, and network autocomplete</li>
                <li>Multi-command runbooks executed in sequence</li>
                <li>Categories and tags for organization</li>
                <li>Pin favorites to the top of the list</li>
                <li>Dry-run preview before execution</li>
                <li>Streaming output with elapsed timer</li>
                <li>Import/export for backup and sharing</li>
              </ul>
            </Typography>
          </section>

          <section>
            <Typography variant="subtitle2" gutterBottom>
              Keyboard Shortcuts
            </Typography>
            <Stack spacing={0.75}>
              {([
                ["Ctrl+N", "Create a new runbook"],
                ["/", "Focus the search bar"],
                ["Escape", "Clear search and unfocus"],
                ["Ctrl+C", "Abort running command"],
                ["Ctrl+Enter", "Save runbook form"],
              ] as const).map(([key, desc]) => (
                <Stack key={key} direction="row" spacing={1} alignItems="center">
                  <Box sx={{ ...kbdStyle, minWidth: 80, textAlign: "center" }}>{key}</Box>
                  <Typography variant="body2" color="text.secondary">{desc}</Typography>
                </Stack>
              ))}
            </Stack>
          </section>

          <section>
            <Typography variant="subtitle2" gutterBottom>
              Variable Syntax
            </Typography>
            <Box
              component="pre"
              sx={{
                bgcolor: "action.hover",
                borderRadius: 1,
                p: 1.5,
                fontSize: "0.8rem",
                fontFamily: "monospace",
                overflow: "auto",
                m: 0,
              }}
            >
{`{{name}}            Prompted at run time
{{name=default}}    Pre-filled default value
{{name|a,b,c}}      Dropdown with options
{{name=a|a,b,c}}    Dropdown with default

Resource autocomplete (use these names):
  {{container}}  {{image}}
  {{volume}}     {{network}}`}
            </Box>
          </section>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
