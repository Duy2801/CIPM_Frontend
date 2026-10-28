"use client";

import React, { useMemo, useState } from "react";
import { App } from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  DownOutlined,
  ExclamationCircleOutlined,
  FileDoneOutlined,
  RightOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { Button, Card, Input, Select } from "@/components/ui";
import { ReasonModal } from "@/components/workspace";
import { loadProcedureLibrary } from "@/features/construction-procedures/utils/procedure-library";
import { getStepAlertLevel } from "@/features/construction-procedures/utils/procedure-rules";
import {
  getDepartmentStaff,
  isSameDepartment,
} from "@/features/construction-procedures/constants/procedure-department-templates";
import type { ProcedureStep } from "@/features/construction-procedures/types/procedure.types";
import { cn } from "@/utils/cn";
import { formatDateVi } from "@/utils/date";
import { STAGE_STATE_META } from "../../constants/procedure-step-status";
import type { ProjectProcedureController } from "../../hooks/useProjectProcedure";
import type { ProjectItem } from "../../types/project.types";
import { getStepFlow, groupStepsByStage, type StageSummary } from "../../utils/project-procedure-flow";
import ProcedureStepFlowDrawer, { FlowBadge, RejectStepModal } from "./ProcedureStepFlowDrawer";

interface ProjectProcedureConfigTabProps {
  project: ProjectItem;
  controller: ProjectProcedureController;
}

/** Tab "Quy trình": quy trình từng phòng ban, chia theo giai đoạn; ai làm, ai duyệt, đang ở đâu trong luồng */
export default function ProjectProcedureConfigTab({ project, controller }: ProjectProcedureConfigTabProps) {
  const departments = project.departments ?? [];
  const library = useMemo(() => loadProcedureLibrary(), []);
  const [expanded, setExpanded] = useState<string | null>(departments[0] ?? null);
  const [openStepId, setOpenStepId] = useState<string | null>(null);
  // Luôn lấy bản mới nhất của bước đang mở (sau khi thao tác)
  const openStep = controller.data.steps.find((s) => s.id === openStepId) ?? null;

  if (departments.length === 0) {
    return (
      <Card surface="workspace" padding="none" rounded="lg" className="border border-slate-200/80 shadow-xs">
        <div className="p-8 text-center text-sm text-slate-500">
          Dự án chưa có phòng ban phụ trách. Thêm phòng ban ở tab <strong>Thông tin chung</strong> trước khi cấu hình
          quy trình.
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {departments.map((department) => (
        <DepartmentProcedureCard
          key={department}
          department={department}
          library={library}
          controller={controller}
          expanded={expanded === department}
          onToggle={() => setExpanded((prev) => (prev === department ? null : department))}
          onOpenStep={(step) => setOpenStepId(step.id)}
        />
      ))}

      <ProcedureStepFlowDrawer step={openStep} controller={controller} onClose={() => setOpenStepId(null)} />
    </div>
  );
}

interface DepartmentProcedureCardProps {
  department: string;
  library: ReturnType<typeof loadProcedureLibrary>;
  controller: ProjectProcedureController;
  expanded: boolean;
  onToggle: () => void;
  onOpenStep: (step: ProcedureStep) => void;
}

function DepartmentProcedureCard({
  department,
  library,
  controller,
  expanded,
  onToggle,
  onOpenStep,
}: DepartmentProcedureCardProps) {
  const { modal, message } = App.useApp();
  const { data, canConfigure, departmentStatus, applyProcedure } = controller;

  const status = departmentStatus(department);
  const deptSteps = data.steps.filter((s) => s.department && isSameDepartment(s.department, department));
  const hasProcedure = deptSteps.length > 0;
  const stages = groupStepsByStage(department, deptSteps, data.stageApprovals);
  const totals = stages.reduce(
    (acc, st) => ({
      done: acc.done + st.done,
      total: acc.total + st.total,
      awaiting: acc.awaiting + st.awaitingApproval,
      returned: acc.returned + st.returned,
    }),
    { done: 0, total: 0, awaiting: 0, returned: 0 },
  );

  // Quy trình của chính phòng ban xếp trước
  const procedureOptions = useMemo(() => {
    const own = library.filter((p) => p.department && isSameDepartment(p.department, department));
    const others = library.filter((p) => !own.includes(p));
    const toOption = (p: (typeof library)[number]) => ({ value: p.id, label: `${p.name} (${p.steps.length} bước)` });
    return [
      ...(own.length ? [{ label: "Quy trình của phòng ban", options: own.map(toOption) }] : []),
      ...(others.length ? [{ label: "Quy trình khác", options: others.map(toOption) }] : []),
    ];
  }, [library, department]);

  const [picking, setPicking] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>(status?.procedureId);

  const handleApply = () => {
    const procedure = library.find((p) => p.id === selectedId);
    if (!procedure) return;
    const startedCount = deptSteps.filter((s) => s.status !== "NOT_STARTED" && s.status !== "DISABLED").length;
    const apply = () => {
      applyProcedure(department, procedure);
      setPicking(false);
      message.success(`Đã áp dụng "${procedure.name}" cho ${department}.`);
    };
    if (!hasProcedure) {
      apply();
      return;
    }
    modal.confirm({
      centered: true,
      width: 460,
      title: "Đổi quy trình của phòng ban?",
      content: (
        <div className="space-y-2 text-xs text-slate-600">
          <p className="m-0">
            Toàn bộ bước hiện tại của <strong>{department}</strong> sẽ được thay bằng các bước của{" "}
            <strong>{procedure.name}</strong>. Người thực hiện và hạn kế hoạch phải giao lại.
          </p>
          {startedCount > 0 && (
            <p className="m-0 rounded-md border border-rose-200 bg-rose-50 px-2 py-1.5 text-rose-700">
              Có {startedCount} bước đã bắt đầu hoặc hoàn thành — tiến độ và hồ sơ của các bước này sẽ bị xóa.
            </p>
          )}
        </div>
      ),
      okText: "Đổi quy trình",
      cancelText: "Giữ quy trình cũ",
      okButtonProps: { danger: true },
      onOk: apply,
    });
  };

  const showPicker = canConfigure && (!hasProcedure || picking);

  return (
    <Card surface="workspace" padding="none" rounded="lg" className="overflow-hidden border border-slate-200/80 shadow-xs">
      {/* Đầu thẻ: phòng ban · quy trình · số liệu luồng */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onToggle}
          disabled={!hasProcedure}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 border-0 bg-transparent p-0 text-left disabled:cursor-default"
        >
          <span className="w-3 text-[10px] text-slate-400">
            {hasProcedure && (expanded ? <DownOutlined /> : <RightOutlined />)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-slate-900">{department}</span>
            <span className="block text-[11px] text-slate-500">
              {hasProcedure ? (status?.procedureName ?? "Quy trình đã cấu hình") : "Chưa áp dụng quy trình"}
            </span>
          </span>
        </button>

        {hasProcedure && (
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 font-semibold text-slate-700">
              {totals.done}/{totals.total} bước xong
            </span>
            {totals.awaiting > 0 && (
              <span className="rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 font-semibold text-amber-800">
                {totals.awaiting} chờ duyệt
              </span>
            )}
            {totals.returned > 0 && (
              <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 font-semibold text-rose-700">
                {totals.returned} bị từ chối
              </span>
            )}
          </div>
        )}

        {showPicker ? (
          <div className="flex items-center gap-2">
            <Select
              size="small"
              value={selectedId}
              onChange={(v) => setSelectedId(v as string)}
              options={procedureOptions}
              placeholder="Chọn quy trình áp dụng"
              className="w-[260px] text-xs"
              popupMatchSelectWidth={false}
            />
            <Button
              intent="primary"
              scale="sm"
              disabled={!selectedId || selectedId === status?.procedureId}
              onClick={handleApply}
              className="!bg-[#DC2626] !border-[#DC2626] hover:!bg-[#B91C1C] disabled:opacity-50"
            >
              Áp dụng
            </Button>
            {hasProcedure && (
              <Button scale="sm" onClick={() => setPicking(false)}>
                Hủy
              </Button>
            )}
          </div>
        ) : canConfigure ? (
          <Button scale="sm" onClick={() => setPicking(true)}>
            Đổi quy trình
          </Button>
        ) : (
          !hasProcedure && <span className="text-[11px] italic text-slate-400">Chờ người có quyền cấu hình</span>
        )}
      </div>

      {/* Các giai đoạn của quy trình */}
      {hasProcedure && expanded && (
        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/40 p-3">
          {stages.map((stage) => (
            <StageBlock
              key={stage.code}
              department={department}
              stage={stage}
              controller={controller}
              onOpenStep={onOpenStep}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function StageBlock({
  department,
  stage,
  controller,
  onOpenStep,
}: {
  department: string;
  stage: StageSummary;
  controller: ProjectProcedureController;
  onOpenStep: (step: ProcedureStep) => void;
}) {
  const { message } = App.useApp();
  const {
    canManageDepartment,
    canApproveSteps,
    canDecideStage,
    decideStage,
    drafts,
    withDraft,
    setStepDraft,
    saveDrafts,
    discardDrafts,
    approveStep,
    returnStep,
    actorName,
  } = controller;
  const canManage = canManageDepartment(department);
  const [reviewing, setReviewing] = useState(false);
  const [rejecting, setRejecting] = useState<ProcedureStep | null>(null);
  const canApprove = canApproveSteps(department);
  // Giai đoạn đã được BGĐ nghiệm thu thì thu gọn sẵn, còn lại mở sẵn
  const [open, setOpen] = useState(stage.state !== "APPROVED");
  const staffOptions = useMemo(
    () => getDepartmentStaff(department).map((s) => ({ value: s.id, label: `${s.name} — ${s.title}` })),
    [department],
  );
  const stateMeta = STAGE_STATE_META[stage.state];
  const allDone = stage.total > 0 && stage.done === stage.total;
  const stagePercent = stage.total ? Math.round((stage.done / stage.total) * 100) : 0;

  const assign = (step: ProcedureStep, staffId?: string) => {
    const staff = getDepartmentStaff(department).find((s) => s.id === staffId);
    setStepDraft(step, {
      assignedTo: staff?.name,
      assignedToId: staff?.id,
      assignedBy: staff ? actorName : undefined,
      assignedAt: staff ? new Date().toISOString().slice(0, 10) : undefined,
    });
  };

  // Đặt ngày bắt đầu / kết thúc kế hoạch; kết thúc không được trước bắt đầu
  const setPlannedDate = (step: ProcedureStep, field: "startDatePlanned" | "endDatePlanned", value: string) => {
    const view = withDraft(step);
    if (value === (view[field] ?? "")) return;
    const start = field === "startDatePlanned" ? value : view.startDatePlanned;
    const end = field === "endDatePlanned" ? value : view.endDatePlanned;
    if (start && end && end < start) {
      message.warning("Ngày kết thúc kế hoạch không được trước ngày bắt đầu.");
      return;
    }
    setStepDraft(step, { [field]: value || undefined });
  };

  // Các bước của giai đoạn đang có phần sửa chưa lưu
  const stageDraftIds = stage.steps.filter((s) => drafts[s.id]).map((s) => s.id);

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      {/* Đầu giai đoạn: bấm để thu gọn / mở ra; tiến độ + nghiệm thu của BGĐ */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        className={cn(
          "flex cursor-pointer select-none flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 hover:bg-slate-50/70",
          open && "border-b border-slate-100",
        )}
      >
        <span className="w-3 text-[10px] text-slate-400">{open ? <DownOutlined /> : <RightOutlined />}</span>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-slate-900">
            Giai đoạn {stage.code}. {stage.title}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
            <span className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
              <span className="block h-full rounded-full bg-[#DC2626]" style={{ width: `${stagePercent}%` }} />
            </span>
            <span className="font-mono text-xs font-bold text-slate-900">{stagePercent}%</span>
            <span>
              · {stage.done}/{stage.total} bước hoàn thành
            </span>
          </div>
        </div>
        {stageDraftIds.length > 0 && (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <span className="text-[11px] font-semibold text-amber-700">{stageDraftIds.length} bước chưa lưu</span>
            <Button scale="sm" onClick={() => discardDrafts(stageDraftIds)}>
              Hủy
            </Button>
            <Button
              intent="primary"
              scale="sm"
              icon={<SaveOutlined />}
              onClick={() => {
                const { saved, started } = saveDrafts(stageDraftIds);
                message.success(
                  `Đã lưu ${saved} bước của giai đoạn ${stage.code}${started ? `, ${started} bước đã bắt đầu thực hiện` : ""}.`,
                );
              }}
              className="!bg-[#DC2626] !border-[#DC2626] hover:!bg-[#B91C1C]"
            >
              Lưu
            </Button>
          </div>
        )}
        <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${stateMeta.className}`}>
          {stateMeta.label}
        </span>
        {canDecideStage && allDone && stage.state !== "APPROVED" && (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Button
              scale="sm"
              icon={<FileDoneOutlined />}
              className="!border-emerald-600 !bg-emerald-600 !text-white hover:!bg-emerald-700"
              onClick={() => {
                decideStage(department, stage, true);
                message.success(`Đã nghiệm thu giai đoạn ${stage.code}.`);
              }}
            >
              Nghiệm thu
            </Button>
            <Button scale="sm" danger onClick={() => setReviewing(true)}>
              Yêu cầu rà soát
            </Button>
          </div>
        )}
      </div>

      {open && (
        <>
          {stage.approval && (
            <div
              className={cn(
                "px-3 py-1.5 text-[11px]",
                stage.state === "RETURNED" ? "bg-rose-50 text-rose-700" : "bg-emerald-50/60 text-emerald-800",
              )}
            >
              {stage.state === "RETURNED" ? (
                <>
                  <ExclamationCircleOutlined className="mr-1" />
                  {stage.approval.decidedBy} yêu cầu rà soát ({stage.approval.decidedAt}): {stage.approval.rejectionReason}
                </>
              ) : (
                stage.state === "APPROVED" &&
                `Nghiệm thu bởi ${stage.approval.decidedBy} · ${stage.approval.decidedAt}`
              )}
            </div>
          )}

          {/* Các bước của giai đoạn */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] table-fixed border-collapse text-left text-xs">
              <thead>
                <tr className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="w-[8%] px-3 py-1.5">Mã</th>
                  <th className="px-3 py-1.5">Bước thực hiện</th>
                  <th className="w-[20%] py-1.5 pl-5 pr-3">Người thực hiện</th>
                  <th className="w-[13%] py-1.5 pl-5 pr-3">Bắt đầu</th>
                  <th className="w-[13%] py-1.5 pl-5 pr-3">Kết thúc</th>
                  <th className="w-[16%] px-3 py-1.5">Trạng thái xử lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stage.steps.map((saved) => {
                  // Hiển thị bản đang sửa; trạng thái lấy theo bản đã lưu
                  const step = withDraft(saved);
                  const draft = drafts[saved.id] ?? {};
                  const flow = getStepFlow(saved);
                  // Chỉ giao lại / đổi hạn khi bước chưa nộp và chưa xong
                  const editable =
                    canManage && (flow === "UNASSIGNED" || flow === "IN_PROGRESS" || flow === "RETURNED");
                  const alert = getStepAlertLevel(step);
                  return (
                    <tr
                      key={step.id}
                      onClick={() => onOpenStep(saved)}
                      className={cn("cursor-pointer hover:bg-slate-50/80", flow === "DISABLED" && "opacity-60")}
                    >
                      <td className="px-3 py-2 align-middle font-mono text-slate-500">{step.code}</td>
                      <td className="px-3 py-2 align-middle leading-snug text-slate-800">{step.name}</td>
                      <td className="px-3 py-2 align-middle" onClick={(e) => editable && e.stopPropagation()}>
                        {editable ? (
                          <Select
                            size="small"
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            value={step.assignedToId}
                            onChange={(v) => assign(saved, v as string | undefined)}
                            status={"assignedToId" in draft ? "warning" : undefined}
                            options={staffOptions}
                            placeholder="Chọn người thực hiện"
                            className="w-full"
                            style={CELL_CONTROL_STYLE}
                            popupMatchSelectWidth={false}
                          />
                        ) : (
                          <CellText className={step.assignedTo ? "text-slate-800" : "italic text-slate-400"}>
                            {step.assignedTo || "Chưa giao"}
                          </CellText>
                        )}
                      </td>
                      <td className="px-3 py-2 align-middle" onClick={(e) => editable && e.stopPropagation()}>
                        <StepDateCell
                          step={step}
                          field="startDatePlanned"
                          actual={step.actualStartDate}
                          editable={editable}
                          changed={"startDatePlanned" in draft}
                          onChange={(value) => setPlannedDate(saved, "startDatePlanned", value)}
                        />
                      </td>
                      <td className="px-3 py-2 align-middle" onClick={(e) => editable && e.stopPropagation()}>
                        <StepDateCell
                          step={step}
                          field="endDatePlanned"
                          actual={step.actualEndDate || (step.status === "COMPLETED" ? step.approvedAt : undefined)}
                          editable={editable}
                          tone={alert === "DANGER_RED" ? "danger" : alert === "WARNING_YELLOW" ? "warning" : undefined}
                          changed={"endDatePlanned" in draft}
                          onChange={(value) => setPlannedDate(saved, "endDatePlanned", value)}
                        />
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <FlowBadge step={step} />
                        {/* Đã nộp: Tổ trưởng duyệt hoặc từ chối ngay trên bảng */}
                        {flow === "AWAITING_APPROVAL" && canApprove && (
                          <div className="mt-1.5 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <Button
                              scale="compact"
                              icon={<CheckOutlined />}
                              onClick={() => {
                                approveStep(saved);
                                message.success(`Đã duyệt bước ${step.code}.`);
                              }}
                              className="!h-6 !px-2 !text-[11px] !border-emerald-600 !bg-emerald-600 !text-white hover:!bg-emerald-700"
                            >
                              Duyệt
                            </Button>
                            <Button
                              scale="compact"
                              danger
                              icon={<CloseOutlined />}
                              onClick={() => setRejecting(saved)}
                              className="!h-6 !px-2 !text-[11px]"
                            >
                              Từ chối
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <RejectStepModal
        step={rejecting}
        onClose={() => setRejecting(null)}
        onConfirm={(reason) => {
          if (rejecting) returnStep(rejecting, reason);
          message.warning("Đã từ chối, chuyển lại cho người thực hiện.");
          setRejecting(null);
        }}
      />

      <ReasonModal
        open={reviewing}
        title="Yêu cầu rà soát giai đoạn"
        summary={
          <span>
            Giai đoạn <strong>{stage.code}. {stage.title}</strong> của {department}
          </span>
        }
        label="Nội dung cần rà soát"
        presetReasons={["Hồ sơ chưa đầy đủ", "Kết quả chưa đúng chủ trương được duyệt", "Cần bổ sung ý kiến thẩm định"]}
        confirmText="Gửi yêu cầu rà soát"
        onClose={() => setReviewing(false)}
        onConfirm={async (reason) => {
          decideStage(department, stage, false, reason);
          message.warning(`Đã yêu cầu ${department} rà soát giai đoạn ${stage.code}.`);
          setReviewing(false);
          return true;
        }}
      />
    </section>
  );
}

/**
 * Một ô ngày (bắt đầu hoặc kết thúc) của bước.
 * Bước đang xử lý: luôn sửa được ngày kế hoạch. Bước đã nộp / hoàn thành: hiện ngày thực tế (chưa có thì ngày kế hoạch, gắn "KH").
 */
function StepDateCell({
  step,
  field,
  actual,
  editable,
  tone,
  changed,
  onChange,
}: {
  step: ProcedureStep;
  field: "startDatePlanned" | "endDatePlanned";
  actual?: string;
  editable: boolean;
  /** Màu cảnh báo hạn (chỉ dùng cho ngày kết thúc) */
  tone?: "danger" | "warning";
  /** Đã sửa nhưng chưa lưu */
  changed?: boolean;
  onChange: (value: string) => void;
}) {
  const planned = step[field];
  if (editable) {
    return (
      <Input
        key={`${step.id}-${field}-${planned ?? ""}`}
        size="small"
        type="date"
        defaultValue={planned ?? ""}
        onBlur={(e) => onChange(e.target.value)}
        status={changed ? "warning" : tone === "danger" ? "error" : tone}
        className="w-full"
        style={CELL_CONTROL_STYLE}
      />
    );
  }
  if (actual) return <CellText className="text-slate-800">{formatDateVi(actual)}</CellText>;
  if (!planned) return <CellText className="text-slate-400">—</CellText>;
  return (
    <CellText
      className={cn(
        "text-slate-500",
        tone === "danger" && "text-rose-600",
        tone === "warning" && "text-amber-700",
      )}
    >
      {formatDateVi(planned)}
      <span className="ml-1 text-[10px]">KH</span>
    </CellText>
  );
}

/** Ô nhập trong bảng bước: cao 28px, chữ 12px — bằng ô chỉ đọc để các dòng thẳng hàng */
const CELL_CONTROL_STYLE: React.CSSProperties = { height: 28, fontSize: 12 };

/** Ô chỉ đọc có cùng chiều cao và lề trong với ô nhập, để chữ thẳng hàng với ô nhập ở dòng khác */
function CellText({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "flex h-7 items-center truncate rounded-md border border-transparent px-2 text-xs tabular-nums",
        className,
      )}
    >
      {children}
    </span>
  );
}
