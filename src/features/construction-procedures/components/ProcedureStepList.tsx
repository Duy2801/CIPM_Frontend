"use client";

import { useMemo, useState } from "react";
import {
  CheckCircleFilled,
  ClockCircleFilled,
  RightOutlined,
} from "@ant-design/icons";
import { Card, Tag, Text } from "@/components/ui";
import { getStepAlertLevel } from "../utils/procedure-rules";
import ProcedureStepCard from "./ProcedureStepCard";
import type {
  ProcedureFilterStatus,
  ProcedureStep,
  ProcedureViewMode,
} from "../types/procedure.types";

interface ProcedureStepListProps {
  steps: ProcedureStep[];
  searchTerm: string;
  statusFilter: ProcedureFilterStatus;
  viewMode: ProcedureViewMode;
  onStartStep: (stepId: string) => void;
  onOpenCompleteModal: (step: ProcedureStep) => void;
  onOpenSkipModal: (step: ProcedureStep) => void;
  onOpenDocsModal: (step: ProcedureStep) => void;
  onOpenDetailStep?: (step: ProcedureStep) => void;
  highlightedStepId?: string | null;
  canUpdateProcedure?: boolean;
}

export default function ProcedureStepList({
  steps,
  searchTerm,
  statusFilter,
  viewMode,
  onStartStep,
  onOpenCompleteModal,
  onOpenSkipModal,
  onOpenDocsModal,
  onOpenDetailStep,
  highlightedStepId,
  canUpdateProcedure = true,
}: ProcedureStepListProps) {
  // Lọc theo search và status
  const filteredSteps = useMemo(() => {
    return steps.filter((step) => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchName = step.name.toLowerCase().includes(q);
        const matchCode = step.code.toLowerCase().includes(q);
        const matchUnit = step.responsibleUnit.toLowerCase().includes(q);
        const matchGroup = step.groupTitle.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchUnit && !matchGroup) return false;
      }

      if (statusFilter === "ALL") return true;
      if (statusFilter === "DISABLED") return !step.isEnabled;
      if (statusFilter === "IN_PROGRESS") return step.isEnabled && step.status === "IN_PROGRESS";
      if (statusFilter === "COMPLETED") return step.isEnabled && step.status === "COMPLETED";
      if (statusFilter === "SKIPPED") return step.isEnabled && step.status === "SKIPPED";
      if (statusFilter === "DANGER_RED") {
        return step.isEnabled && getStepAlertLevel(step) === "DANGER_RED";
      }
      if (statusFilter === "WARNING_YELLOW") {
        return step.isEnabled && getStepAlertLevel(step) === "WARNING_YELLOW";
      }

      return true;
    });
  }, [steps, searchTerm, statusFilter]);

  // Cấu trúc phân cấp 7 Nhóm lớn (I đến VII)
  const groupCodes = ["I", "II", "III", "IV", "V", "VI", "VII"];
  const groupedSteps = useMemo(() => {
    return groupCodes
      .map((code) => {
        const groupSteps = filteredSteps.filter((s) => s.groupCode === code);
        const title =
          groupSteps[0]?.groupTitle ||
          steps.find((s) => s.groupCode === code)?.groupTitle ||
          `Nhóm ${code}`;
        return { code, title, steps: groupSteps };
      })
      .filter((g) => g.steps.length > 0);
  }, [filteredSteps, steps]);

  // Nhóm đang được chọn xem (mặc định mở nhóm đang thực hiện, hoặc nhóm đầu tiên)
  const [activeGroupCode, setActiveGroupCode] = useState<string>(() => {
    const inProgressStep = steps.find((s) => s.isEnabled && s.status === "IN_PROGRESS");
    if (inProgressStep) return inProgressStep.groupCode;
    const notCompleted = steps.find(
      (s) => s.isEnabled && s.status !== "COMPLETED" && s.status !== "SKIPPED"
    );
    if (notCompleted) return notCompleted.groupCode;
    return "I";
  });

  const [showAllStages, setShowAllStages] = useState<boolean>(false);

  // Khi tìm kiếm có từ khóa, tự động mở toàn bộ kết quả
  const isSearching = searchTerm.trim().length > 0 || statusFilter !== "ALL";

  if (filteredSteps.length === 0) {
    return (
      <Card surface="workspace" padding="comfortable" rounded="lg" className="border text-center py-12">
        <Text className="text-sm text-slate-500">
          Không tìm thấy bước thủ tục nào phù hợp với điều kiện tìm kiếm.
        </Text>
      </Card>
    );
  }

  // Bố cục phân cấp 7 giai đoạn (Mặc định)
  // Nếu người dùng chọn "Mở tất cả" hoặc đang tìm kiếm: hiển thị toàn bộ
  if (isSearching || showAllStages) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between pb-1 text-xs">
          <span className="text-slate-600 font-semibold">
            {isSearching ? "Kết quả tìm kiếm trên toàn bộ 7 giai đoạn:" : "Đang hiển thị toàn bộ 7 giai đoạn quy trình:"}
          </span>
          {!isSearching && (
            <button
              type="button"
              onClick={() => setShowAllStages(false)}
              className="text-xs text-[#007A78] hover:underline font-medium cursor-pointer"
            >
              Chuyển sang chế độ chọn từng giai đoạn
            </button>
          )}
        </div>

        {groupedSteps.map((group) => {
          const completedInGroup = group.steps.filter(
            (s) => s.isEnabled && s.status === "COMPLETED"
          ).length;
          const skippedInGroup = group.steps.filter(
            (s) => s.isEnabled && s.status === "SKIPPED"
          ).length;
          const totalActiveInGroup = group.steps.filter((s) => s.isEnabled).length;
          const isGroupCompleted =
            totalActiveInGroup > 0 &&
            completedInGroup + skippedInGroup === totalActiveInGroup;

          return (
            <div
              key={group.code}
              className={`rounded-xl border p-3.5 flex flex-col gap-3 transition-all ${isGroupCompleted ? "border-emerald-200/90 bg-emerald-50/15" : "border-slate-200 bg-white"
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-6 min-w-6 items-center justify-center rounded text-xs font-bold font-mono text-white ${isGroupCompleted ? "bg-emerald-600" : "bg-[#007A78]"
                      }`}
                  >
                    {group.code}
                  </span>
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-wide text-slate-900">
                    {group.title}
                  </span>
                </div>
                {isGroupCompleted ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300">
                    <CheckCircleFilled className="text-xs text-emerald-600" />
                    Đã hoàn thành ({completedInGroup + skippedInGroup}/{totalActiveInGroup} bước)
                  </span>
                ) : (
                  <span className="text-xs text-slate-600 font-medium">
                    Tiến độ: {completedInGroup + skippedInGroup}/{totalActiveInGroup} bước
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2.5">
                {group.steps.map((step) => (
                  <section id={`procedure-step-${step.id}`} key={step.id} className="scroll-mt-20">
                    <ProcedureStepCard
                      step={step}
                      allSteps={steps}
                      onStartStep={onStartStep}
                      onOpenCompleteModal={onOpenCompleteModal}
                      onOpenSkipModal={onOpenSkipModal}
                      onOpenDocsModal={onOpenDocsModal}
                      onOpenDetail={onOpenDetailStep}
                      highlight={highlightedStepId === step.id}
                      canUpdateProcedure={canUpdateProcedure}
                    />
                  </section>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Giai đoạn hiện đang được chọn
  const activeGroup =
    groupedSteps.find((g) => g.code === activeGroupCode) || groupedSteps[0];

  const activeCompletedInGroup = activeGroup.steps.filter(
    (s) => s.isEnabled && s.status === "COMPLETED"
  ).length;
  const activeSkippedInGroup = activeGroup.steps.filter(
    (s) => s.isEnabled && s.status === "SKIPPED"
  ).length;
  const activeTotalInGroup = activeGroup.steps.filter((s) => s.isEnabled).length;
  const activeIsCompleted =
    activeTotalInGroup > 0 &&
    activeCompletedInGroup + activeSkippedInGroup === activeTotalInGroup;

  const totalFinishedStages = groupedSteps.filter((g) => {
    const c = g.steps.filter((s) => s.isEnabled && s.status === "COMPLETED").length;
    const sk = g.steps.filter((s) => s.isEnabled && s.status === "SKIPPED").length;
    const tot = g.steps.filter((s) => s.isEnabled).length;
    return tot > 0 && c + sk === tot;
  }).length;

  return (
    <div className="flex flex-col lg:flex-row items-start gap-4 w-full">
      {/* CỘT TRÁI: Bảng điều hướng 7 Giai đoạn lớn (Lộ trình chuẩn) */}
      <div className="w-full lg:w-[380px] shrink-0 flex flex-col gap-2 bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
              7 Giai đoạn quy trình
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[11px] font-semibold text-[#007A78]">
              {totalFinishedStages}/7 hoàn thành
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAllStages(true)}
            className="text-[11px] text-[#007A78] hover:underline font-medium cursor-pointer"
          >
            Mở xem tất cả
          </button>
        </div>

        {/* Danh sách 7 thẻ giai đoạn */}
        <div className="flex flex-col gap-1.5">
          {groupedSteps.map((group) => {
            const completed = group.steps.filter(
              (s) => s.isEnabled && s.status === "COMPLETED"
            ).length;
            const skipped = group.steps.filter(
              (s) => s.isEnabled && s.status === "SKIPPED"
            ).length;
            const total = group.steps.filter((s) => s.isEnabled).length;
            const isCompleted = total > 0 && completed + skipped === total;
            const hasInProg = group.steps.some((s) => s.isEnabled && s.status === "IN_PROGRESS");
            const isSelected = activeGroupCode === group.code;

            return (
              <div
                key={group.code}
                onClick={() => setActiveGroupCode(group.code)}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer ${isSelected
                  ? "border-[#007A78] bg-teal-50/40 ring-1 ring-[#007A78] shadow-xs"
                  : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/70"
                  }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`flex h-5 min-w-5 items-center justify-center rounded text-[11px] font-bold font-mono shrink-0 ${isSelected
                        ? "bg-[#007A78] text-white"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                    >
                      {group.code}
                    </span>
                    <span className={`text-xs font-semibold truncate ${isSelected ? "text-slate-900 font-bold" : "text-slate-700"}`}>
                      {group.title}
                    </span>
                  </div>

                  <RightOutlined
                    className={`text-[10px] shrink-0 transition-transform ${isSelected ? "text-[#007A78] translate-x-0.5" : "text-slate-300"
                      }`}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] mt-1.5 pl-7">
                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                      <CheckCircleFilled className="text-[11px] text-emerald-600" />
                      Hoàn thành ({completed + skipped}/{total})
                    </span>
                  ) : hasInProg ? (
                    <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                      <ClockCircleFilled className="text-[11px] text-[#007A78]" />
                      Đang thực hiện ({completed + skipped}/{total})
                    </span>
                  ) : (
                    <span className="text-slate-400 font-normal">
                      Chưa thực hiện ({total} bước)
                    </span>
                  )}

                  <span
                    className={`text-[11px] font-semibold ${isSelected ? "text-[#007A78]" : "text-slate-400"
                      }`}
                  >
                    {isSelected ? "Đang chọn" : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CỘT PHẢI: Chi tiết các bước của giai đoạn đang chọn (Lấp đầy không gian) */}
      <div className="flex-1 min-w-0 flex flex-col gap-3 w-full">
        {/* Header giai đoạn đang chọn */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-[#007A78] text-sm font-bold font-mono text-white shadow-xs">
              {activeGroup.code}
            </span>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
                {activeGroup.title}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Bao gồm {activeGroup.steps.length} bước thủ tục • Tiến độ:{" "}
                <strong className="text-slate-800">
                  {activeCompletedInGroup + activeSkippedInGroup}/{activeTotalInGroup}
                </strong>{" "}
                bước đã xử lý
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {activeIsCompleted ? (
              <Tag intent="success" icon={<CheckCircleFilled />}>
                Giai đoạn đã hoàn thành 100%
              </Tag>
            ) : (
              <span className="inline-block rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                Tiến độ: <strong className="text-[#007A78]">{activeCompletedInGroup + activeSkippedInGroup}/{activeTotalInGroup}</strong> bước
              </span>
            )}
          </div>
        </div>

        {/* Danh sách các thẻ bước của giai đoạn này */}
        <div className="flex flex-col gap-2.5">
          {activeGroup.steps.map((step) => (
            <section id={`procedure-step-${step.id}`} key={step.id} className="scroll-mt-20">
              <ProcedureStepCard
                step={step}
                allSteps={steps}
                onStartStep={onStartStep}
                onOpenCompleteModal={onOpenCompleteModal}
                onOpenSkipModal={onOpenSkipModal}
                onOpenDocsModal={onOpenDocsModal}
                onOpenDetail={onOpenDetailStep}
                highlight={highlightedStepId === step.id}
                canUpdateProcedure={canUpdateProcedure}
              />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
