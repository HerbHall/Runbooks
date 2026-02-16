import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Category } from "../types";
import { loadCategories, saveCategories } from "../storage";

interface CategoryContextValue {
  categories: Category[];
  addCategory: (data: Omit<Category, "id" | "order">) => void;
  updateCategory: (id: string, updates: Partial<Omit<Category, "id">>) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (ids: string[]) => void;
  replaceAllCategories: (categories: Category[]) => void;
}

const CategoryContext = createContext<CategoryContextValue | null>(null);

export function CategoryProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(() => loadCategories());

  const addCategory = useCallback(
    (data: Omit<Category, "id" | "order">) => {
      setCategories((prev) => {
        const newCat: Category = {
          ...data,
          id: `cat-${crypto.randomUUID().slice(0, 8)}`,
          order: prev.length,
        };
        const next = [...prev, newCat];
        saveCategories(next);
        return next;
      });
    },
    [],
  );

  const updateCategory = useCallback(
    (id: string, updates: Partial<Omit<Category, "id">>) => {
      setCategories((prev) => {
        const next = prev.map((c) => (c.id === id ? { ...c, ...updates } : c));
        saveCategories(next);
        return next;
      });
    },
    [],
  );

  const deleteCategory = useCallback((id: string) => {
    setCategories((prev) => {
      const next = prev
        .filter((c) => c.id !== id)
        .map((c, i) => ({ ...c, order: i }));
      saveCategories(next);
      return next;
    });
  }, []);

  const reorderCategories = useCallback((ids: string[]) => {
    setCategories((prev) => {
      const map = new Map(prev.map((c) => [c.id, c]));
      const next = ids
        .map((id) => map.get(id))
        .filter((c): c is Category => c !== undefined)
        .map((c, i) => ({ ...c, order: i }));
      saveCategories(next);
      return next;
    });
  }, []);

  const replaceAllCategories = useCallback((imported: Category[]) => {
    saveCategories(imported);
    setCategories(imported);
  }, []);

  return (
    <CategoryContext.Provider
      value={{ categories, addCategory, updateCategory, deleteCategory, reorderCategories, replaceAllCategories }}
    >
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories(): CategoryContextValue {
  const ctx = useContext(CategoryContext);
  if (!ctx) throw new Error("useCategories must be used within CategoryProvider");
  return ctx;
}
