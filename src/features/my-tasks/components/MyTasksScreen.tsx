"use client";

import { useMemo, useState } from "react";
import type React from "react";
import { App, AutoComplete } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { Input, Select } from "@/components/ui";
import { ReasonModal } from "@/components/workspace";
import {
  HANDBACK_REASON_PRESETS,
  INCIDENT_REASON_PRESETS,
  MY_TASK_COLUMNS,
  MY_TASK_KIND_META,
  REJECT_REASON_PRESETS,
  type MyTaskColumn,
  type MyTaskDropAction,
} from "../constants/my-task-tabs";
import { useMyTasks } from "../hooks/useMyTasks";
import { hasIncident, isMine, type HandbackMode, type MyTask } from "../utils/my-tasks";
import MyTaskBoard, { type MyTaskItem } from "./MyTaskBoard";
import MyTaskStatsChart from "./MyTaskStatsChart";
import { toProcedureDocuments } from "../utils/task-documents";
import MyTaskDrawer, { type TaskWorkActions } from "./MyTaskDrawer";

type TaskKey = { projectId: string; stepId: string };
const keyOfTask = (task: MyTask): TaskKey => ({ projectId: task.projectId, stepId: task.step.id });

/**
 * "Việc cần xử lý" — chọn dự án · tìm kiếm → bảng 5 cột kéo thả
 * (Chờ tiếp nhận · Đang xử lý · Chờ duyệt · Hoàn thành · Từ chối · Sự cố).
 */
export default function MyTasksScreen() {
  const { message, modal } = App.useApp();
  const ctl = useMyTasks();
  // Giữ khóa việc, lấy lại việc từ dữ liệu mới nhất (vừa thêm ghi chú / hồ sơ thì ngăn chi tiết cập nhật theo)
  const [viewingKey, setViewingKey] = useState<TaskKey | null>(null);
  const [rejecting, setRejecting] = useState<MyTask | null>(null);
  const [reporting, setReporting] = useState<MyTask | null>(null);
  // Lọc thêm theo quy trình (chỉ khi đã chọn một dự án)
  const [procedureFilter, setProcedureFilter] = useState<string>();
  const [handingBack, setHandingBack] = useState<{ task: MyTask; mode: HandbackMode } | null>(null);
  const viewing = viewingKey ? (ctl.findTask(viewingKey.projectId, viewingKey.stepId) ?? null) : null;
  const setViewing = (task: MyTask | null) => setViewingKey(task && keyOfTask(task));

  const work: TaskWorkActions = {
    onSaveNote: (task, note) => {
      if (!ctl.saveNote(task, note)) {
        notFound();
        return false;
      }
      return true;
    },
    onAddFiles: (task, files) => {
      if (!ctl.addDocuments(task, toProcedureDocuments(files, ctl.me.name))) return notFound();
      message.success(`Đã thêm ${files.length} hồ sơ.`);
    },
    onRemoveFile: (task, doc) =>
      modal.confirm({
        centered: true,
        title: "Gỡ hồ sơ?",
        content: <p className="m-0 text-xs text-slate-600">Gỡ tệp <strong>{doc.fileName}</strong> khỏi bước {task.step.code}.</p>,
        okText: "Gỡ",
        okButtonProps: { danger: true },
        cancelText: "Hủy",
        onOk: () => {
          if (!ctl.removeDocument(task, doc.id)) notFound();
        },
      }),
  };

  /**
   * Thẻ của từng cột: việc của mình trước (bỏ loại của người duyệt nếu không có quyền duyệt; mỗi việc chỉ hiện một lần),
   * sau đó là việc của người khác ở cùng tình trạng — chỉ xem, không thao tác.
   */
  const columns = useMemo(() => {
    const build = (col: MyTaskColumn): MyTaskItem[] => {
      const seen = new Set<string>();
      const mine: MyTaskItem[] = MY_TASK_COLUMNS[col].kinds
        .filter((k) => ctl.isReviewer || !MY_TASK_KIND_META[k].reviewerOnly)
        .flatMap((kind) =>
          ctl.groups[kind].flatMap((task) => {
            const key = `${task.projectId}:${task.step.id}`;
            if (seen.has(key)) return [];
            seen.add(key);
            return [{ kind, task }];
          }),
        );
      const kinds = MY_TASK_COLUMNS[col].kinds;
      const others = ctl.others
        .filter((o) => kinds.includes(o.kind) && !seen.has(`${o.task.projectId}:${o.task.step.id}`))
        .map((o) => ({ ...o, readonly: true }));
      const items = [...mine, ...others];
      // Chờ tiếp nhận: bước đang tới lượt lên trước, bước chưa tới lượt xếp sau theo thứ tự quy trình
      return col === "accept"
        ? items.sort(
            (a, b) =>
              Number(b.task.reached) - Number(a.task.reached) ||
              a.task.projectName.localeCompare(b.task.projectName) ||
              a.task.step.order - b.task.step.order,
          )
        : items;
    };
    return {
      accept: build("accept"),
      processing: build("processing"),
      pending: build("pending"),
      done: build("done"),
      rejected: build("rejected"),
      incident: build("incident"),
    };
  }, [ctl.groups, ctl.others, ctl.isReviewer]);

  const canReviewTask = (task: MyTask) => task.flow === "AWAITING_APPROVAL" && ctl.groups.review.includes(task);
  const isWorking = (task: MyTask) => task.flow === "IN_PROGRESS" || task.flow === "RETURNED";
  // Chỉ nhận / làm được bước đã tới lượt theo thứ tự quy trình
  const canAcceptTask = (task: MyTask) => task.reached && ctl.groups.accept.includes(task);
  // Phải tiếp nhận trước khi làm; đang có sự cố thì chờ Tổ trưởng xử lý
  const canSubmitTask = (task: MyTask) =>
    task.reached &&
    isWorking(task) &&
    isMine(task.step, ctl.me) &&
    !ctl.groups.accept.includes(task) &&
    !hasIncident(task.step);
  // Báo cáo sự cố: bấm được ở mọi việc chưa xong (kể cả chưa tới lượt / đang chờ duyệt) của mình hoặc tổ mình duyệt
  const canReportIncidentTask = (task: MyTask) =>
    !["COMPLETED", "SKIPPED", "DISABLED"].includes(task.flow) &&
    (isMine(task.step, ctl.me) || ctl.canReview(task.department)) &&
    !hasIncident(task.step);
  const canResolveIncidentTask = (task: MyTask) => hasIncident(task.step) && ctl.canReview(task.department);
  // Hoàn trả: việc của mình đã nộp, đang chờ duyệt → rút về Đang xử lý
  // Từ chối (trả việc về Tổ trưởng): được cả lúc chờ tiếp nhận lẫn đang xử lý — đi cùng Báo cáo sự cố
  const canDeclineTask = (task: MyTask) => isWorking(task) && isMine(task.step, ctl.me) && !hasIncident(task.step);
  const canGiveBackTask = (task: MyTask) => task.flow === "AWAITING_APPROVAL" && isMine(task.step, ctl.me);
  const notFound = () => message.error("Không tìm thấy quy trình của dự án, vui lòng tải lại trang.");

  /** Nộp ngay ghi chú + hồ sơ đã có trên bước; chưa có gì thì mở chi tiết để bổ sung */
  const handleSubmit = (task: MyTask) => {
    const result = ctl.submitNow(task);
    if (result === "notfound") return notFound();
    if (result === "empty") {
      message.warning("Thêm ghi chú hoặc hồ sơ kết quả trước khi nộp.");
      setViewing(task);
      return;
    }
    message.success(`Đã nộp kết quả bước ${task.step.code}, chờ Tổ trưởng duyệt.`);
    setViewing(null);
  };

  const handleApprove = (task: MyTask) =>
    modal.confirm({
      centered: true,
      title: "Duyệt hoàn thành bước?",
      content: (
        <p className="m-0 text-xs text-slate-600">
          Xác nhận kết quả bước <strong>{task.step.code} · {task.step.name}</strong>
          {task.step.assignedTo ? ` của ${task.step.assignedTo}` : ""} đã đạt yêu cầu.
        </p>
      ),
      okText: "Duyệt",
      cancelText: "Hủy",
      onOk: () => {
        if (!ctl.approve(task)) return notFound();
        message.success(`Đã duyệt bước ${task.step.code}.`);
        setViewing(null);
      },
    });

  const handleReject = async (reason: string) => {
    if (!rejecting) return false;
    if (!ctl.reject(rejecting, reason)) {
      notFound();
      return false;
    }
    message.success(`Đã từ chối bước ${rejecting.step.code}, người thực hiện sẽ làm lại.`);
    setRejecting(null);
    setViewing(null);
    return true;
  };

  const handleAccept = (task: MyTask) => {
    if (!ctl.accept(task)) return notFound();
    message.success(`Đã chuyển bước ${task.step.code} sang Đang xử lý.`);
    setViewing(null);
  };

  const handleReportIncident = async (reason: string) => {
    if (!reporting) return false;
    if (!ctl.reportIncident(reporting, reason)) {
      notFound();
      return false;
    }
    message.success(`Đã báo sự cố ở bước ${reporting.step.code}, chờ Tổ trưởng xử lý.`);
    setReporting(null);
    setViewing(null);
    return true;
  };

  const handleResolveIncident = (task: MyTask) => {
    if (!canResolveIncidentTask(task)) {
      message.warning("Chỉ Tổ trưởng của phòng ban mới đánh dấu đã xử lý sự cố.");
      return;
    }
    modal.confirm({
      centered: true,
      title: "Đã xử lý xong sự cố?",
      content: (
        <p className="m-0 text-xs text-slate-600">
          Bước <strong>{task.step.code} · {task.step.name}</strong> trở lại Đang xử lý để{" "}
          {task.step.assignedTo || "người thực hiện"} làm tiếp.
        </p>
      ),
      okText: "Đã xử lý",
      cancelText: "Hủy",
      onOk: () => {
        if (!ctl.resolveIncident(task)) return notFound();
        message.success(`Đã xử lý sự cố ở bước ${task.step.code}.`);
        setViewing(null);
      },
    });
  };

  const handleHandBack = async (reason: string) => {
    if (!handingBack) return false;
    const { task, mode } = handingBack;
    if (!ctl.handBack(task, mode, reason)) {
      notFound();
      return false;
    }
    message.success(
      mode === "decline"
        ? `Đã từ chối bước ${task.step.code}, việc được trả về Tổ trưởng.`
        : `Đã hoàn trả bước ${task.step.code}, việc quay lại Đang xử lý.`,
    );
    setHandingBack(null);
    setViewing(null);
    return true;
  };

  /** Thả thẻ: tiếp nhận / nộp ngay; duyệt, xử lý sự cố cần xác nhận; từ chối, báo sự cố cần lý do */
  const handleDrop = ({ task }: MyTaskItem, action: MyTaskDropAction) => {
    if (action === "accept") handleAccept(task);
    else if (action === "submit") handleSubmit(task);
    else if (action === "approve") handleApprove(task);
    else if (action === "reject") setRejecting(task);
    else if (action === "incident") setReporting(task);
    else handleResolveIncident(task);
  };

  /**
   * Gợi ý dự án theo chữ đang gõ (chưa gõ thì gợi ý tất cả). Chọn gợi ý chỉ điền tên dự án vào ô tìm như chữ thường:
   * việc được lọc theo tên đó, xóa bớt từng ký tự là nới lọc dần.
   */
  const q = ctl.keyword.trim().toLowerCase();
  const matchedProjects = ctl.projectOptions.filter(
    (p) => p.name.toLowerCase() !== q && (!q || `${p.name} ${p.code}`.toLowerCase().includes(q)),
  );
  const projectSuggestions =
    matchedProjects.length === 0
      ? []
      : [
          {
            label: <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Lọc theo dự án</span>,
            options: matchedProjects.map((p) => ({
              value: p.name,
              label: (
                <div className="flex items-center gap-2.5 py-1">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
                    {p.name.trim().slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-slate-800">{p.name}</span>
                    {p.code && p.code !== p.name && (
                      <span className="block truncate font-mono text-[11px] text-slate-400">{p.code}</span>
                    )}
                  </span>
                </div>
              ),
            })),
          },
        ];

  // Số liệu tổng quan: chỉ đếm việc của mình (không tính việc người khác chỉ xem), theo ô tìm hiện tại
  // Đã chọn đúng một dự án (ô tìm khớp tên dự án) → chọn thêm quy trình của dự án đó
  const selectedProject = ctl.projectOptions.find((p) => p.name.toLowerCase() === q);
  const procedureOptions = selectedProject
    ? [
        ...new Set(
          Object.values(columns)
            .flat()
            .filter((it) => it.task.projectId === selectedProject.id)
            .map((it) => it.task.procedureName),
        ),
      ].sort((a, b) => a.localeCompare(b, "vi"))
    : [];
  // Quy trình đã chọn chỉ còn hiệu lực khi vẫn thuộc dự án đang chọn
  const activeProcedure = procedureFilter && procedureOptions.includes(procedureFilter) ? procedureFilter : undefined;
  const shownColumns = activeProcedure
    ? (Object.fromEntries(
        Object.entries(columns).map(([col, items]) => [col, items.filter((it) => it.task.procedureName === activeProcedure)]),
      ) as typeof columns)
    : columns;

  const mineOf = (col: MyTaskColumn) => shownColumns[col].filter((it) => !it.readonly);
  const projectCount = new Set(
    (Object.keys(shownColumns) as MyTaskColumn[]).flatMap(mineOf).map((it) => it.task.projectId),
  ).size;

  return (
    <div className="mx-auto flex w-full max-w-[2560px] flex-col gap-4">
      {/* Thống kê + ô tìm chung một khung (chọn gợi ý dự án thì tên dự án được điền vào ô) */}
      <MyTaskStatsChart
        projectCount={projectCount}
        toolbar={
            <div className="flex flex-wrap items-center gap-2">
              <AutoComplete
                value={ctl.keyword}
                onChange={(next: string) => ctl.setKeyword(next ?? "")}
                options={projectSuggestions}
                popupMatchSelectWidth
                listHeight={320}
                className="min-w-0 flex-1"
                classNames={{
                  popup: {
                    root: "[&_.ant-select-item]:!rounded-lg [&_.ant-select-item-option-active]:!bg-slate-50",
                  },
                }}
              >
                <Input
                  prefix={<SearchOutlined className="text-slate-400" />}
                  placeholder="Tìm việc, mã bước hoặc tên dự án..."
                  className="!border-slate-200 !shadow-none hover:!border-slate-300 [&.ant-input-affix-wrapper-focused]:!border-slate-400"
                />
              </AutoComplete>
              {/* Chọn dự án xong thì lọc thêm theo quy trình của dự án đó */}
              {selectedProject && procedureOptions.length > 0 && (
                <Select
                  aria-label="Quy trình"
                  allowClear
                  placeholder="Tất cả quy trình"
                  value={activeProcedure}
                  onChange={(v?: string) => setProcedureFilter(v)}
                  options={procedureOptions.map((name) => ({ value: name, label: name }))}
                  className="w-full sm:w-[280px]"
                />
              )}
            </div>
        }
        segments={[
          { key: "accept", label: "Chờ tiếp nhận", count: mineOf("accept").length, color: "#8b5cf6" },
          { key: "processing", label: "Đang xử lý", count: mineOf("processing").length, color: "#3b82f6" },
          { key: "pending", label: "Chờ duyệt", count: mineOf("pending").length, color: "#f59e0b" },
          { key: "done", label: "Hoàn thành", count: mineOf("done").length, color: "#10b981" },
          { key: "rejected", label: "Từ chối", count: mineOf("rejected").length, color: "#f97316" },
          { key: "incident", label: "Sự cố", count: mineOf("incident").length, color: "#f43f5e" },
        ]}
      />

      <MyTaskBoard
        columns={shownColumns}
        onOpen={setViewing}
        onDrop={handleDrop}
      />

      <MyTaskDrawer
        task={viewing}
        canSubmit={Boolean(viewing && canSubmitTask(viewing))}
        canReview={Boolean(viewing && canReviewTask(viewing))}
        canAccept={Boolean(viewing && canAcceptTask(viewing))}
        canReportIncident={Boolean(viewing && canReportIncidentTask(viewing))}
        canResolveIncident={Boolean(viewing && canResolveIncidentTask(viewing))}
        onAccept={handleAccept}
        onReportIncident={setReporting}
        onResolveIncident={handleResolveIncident}
        canDecline={Boolean(viewing && canDeclineTask(viewing))}
        canGiveBack={Boolean(viewing && canGiveBackTask(viewing))}
        onDecline={(task) => setHandingBack({ task, mode: "decline" })}
        onGiveBack={(task) => setHandingBack({ task, mode: "return" })}
        meName={ctl.me.name}
        work={work}
        onClose={() => setViewing(null)}
        onSubmit={handleSubmit}
        onApprove={handleApprove}
        onReject={setRejecting}
      />


      <ReasonModal
        open={Boolean(rejecting)}
        title="Từ chối kết quả bước"
        summary={
          rejecting && (
            <span>
              <strong>{rejecting.step.code} · {rejecting.step.name}</strong> — {rejecting.step.assignedTo || "người thực hiện"} ·{" "}
              {rejecting.projectName}
            </span>
          )
        }
        label="Lý do từ chối"
        confirmText="Từ chối"
        presetReasons={REJECT_REASON_PRESETS}
        onClose={() => setRejecting(null)}
        onConfirm={handleReject}
      />

      <ReasonModal
        open={Boolean(reporting)}
        title="Báo cáo sự cố"
        summary={
          reporting && (
            <span>
              <strong>{reporting.step.code} · {reporting.step.name}</strong> — {reporting.projectName}
            </span>
          )
        }
        label="Mô tả sự cố"
        confirmText="Gửi báo cáo"
        presetReasons={INCIDENT_REASON_PRESETS}
        onClose={() => setReporting(null)}
        onConfirm={handleReportIncident}
      />

      <ReasonModal
        open={Boolean(handingBack)}
        title={handingBack?.mode === "decline" ? "Từ chối việc" : "Hoàn trả việc"}
        summary={
          handingBack && (
            <span>
              <strong>{handingBack.task.step.code} · {handingBack.task.step.name}</strong>
              {handingBack.mode === "decline" && " — việc sẽ được trả về Tổ trưởng để giao người khác."}
            </span>
          )
        }
        label={handingBack?.mode === "decline" ? "Lý do từ chối" : "Lý do hoàn trả"}
        placeholder={handingBack?.mode === "decline" ? undefined : "Nhập lý do hoàn trả..."}
        confirmText={handingBack?.mode === "decline" ? "Từ chối" : "Hoàn trả"}
        // Hoàn trả: chỉ nhập lý do, không chọn lý do mẫu
        presetReasons={handingBack?.mode === "decline" ? HANDBACK_REASON_PRESETS.decline : undefined}
        optional={handingBack?.mode === "return"}
        onClose={() => setHandingBack(null)}
        onConfirm={handleHandBack}
      />
    </div>
  );
}
