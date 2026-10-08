"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useActionFeedback } from "@/components/workspace";
import { useAuth } from "@/features/auth";
import { todayIso } from "@/utils/date";
import { mockWarrantyRepository } from "../services/mock-warranty.repository";
import type { FixInput, IncidentInput, WarrantyCreateInput, WarrantyDataset } from "../types/warranty.types";
import { getWarrantyRolePermissions } from "../utils/warranty-permissions";
import { getCountdown, isIncidentOverdue } from "../utils/warranty-rules";
import { buildWarrantyTasks } from "../utils/warranty-workspace";

const EMPTY_DATASET: WarrantyDataset = { projects: [], warranties: [], incidents: [] };

export function useWarrantyMaintenance() {
  const { user } = useAuth();
  const [data, setData] = useState<WarrantyDataset>(EMPTY_DATASET);
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState("ALL");
  const today = todayIso();

  const permissions = useMemo(() => getWarrantyRolePermissions(user), [user]);
  const actor = permissions.userName;

  const refresh = useCallback(async () => {
    setData(await mockWarrantyRepository.getDataset());
  }, []);
  const { feedback, run, clearFeedback } = useActionFeedback(refresh);

  useEffect(() => {
    let active = true;
    mockWarrantyRepository.getDataset().then((result) => {
      if (active) {
        setData(result);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  const warranties = useMemo(
    () => data.warranties.filter((item) => projectId === "ALL" || item.projectId === projectId),
    [data.warranties, projectId],
  );
  const incidents = useMemo(() => {
    const ids = new Set(warranties.map((item) => item.id));
    return data.incidents.filter((item) => ids.has(item.warrantyId));
  }, [data.incidents, warranties]);

  const kpis = useMemo(() => {
    const active = warranties.filter((item) => getCountdown(item, today).level !== "EXPIRED");
    return {
      active: active.length,
      expiringSoon: active.filter((item) => getCountdown(item, today).daysLeft <= 90).length,
      openIncidents: incidents.filter((item) => item.status !== "FIXED").length,
      overdueIncidents: incidents.filter((item) => isIncidentOverdue(item, today)).length,
      bondHolding: warranties
        .filter((item) => item.bondStatus === "HOLDING")
        .reduce((sum, item) => sum + item.bondValue, 0),
    };
  }, [incidents, today, warranties]);

  const tasks = useMemo(
    () => buildWarrantyTasks(permissions, warranties, incidents, today),
    [incidents, permissions, today, warranties],
  );

  const workNameOf = (warrantyId: string) => data.warranties.find((item) => item.id === warrantyId)?.workName ?? "";

  return {
    currentUser: user,
    data,
    loading,
    today,
    projectId,
    setProjectId,
    permissions,
    warranties,
    incidents,
    kpis,
    tasks,
    feedback,
    clearFeedback,
    reportIncident: (input: IncidentInput) => run(
      () => mockWarrantyRepository.reportIncident(input, actor),
      `Đã ghi nhận sự cố tại “${workNameOf(input.warrantyId)}” và gửi yêu cầu khắc phục.`,
    ),
    startFixing: (id: string) => run(
      () => mockWarrantyRepository.startFixing(id),
      "Đã chuyển sự cố sang trạng thái đang khắc phục.",
    ),
    acceptFix: (id: string, input: FixInput) => run(
      () => mockWarrantyRepository.acceptFix(id, input),
      "Đã nghiệm thu khắc phục sự cố.",
    ),
    returnBond: (warrantyId: string) => run(
      () => mockWarrantyRepository.closeBond(warrantyId, "RETURNED", ""),
      `Đã hoàn trả bảo lãnh bảo hành “${workNameOf(warrantyId)}”.`,
    ),
    forfeitBond: (warrantyId: string, reason: string) => run(
      () => mockWarrantyRepository.closeBond(warrantyId, "FORFEITED", reason),
      `Đã thu hồi bảo lãnh bảo hành “${workNameOf(warrantyId)}”.`,
    ),
    createWarranty: (input: WarrantyCreateInput) => run(
      () => mockWarrantyRepository.createWarranty(input),
      `Đã thêm hồ sơ bảo hành cho công trình “${input.workName}”.`,
    ),
    updateWarranty: (id: string, input: Partial<WarrantyCreateInput>) => run(
      () => mockWarrantyRepository.updateWarranty(id, input),
      `Đã cập nhật hồ sơ bảo hành cho công trình “${workNameOf(id)}”.`,
    ),
  };
}

export type WarrantyController = ReturnType<typeof useWarrantyMaintenance>;
