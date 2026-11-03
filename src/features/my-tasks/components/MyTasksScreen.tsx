"use client";

import { useMemo, useState } from "react";
import { App } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { Card, Input, Select } from "@/components/ui";
import { ReasonModal } from "@/components/workspace";
import { cn } from "@/utils/cn";
import {
  MY_TASK_KIND_META,
  MY_TASK_VIEWS,
  REJECT_REASON_PRESETS,
  type MyTaskView,
} from "../constants/my-task-tabs";
import { ALL_PROJECTS, useMyTasks } from "../hooks/useMyTasks";
import { isMine, type MyTask, type MyTaskTab } from "../utils/my-tasks";
import MyTaskDrawer from "./MyTaskDrawer";
import MyTaskList, { timeInfo, type MyTaskItem } from "./MyTaskList";
import SubmitTaskModal from "./SubmitTaskModal";

const ALL_KINDS = "ALL";
type KindFilter = MyTaskTab | typeof ALL_KINDS;

/**
 * "Việc cần xử lý" — một khung: tab Việc của tôi / Lịch sử → bộ lọc (loại việc · dự án · tìm kiếm) → danh sách.
 */
export default function MyTasksScreen() {
  const { message, modal } = App.useApp();
  const ctl = useMyTasks();
  const [view, setView] = useState<MyTaskView>("mine");
  const [kindByView, setKindByView] = useState<Record<MyTaskView, KindFilter>>({ mine: ALL_KINDS, history: ALL_KINDS });
  // Lịch sử: lọc theo một ngày (ngày nộp / duyệt / từ chối của từng dòng)
  const [historyDate, setHistoryDate] = useState("");
  const [viewing, setViewing] = useState<MyTask | null>(null);
  const [submitting, setSubmitting] = useState<MyTask | null>(null);
  const [rejecting, setRejecting] = useState<MyTask | null>(null);

  // Loại việc có trong tab (bỏ loại của người duyệt nếu không có quyền duyệt)
  const kinds = MY_TASK_VIEWS[view].kinds.filter((k) => ctl.isReviewer || !MY_TASK_KIND_META[k].reviewerOnly);
  // Lịch sử chỉ lọc theo tìm kiếm + ngày, luôn gồm mọi loại việc
  const kind = view === "history" ? ALL_KINDS : kindByView[view];
  const goTo = (nextView: MyTaskView, nextKind: KindFilter = ALL_KINDS) => {
    setView(nextView);
    setKindByView((prev) => ({ ...prev, [nextView]: nextKind }));
  };

  /** Dòng của tab đang xem: "Việc của tôi" theo thứ tự loại việc; "Lịch sử" mới nhất lên đầu */
  const items = useMemo<MyTaskItem[]>(() => {
    const seen = new Set<string>();
    const list = (kind === ALL_KINDS ? kinds : [kind]).flatMap((k) =>
      ctl.groups[k].flatMap((task) => {
        const key = `${task.projectId}:${task.step.id}`;
        if (seen.has(key)) return [];
        seen.add(key);
        return [{ kind: k, task }];
      }),
    );
    if (view === "history") {
      return list
        .filter((item) => !historyDate || timeInfo(item.kind, item.task).raw === historyDate)
        .sort((a, b) => (timeInfo(b.kind, b.task).raw ?? "").localeCompare(timeInfo(a.kind, a.task).raw ?? ""));
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctl.groups, kind, view, ctl.isReviewer, historyDate]);

  const canReviewTask = (task: MyTask) => task.flow === "AWAITING_APPROVAL" && ctl.groups.review.includes(task);
  const canSubmitTask = (task: MyTask) =>
    (task.flow === "IN_PROGRESS" || task.flow === "RETURNED") && isMine(task.step, ctl.me);
  const notFound = () => message.error("Không tìm thấy quy trình của dự án, vui lòng tải lại trang.");

  const handleSubmit: Parameters<typeof SubmitTaskModal>[0]["onSubmit"] = (task, input) => {
    if (!ctl.submit(task, input)) return notFound();
    message.success(`Đã nộp kết quả bước ${task.step.code}, chờ Tổ trưởng duyệt.`);
    setSubmitting(null);
    setViewing(null);
    goTo("history", "submitted");
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

  return (
    <div className="mx-auto w-full max-w-[2560px]">
      <Card surface="workspace" padding="none" rounded="lg" className="overflow-hidden border border-slate-200/80 shadow-xs">
        {/* Hai tab: việc đang chờ mình xử lý / việc đã qua tay */}
        <div role="tablist" className="flex gap-6 border-b border-slate-200 px-4 pt-3.5">
          {(Object.keys(MY_TASK_VIEWS) as MyTaskView[]).map((key) => (
            <ViewTab
              key={key}
              active={view === key}
              onClick={() => {
                setView(key);
                // Lịch sử không lọc theo dự án
                if (key === "history") ctl.setProjectId(ALL_PROJECTS);
              }}
            >
              {MY_TASK_VIEWS[key].label}
            </ViewTab>
          ))}
        </div>

        {/* Bộ lọc: loại việc · dự án · tìm kiếm */}
        <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center">
          {view === "mine" && (
            <>
              <Select
                value={kind}
                onChange={(next: KindFilter) => setKindByView((prev) => ({ ...prev, [view]: next }))}
                className="w-full sm:w-56"
                options={[
                  { value: ALL_KINDS, label: "Tất cả loại việc" },
                  ...kinds.map((k) => ({ value: k, label: MY_TASK_KIND_META[k].label })),
                ]}
              />
              <Select
                showSearch
                value={ctl.projectId}
                onChange={ctl.setProjectId}
                optionFilterProp="label"
                className="w-full sm:w-64"
                options={[
                  { value: ALL_PROJECTS, label: "Tất cả dự án" },
                  ...ctl.projectOptions.map((p) => ({ value: p.id, label: p.name })),
                ]}
              />
            </>
          )}
          <Input
            allowClear
            prefix={<SearchOutlined className="text-slate-400" />}
            placeholder="Tìm việc, dự án..."
            value={ctl.keyword}
            onChange={(e) => ctl.setKeyword(e.target.value)}
            className={view === "history" ? "w-full sm:!w-[420px] sm:flex-none" : "w-full sm:!w-72 sm:flex-none"}
          />
          {view === "history" && (
            // Bọc riêng để đẩy ô ngày sát mép phải
            <div className="w-full sm:ml-auto sm:w-44 sm:flex-none">
              <Input
                type="date"
                aria-label="Lọc theo ngày"
                title="Lọc theo ngày nộp / duyệt / từ chối"
                value={historyDate}
                onChange={(e) => setHistoryDate(e.target.value)}
                className="w-full"
              />
            </div>
          )}
        </div>

        <MyTaskList
          key={`${view}:${kind}:${ctl.projectId}:${ctl.keyword}`}
          items={items}
          emptyText={MY_TASK_VIEWS[view].empty}
          onOpen={setViewing}
          onSubmit={setSubmitting}
          onApprove={handleApprove}
          onReject={setRejecting}
        />
      </Card>

      <MyTaskDrawer
        task={viewing}
        canSubmit={Boolean(viewing && canSubmitTask(viewing))}
        canReview={Boolean(viewing && canReviewTask(viewing))}
        onClose={() => setViewing(null)}
        onSubmit={setSubmitting}
        onApprove={handleApprove}
        onReject={setRejecting}
      />

      <SubmitTaskModal
        task={submitting}
        submitterName={ctl.me.name}
        onClose={() => setSubmitting(null)}
        onSubmit={handleSubmit}
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
    </div>
  );
}

function ViewTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "-mb-px cursor-pointer border-0 border-b-2 bg-transparent px-0.5 pb-2.5 text-[13px] transition-colors",
        active ? "border-[#DC2626] font-semibold text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800",
      )}
    >
      {children}
    </button>
  );
}
