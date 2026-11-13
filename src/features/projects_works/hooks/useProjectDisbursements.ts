"use client";

import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { hasMatrixPermission } from "@/access-control";
import { useAuth } from "@/shared/auth";
import { useCatalog } from "@/shared/catalogs";
import { loadProjectProcedure } from "@/shared/construction-procedures/utils/project-procedure-storage";
import { hasBackendSession } from "@/config/backend";
import { addDisbursement, getDisbursements, getProjectProcedure } from "@/shared/projects_works/services/project.api";
import { procedureHeadings } from "../utils/procedure-target";
import {
  DEFAULT_DISBURSEMENT_CATEGORIES,
  loadCustomCategories,
  loadProjectDisbursements,
  projectFundingBudgets,
  remainingAfterEach,
  saveCustomCategories,
  saveProjectDisbursements,
  signedAmount,
  sourceBalance,
  summarizeDisbursements,
  type DisbursementEntry,
  type DisbursementKind,
} from "@/shared/projects_works/utils/project-disbursement";
import { projectKeys, useProject } from "@/shared/projects_works/hooks/useProjectList";

export type NewDisbursement = Pick<
  DisbursementEntry,
  "kind" | "category" | "fundingSource" | "amount" | "date" | "content" | "attachments"
>;

const CUSTOM_CATEGORIES_KEY = ["projects", "disbursement-custom-categories"] as const;
const NO_ENTRIES: DisbursementEntry[] = [];
const NO_STRINGS: string[] = [];

function useDisbursementHeadings(projectId: string) {
  const project = useProject(projectId);
  const isBackend = hasBackendSession();
  const remote = useQuery({
    queryKey: projectKeys.procedure(projectId),
    queryFn: () => getProjectProcedure(project!),
    enabled: isBackend && Boolean(project),
  });
  const projectCode = project?.code;
  const local = useMemo(
    () => (!isBackend && projectCode ? loadProjectProcedure(projectId, projectCode) : undefined),
    [isBackend, projectId, projectCode],
  );
  const data = isBackend ? remote.data : local;
  return useMemo(() => (data ? procedureHeadings(data) : NO_STRINGS), [data]);
}

export function useProjectDisbursements(projectId: string) {
  const isBackend = hasBackendSession();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const project = useProject(projectId);
  const operatorName = user?.name || user?.displayName || "Cán bộ quản lý";
  const canDisburse = hasMatrixPermission(user, "project:disburse") && project?.status !== "closed";

  const headings = useDisbursementHeadings(projectId);
  const byHeading = headings.length > 0;
  const unit = byHeading ? "đầu mục" : "danh mục";

  const { data: customCategories = NO_STRINGS } = useQuery({
    queryKey: CUSTOM_CATEGORIES_KEY,
    queryFn: loadCustomCategories,
    staleTime: Infinity,
  });
  const { items: catalog, add: addToCatalog } = useCatalog("EXPENSE_TYPE");
  const categories = useMemo(() => {
    if (byHeading) return headings;
    const base = catalog.length > 0 ? catalog.map((c) => c.name) : [...DEFAULT_DISBURSEMENT_CATEGORIES];
    return [...base, ...customCategories.filter((c) => !base.includes(c))];
  }, [byHeading, headings, catalog, customCategories]);

  const { data: entries = NO_ENTRIES } = useQuery({
    queryKey: projectKeys.disbursements(projectId),
    queryFn: async () =>
      isBackend ? (await getDisbursements(projectId, categories)).entries : loadProjectDisbursements(projectId),
  });
  const summary = useMemo(() => summarizeDisbursements(entries, categories), [entries, categories]);

  const totalInvestment = project?.totalInvestment || 0;
  const remaining = totalInvestment > 0 ? Math.max(0, totalInvestment - summary.total) : undefined;
  const budgets = useMemo(() => (project ? projectFundingBudgets(project) : []), [project]);
  const perSource = budgets.some((b) => b.amount > 0);
  const remainingById = useMemo(
    () => remainingAfterEach(entries, budgets, totalInvestment),
    [entries, budgets, totalInvestment],
  );

  const limitFor = (kind: DisbursementKind, category: string, source?: string) => {
    if (kind === "withdraw") {
      return entries
        .filter((e) => e.category === category && (!source || e.fundingSource === source))
        .reduce((sum, e) => sum + signedAmount(e), 0);
    }
    const budget = budgets.find((b) => b.source === source);
    if (perSource && budget && budget.amount > 0) return Math.max(0, sourceBalance(entries, budget));
    return remaining;
  };

  const add = useCallback(
    async (input: NewDisbursement, files: File[] = []) => {
      if (isBackend) {
        try {
          return await addDisbursement(projectId, input, operatorName, files);
        } finally {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: projectKeys.disbursements(projectId) }),
            queryClient.invalidateQueries({ queryKey: projectKeys.list() }),
          ]);
        }
      }
      const now = new Date();
      const entry: DisbursementEntry = {
        ...input,
        id: `GN-${now.getTime()}`,
        createdBy: operatorName,
        createdAt: now.toISOString(),
      };
      const next = [entry, ...loadProjectDisbursements(projectId)];
      saveProjectDisbursements(projectId, next);
      queryClient.setQueryData(projectKeys.disbursements(projectId), next);
      return entry;
    },
    [isBackend, operatorName, projectId, queryClient],
  );

  const addCategory = useCallback(
    (name: string) => {
      if (byHeading || categories.includes(name)) return;
      const next = [...customCategories, name];
      saveCustomCategories(next);
      queryClient.setQueryData(CUSTOM_CATEGORIES_KEY, next);
      void addToCatalog(name);
    },
    [byHeading, categories, customCategories, addToCatalog, queryClient],
  );

  return {
    project,
    isBackend,
    operatorName,
    canDisburse,
    byHeading,
    unit,
    entries,
    categories,
    summary,
    totalInvestment,
    budgets,
    perSource,
    remainingById,
    limitFor,
    add,
    addCategory,
  };
}
