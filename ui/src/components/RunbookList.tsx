import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  InputAdornment,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Collapse,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SortIcon from "@mui/icons-material/Sort";
import FolderIcon from "@mui/icons-material/Folder";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useRunbooks } from "../context/RunbookContext";
import { loadPreference, savePreference } from "../storage";
import type { SortOption, Runbook } from "../types";
import { RunbookCard } from "./RunbookCard";

const gridSx = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
  gap: 1.5,
  alignContent: "start",
};

interface SubGroup {
  tag: string;
  runbooks: Runbook[];
}

interface PrimaryGroup {
  tag: string;
  direct: Runbook[];
  subgroups: SubGroup[];
}

export function RunbookList() {
  const { runbooks } = useRunbooks();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>(
    () => loadPreference<SortOption>("sortBy", "name-asc"),
  );
  const [groupByTag, setGroupByTag] = useState<boolean>(
    () => loadPreference<boolean>("groupByTag", false),
  );
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return runbooks;
    return runbooks.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q)) ||
        r.commands.some((c) => c.toLowerCase().includes(q)),
    );
  }, [runbooks, searchQuery]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sortBy) {
      case "name-asc":
        return arr.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return arr.sort((a, b) => b.name.localeCompare(a.name));
      case "created-desc":
        return arr.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      case "created-asc":
        return arr.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      case "modified-desc":
        return arr.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      case "modified-asc":
        return arr.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
      default:
        return arr;
    }
  }, [filtered, sortBy]);

  const groups = useMemo((): PrimaryGroup[] | null => {
    if (!groupByTag) return null;

    const primaryMap = new Map<string, { direct: Runbook[]; subs: Map<string, Runbook[]> }>();
    const ungrouped: Runbook[] = [];

    for (const r of sorted) {
      if (r.tags.length === 0) {
        ungrouped.push(r);
      } else {
        const primary = r.tags[0];
        if (!primaryMap.has(primary)) {
          primaryMap.set(primary, { direct: [], subs: new Map() });
        }
        const group = primaryMap.get(primary)!;
        if (r.tags.length >= 2) {
          const sub = r.tags[1];
          if (!group.subs.has(sub)) group.subs.set(sub, []);
          group.subs.get(sub)!.push(r);
        } else {
          group.direct.push(r);
        }
      }
    }

    const result: PrimaryGroup[] = [...primaryMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([tag, { direct, subs }]) => ({
        tag,
        direct,
        subgroups: [...subs.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([subTag, subRunbooks]) => ({ tag: subTag, runbooks: subRunbooks })),
      }));

    if (ungrouped.length > 0) {
      result.push({ tag: "Ungrouped", direct: ungrouped, subgroups: [] });
    }
    return result;
  }, [sorted, groupByTag]);

  const toggleCollapse = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSortChange = (e: SelectChangeEvent) => {
    const value = e.target.value as SortOption;
    setSortBy(value);
    savePreference("sortBy", value);
  };

  const handleGroupToggle = () => {
    setGroupByTag((prev) => {
      const next = !prev;
      savePreference("groupByTag", next);
      return next;
    });
  };

  const totalInGroup = (g: PrimaryGroup) =>
    g.direct.length + g.subgroups.reduce((sum, s) => sum + s.runbooks.length, 0);

  if (runbooks.length === 0) {
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography color="text.secondary">
          No runbooks yet. Click &quot;New Runbook&quot; to create one.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Toolbar */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
        <Tooltip title="Filter by name, description, tags, or commands" placement="bottom">
          <TextField
            size="small"
            placeholder="Search runbooks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1 }}
          />
        </Tooltip>
        <Select
          size="small"
          value={sortBy}
          onChange={handleSortChange}
          startAdornment={<SortIcon fontSize="small" sx={{ mr: 0.5 }} />}
          sx={{ minWidth: 170 }}
        >
          <MenuItem value="name-asc">Name A-Z</MenuItem>
          <MenuItem value="name-desc">Name Z-A</MenuItem>
          <MenuItem value="created-desc">Newest</MenuItem>
          <MenuItem value="created-asc">Oldest</MenuItem>
          <MenuItem value="modified-desc">Recently Modified</MenuItem>
          <MenuItem value="modified-asc">Least Recently Modified</MenuItem>
        </Select>
        <Tooltip title="Group by tags. First tag = group, second tag = sub-group." placement="bottom">
          <Button
            size="small"
            variant={groupByTag ? "contained" : "outlined"}
            startIcon={<FolderIcon />}
            onClick={handleGroupToggle}
            sx={{ whiteSpace: "nowrap" }}
          >
            Group
          </Button>
        </Tooltip>
      </Stack>

      {/* Content */}
      {sorted.length === 0 ? (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography color="text.secondary">
            No runbooks match your search.
          </Typography>
        </Box>
      ) : groups ? (
        <Box sx={{ flex: 1, overflow: "auto" }}>
          <Stack spacing={2}>
            {groups.map((group) => (
              <Box key={group.tag}>
                {/* Primary group header */}
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.5}
                  onClick={() => toggleCollapse(group.tag)}
                  sx={{ cursor: "pointer", mb: 0.5, userSelect: "none" }}
                >
                  <IconButton size="small">
                    {collapsed.has(group.tag) ? (
                      <ExpandMoreIcon fontSize="small" />
                    ) : (
                      <ExpandLessIcon fontSize="small" />
                    )}
                  </IconButton>
                  <Chip label={group.tag} size="small" />
                  <Typography variant="body2" color="text.secondary">
                    ({totalInGroup(group)})
                  </Typography>
                </Stack>
                <Collapse in={!collapsed.has(group.tag)}>
                  <Box sx={{ pl: 2 }}>
                    {/* Direct runbooks (single-tag, no sub-group) */}
                    {group.direct.length > 0 && (
                      <Box sx={{ ...gridSx, mb: group.subgroups.length > 0 ? 1.5 : 0 }}>
                        {group.direct.map((runbook) => (
                          <RunbookCard key={runbook.id} runbook={runbook} />
                        ))}
                      </Box>
                    )}
                    {/* Sub-groups (second tag) */}
                    {group.subgroups.map((sub) => {
                      const subKey = `${group.tag}/${sub.tag}`;
                      return (
                        <Box key={subKey} sx={{ mb: 1 }}>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.5}
                            onClick={() => toggleCollapse(subKey)}
                            sx={{ cursor: "pointer", mb: 0.5, userSelect: "none" }}
                          >
                            <IconButton size="small">
                              {collapsed.has(subKey) ? (
                                <ExpandMoreIcon sx={{ fontSize: "1rem" }} />
                              ) : (
                                <ExpandLessIcon sx={{ fontSize: "1rem" }} />
                              )}
                            </IconButton>
                            <Chip label={sub.tag} size="small" variant="outlined" />
                            <Typography variant="body2" color="text.secondary">
                              ({sub.runbooks.length})
                            </Typography>
                          </Stack>
                          <Collapse in={!collapsed.has(subKey)}>
                            <Box sx={{ ...gridSx, pl: 2 }}>
                              {sub.runbooks.map((runbook) => (
                                <RunbookCard key={runbook.id} runbook={runbook} />
                              ))}
                            </Box>
                          </Collapse>
                        </Box>
                      );
                    })}
                  </Box>
                </Collapse>
              </Box>
            ))}
          </Stack>
        </Box>
      ) : (
        <Box sx={{ flex: 1, overflow: "auto", ...gridSx }}>
          {sorted.map((runbook) => (
            <RunbookCard key={runbook.id} runbook={runbook} />
          ))}
        </Box>
      )}
    </Box>
  );
}
