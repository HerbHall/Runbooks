import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Runbook } from "../types";
import { loadRunbooks, saveRunbooks, resetExamples, loadPreference, savePreference, DEFAULT_RUNBOOKS } from "../storage";

interface RunbookContextValue {
  runbooks: Runbook[];
  addRunbook: (data: Omit<Runbook, "id" | "createdAt" | "updatedAt">) => void;
  updateRunbook: (id: string, updates: Partial<Omit<Runbook, "id" | "createdAt">>) => void;
  deleteRunbook: (id: string) => void;
  togglePin: (id: string) => void;
  replaceAll: (runbooks: Runbook[]) => void;
  showExamples: boolean;
  setShowExamples: (show: boolean) => void;
  resetExamplesToDefaults: () => void;
}

const RunbookContext = createContext<RunbookContextValue | null>(null);

export function RunbookProvider({ children }: { children: ReactNode }) {
  const [runbooks, setRunbooks] = useState<Runbook[]>(() => loadRunbooks());
  const [showExamples, setShowExamplesState] = useState<boolean>(
    () => loadPreference<boolean>("showExamples", true),
  );

  const setShowExamples = useCallback((show: boolean) => {
    setShowExamplesState(show);
    savePreference("showExamples", show);
    if (show) {
      // If enabling and no examples exist, add defaults
      setRunbooks((prev) => {
        const hasExamples = prev.some((r) => r.id.startsWith("example-"));
        if (!hasExamples) {
          const next = [...DEFAULT_RUNBOOKS, ...prev];
          saveRunbooks(next);
          return next;
        }
        return prev;
      });
    }
  }, []);

  const resetExamplesToDefaults = useCallback(() => {
    setRunbooks((prev) => {
      const next = resetExamples(prev);
      saveRunbooks(next);
      return next;
    });
  }, []);

  const addRunbook = useCallback(
    (data: Omit<Runbook, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString();
      const newRunbook: Runbook = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      setRunbooks((prev) => {
        const next = [...prev, newRunbook];
        saveRunbooks(next);
        return next;
      });
    },
    [],
  );

  const updateRunbook = useCallback(
    (id: string, updates: Partial<Omit<Runbook, "id" | "createdAt">>) => {
      setRunbooks((prev) => {
        const next = prev.map((r) =>
          r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r,
        );
        saveRunbooks(next);
        return next;
      });
    },
    [],
  );

  const deleteRunbook = useCallback((id: string) => {
    setRunbooks((prev) => {
      const next = prev.filter((r) => r.id !== id);
      saveRunbooks(next);
      return next;
    });
  }, []);

  const togglePin = useCallback((id: string) => {
    setRunbooks((prev) => {
      const next = prev.map((r) =>
        r.id === id ? { ...r, pinned: !r.pinned, updatedAt: new Date().toISOString() } : r,
      );
      saveRunbooks(next);
      return next;
    });
  }, []);

  const replaceAll = useCallback((imported: Runbook[]) => {
    saveRunbooks(imported);
    setRunbooks(imported);
  }, []);

  return (
    <RunbookContext.Provider value={{ runbooks, addRunbook, updateRunbook, deleteRunbook, togglePin, replaceAll, showExamples, setShowExamples, resetExamplesToDefaults }}>
      {children}
    </RunbookContext.Provider>
  );
}

export function useRunbooks(): RunbookContextValue {
  const ctx = useContext(RunbookContext);
  if (!ctx) throw new Error("useRunbooks must be used within RunbookProvider");
  return ctx;
}
