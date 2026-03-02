import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Runbook, ExecutionHistoryEntry } from "../types";
import { RunbookProvider } from "../context/RunbookContext";
import { CategoryProvider } from "../context/CategoryContext";
import { RunbookCard } from "../components/RunbookCard";

// Mock the Docker Desktop client used by child components
vi.mock("../App", () => ({
  useDockerDesktopClient: vi.fn(() => ({
    docker: { cli: { exec: vi.fn() } },
    desktopUI: { toast: { success: vi.fn(), error: vi.fn() } },
  })),
}));

// Mock child dialog components to avoid pulling in their full dependency trees
vi.mock("../components/RunbookFormDialog", () => ({
  RunbookFormDialog: () => null,
}));
vi.mock("../components/RunbookDeleteDialog", () => ({
  RunbookDeleteDialog: () => null,
}));
vi.mock("../components/RunbookExecutionDialog", () => ({
  RunbookExecutionDialog: () => null,
}));

// Mock execution history utilities
const mockGetLastRun = vi.fn<(id: string) => ExecutionHistoryEntry | null>(() => null);
const mockFormatTimeAgo = vi.fn<(ts: string) => string>(() => "5m ago");
vi.mock("../utils/execution-history", () => ({
  getLastRun: (id: string) => mockGetLastRun(id),
  formatTimeAgo: (ts: string) => mockFormatTimeAgo(ts),
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: { writeText: vi.fn(() => Promise.resolve()) },
});

const baseRunbook: Runbook = {
  id: "test-1",
  name: "Test Runbook",
  description: "A test description",
  commands: ["docker ps", "docker images"],
  tags: ["info", "test"],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <RunbookProvider>
      <CategoryProvider>{ui}</CategoryProvider>
    </RunbookProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  mockGetLastRun.mockReturnValue(null);
  mockFormatTimeAgo.mockReturnValue("5m ago");
});

describe("RunbookCard", () => {
  it("renders runbook name and description", () => {
    renderWithProviders(<RunbookCard runbook={baseRunbook} />);
    expect(screen.getByText("Test Runbook")).toBeInTheDocument();
    expect(screen.getByText("A test description")).toBeInTheDocument();
  });

  it("renders command text in code block", () => {
    renderWithProviders(<RunbookCard runbook={baseRunbook} />);
    // Commands are joined with newlines and rendered in a code block
    const codeEl = screen.getByText((_, element) =>
      element?.tagName === "CODE" && element.textContent?.includes("docker ps") || false,
    );
    expect(codeEl).toBeInTheDocument();
  });

  it("renders tags as chips", () => {
    renderWithProviders(<RunbookCard runbook={baseRunbook} />);
    expect(screen.getByText("info")).toBeInTheDocument();
    expect(screen.getByText("test")).toBeInTheDocument();
  });

  it("shows StarBorder icon when not pinned", () => {
    renderWithProviders(<RunbookCard runbook={baseRunbook} />);
    const pinButton = screen.getByTitle("Pin");
    expect(pinButton).toBeInTheDocument();
    // StarBorderIcon is rendered via data-testid or we check the button title
    expect(pinButton).toHaveAttribute("title", "Pin");
  });

  it("shows Star icon when pinned", () => {
    const pinnedRunbook: Runbook = { ...baseRunbook, pinned: true };
    renderWithProviders(<RunbookCard runbook={pinnedRunbook} />);
    const unpinButton = screen.getByTitle("Unpin");
    expect(unpinButton).toBeInTheDocument();
  });

  it("shows warning-colored star button when pinned", () => {
    const pinnedRunbook: Runbook = { ...baseRunbook, pinned: true };
    renderWithProviders(<RunbookCard runbook={pinnedRunbook} />);
    const unpinButton = screen.getByTitle("Unpin");
    // MUI applies the color class for "warning"
    expect(unpinButton).toHaveClass("MuiIconButton-colorWarning");
  });

  it('shows "Last run" text when execution history exists', () => {
    mockGetLastRun.mockReturnValue({
      timestamp: "2026-01-15T12:00:00Z",
      exitCode: 0,
      duration: 1500,
      commandCount: 2,
      outputSnippet: "some output",
    });
    mockFormatTimeAgo.mockReturnValue("5m ago");

    renderWithProviders(<RunbookCard runbook={baseRunbook} />);
    expect(screen.getByText(/Last run:/)).toBeInTheDocument();
    expect(screen.getByText(/5m ago/)).toBeInTheDocument();
    expect(screen.getByText(/success/)).toBeInTheDocument();
  });

  it('does not show "Last run" when no history', () => {
    mockGetLastRun.mockReturnValue(null);
    renderWithProviders(<RunbookCard runbook={baseRunbook} />);
    expect(screen.queryByText(/Last run:/)).not.toBeInTheDocument();
  });

  it("shows failed status for non-zero exit code in last run", () => {
    mockGetLastRun.mockReturnValue({
      timestamp: "2026-01-15T12:00:00Z",
      exitCode: 1,
      duration: 500,
      commandCount: 1,
      outputSnippet: "error",
    });
    renderWithProviders(<RunbookCard runbook={baseRunbook} />);
    expect(screen.getByText(/failed/)).toBeInTheDocument();
  });

  it("collapses and expands card content", () => {
    const toggleFn = vi.fn();
    renderWithProviders(
      <RunbookCard runbook={baseRunbook} collapsed={false} onToggleCollapse={toggleFn} />,
    );
    // Description should be visible when not collapsed
    expect(screen.getByText("A test description")).toBeInTheDocument();

    // Click the collapse button
    const collapseButton = screen.getByTitle("Collapse");
    fireEvent.click(collapseButton);
    expect(toggleFn).toHaveBeenCalledTimes(1);
  });

  it("renders action buttons (Run, Copy, Edit, Delete)", () => {
    renderWithProviders(<RunbookCard runbook={baseRunbook} />);
    expect(screen.getByTitle("Run")).toBeInTheDocument();
    expect(screen.getByTitle("Copy commands")).toBeInTheDocument();
    expect(screen.getByTitle("Edit")).toBeInTheDocument();
    expect(screen.getByTitle("Delete")).toBeInTheDocument();
  });
});
