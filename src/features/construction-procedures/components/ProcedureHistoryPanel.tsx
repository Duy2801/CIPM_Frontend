"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui";
import ActivityDateFilter, { toLocalDate } from "@/features/personnel-assignment/components/ActivityDateFilter";
import ActivityTimeline from "@/features/personnel-assignment/components/ActivityTimeline";
import type { ActivityEntry } from "@/features/personnel-assignment/utils/activity-log";
import type { ProjectProcedureData, StepStatus } from "../types/procedure.types";

interface ProcedureHistoryPanelProps {
  /** Toàn bộ dự án — lịch sử gộp của tất cả dự án, mới nhất lên đầu */
  projects: ProjectProcedureData[];
}

const STEP_STATUS_LABELS: Record<StepStatus, string> = {
  NOT_STARTED: "Chưa bắt đầu",
  IN_PROGRESS: "Đang thực hiện",
  COMPLETED: "Đã hoàn thành",
  SKIPPED: "Đã bỏ qua",
  DISABLED: "Đã tắt",
};

/** "2026-10-22 08:30" hoặc ISO → ISO (cùng cách đọc với lịch sử trong hồ sơ cán bộ) */
function toIso(value: string): string {
  const d = new Date(value.includes("T") ? value : value.replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString();
}

/** Đổi nhật ký từng bước thủ tục sang dòng lịch sử dùng chung (giống các phân hệ khác) */
function toActivityEntries(projects: ProjectProcedureData[]): ActivityEntry[] {
  return projects
    .flatMap((project) =>
      (project.history ?? []).map<ActivityEntry>((log) => ({
        id: `PROC-${project.projectId}-${log.id}`,
        at: toIso(log.timestamp),
        actorName: log.performedBy,
        actorRole: log.role,
        module: "Thủ tục XDCB",
        action: `${log.actionLabel}${log.stepCode ? ` [${log.stepCode}]` : ""}`,
        targetType: "procedure",
        targetId: project.projectId,
        targetName: `[${project.projectCode}] ${project.projectName} · ${log.stepName}`,
        changes: [
          ...(log.previousStatus || log.newStatus
            ? [
                {
                  label: "Trạng thái",
                  from: log.previousStatus ? STEP_STATUS_LABELS[log.previousStatus] : undefined,
                  to: log.newStatus ? STEP_STATUS_LABELS[log.newStatus] : undefined,
                },
              ]
            : []),
          ...(log.skipDocumentCode ? [{ label: "Căn cứ văn bản", to: log.skipDocumentCode }] : []),
          ...(log.documentReference ? [{ label: "Văn bản", to: log.documentReference }] : []),
        ],
        note: [log.details, log.reason && `Lý do: ${log.reason}`].filter(Boolean).join(" — ") || undefined,
      })),
    )
    .sort((a, b) => b.at.localeCompare(a.at));
}

/** Tab "Lịch sử thay đổi": cùng kiểu với Thư viện pháp lý / Nhân sự — lọc theo ngày, bấm dòng để xem chi tiết */
export default function ProcedureHistoryPanel({ projects }: ProcedureHistoryPanelProps) {
  // Lọc theo một ngày (yyyy-mm-dd), rỗng = tất cả
  const [historyDate, setHistoryDate] = useState("");

  const entries = useMemo(() => {
    const all = toActivityEntries(projects);
    return historyDate ? all.filter((e) => toLocalDate(e.at) === historyDate) : all;
  }, [projects, historyDate]);

  return (
    <Card
      surface="flat"
      padding="none"
      rounded="lg"
      className="overflow-hidden border border-slate-200 shadow-xs bg-white"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-4 py-3.5">
        <div className="min-w-0">
          <h2 className="m-0 text-base font-bold text-slate-900">Lịch sử thay đổi</h2>
          <p className="m-0 mt-0.5 text-xs text-slate-500">
            Ai đã thao tác trên thủ tục các dự án, vào lúc nào · {entries.length} thao tác
          </p>
        </div>
        <ActivityDateFilter value={historyDate} onChange={setHistoryDate} />
      </div>
      <div className="p-4">
        <ActivityTimeline
          key={historyDate}
          entries={entries}
          pageSize={20}
          emptyText={
            historyDate
              ? "Không có thao tác nào trong ngày đã chọn."
              : "Chưa có thao tác nào trên thủ tục được ghi nhận."
          }
        />
      </div>
    </Card>
  );
}
