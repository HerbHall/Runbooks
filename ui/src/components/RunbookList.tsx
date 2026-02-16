import { Box, Typography } from "@mui/material";
import { useRunbooks } from "../context/RunbookContext";
import { RunbookCard } from "./RunbookCard";

export function RunbookList() {
  const { runbooks } = useRunbooks();

  if (runbooks.length === 0) {
    return (
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography color="text.secondary">
          No runbooks yet. Click "New Runbook" to create one.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        overflow: "auto",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
        gap: 1.5,
        alignContent: "start",
      }}
    >
      {runbooks.map((runbook) => (
        <RunbookCard key={runbook.id} runbook={runbook} />
      ))}
    </Box>
  );
}
