import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import type { Runbook } from "../types";
import { RunbookExecutionDialog } from "../components/RunbookExecutionDialog";

const mockRecordExecution = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
const mockClose = vi.fn();

// Mock @docker/extension-api-client before any component imports
vi.mock("@docker/extension-api-client", () => ({
  createDockerDesktopClient: vi.fn(() => ({
    docker: { cli: { exec: vi.fn() } },
    desktopUI: {
      toast: { success: vi.fn(), error: vi.fn() },
      navigate: {
        viewContainers: vi.fn(),
        viewImages: vi.fn(),
        viewVolumes: vi.fn(),
      },
    },
    host: { openExternal: vi.fn() },
  })),
}));

// Mock execution history
vi.mock("../utils/execution-history", () => ({
  recordExecution: (...args: unknown[]) => mockRecordExecution(...args),
  getLastRun: vi.fn(() => null),
  formatTimeAgo: vi.fn(() => "5m ago"),
}));

// Mock variables utilities (hasVariables returns false so execution starts immediately)
vi.mock("../utils/variables", () => ({
  hasVariables: vi.fn(() => false),
  parseVariables: vi.fn(() => []),
  substituteVariables: vi.fn((cmds: string[]) => cmds),
  VARIABLE_REGEX: /(?<!\\)\{\{([a-zA-Z_][a-zA-Z0-9_]*)(?:=([^|}]*))?(?:\|([^}]+))?\}\}/g,
  escapeHtml: vi.fn((s: string) => s),
}));

// Mock destructive commands (return no warnings so execution proceeds)
vi.mock("../utils/destructive-commands", () => ({
  getDestructiveWarnings: vi.fn(() => []),
}));

// Mock ParameterInputDialog
vi.mock("../components/ParameterInputDialog", () => ({
  ParameterInputDialog: () => null,
}));

// Track streaming behavior
let streamCallbacks: {
  onOutput?: (data: { stdout?: string; stderr?: string }) => void;
  onClose?: (exitCode: number) => void;
  onError?: (error: unknown) => void;
} = {};

const mockNavigateContainers = vi.fn();
const mockNavigateImages = vi.fn();
const mockNavigateVolumes = vi.fn();

vi.mock("../App", () => ({
  useDockerDesktopClient: vi.fn(() => ({
    docker: {
      cli: {
        exec: vi.fn((_cmd: string, _args: string[], options?: { stream?: typeof streamCallbacks }) => {
          if (options?.stream) {
            streamCallbacks = options.stream;
            return { close: mockClose };
          }
          return Promise.resolve({ stdout: "output", stderr: "" });
        }),
      },
    },
    desktopUI: {
      toast: {
        success: mockToastSuccess,
        error: mockToastError,
      },
      navigate: {
        viewContainers: mockNavigateContainers,
        viewImages: mockNavigateImages,
        viewVolumes: mockNavigateVolumes,
      },
    },
  })),
}));

const simpleRunbook: Runbook = {
  id: "exec-test-1",
  name: "Test Execution",
  description: "Simple runbook for testing execution",
  commands: ["docker ps"],
  tags: [],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const multiCommandRunbook: Runbook = {
  id: "exec-test-2",
  name: "Multi-Command",
  description: "Runbook with multiple commands",
  commands: ["docker ps", "docker images"],
  tags: [],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const containerRunbook: Runbook = {
  id: "exec-test-3",
  name: "Container Runbook",
  description: "Runbook with container commands",
  commands: ["docker run nginx"],
  tags: [],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  localStorage.clear();
  mockRecordExecution.mockClear();
  mockToastSuccess.mockClear();
  mockToastError.mockClear();
  mockClose.mockClear();
  mockNavigateContainers.mockClear();
  mockNavigateImages.mockClear();
  mockNavigateVolumes.mockClear();
  streamCallbacks = {};
});

describe("RunbookExecutionDialog", () => {
  describe("Preview", () => {
    it("shows preview when dialog opens", async () => {
      render(
        <RunbookExecutionDialog open={true} onClose={vi.fn()} runbook={simpleRunbook} />,
      );
      await waitFor(() => {
        expect(screen.getByText(/Preview: Test Execution/)).toBeInTheDocument();
      });
      expect(screen.getByText(/Review the commands that will be executed/)).toBeInTheDocument();
      expect(screen.getByText(/\$ docker ps/)).toBeInTheDocument();
    });

    it("shows Run, Copy, Cancel buttons in preview", async () => {
      render(
        <RunbookExecutionDialog open={true} onClose={vi.fn()} runbook={simpleRunbook} />,
      );
      await waitFor(() => {
        expect(screen.getByText("Run")).toBeInTheDocument();
      });
      expect(screen.getByText("Copy")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("shows all commands in preview for multi-command runbook", async () => {
      render(
        <RunbookExecutionDialog open={true} onClose={vi.fn()} runbook={multiCommandRunbook} />,
      );
      await waitFor(() => {
        expect(screen.getByText(/Preview: Multi-Command/)).toBeInTheDocument();
      });
      expect(screen.getByText(/\$ docker ps/)).toBeInTheDocument();
      expect(screen.getByText(/\$ docker images/)).toBeInTheDocument();
    });

    it("clicking Cancel in preview closes dialog", async () => {
      const onClose = vi.fn();
      render(
        <RunbookExecutionDialog open={true} onClose={onClose} runbook={simpleRunbook} />,
      );
      await waitFor(() => {
        expect(screen.getByText("Cancel")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("Cancel"));
      expect(onClose).toHaveBeenCalled();
    });

    it("clicking Run in preview starts execution", async () => {
      render(
        <RunbookExecutionDialog open={true} onClose={vi.fn()} runbook={simpleRunbook} />,
      );
      await waitFor(() => {
        expect(screen.getByText("Run")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("Run"));
      await waitFor(() => {
        expect(screen.getByText(/Running:/)).toBeInTheDocument();
      });
    });
  });

  describe("Execution (after preview)", () => {
    it("renders dialog with runbook name in running state", async () => {
      render(
        <RunbookExecutionDialog open={true} onClose={vi.fn()} runbook={simpleRunbook} />,
      );
      await waitFor(() => {
        expect(screen.getByText("Run")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("Run"));
      await waitFor(() => {
        expect(screen.getByText(/Test Execution/)).toBeInTheDocument();
      });
    });

    it("shows commands in the running dialog", async () => {
      render(
        <RunbookExecutionDialog open={true} onClose={vi.fn()} runbook={multiCommandRunbook} />,
      );
      await waitFor(() => {
        expect(screen.getByText("Run")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("Run"));
      await waitFor(() => {
        expect(screen.getByText(/Running:/)).toBeInTheDocument();
      });
      expect(screen.getByText(/\$ docker ps/)).toBeInTheDocument();
      expect(screen.getByText(/\$ docker images/)).toBeInTheDocument();
    });

    it("shows streaming output during execution", async () => {
      render(
        <RunbookExecutionDialog open={true} onClose={vi.fn()} runbook={simpleRunbook} />,
      );
      await waitFor(() => {
        expect(screen.getByText("Run")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("Run"));

      // Wait for execution to start and streaming to be set up
      await waitFor(() => {
        expect(streamCallbacks.onOutput).toBeDefined();
      });

      // Simulate streaming output (wrap in act to flush state updates)
      act(() => {
        streamCallbacks.onOutput?.({ stdout: "container-list-output\n" });
      });

      await waitFor(() => {
        expect(screen.getByText(/container-list-output/)).toBeInTheDocument();
      });
    });

    it("records execution history on completion", async () => {
      render(
        <RunbookExecutionDialog open={true} onClose={vi.fn()} runbook={simpleRunbook} />,
      );
      await waitFor(() => {
        expect(screen.getByText("Run")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("Run"));

      await waitFor(() => {
        expect(streamCallbacks.onClose).toBeDefined();
      });

      // Complete the execution
      streamCallbacks.onClose?.(0);

      await waitFor(() => {
        expect(mockRecordExecution).toHaveBeenCalledWith(
          "exec-test-1",
          0,
          expect.any(Number),
          1,
          expect.any(String),
        );
      });
    });

    it("shows success message on completion", async () => {
      render(
        <RunbookExecutionDialog open={true} onClose={vi.fn()} runbook={simpleRunbook} />,
      );
      await waitFor(() => {
        expect(screen.getByText("Run")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("Run"));

      await waitFor(() => {
        expect(streamCallbacks.onClose).toBeDefined();
      });

      streamCallbacks.onClose?.(0);

      await waitFor(() => {
        expect(screen.getByText(/All commands completed successfully/)).toBeInTheDocument();
      });
    });

    it("shows Close button when not running", async () => {
      render(
        <RunbookExecutionDialog open={true} onClose={vi.fn()} runbook={simpleRunbook} />,
      );
      await waitFor(() => {
        expect(screen.getByText("Run")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("Run"));

      await waitFor(() => {
        expect(streamCallbacks.onClose).toBeDefined();
      });

      // Complete execution to transition out of running state
      streamCallbacks.onClose?.(0);

      await waitFor(() => {
        expect(screen.getByText("Close")).toBeInTheDocument();
      });
    });
  });

  describe("Navigation Links", () => {
    it("shows View Containers button after container command completes", async () => {
      render(
        <RunbookExecutionDialog open={true} onClose={vi.fn()} runbook={containerRunbook} />,
      );
      await waitFor(() => {
        expect(screen.getByText("Run")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("Run"));

      await waitFor(() => {
        expect(streamCallbacks.onClose).toBeDefined();
      });

      streamCallbacks.onClose?.(0);

      await waitFor(() => {
        expect(screen.getByText("View Containers")).toBeInTheDocument();
      });
    });

    it("calls navigate.viewContainers when View Containers is clicked", async () => {
      render(
        <RunbookExecutionDialog open={true} onClose={vi.fn()} runbook={containerRunbook} />,
      );
      await waitFor(() => {
        expect(screen.getByText("Run")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("Run"));

      await waitFor(() => {
        expect(streamCallbacks.onClose).toBeDefined();
      });

      streamCallbacks.onClose?.(0);

      await waitFor(() => {
        expect(screen.getByText("View Containers")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("View Containers"));
      expect(mockNavigateContainers).toHaveBeenCalled();
    });

    it("does not show navigation buttons for non-navigable commands", async () => {
      render(
        <RunbookExecutionDialog open={true} onClose={vi.fn()} runbook={simpleRunbook} />,
      );
      await waitFor(() => {
        expect(screen.getByText("Run")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("Run"));

      await waitFor(() => {
        expect(streamCallbacks.onClose).toBeDefined();
      });

      streamCallbacks.onClose?.(0);

      await waitFor(() => {
        expect(screen.getByText("Close")).toBeInTheDocument();
      });

      expect(screen.queryByText("View Containers")).not.toBeInTheDocument();
      expect(screen.queryByText("View Images")).not.toBeInTheDocument();
      expect(screen.queryByText("View Volumes")).not.toBeInTheDocument();
    });

    it("shows navigation buttons even when execution fails", async () => {
      render(
        <RunbookExecutionDialog open={true} onClose={vi.fn()} runbook={containerRunbook} />,
      );
      await waitFor(() => {
        expect(screen.getByText("Run")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("Run"));

      await waitFor(() => {
        expect(streamCallbacks.onClose).toBeDefined();
      });

      streamCallbacks.onClose?.(1);

      await waitFor(() => {
        expect(screen.getByText(/Execution stopped due to error/)).toBeInTheDocument();
      });

      expect(screen.getByText("View Containers")).toBeInTheDocument();
    });
  });
});
