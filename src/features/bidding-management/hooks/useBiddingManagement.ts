"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useActionFeedback } from "@/components/workspace";
import { useAuth } from "@/features/auth";
import { todayIso } from "@/utils/date";
import { mockBiddingRepository } from "../services/mock-bidding.repository";
import type { BidStepInput, BiddingDataset, CreatePackageInput } from "../types/bidding.types";
import { getBiddingRolePermissions } from "../utils/bidding-permissions";
import { getBidDeadlineStatus, getCurrentBidStep, getSavings } from "../utils/bidding-rules";
import { buildBiddingTasks } from "../utils/bidding-workspace";

const EMPTY_DATASET: BiddingDataset = { projects: [], packages: [] };

export function useBiddingManagement() {
  const { user } = useAuth();
  const [data, setData] = useState<BiddingDataset>(EMPTY_DATASET);
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState("ALL");
  const today = todayIso();

  const permissions = useMemo(() => getBiddingRolePermissions(user), [user]);
  const actor = permissions.userName;

  const refresh = useCallback(async () => {
    setData(await mockBiddingRepository.getDataset());
  }, []);
  const { feedback, run, clearFeedback } = useActionFeedback(refresh);

  useEffect(() => {
    let active = true;
    mockBiddingRepository.getDataset().then((result) => {
      if (active) {
        setData(result);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  const packages = useMemo(
    () => data.packages.filter((pkg) => projectId === "ALL" || pkg.projectId === projectId),
    [data.packages, projectId],
  );

  const kpis = useMemo(() => {
    const signed = packages.filter((pkg) => getCurrentBidStep(pkg) === null);
    return {
      total: packages.length,
      totalValue: packages.reduce((sum, pkg) => sum + pkg.estimatedPrice, 0),
      signed: signed.length,
      savings: packages.reduce((sum, pkg) => sum + getSavings(pkg), 0),
      deadlineSoon: packages.filter((pkg) => {
        const state = getBidDeadlineStatus(pkg, today).state;
        return state === "WARNING" || state === "DANGER";
      }).length,
      pendingApproval: packages.filter((pkg) => pkg.submission).length,
    };
  }, [packages, today]);

  const tasks = useMemo(() => buildBiddingTasks(permissions, packages, today), [packages, permissions, today]);

  const nameOf = (id: string) => data.packages.find((pkg) => pkg.id === id)?.code ?? "";

  return {
    data,
    loading,
    today,
    projectId,
    setProjectId,
    permissions,
    packages,
    kpis,
    tasks,
    feedback,
    clearFeedback,
    createPackage: (input: CreatePackageInput) => run(
      () => mockBiddingRepository.createPackage(input, actor),
      `Đã tạo gói thầu “${input.name}”.`,
    ),
    completeStep: (id: string, input: BidStepInput) => run(
      () => mockBiddingRepository.completeStep(id, input, actor),
      `Đã cập nhật bước mới cho gói thầu ${nameOf(id)}.`,
    ),
    submitStep: (id: string, input: BidStepInput) => run(
      () => mockBiddingRepository.submitStep(id, input, actor),
      `Đã trình lãnh đạo phê duyệt gói thầu ${nameOf(id)}.`,
    ),
    approveSubmission: (id: string) => run(
      () => mockBiddingRepository.approveSubmission(id, actor),
      `Đã phê duyệt tờ trình gói thầu ${nameOf(id)}.`,
    ),
    rejectSubmission: (id: string, reason: string) => run(
      () => mockBiddingRepository.rejectSubmission(id, reason, actor),
      `Đã trả lại tờ trình gói thầu ${nameOf(id)} kèm lý do.`,
    ),
  };
}

export type BiddingController = ReturnType<typeof useBiddingManagement>;
