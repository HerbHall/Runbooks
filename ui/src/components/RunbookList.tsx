import { useState, useMemo, useRef, useEffect, useCallback } from "react";
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
  Divider,
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
import { getLastRun, getExecutionCount, didLastRunFail } from "../utils/execution-history";
import type { SortOption, LayoutMode, GroupMode, SmartFilter, Runbook, Category } from "../types";
import HistoryIcon from "@mui/icons-material/History";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { RunbookCard } from "./RunbookCard";
import { CategoryBadge } from "./CategoryBadge";

const getLayoutSx = (mode: LayoutMode, compact: boolean) => {
  const gap = compact ? 0.5 : 1;
  if (mode === "list") {
    return { display: "flex", flexDirection: "column" as const, gap, alignContent: "start" };
  }
  return {
    columnWidth: "300px",
    columnGap: gap,
    "& > *": {
      breakInside: "avoid",
      mb: gap,
    },
  };
};

interface PrimaryGroup {
  tag: string;
  color?: string;
  icon?: string;
  category?: Category;
  runbooks: Runbook[];
}

export function RunbookList() {
  const { runbooks, showExamples } = useRunbooks();
  const { categories } = useCategories();
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape" && tag === "INPUT") {
        searchRef.current?.blur();
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
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
  const [collapsed, setCollapsed] = useState<Set<string>>(
    () => new Set(loadPreference<string[]>("collapsedGroups", [])),
  );
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>({});
  const [smartFilter, setSmartFilter] = useState<SmartFilter>("none");

  // Reset smart filter when example visibility changes to prevent empty results with no explanation
  useEffect(() => {
    setSmartFilter("none");
  }, [showExamples]);

  const toggleSmartFilter = (filter: SmartFilter) => {
    setSmartFilter((prev) => (prev === filter ? "none" : filter));
  };

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const layoutSx = useMemo(() => getLayoutSx(layoutMode, compact), [layoutMode, compact]);

  const visibleRunbooks = useMemo(() => {
    if (showExamples) return runbooks;
    return runbooks.filter((r) => !r.id.startsWith("example-"));
  }, [runbooks, showExamples]);

  const smartFiltered = useMemo(() => {
    if (smartFilter === "none") return visibleRunbooks;

    if (smartFilter === "recent") {
      return visibleRunbooks
        .filter((r) => getLastRun(r.id) !== null)
        .sort((a, b) => {
          const aLast = getLastRun(a.id)!;
          const bLast = getLastRun(b.id)!;
          return bLast.timestamp.localeCompare(aLast.timestamp);
        });
    }

    if (smartFilter === "most-used") {
      return visibleRunbooks
        .filter((r) => getExecutionCount(r.id) > 0)
        .sort((a, b) => getExecutionCount(b.id) - getExecutionCount(a.id));
    }

    if (smartFilter === "failed") {
      return visibleRunbooks.filter((r) => didLastRunFail(r.id));
    }

    return visibleRunbooks;
  }, [visibleRunbooks, smartFilter]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return smartFiltered;
    return smartFiltered.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q)) ||
        r.commands.some((c) => c.toLowerCase().includes(q)) ||
        (r.categoryId && categoryMap.get(r.categoryId)?.name.toLowerCase().includes(q)),
    );
  }, [smartFiltered, searchQuery, categoryMap]);

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
      case "last-run-desc":
        return arr.sort((a, b) => {
          const aLast = getLastRun(a.id);
          const bLast = getLastRun(b.id);
          if (aLast == null && bLast == null) return 0;
          if (aLast == null) return 1;
          if (bLast == null) return -1;
          return bLast.timestamp.localeCompare(aLast.timestamp);
        });
      default:
        return arr;
    }
  }, [filtered, sortBy]);

  const pinSorted = useMemo(() => {
    const pinned = sorted.filter((r) => r.pinned);
    const unpinned = sorted.filter((r) => !r.pinned);
    return { pinned, unpinned, all: [...pinned, ...unpinned] };
  }, [sorted]);

  const groups = useMemo((): PrimaryGroup[] | null => {
    if (groupMode === "none") return null;

    if (groupMode === "category") {
      const catGroups = new Map<string, Runbook[]>();
      const ungrouped: Runbook[] = [];

      for (const r of pinSorted.all) {
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
          runbooks: catGroups.get(cat.id) ?? [],
        }));

      if (ungrouped.length > 0) {
        result.push({ tag: "Uncategorized", runbooks: ungrouped });
      }
      return result;
    }

    // groupMode === "tag" — group by first tag (case-insensitive), sort within by remaining tags
    const primaryMap = new Map<string, { display: string; items: Runbook[] }>();
    const ungrouped: Runbook[] = [];

    for (const r of pinSorted.all) {
      if (r.tags.length === 0) {
        ungrouped.push(r);
      } else {
        const key = r.tags[0].trim().toLowerCase();
        if (!primaryMap.has(key)) {
          primaryMap.set(key, { display: r.tags[0].trim(), items: [] });
        }
        primaryMap.get(key)!.items.push(r);
      }
    }

    // Within each group, sort pinned first then by secondary tags then name
    const result: PrimaryGroup[] = [...primaryMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, { display, items }]) => ({
        tag: display,
        runbooks: items.sort((a, b) => {
          const aPinned = a.pinned ? 0 : 1;
          const bPinned = b.pinned ? 0 : 1;
          if (aPinned !== bPinned) return aPinned - bPinned;
          const aSub = a.tags.slice(1).join("/");
          const bSub = b.tags.slice(1).join("/");
          return aSub.localeCompare(bSub) || a.name.localeCompare(b.name);
        }),
      }));

    if (ungrouped.length > 0) {
      result.push({ tag: "Ungrouped", runbooks: ungrouped });
    }
    return result;
  }, [pinSorted, groupMode, categories, categoryMap]);

  const toggleCollapse = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      savePreference("collapsedGroups", [...next]);
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

  const toggleCardCollapse = useCallback((id: string) => {
    setCollapsedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const expandAllCards = useCallback(() => setCollapsedCards({}), []);
  const collapseAllCards = useCallback(() => {
    setCollapsedCards(
      Object.fromEntries(runbooks.map((r) => [r.id, true])),
    );
  }, [runbooks]);

  const totalInGroup = (g: PrimaryGroup) => g.runbooks.length;

  const groupLabel = groupMode === "none" ? "Group" : groupMode === "tag" ? "By Tag" : "By Category";

  const renderCard = useCallback((runbook: Runbook) => (
    <RunbookCard
      key={runbook.id}
      runbook={runbook}
      category={runbook.categoryId ? categoryMap.get(runbook.categoryId) : undefined}
      collapsed={!!collapsedCards[runbook.id]}
      onToggleCollapse={() => toggleCardCollapse(runbook.id)}
      compact={compact}
    />
  ), [collapsedCards, categoryMap, toggleCardCollapse, compact]);

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
            placeholder="Search runbooks... (/)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            inputRef={searchRef}
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
          <MenuItem value="last-run-desc">Recently Executed</MenuItem>
        </Select>
        <Tooltip title={layoutMode === "grid" ? "Switch to list view" : "Switch to grid view"} placement="bottom">
          <IconButton size="small" onClick={handleLayoutToggle} aria-label={layoutMode === "grid" ? "Switch to list view" : "Switch to grid view"}>
            {layoutMode === "grid" ? <ViewListIcon fontSize="small" /> : <GridViewIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title={compact ? "Normal density" : "Compact density"} placement="bottom">
          <IconButton size="small" onClick={handleCompactToggle} color={compact ? "primary" : "default"} aria-label={compact ? "Normal density" : "Compact density"}>
            <DensitySmallIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Expand all cards" placement="bottom">
          <IconButton size="small" onClick={expandAllCards} aria-label="Expand all cards">
            <UnfoldMoreIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Collapse all cards" placement="bottom">
          <IconButton size="small" onClick={collapseAllCards} aria-label="Collapse all cards">
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

      {/* Smart filters */}
      {visibleRunbooks.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <Chip
            icon={<HistoryIcon />}
            label="Recently Used"
            size="small"
            variant={smartFilter === "recent" ? "filled" : "outlined"}
            color={smartFilter === "recent" ? "primary" : "default"}
            onClick={() => toggleSmartFilter("recent")}
            sx={{ cursor: "pointer" }}
          />
          <Chip
            icon={<TrendingUpIcon />}
            label="Most Used"
            size="small"
            variant={smartFilter === "most-used" ? "filled" : "outlined"}
            color={smartFilter === "most-used" ? "primary" : "default"}
            onClick={() => toggleSmartFilter("most-used")}
            sx={{ cursor: "pointer" }}
          />
          <Chip
            icon={<ErrorOutlineIcon />}
            label="Failed Last Run"
            size="small"
            variant={smartFilter === "failed" ? "filled" : "outlined"}
            color={smartFilter === "failed" ? "primary" : "default"}
            onClick={() => toggleSmartFilter("failed")}
            sx={{ cursor: "pointer" }}
          />
        </Stack>
      )}

      {/* Content */}
      {pinSorted.all.length === 0 ? (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography color="text.secondary">
            {smartFilter !== "none" && searchQuery.trim()
              ? "No runbooks match your filter and search."
              : smartFilter !== "none"
                ? "No runbooks match this filter."
                : "No runbooks match your search."}
          </Typography>
        </Box>
      ) : groups ? (
        <Box sx={{ flex: 1, overflow: "auto", pr: 0.5 }}>
          <Stack spacing={0.75}>
            {groups.map((group) => (
              <Box key={group.tag}>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.5}
                  onClick={() => toggleCollapse(group.tag)}
                  sx={{
                    cursor: "pointer",
                    userSelect: "none",
                    py: 0.25,
                    borderBottom: 1,
                    borderColor: "divider",
                  }}
                >
                  {collapsed.has(group.tag) ? (
                    <ExpandMoreIcon sx={{ fontSize: "1rem", color: "text.secondary" }} />
                  ) : (
                    <ExpandLessIcon sx={{ fontSize: "1rem", color: "text.secondary" }} />
                  )}
                  {group.category ? (
                    <CategoryBadge category={group.category} />
                  ) : (
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {group.tag}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {totalInGroup(group)}
                  </Typography>
                </Stack>
                <Collapse in={!collapsed.has(group.tag)}>
                  <Box sx={{ ...layoutSx, pl: 1, pt: 0.5 }}>
                    {group.runbooks.map(renderCard)}
                  </Box>
                </Collapse>
              </Box>
            ))}
          </Stack>
        </Box>
      ) : (
        <Box sx={{ flex: 1, overflow: "auto", pr: 0.5 }}>
          {pinSorted.pinned.length > 0 && (
            <>
              <Divider textAlign="left" sx={{ mb: 0.75 }}>
                <Chip label="Pinned" size="small" color="warning" variant="outlined" />
              </Divider>
              <Box sx={{ ...layoutSx, mb: 1 }}>
                {pinSorted.pinned.map(renderCard)}
              </Box>
            </>
          )}
          <Box sx={layoutSx}>
            {pinSorted.unpinned.map(renderCard)}
          </Box>
        </Box>
      )}
    </Box>
  );
}
