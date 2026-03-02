import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Runbook } from "../types";
import { RunbookProvider } from "../context/RunbookContext";
import { CategoryProvider } from "../context/CategoryContext";
import { RunbookList } from "../components/RunbookList";

// Mock the Docker Desktop client
vi.mock("../App", () => ({
  useDockerDesktopClient: vi.fn(() => ({
    docker: { cli: { exec: vi.fn() } },
    desktopUI: { toast: { success: vi.fn(), error: vi.fn() } },
  })),
}));

// Mock child dialog components used by RunbookCard
vi.mock("../components/RunbookFormDialog", () => ({
  RunbookFormDialog: () => null,
}));
vi.mock("../components/RunbookDeleteDialog", () => ({
  RunbookDeleteDialog: () => null,
}));
vi.mock("../components/RunbookExecutionDialog", () => ({
  RunbookExecutionDialog: () => null,
}));

// Mock execution history
vi.mock("../utils/execution-history", () => ({
  getLastRun: vi.fn(() => null),
  formatTimeAgo: vi.fn(() => "5m ago"),
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: { writeText: vi.fn(() => Promise.resolve()) },
});

const testRunbooks: Runbook[] = [
  {
    id: "rb-alpha",
    name: "Alpha Runbook",
    description: "First runbook",
    commands: ["docker ps"],
    tags: ["info"],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "rb-beta",
    name: "Beta Runbook",
    description: "Second runbook",
    commands: ["docker images"],
    tags: ["cleanup"],
    createdAt: "2026-01-02T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
  },
  {
    id: "rb-gamma",
    name: "Gamma Runbook",
    description: "Third runbook with info tag",
    commands: ["docker volume ls"],
    tags: ["info", "storage"],
    pinned: true,
    createdAt: "2026-01-03T00:00:00Z",
    updatedAt: "2026-01-03T00:00:00Z",
  },
];

function seedRunbooks(runbooks: Runbook[]) {
  localStorage.setItem("runbooks-data", JSON.stringify(runbooks));
}

function renderList() {
  return render(
    <RunbookProvider>
      <CategoryProvider>
        <RunbookList />
      </CategoryProvider>
    </RunbookProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe("RunbookList", () => {
  it("renders empty state when no runbooks", () => {
    seedRunbooks([]);
    renderList();
    expect(screen.getByText(/No runbooks yet/)).toBeInTheDocument();
  });

  it("renders runbook cards for seeded data", () => {
    seedRunbooks(testRunbooks);
    renderList();
    expect(screen.getByText("Alpha Runbook")).toBeInTheDocument();
    expect(screen.getByText("Beta Runbook")).toBeInTheDocument();
    expect(screen.getByText("Gamma Runbook")).toBeInTheDocument();
  });

  it("search filters runbooks by name", () => {
    seedRunbooks(testRunbooks);
    renderList();
    const searchInput = screen.getByPlaceholderText("Search runbooks... (/)");
    fireEvent.change(searchInput, { target: { value: "Alpha" } });
    expect(screen.getByText("Alpha Runbook")).toBeInTheDocument();
    expect(screen.queryByText("Beta Runbook")).not.toBeInTheDocument();
    expect(screen.queryByText("Gamma Runbook")).not.toBeInTheDocument();
  });

  it("search filters runbooks by tag", () => {
    seedRunbooks(testRunbooks);
    renderList();
    const searchInput = screen.getByPlaceholderText("Search runbooks... (/)");
    fireEvent.change(searchInput, { target: { value: "cleanup" } });
    expect(screen.getByText("Beta Runbook")).toBeInTheDocument();
    expect(screen.queryByText("Alpha Runbook")).not.toBeInTheDocument();
  });

  it("shows no-match message when search yields nothing", () => {
    seedRunbooks(testRunbooks);
    renderList();
    const searchInput = screen.getByPlaceholderText("Search runbooks... (/)");
    fireEvent.change(searchInput, { target: { value: "zzz-nonexistent" } });
    expect(screen.getByText(/No runbooks match/)).toBeInTheDocument();
  });

  it("pinned runbooks appear in a Pinned section in flat mode", () => {
    seedRunbooks(testRunbooks);
    renderList();
    // Gamma is pinned, so "Pinned" divider chip should appear
    expect(screen.getByText("Pinned")).toBeInTheDocument();
  });

  it('"Recently Executed" sort option is available in sort dropdown', () => {
    seedRunbooks(testRunbooks);
    renderList();
    // Open the sort dropdown by clicking on it
    const sortSelect = screen.getByText("Name A-Z");
    fireEvent.mouseDown(sortSelect);
    // The menu item should be rendered in the dropdown
    expect(screen.getByText("Recently Executed")).toBeInTheDocument();
  });

  it("group by tag creates group headers", () => {
    seedRunbooks(testRunbooks);
    renderList();
    // Click the Group chip to cycle from "none" to "tag"
    const groupChip = screen.getByText("Group");
    fireEvent.click(groupChip);
    // After cycling to "By Tag", group headers appear as Typography elements
    // "info" appears as both group header AND tag chips, so use getAllByText
    const infoElements = screen.getAllByText("info");
    expect(infoElements.length).toBeGreaterThanOrEqual(2); // at least header + chip(s)
    const cleanupElements = screen.getAllByText("cleanup");
    expect(cleanupElements.length).toBeGreaterThanOrEqual(1);
    // Verify the "By Tag" label is shown
    expect(screen.getByText("By Tag")).toBeInTheDocument();
  });
});
