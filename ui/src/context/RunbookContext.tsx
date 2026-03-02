import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Runbook } from "../types";
import { loadRunbooks, saveRunbooks, getMissingDefaults } from "../storage";

interface RunbookContextValue {
  runbooks: Runbook[];
  addRunbook: (data: Omit<Runbook, "id" | "createdAt" | "updatedAt">) => void;
  updateRunbook: (id: string, updates: Partial<Omit<Runbook, "id" | "createdAt">>) => void;
  deleteRunbook: (id: string) => void;
  togglePin: (id: string) => void;
  replaceAll: (runbooks: Runbook[]) => void;
  restoreDefaults: () => number;
}

const RunbookContext = createContext<RunbookContextValue | null>(null);

export function RunbookProvider({ children }: { children: ReactNode }) {
  const [runbooks, setRunbooks] = useState<Runbook[]>(() => loadRunbooks());

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

  const restoreDefaults = useCallback((): number => {
    const missing = getMissingDefaults(runbooks);
    if (missing.length > 0) {
      setRunbooks((prev) => {
        const next = [...missing, ...prev];
        saveRunbooks(next);
        return next;
      });
    }
    return missing.length;
  }, [runbooks]);

  return (
    <RunbookContext.Provider value={{ runbooks, addRunbook, updateRunbook, deleteRunbook, togglePin, replaceAll, restoreDefaults }}>
      {children}
    </RunbookContext.Provider>
  );
}

export function useRunbooks(): RunbookContextValue {
  const ctx = useContext(RunbookContext);
  if (!ctx) throw new Error("useRunbooks must be used within RunbookProvider");
  return ctx;
}
