"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCatalog } from "@/features/catalogs";
import { hasBackendSession } from "@/features/personnel-assignment/services/backend";
import { addDisbursement, getDisbursements } from "../services/project.api";
import { projectKeys } from "./useProjectList";
import {
  DEFAULT_DISBURSEMENT_CATEGORIES,
  loadCustomCategories,
  loadProjectDisbursements,
  saveCustomCategories,
  saveProjectDisbursements,
  summarizeDisbursements,
  type DisbursementEntry,
} from "../utils/project-disbursement";

export type NewDisbursement = Pick<DisbursementEntry, "kind" | "category" | "amount" | "content" | "attachments">;

export function useProjectDisbursements(
  projectId: string,
  operatorName: string,
  headings?: readonly string[],
) {
  const isBackend = hasBackendSession();
  const queryClient = useQueryClient();
  const [localEntries, setEntries] = useState<DisbursementEntry[]>(() =>
    isBackend ? [] : loadProjectDisbursements(projectId),
  );
  const [customCategories, setCustomCategories] = useState<string[]>(loadCustomCategories);

  const { items: catalog, add: addToCatalog } = useCatalog("EXPENSE_TYPE");
  const headingKey = JSON.stringify(headings ?? []);
  const categories = useMemo(() => {
    const list = JSON.parse(headingKey) as string[];
    if (list.length > 0) return list;
    const base = catalog.length > 0 ? catalog.map((c) => c.name) : [...DEFAULT_DISBURSEMENT_CATEGORIES];
    return [...base, ...customCategories.filter((c) => !base.includes(c))];
  }, [catalog, customCategories, headingKey]);

  const remote = useQuery({
    queryKey: projectKeys.disbursements(projectId),
    queryFn: () => getDisbursements(projectId, categories),
    enabled: isBackend,
  });
  const remoteEntries = remote.data?.entries;
  const entries = useMemo(
    () => (isBackend ? (remoteEntries ?? []) : localEntries),
    [isBackend, remoteEntries, localEntries],
  );
  const summary = useMemo(() => summarizeDisbursements(entries, categories), [entries, categories]);

  const commit = useCallback(
    (next: DisbursementEntry[]) => {
      setEntries(next);
      saveProjectDisbursements(projectId, next);
    },
    [projectId],
  );

  const add = useCallback(
    async (input: NewDisbursement, files: File[] = []) => {
      if (isBackend) {
        const entry = await addDisbursement(projectId, input, operatorName, files);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: projectKeys.disbursements(projectId) }),
          queryClient.invalidateQueries({ queryKey: projectKeys.list() }),
        ]);
        return entry;
      }
      const now = new Date();
      const entry: DisbursementEntry = {
        ...input,
        id: `GN-${now.getTime()}`,
        date: now.toISOString().slice(0, 10),
        createdBy: operatorName,
        createdAt: now.toISOString(),
      };
      commit([entry, ...entries]);
      return entry;
    },
    [entries, commit, operatorName, isBackend, projectId, queryClient],
  );

  const remove = useCallback((id: string) => commit(entries.filter((e) => e.id !== id)), [entries, commit]);

  const addCategory = useCallback(
    (name: string) => {
      if (categories.includes(name)) return;
      const next = [...customCategories, name];
      setCustomCategories(next);
      saveCustomCategories(next);
      void addToCatalog(name);
    },
    [categories, customCategories, addToCatalog],
  );

  return { isBackend, entries, categories, summary, add, remove, addCategory };
}
