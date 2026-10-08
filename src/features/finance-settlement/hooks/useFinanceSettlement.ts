"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth";
import type {
  CapitalPlanAdjustmentInput,
  CapitalPlanInput,
  DisbursementInput,
  FinanceDataset,
  FinanceFilters,
} from "../types/finance.types";
import { mockFinanceRepository } from "../services/mock-finance.repository";
import type { SettlementStepPayload } from "../services/finance.repository";
import { getWorkingDaysUntil, validateDisbursement } from "../utils/finance-rules";
import { getFinanceRolePermissions } from "../utils/finance-permissions";
import { buildFinanceTasks } from "../utils/finance-workspace";

const EMPTY_DATASET: FinanceDataset = {
  projects: [],
  contracts: [],
  treasuryAccounts: [],
  capitalPlans: [],
  disbursements: [],
  settlements: [],
};

export function useFinanceSettlement() {
  const { user } = useAuth();
  const [data, setData] = useState<FinanceDataset>(EMPTY_DATASET);
  const [filters, setFilters] = useState<FinanceFilters>({ year: 2026, projectId: "ALL" });
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const rolePermissions = useMemo(() => getFinanceRolePermissions(user), [user]);

  const refresh = useCallback(async () => {
    setData(await mockFinanceRepository.getDataset());
  }, []);

  useEffect(() => {
    let active = true;
    mockFinanceRepository.getDataset().then((result) => {
      if (active) {
        setData(result);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  const visiblePlans = useMemo(
    () => data.capitalPlans.filter((plan) =>
      plan.year === filters.year && (filters.projectId === "ALL" || plan.projectId === filters.projectId)),
    [data.capitalPlans, filters],
  );

  const visibleDisbursements = useMemo(
    () => data.disbursements.filter((item) =>
      (filters.projectId === "ALL" || item.projectId === filters.projectId) &&
      new Date(item.approvalDate).getFullYear() === filters.year),
    [data.disbursements, filters],
  );

  const visibleSettlements = useMemo(
    () => data.settlements.filter((item) =>
      filters.projectId === "ALL" || item.projectId === filters.projectId),
    [data.settlements, filters.projectId],
  );

  const kpis = useMemo(() => {
    const planned = visiblePlans.reduce(
      (sum, plan) => sum + plan.initialAmount + plan.adjustmentAmount,
      0,
    );
    const disbursed = visibleDisbursements
      .filter((item) => item.status === "APPROVED")
      .reduce((sum, item) => sum + item.amount, 0);

    const pendingChief = visibleDisbursements.filter((item) => item.status === "PENDING_CHIEF").length;
    const pendingDirector = visibleDisbursements.filter((item) => item.status === "PENDING_DIRECTOR").length;
    const pending = pendingChief + pendingDirector;

    return {
      planned,
      disbursed,
      ratio: planned > 0 ? Math.round((disbursed / planned) * 1000) / 10 : 0,
      pending,
      pendingChief,
      pendingDirector,
    };
  }, [visibleDisbursements, visiblePlans]);

  const { dueSoon, overdue } = useMemo(() => {
    const pendingWithDays = visibleDisbursements
      .filter((item) => item.status === "PENDING_CHIEF" || item.status === "PENDING_DIRECTOR")
      .map((item) => ({ item, days: getWorkingDaysUntil(item.dueDate) }));
    return {
      dueSoon: pendingWithDays.filter(({ days }) => days >= 0 && days <= 5).map(({ item }) => item),
      overdue: pendingWithDays.filter(({ days }) => days < 0).map(({ item }) => item),
    };
  }, [visibleDisbursements]);

  const contractCapWarnings = useMemo(() => {
    return data.contracts.filter((contract) => {
      if (filters.projectId !== "ALL" && contract.projectId !== filters.projectId) return false;
      if (!contract.value || contract.value <= 0) return false;
      const usage = (contract.disbursed / contract.value) * 100;
      return usage >= 95;
    });
  }, [data.contracts, filters.projectId]);

  const tasks = useMemo(
    () => buildFinanceTasks({
      permissions: rolePermissions,
      disbursements: visibleDisbursements,
      settlements: visibleSettlements,
      plans: visiblePlans,
      overdueCount: overdue.length,
      dueSoonCount: dueSoon.length,
      contractWarningCount: contractCapWarnings.length,
    }),
    [
      contractCapWarnings.length,
      dueSoon.length,
      overdue.length,
      rolePermissions,
      visibleDisbursements,
      visiblePlans,
      visibleSettlements,
    ],
  );

  const runMutation = useCallback(async (action: () => Promise<unknown>, successText: string) => {
    try {
      setFeedback(null);
      await action();
      await refresh();
      setFeedback({ type: "success", text: successText });
      return true;
    } catch (error) {
      setFeedback({ type: "error", text: error instanceof Error ? error.message : "Không thể hoàn tất thao tác." });
      return false;
    }
  }, [refresh]);

  const createDisbursement = useCallback(async (input: DisbursementInput) => {
    const project = data.projects.find((item) => item.id === input.projectId);
    const contract = data.contracts.find((item) => item.id === input.contractId);
    if (!project) {
      setFeedback({ type: "error", text: "Dự án không hợp lệ." });
      return false;
    }
    const projectDisbursed = data.disbursements
      .filter((item) => item.projectId === input.projectId && item.status !== "REJECTED")
      .reduce((sum, item) => sum + item.amount, 0);
    const errors = validateDisbursement({
      amount: input.amount,
      contractRemaining: contract ? contract.value - contract.disbursed : undefined,
      projectDisbursed,
      projectInvestment: project.totalInvestment,
      evidenceCount: input.evidence.length,
    });
    const error = Object.values(errors)[0];
    if (error) {
      setFeedback({ type: "error", text: error });
      return false;
    }

    const actorName = user?.displayName || user?.name || "Nguyễn Thị Thúy Hà";

    return runMutation(
      () => mockFinanceRepository.createDisbursement(input, actorName),
      "Đã lập đợt giải ngân và chuyển Kế toán trưởng duyệt (cấp 1).",
    );
  }, [data, runMutation, user]);

  const approveDisbursement = useCallback(async (id: string) => {
    const actorName = user?.displayName || user?.name;
    const item = data.disbursements.find((entry) => entry.id === id);
    const isChiefLevel = item?.status === "PENDING_CHIEF";
    return runMutation(
      () => mockFinanceRepository.approveDisbursement(
        id,
        actorName,
        isChiefLevel ? "Kế toán trưởng" : "Giám đốc",
      ),
      isChiefLevel
        ? `Đã duyệt cấp 1 hồ sơ ${item?.code ?? ""} và chuyển Giám đốc phê duyệt.`
        : `Đã phê duyệt cấp 2 hồ sơ ${item?.code ?? ""}, sẵn sàng chuyển KBNN.`,
    );
  }, [data.disbursements, runMutation, user]);

  const rejectDisbursement = useCallback(async (id: string, reason: string) => {
    const actorName = user?.displayName || user?.name;
    const item = data.disbursements.find((entry) => entry.id === id);
    const actorRole = item?.status === "PENDING_CHIEF" ? "Kế toán trưởng" : "Giám đốc";
    return runMutation(
      () => mockFinanceRepository.rejectDisbursement(id, reason, actorName, actorRole),
      "Đã trả lại hồ sơ, Kế toán viên sẽ nhận yêu cầu bổ sung.",
    );
  }, [data.disbursements, runMutation, user]);

  const updateDisbursement = useCallback(async (id: string, input: DisbursementInput) => {
    const actorName = user?.displayName || user?.name || "Nguyễn Thị Thúy Hà";
    return runMutation(
      () => mockFinanceRepository.updateDisbursement(id, input, actorName),
      "Đã cập nhật đợt giải ngân và trình lại cho Kế toán trưởng duyệt.",
    );
  }, [runMutation, user]);

  return {
    data,
    filters,
    setFilters,
    loading,
    feedback,
    clearFeedback: () => setFeedback(null),
    user,
    rolePermissions,
    visiblePlans,
    visibleDisbursements,
    visibleSettlements,
    kpis,
    dueSoon,
    overdue,
    contractCapWarnings,
    tasks,
    createCapitalPlan: (input: CapitalPlanInput) => runMutation(
      () => mockFinanceRepository.createCapitalPlan(input),
      "Đã thêm kế hoạch vốn.",
    ),
    adjustCapitalPlan: (input: CapitalPlanAdjustmentInput) => runMutation(
      () => mockFinanceRepository.adjustCapitalPlan(input),
      "Đã cập nhật điều chỉnh kế hoạch vốn.",
    ),
    createDisbursement,
    updateDisbursement,
    approveDisbursement,
    rejectDisbursement,
    completeSettlementStep: (id: string, step: number, payload: SettlementStepPayload) => runMutation(
      () => mockFinanceRepository.completeSettlementStep(id, step, payload),
      step === 5 ? "Dự án đã được phê duyệt tất toán thành công." : `Đã hoàn tất bước ${step}.`,
    ),
  };
}

export type FinanceSettlementController = ReturnType<typeof useFinanceSettlement>;
