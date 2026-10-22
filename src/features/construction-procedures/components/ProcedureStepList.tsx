"use client";

import { useMemo, useState } from "react";
import {
  CheckCircleFilled,
  CheckOutlined,
  ClockCircleFilled,
  CloseOutlined,
  FolderAddOutlined,
  PlusOutlined,
  RightOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Button, Card, Input, Modal, Tag, Text, toast } from "@/components/ui";
import { getStepAlertLevel, getWorkSteps } from "../utils/procedure-rules";
import ProcedureStepCard from "./ProcedureStepCard";
import type {
  ProcedureFilterStatus,
  ProcedureStep,
  ProcedureViewMode,
  StageApprovalStatus,
} from "../types/procedure.types";

interface ProcedureStepListProps {
  steps: ProcedureStep[];
  searchTerm: string;
  statusFilter: ProcedureFilterStatus;
  viewMode: ProcedureViewMode;
  onStartStep: (stepId: string) => void;
  onOpenCompleteModal: (step: ProcedureStep) => void;
  onConfirmCompleteStep?: (stepId: string) => void;
  onOpenSkipModal: (step: ProcedureStep) => void;
  onOpenDetailStep?: (step: ProcedureStep) => void;
  highlightedStepId?: string | null;
  canUpdateProcedure?: boolean;
  canConfigureProcedure?: boolean;
  canApproveProcedure?: boolean;
  onOpenStepConfig?: () => void;
  onOpenAddDeptProcedure?: () => void;
  isLeadOfDept?: boolean;
  userDepartment?: string;
  isDirector?: boolean;
  isDeptCompletedByLead?: boolean;
  onAssignMember?: (stepId: string, memberName: string) => void;
  onApproveStep?: (stepId: string) => void;
  onRejectStep?: (stepId: string, reason: string) => void;
  onLeadApproveStage?: (stageCode: string, stageTitle: string) => void;
  onLeadRejectStage?: (stageCode: string, stageTitle: string, reason: string) => void;
  onDirectorApproveStage?: (stageCode: string, stageTitle: string) => void;
  onDirectorRejectStage?: (stageCode: string, stageTitle: string) => void;
  stageApprovals?: Record<string, StageApprovalStatus>;
  /** Tên quy trình dự án đã áp dụng (đã lưu cấu hình), kể cả khi quy trình chưa có bước */
  appliedProcedureName?: string;
}

export default function ProcedureStepList({
  steps,
  searchTerm,
  statusFilter,
  viewMode,
  onStartStep,
  onOpenCompleteModal,
  onConfirmCompleteStep,
  onOpenSkipModal,
  onOpenDetailStep,
  highlightedStepId,
  canUpdateProcedure = true,
  canConfigureProcedure = false,
  canApproveProcedure,
  onOpenStepConfig,
  onOpenAddDeptProcedure,
  isLeadOfDept = false,
  userDepartment,
  isDirector = false,
  isDeptCompletedByLead = false,
  onAssignMember,
  onApproveStep,
  onRejectStep,
  onLeadApproveStage,
  onLeadRejectStage,
  onDirectorApproveStage,
  onDirectorRejectStage,
  stageApprovals,
  appliedProcedureName,
}: ProcedureStepListProps) {
  const canApprove = canApproveProcedure !== undefined ? canApproveProcedure : isDirector;
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

  // Cấu trúc phân cấp động theo các nhóm/phòng ban
  const dynamicGroupCodes = useMemo(() => {
    return Array.from(new Set(steps.map((s) => s.groupCode || "CHUNG")));
  }, [steps]);

  const groupedSteps = useMemo(() => {
    return dynamicGroupCodes
      .map((code) => {
        const groupSteps = filteredSteps.filter((s) => (s.groupCode || "CHUNG") === code);
        const title =
          groupSteps[0]?.groupTitle ||
          steps.find((s) => (s.groupCode || "CHUNG") === code)?.groupTitle ||
          `Giai đoạn ${code}`;
        return { code, title, steps: groupSteps };
      })
      .filter((g) => g.steps.length > 0);
  }, [filteredSteps, steps, dynamicGroupCodes]);

  // Bước cần làm của một nhóm: mục lớn đã có bước con chỉ là tiêu mục → không hiện thẻ, không tính tiến độ
  const workOf = (list: ProcedureStep[]) => getWorkSteps(list, steps);

  // Nhóm đang được chọn xem (mặc định mở nhóm đang thực hiện, hoặc nhóm đầu tiên)
  const [activeGroupCode, setActiveGroupCode] = useState<string>(() => {
    const inProgressStep = steps.find((s) => s.isEnabled && s.status === "IN_PROGRESS");
    if (inProgressStep) return inProgressStep.groupCode;
    const notCompleted = steps.find(
      (s) => s.isEnabled && s.status !== "COMPLETED" && s.status !== "SKIPPED"
    );
    if (notCompleted) return notCompleted.groupCode;
    return steps[0]?.groupCode || "I";
  });



  // Khi tìm kiếm có từ khóa, tự động mở toàn bộ kết quả
  const isSearching = searchTerm.trim().length > 0 || statusFilter !== "ALL";

  // Trường hợp dự án chưa được thiết lập quy trình (bước thực hiện = 0)
  if (steps.length === 0) {
    return (
      <Card
        surface="workspace"
        padding="comfortable"
        rounded="lg"
        className="border border-dashed border-slate-300 bg-white py-14 px-6 text-center shadow-xs"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 border border-red-100 text-[#DC2626] shadow-sm mb-4">
          <FolderAddOutlined className="text-3xl" />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1.5">
          {appliedProcedureName ? (
            <>
              Dự án đã áp dụng quy trình <span className="text-[#DC2626]">{appliedProcedureName}</span>
            </>
          ) : (
            "Dự án chưa có quy trình thủ tục nào"
          )}
        </h3>
        <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
          {appliedProcedureName
            ? "Quy trình này chưa có bước nào. Vào Cấu hình quy trình để thêm bước chính, bước con và phân công thực hiện."
            : canConfigureProcedure
            ? "Bạn có toàn quyền thiết lập, cấu hình quy trình thủ tục và phân công nhiệm vụ vào dự án."
            : canApprove
            ? "Lãnh đạo có quyền phê duyệt quy trình hoặc phân công cho các bộ phận chủ động thiết lập thủ tục chuyên môn."
            : "Quy trình thủ tục của dự án sẽ do các Tổ trưởng/Trưởng phòng ban được phân công chủ động thiết lập và phân công nhiệm vụ cho từng cán bộ."}
        </p>
        {appliedProcedureName && canConfigureProcedure && onOpenStepConfig && (
          <div className="mt-4 flex justify-center">
            <Button
              intent="primary"
              scale="compact"
              icon={<PlusOutlined />}
              onClick={onOpenStepConfig}
              className="!bg-[#DC2626] !border-[#DC2626] text-white font-semibold h-9 px-5 shadow-2xs hover:!bg-[#B91C1C]"
            >
              Thêm bước cho quy trình
            </Button>
          </div>
        )}
      </Card>
    );
  }

  if (filteredSteps.length === 0) {
    return (
      <Card surface="workspace" padding="comfortable" rounded="lg" className="border text-center py-12">
        <Text className="text-sm font-semibold text-slate-700 block mb-1">
          Phòng ban này chưa có bước quy trình thủ tục nào được thêm vào dự án.
        </Text>
        <Text className="text-xs text-slate-400 block mb-4">
          Tổ trưởng phòng ban sẽ chủ động thiết lập quy trình chuyên môn khi triển khai dự án.
        </Text>
        {(isLeadOfDept || canApprove || canConfigureProcedure || canUpdateProcedure) && onOpenAddDeptProcedure && (
          <div className="flex justify-center">
            <Button
              intent="primary"
              scale="compact"
              icon={<PlusOutlined />}
              onClick={onOpenAddDeptProcedure}
              className="!bg-[#DC2626] !border-[#DC2626] text-white font-semibold h-9 px-5 shadow-2xs hover:!bg-[#B91C1C]"
            >
              Thêm quy trình cho phòng ban này
            </Button>
          </div>
        )}
      </Card>
    );
  }

  // Đang tìm kiếm / lọc trạng thái: hiển thị kết quả trên toàn bộ giai đoạn
  if (isSearching) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between pb-1 text-xs">
          <span className="text-slate-600 font-semibold">
            Kết quả tìm kiếm trên toàn bộ {groupedSteps.length} giai đoạn:
          </span>
        </div>

        {groupedSteps.map((group) => {
          const completedInGroup = workOf(group.steps).filter(
            (s) => s.isEnabled && s.status === "COMPLETED"
          ).length;
          const skippedInGroup = workOf(group.steps).filter(
            (s) => s.isEnabled && s.status === "SKIPPED"
          ).length;
          const totalActiveInGroup = workOf(group.steps).filter((s) => s.isEnabled).length;
          const isGroupCompleted =
            totalActiveInGroup > 0 &&
            completedInGroup + skippedInGroup === totalActiveInGroup;
          const stageApproval = stageApprovals?.[group.code] || stageApprovals?.[group.title];

          return (
            <div
              key={group.code}
              className={`rounded-xl border p-3.5 flex flex-col gap-3 transition-all ${
                isGroupCompleted ? "border-red-200/90 bg-red-50/20" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-6 min-w-6 items-center justify-center rounded text-xs font-bold font-mono text-white bg-[#DC2626]"
                  >
                    {group.code}
                  </span>
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-wide text-slate-900">
                    {group.title}
                  </span>
                </div>
                {isGroupCompleted ? (
                  stageApproval?.status === "APPROVED" ? (
                    <Tag
                      className="!border-red-200 !bg-red-50 !text-[#DC2626] font-semibold text-xs"
                      icon={<SafetyCertificateOutlined className="text-[#DC2626]" />}
                    >
                      Đã hoàn thành
                    </Tag>
                  ) : stageApproval?.status === "REJECTED" ? (
                    <div className="flex items-center gap-2">
                      <Tag
                        className="!border-rose-300 !bg-rose-50 !text-rose-700 font-semibold text-xs"
                        icon={<CloseOutlined className="text-rose-600" />}
                      >
                        BGĐ yêu cầu rà soát lại
                      </Tag>
                      {canApprove && (
                        <Button
                          intent="primary"
                          scale="compact"
                          icon={<CheckOutlined />}
                          className="!bg-[#DC2626] hover:!bg-[#B91C1C] text-white font-semibold text-xs shadow-2xs h-7 px-2.5"
                          onClick={() => onDirectorApproveStage?.(group.code, group.title)}
                        >
                          Duyệt lại
                        </Button>
                      )}
                    </div>
                  ) : canApprove ? (
                    <div className="flex items-center gap-2">
                      <Button
                        intent="primary"
                        scale="compact"
                        icon={<CheckOutlined />}
                        className="!bg-[#DC2626] hover:!bg-[#B91C1C] text-white font-semibold text-xs shadow-2xs h-7 px-2.5"
                        onClick={() => onDirectorApproveStage?.(group.code, group.title)}
                      >
                        Duyệt giai đoạn
                      </Button>
                      <Button
                        intent="outline"
                        scale="compact"
                        icon={<CloseOutlined />}
                        className="!border-rose-300 !text-rose-700 hover:!bg-rose-50 text-xs font-semibold h-7 px-2"
                        onClick={() => onDirectorRejectStage?.(group.code, group.title)}
                      >
                        Từ chối
                      </Button>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                      <CheckCircleFilled className="text-xs text-[#DC2626]" />
                      Đã hoàn thành ({completedInGroup + skippedInGroup}/{totalActiveInGroup} bước)
                    </span>
                  )
                ) : (
                  <span className="text-xs text-slate-600 font-medium">
                    Tiến độ: {completedInGroup + skippedInGroup}/{totalActiveInGroup} bước
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2.5">
                {workOf(group.steps).map((step) => (
                  <section id={`procedure-step-${step.id}`} key={step.id} className="scroll-mt-20">
                    <ProcedureStepCard
                      step={step}
                      allSteps={steps}
                      onStartStep={onStartStep}
                      onOpenCompleteModal={onOpenCompleteModal}
                      onOpenSkipModal={onOpenSkipModal}
                      onOpenDetail={onOpenDetailStep}
                      highlight={highlightedStepId === step.id}
                      canUpdateProcedure={canUpdateProcedure}
                      onAssignMember={onAssignMember}
                      onApproveStep={onApproveStep}
                      onRejectStep={onRejectStep}
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

  const activeCompletedInGroup = workOf(activeGroup.steps).filter(
    (s) => s.isEnabled && s.status === "COMPLETED"
  ).length;
  const activeSkippedInGroup = workOf(activeGroup.steps).filter(
    (s) => s.isEnabled && s.status === "SKIPPED"
  ).length;
  const activeTotalInGroup = workOf(activeGroup.steps).filter((s) => s.isEnabled).length;
  const activeIsCompleted =
    activeTotalInGroup > 0 &&
    activeCompletedInGroup + activeSkippedInGroup === activeTotalInGroup;

  const totalFinishedStages = groupedSteps.filter((g) => {
    const c = workOf(g.steps).filter((s) => s.isEnabled && s.status === "COMPLETED").length;
    const sk = workOf(g.steps).filter((s) => s.isEnabled && s.status === "SKIPPED").length;
    const tot = workOf(g.steps).filter((s) => s.isEnabled).length;
    return tot > 0 && c + sk === tot;
  }).length;

  return (
    <div className="flex flex-col lg:flex-row items-start gap-4 w-full">
      {/* CỘT TRÁI: Bảng điều hướng các giai đoạn lớn */}
      <div className="w-full lg:w-[380px] shrink-0 flex flex-col gap-2 bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {groupedSteps.length} Giai đoạn quy trình
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[11px] font-semibold text-[#DC2626]">
              {totalFinishedStages}/{groupedSteps.length} hoàn thành
            </span>
          </div>
        </div>

        {/* Danh sách 7 thẻ giai đoạn */}
        <div className="flex flex-col gap-1.5">
          {groupedSteps.map((group) => {
            const completed = workOf(group.steps).filter(
              (s) => s.isEnabled && s.status === "COMPLETED"
            ).length;
            const skipped = workOf(group.steps).filter(
              (s) => s.isEnabled && s.status === "SKIPPED"
            ).length;
            const total = workOf(group.steps).filter((s) => s.isEnabled).length;
            const isCompleted = total > 0 && completed + skipped === total;
            const hasInProg = workOf(group.steps).some((s) => s.isEnabled && s.status === "IN_PROGRESS");
            const isSelected = activeGroupCode === group.code;
            const itemStageApproval = stageApprovals?.[group.code] || stageApprovals?.[group.title];

            return (
              <div
                key={group.code}
                onClick={() => setActiveGroupCode(group.code)}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? "border-[#DC2626] bg-red-50/50 ring-1 ring-[#DC2626] shadow-xs"
                    : isCompleted
                    ? "border-red-200/80 bg-white hover:border-red-300 hover:bg-red-50/30"
                    : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/70"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`flex h-5 min-w-5 items-center justify-center rounded text-[11px] font-bold font-mono shrink-0 ${
                        isSelected
                          ? "bg-[#DC2626] text-white"
                          : isCompleted
                          ? "bg-red-100 text-[#DC2626] border border-red-200"
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
                    className={`text-[10px] shrink-0 transition-transform ${
                      isSelected ? "text-[#DC2626] translate-x-0.5" : "text-slate-300"
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] mt-1.5 pl-7">
                  {itemStageApproval?.status === "APPROVED" ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-red-700">
                      <CheckCircleFilled className="text-[11px] text-[#DC2626]" />
                      Đã hoàn thành
                    </span>
                  ) : itemStageApproval?.status === "REJECTED" ? (
                    <span className="inline-flex items-center gap-1 font-medium text-rose-700">
                      <CloseOutlined className="text-[11px] text-rose-600" />
                      Cần rà soát
                    </span>
                  ) : isCompleted ? (
                    <span className="inline-flex items-center gap-1 font-medium text-red-700">
                      <CheckCircleFilled className="text-[11px] text-[#DC2626]" />
                      Hoàn thành
                    </span>
                  ) : hasInProg ? (
                    <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                      <ClockCircleFilled className="text-[11px] text-[#DC2626]" />
                      Đang thực hiện ({completed + skipped}/{total})
                    </span>
                  ) : (
                    <span className="text-slate-400 font-normal">
                      Chưa thực hiện ({total} bước)
                    </span>
                  )}

                  <span
                    className={`text-[11px] font-semibold ${
                      isSelected ? "text-[#DC2626]" : "text-slate-400"
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
            <span
              className="flex h-7 min-w-7 items-center justify-center rounded-lg text-sm font-bold font-mono text-white shadow-xs bg-[#DC2626]"
            >
              {activeGroup.code}
            </span>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
                {activeGroup.title}
              </h3>
            </div>
          </div>

          <div className="shrink-0">
            {(() => {
              const activeStageApproval =
                stageApprovals?.[activeGroup.code] || stageApprovals?.[activeGroup.title];

              if (!activeIsCompleted) {
                const activeWork = workOf(activeGroup.steps).filter((s) => s.isEnabled);
                const hasSubmittedSteps = activeWork.some((s) => s.submissionStatus === "SUBMITTED");
                // Các bước còn lại đều đã xong, chỉ còn bước vừa nộp (lại) chờ duyệt → hiện lại nút duyệt / từ chối giai đoạn
                const readyForStageReview =
                  hasSubmittedSteps &&
                  activeWork.every(
                    (s) => s.status === "COMPLETED" || s.status === "SKIPPED" || s.submissionStatus === "SUBMITTED"
                  );
                if (canApprove && readyForStageReview) {
                  return (
                    <div className="flex items-center gap-2">
                      <Button
                        intent="primary"
                        scale="compact"
                        icon={<CheckOutlined />}
                        className="!bg-[#DC2626] hover:!bg-[#B91C1C] text-white font-semibold text-xs shadow-2xs h-8 px-3"
                        onClick={() => onDirectorApproveStage?.(activeGroup.code, activeGroup.title)}
                      >
                        Duyệt giai đoạn
                      </Button>
                      <Button
                        intent="outline"
                        scale="compact"
                        icon={<CloseOutlined />}
                        className="!border-rose-300 !text-rose-700 hover:!bg-rose-50 text-xs font-semibold h-8 px-2.5"
                        onClick={() => onDirectorRejectStage?.(activeGroup.code, activeGroup.title)}
                      >
                        Từ chối
                      </Button>
                    </div>
                  );
                }
                if (isLeadOfDept && hasSubmittedSteps) {
                  return (
                    <div className="flex items-center gap-2">
                      <Button
                        intent="primary"
                        scale="compact"
                        icon={<CheckOutlined />}
                        className="!bg-[#DC2626] hover:!bg-[#B91C1C] text-white font-semibold text-xs shadow-2xs h-8 px-3"
                        onClick={() => onLeadApproveStage?.(activeGroup.code, activeGroup.title)}
                      >
                        Xác nhận hoàn thành
                      </Button>
                    </div>
                  );
                }

                return (
                  <span className="inline-block rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                    Tiến độ: <strong className="text-[#DC2626]">{activeCompletedInGroup + activeSkippedInGroup}/{activeTotalInGroup}</strong> bước
                  </span>
                );
              }

              if (activeStageApproval?.status === "APPROVED") {
                return (
                  <Tag
                    className="!border-red-200 !bg-red-50 !text-[#DC2626] font-semibold text-xs"
                    icon={<SafetyCertificateOutlined className="text-[#DC2626]" />}
                  >
                    Đã hoàn thành
                  </Tag>
                );
              }

              if (activeStageApproval?.status === "REJECTED") {
                return (
                  <div className="flex items-center gap-2">
                    <Tag
                      className="!border-rose-300 !bg-rose-50 !text-rose-700 font-semibold text-xs"
                      icon={<CloseOutlined className="text-rose-600" />}
                    >
                      BGĐ yêu cầu rà soát lại
                    </Tag>
                    {canApprove && (
                      <Button
                        intent="primary"
                        scale="compact"
                        icon={<CheckOutlined />}
                        className="!bg-[#DC2626] hover:!bg-[#B91C1C] text-white font-semibold text-xs shadow-2xs h-8 px-3"
                        onClick={() => onDirectorApproveStage?.(activeGroup.code, activeGroup.title)}
                      >
                        Duyệt lại
                      </Button>
                    )}
                  </div>
                );
              }

              if (canApprove) {
                return (
                  <div className="flex items-center gap-2">
                    <Button
                      intent="primary"
                      scale="compact"
                      icon={<CheckOutlined />}
                      className="!bg-[#DC2626] hover:!bg-[#B91C1C] text-white font-semibold text-xs shadow-2xs h-8 px-3"
                      onClick={() => onDirectorApproveStage?.(activeGroup.code, activeGroup.title)}
                    >
                      Duyệt giai đoạn
                    </Button>
                    <Button
                      intent="outline"
                      scale="compact"
                      icon={<CloseOutlined />}
                      className="!border-rose-300 !text-rose-700 hover:!bg-rose-50 text-xs font-semibold h-8 px-2.5"
                      onClick={() => onDirectorRejectStage?.(activeGroup.code, activeGroup.title)}
                    >
                      Từ chối
                    </Button>
                  </div>
                );
              }

              if (isLeadOfDept) {
                if (isDeptCompletedByLead) {
                  return (
                    <div className="flex items-center gap-2">
                      <Tag
                        className="!bg-red-50 !text-red-700 !border-red-200 text-xs px-2.5 py-1 font-semibold flex items-center gap-1"
                        icon={<CheckCircleFilled className="text-[#DC2626]" />}
                      >
                        Đã xác nhận hoàn thành
                      </Tag>
                    </div>
                  );
                }

                return (
                  <div className="flex items-center gap-2">
                    <Button
                      intent="primary"
                      scale="compact"
                      icon={<CheckOutlined />}
                      className="!bg-[#DC2626] hover:!bg-[#B91C1C] text-white font-semibold text-xs shadow-2xs h-8 px-3"
                      onClick={() => onLeadApproveStage?.(activeGroup.code, activeGroup.title)}
                    >
                      Xác nhận hoàn thành
                    </Button>
                  </div>
                );
              }

              return (
                <Tag className="!border-red-200 !bg-red-50 !text-[#DC2626] font-semibold" icon={<CheckCircleFilled className="text-[#DC2626]" />}>
                  Giai đoạn đã hoàn thành 100%
                </Tag>
              );
            })()}
          </div>
        </div>

        {/* Danh sách các thẻ bước của giai đoạn này */}
        <div className="flex flex-col gap-2.5">
          {workOf(activeGroup.steps).map((step) => (
            <section id={`procedure-step-${step.id}`} key={step.id} className="scroll-mt-20">
              <ProcedureStepCard
                step={step}
                allSteps={steps}
                onStartStep={onStartStep}
                onOpenCompleteModal={onOpenCompleteModal}
                onConfirmCompleteStep={onConfirmCompleteStep}
                onOpenSkipModal={onOpenSkipModal}
                onOpenDetail={onOpenDetailStep}
                highlight={highlightedStepId === step.id}
                canUpdateProcedure={canUpdateProcedure}
                onAssignMember={onAssignMember}
                onApproveStep={onApproveStep}
                onRejectStep={onRejectStep}
              />
            </section>
          ))}
        </div>
      </div>


    </div>
  );
}
