"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useActionFeedback } from "@/components/workspace";
import { useAuth } from "@/features/auth";
import { todayIso } from "@/utils/date";
import { mockGpmbRepository } from "../services/mock-gpmb.repository";
import type { GpmbDataset, HouseholdInput, SpecialStatus, StepCompletionInput } from "../types/gpmb.types";
import { getGpmbRolePermissions } from "../utils/gpmb-permissions";
import { getLegalStatus, hasReceivedPayment } from "../utils/gpmb-rules";
import { buildGpmbTasks } from "../utils/gpmb-workspace";

const EMPTY_DATASET: GpmbDataset = { projects: [], households: [] };

export function useSiteClearance() {
  const { user } = useAuth();
  const [data, setData] = useState<GpmbDataset>(EMPTY_DATASET);
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState("ALL");
  const today = todayIso();

  const permissions = useMemo(() => getGpmbRolePermissions(user), [user]);
  const actor = permissions.userName;

  const refresh = useCallback(async () => {
    setData(await mockGpmbRepository.getDataset());
  }, []);
  const { feedback, run, clearFeedback } = useActionFeedback(refresh);

  useEffect(() => {
    let active = true;
    mockGpmbRepository.getDataset().then((result) => {
      if (active) {
        setData(result);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  const households = useMemo(
    () => data.households.filter((item) => projectId === "ALL" || item.projectId === projectId),
    [data.households, projectId],
  );

  const kpis = useMemo(() => {
    const paid = households.filter(hasReceivedPayment);
    return {
      total: households.length,
      paidCount: paid.length,
      paidAmount: paid.reduce((sum, item) => sum + item.compensation, 0),
      totalAmount: households.reduce((sum, item) => sum + item.compensation, 0),
      overdue: households.filter((item) => getLegalStatus(item, today).state === "OVERDUE").length,
      pendingApproval: households.filter((item) => item.proposal).length,
      special: households.filter((item) => item.specialStatus !== "NORMAL").length,
    };
  }, [households, today]);

  const tasks = useMemo(() => buildGpmbTasks(permissions, households, today), [households, permissions, today]);

  const findName = (id: string) => data.households.find((item) => item.id === id)?.ownerName ?? "";

  return {
    data,
    loading,
    today,
    projectId,
    setProjectId,
    permissions,
    households,
    kpis,
    tasks,
    feedback,
    clearFeedback,
    completeStep: (id: string, input: StepCompletionInput) => run(
      () => mockGpmbRepository.completeStep(id, input, actor),
      `Đã cập nhật bước mới cho hộ ${findName(id)}.`,
    ),
    proposeStep: (id: string, input: StepCompletionInput) => run(
      () => mockGpmbRepository.proposeStep(id, input, actor),
      `Đã gửi đề xuất của hộ ${findName(id)} để lãnh đạo duyệt.`,
    ),
    approveProposal: (id: string) => run(
      () => mockGpmbRepository.approveProposal(id, actor),
      `Đã duyệt đề xuất của hộ ${findName(id)}.`,
    ),
    rejectProposal: (id: string, reason: string) => run(
      () => mockGpmbRepository.rejectProposal(id, reason, actor),
      `Đã trả lại đề xuất của hộ ${findName(id)} kèm lý do.`,
    ),
    updateSpecialStatus: (id: string, status: SpecialStatus) => run(
      () => mockGpmbRepository.updateSpecialStatus(id, status, actor),
      `Đã cập nhật tình trạng của hộ ${findName(id)}.`,
    ),
    createHousehold: (input: HouseholdInput) => run(
      () => mockGpmbRepository.createHousehold(input, actor),
      `Đã thêm hồ sơ hộ dân ${input.ownerName.trim()}.`,
    ),
    updateStepRecord: (
      id: string,
      step: number,
      data: { fileName?: string; documentNo?: string; note?: string }
    ) => run(
      () => mockGpmbRepository.updateStepRecord(id, step, data, actor),
      `Đã bổ sung tài liệu bước ${step} cho hộ ${findName(id)}.`,
    ),
  };
}

export type SiteClearanceController = ReturnType<typeof useSiteClearance>;
