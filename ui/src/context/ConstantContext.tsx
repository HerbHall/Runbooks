import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { GlobalVariable } from "../types";
import { loadGlobalVariables, saveGlobalVariables } from "../storage";

interface ConstantContextValue {
  constants: GlobalVariable[];
  addConstant: (data: Omit<GlobalVariable, "id" | "createdAt" | "updatedAt">) => void;
  updateConstant: (id: string, updates: Partial<Omit<GlobalVariable, "id" | "createdAt">>) => void;
  deleteConstant: (id: string) => void;
  replaceAllConstants: (constants: GlobalVariable[]) => void;
  getConstantValue: (name: string) => string | undefined;
  getConstant: (name: string) => GlobalVariable | undefined;
}

const ConstantContext = createContext<ConstantContextValue | null>(null);

export function ConstantProvider({ children }: { children: ReactNode }) {
  const [constants, setConstants] = useState<GlobalVariable[]>(() => loadGlobalVariables());

  const addConstant = useCallback(
    (data: Omit<GlobalVariable, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString();
      setConstants((prev) => {
        const next = [...prev, { ...data, id: crypto.randomUUID(), createdAt: now, updatedAt: now }];
        saveGlobalVariables(next);
        return next;
      });
    },
    [],
  );

  const updateConstant = useCallback(
    (id: string, updates: Partial<Omit<GlobalVariable, "id" | "createdAt">>) => {
      setConstants((prev) => {
        const next = prev.map((c) =>
          c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c,
        );
        saveGlobalVariables(next);
        return next;
      });
    },
    [],
  );

  const deleteConstant = useCallback((id: string) => {
    setConstants((prev) => {
      const next = prev.filter((c) => c.id !== id);
      saveGlobalVariables(next);
      return next;
    });
  }, []);

  const replaceAllConstants = useCallback((imported: GlobalVariable[]) => {
    saveGlobalVariables(imported);
    setConstants(imported);
  }, []);

  const getConstantValue = useCallback(
    (name: string) => constants.find((c) => c.name === name)?.value,
    [constants],
  );

  const getConstant = useCallback(
    (name: string) => constants.find((c) => c.name === name),
    [constants],
  );

  return (
    <ConstantContext.Provider
      value={{ constants, addConstant, updateConstant, deleteConstant, replaceAllConstants, getConstantValue, getConstant }}
    >
      {children}
    </ConstantContext.Provider>
  );
}

export function useConstants(): ConstantContextValue {
  const ctx = useContext(ConstantContext);
  if (!ctx) throw new Error("useConstants must be used within ConstantProvider");
  return ctx;
}
