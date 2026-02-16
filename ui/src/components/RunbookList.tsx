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
  Collapse,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SortIcon from "@mui/icons-material/Sort";
import FolderIcon from "@mui/icons-material/Folder";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import GridViewIcon from "@mui/icons-material/GridView";
import ViewListIcon from "@mui/icons-material/ViewList";
import DensitySmallIcon from "@mui/icons-material/DensitySmall";
import { useRunbooks } from "../context/RunbookContext";
import { useCategories } from "../context/CategoryContext";
import { loadPreference, savePreference } from "../storage";
import type { SortOption, LayoutMode, GroupMode, Runbook, Category } from "../types";
import { RunbookCard } from "./RunbookCard";
import { CategoryBadge } from "./CategoryBadge";

const getLayoutSx = (mode: LayoutMode, compact: boolean) => {
  const gap = compact ? 1 : 1.5;
  if (mode === "list") {
    return { display: "flex", flexDirection: "column" as const, gap, alignContent: "start" };
  }
  return {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
    gap,
    alignContent: "start",
  };
};

interface SubGroup {
  tag: string;
  runbooks: Runbook[];
}

interface PrimaryGroup {
  tag: string;
  color?: string;
  icon?: string;
  category?: Category;
  direct: Runbook[];
  subgroups: SubGroup[];
}

export function RunbookList() {
  const { runbooks } = useRunbooks();
  const { categories } = useCategories();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>(
    () => loadPreference<SortOption>("sortBy", "name-asc"),
  );
  const [groupMode, setGroupMode] = useState<GroupMode>(
    () => loadPreference<GroupMode>("groupMode", "none"),
  );
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(
    () => loadPreference<LayoutMode>("layoutMode", "grid"),
  );
  const [compact, setCompact] = useState<boolean>(
    () => loadPreference<boolean>("compact", false),
  );
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [collapsedCards, setCollapsedCards] = useState<Set<string>>(new Set());

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const layoutSx = useMemo(() => getLayoutSx(layoutMode, compact), [layoutMode, compact]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return runbooks;
    return runbooks.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q)) ||
        r.commands.some((c) => c.toLowerCase().includes(q)) ||
        (r.categoryId && categoryMap.get(r.categoryId)?.name.toLowerCase().includes(q)),
    );
  }, [runbooks, searchQuery, categoryMap]);

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
    if (groupMode === "none") return null;

    if (groupMode === "category") {
      const catGroups = new Map<string, Runbook[]>();
      const ungrouped: Runbook[] = [];

      for (const r of sorted) {
        if (r.categoryId && categoryMap.has(r.categoryId)) {
          if (!catGroups.has(r.categoryId)) catGroups.set(r.categoryId, []);
          catGroups.get(r.categoryId)!.push(r);
        } else {
          ungrouped.push(r);
        }
      }

      const sortedCats = [...categories].sort((a, b) => a.order - b.order);
      const result: PrimaryGroup[] = sortedCats
        .filter((cat) => catGroups.has(cat.id))
        .map((cat) => ({
          tag: cat.name,
          color: cat.color,
          icon: cat.icon,
          category: cat,
          direct: catGroups.get(cat.id) ?? [],
          subgroups: [],
        }));

      if (ungrouped.length > 0) {
        result.push({ tag: "Uncategorized", direct: ungrouped, subgroups: [] });
      }
      return result;
    }

    // groupMode === "tag"
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
  }, [sorted, groupMode, categories, categoryMap]);

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

  const cycleGroupMode = () => {
    setGroupMode((prev) => {
      const modes: GroupMode[] = categories.length > 0
        ? ["none", "tag", "category"]
        : ["none", "tag"];
      const idx = modes.indexOf(prev);
      const next = modes[(idx + 1) % modes.length];
      savePreference("groupMode", next);
      return next;
    });
  };

  const handleLayoutToggle = () => {
    setLayoutMode((prev) => {
      const next = prev === "grid" ? "list" : "grid";
      savePreference("layoutMode", next);
      return next;
    });
  };

  const handleCompactToggle = () => {
    setCompact((prev) => {
      const next = !prev;
      savePreference("compact", next);
      return next;
    });
  };

  const toggleCardCollapse = (id: string) => {
    setCollapsedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAllCards = () => setCollapsedCards(new Set());
  const collapseAllCards = () => setCollapsedCards(new Set(sorted.map((r) => r.id)));

  const totalInGroup = (g: PrimaryGroup) =>
    g.direct.length + g.subgroups.reduce((sum, s) => sum + s.runbooks.length, 0);

  const groupLabel = groupMode === "none" ? "Group" : groupMode === "tag" ? "By Tag" : "By Category";

  const renderCard = (runbook: Runbook) => (
    <RunbookCard
      key={runbook.id}
      runbook={runbook}
      category={runbook.categoryId ? categoryMap.get(runbook.categoryId) : undefined}
      collapsed={collapsedCards.has(runbook.id)}
      onToggleCollapse={() => toggleCardCollapse(runbook.id)}
      compact={compact}
    />
  );

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
        <Tooltip title={layoutMode === "grid" ? "Switch to list view" : "Switch to grid view"} placement="bottom">
          <IconButton size="small" onClick={handleLayoutToggle}>
            {layoutMode === "grid" ? <ViewListIcon fontSize="small" /> : <GridViewIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title={compact ? "Normal density" : "Compact density"} placement="bottom">
          <IconButton size="small" onClick={handleCompactToggle} color={compact ? "primary" : "default"}>
            <DensitySmallIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Expand all cards" placement="bottom">
          <IconButton size="small" onClick={expandAllCards}>
            <UnfoldMoreIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Collapse all cards" placement="bottom">
          <IconButton size="small" onClick={collapseAllCards}>
            <UnfoldLessIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Cycle grouping: None / By Tag / By Category" placement="bottom">
          <Chip
            icon={<FolderIcon />}
            label={groupLabel}
            size="small"
            color={groupMode !== "none" ? "primary" : "default"}
            variant={groupMode !== "none" ? "filled" : "outlined"}
            onClick={cycleGroupMode}
            sx={{ cursor: "pointer" }}
          />
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
                {/* Group header */}
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
                  {group.category ? (
                    <CategoryBadge category={group.category} />
                  ) : (
                    <Chip label={group.tag} size="small" />
                  )}
                  <Typography variant="body2" color="text.secondary">
                    ({totalInGroup(group)})
                  </Typography>
                </Stack>
                <Collapse in={!collapsed.has(group.tag)}>
                  <Box sx={{ pl: 2 }}>
                    {group.direct.length > 0 && (
                      <Box sx={{ ...layoutSx, mb: group.subgroups.length > 0 ? 1.5 : 0 }}>
                        {group.direct.map(renderCard)}
                      </Box>
                    )}
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
                            <Box sx={{ ...layoutSx, pl: 2 }}>
                              {sub.runbooks.map(renderCard)}
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
        <Box sx={{ flex: 1, overflow: "auto", ...layoutSx }}>
          {sorted.map(renderCard)}
        </Box>
      )}
    </Box>
  );
}
