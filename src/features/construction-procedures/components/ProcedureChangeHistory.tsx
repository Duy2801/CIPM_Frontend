"use client";

import { useMemo, useState } from "react";
import ActivityDateFilter, { toLocalDate } from "@/features/personnel-assignment/components/ActivityDateFilter";
import ActivityTimeline from "@/features/personnel-assignment/components/ActivityTimeline";
import { PERSONNEL_MOCK_DATA } from "@/features/personnel-assignment/constants/personnel-mock-data";
import type { ActivityEntry } from "@/features/personnel-assignment/utils/activity-log";
import { stableHash } from "../constants/procedure-templates";
import type { ProcedureHistoryLog, ProcedureStep } from "../types/procedure.types";
import { getPlannedDays } from "../utils/procedure-progress";
import { loadProcedureLibrary } from "../utils/procedure-library";

interface ProcedureChangeHistoryProps {
  procedureId?: string;
  steps: ProcedureStep[];
}

/** Nhật ký "Lưu quy trình" ở tab Quy trình (ghi ở ConstructionProceduresScreen) */
const LIBRARY_HISTORY_STORAGE_KEY = "cipm_procedure_library_history";

const roleOf = (name: string | null | undefined) => PERSONNEL_MOCK_DATA.staff.find((s) => s.name === name)?.title;

/** "2026-10-22 08:30" hoặc ISO → ISO */
const toIso = (value: string) => {
  const d = new Date(value.includes("T") ? value : value.replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString();
};

/** Ngày gốc + n ngày, giờ cố định (giờ Việt Nam) */
const shiftDate = (date: string, days: number, time: string) => {
  const d = new Date(`${date}T00:00:00+07:00`);
  d.setDate(d.getDate() + days);
  return new Date(`${d.toISOString().slice(0, 10)}T${time}:00+07:00`).toISOString();
};

function loadSavedLogs(procedureId: string): ProcedureHistoryLog[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(LIBRARY_HISTORY_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((log: ProcedureHistoryLog) => log.stepId === procedureId) : [];
  } catch {
    return [];
  }
}

/**
 * Lịch sử của một quy trình: tạo, duyệt, các lần chỉnh bước (dữ liệu mẫu theo quy trình)
 * và các lần bấm "Lưu quy trình" thật.
 */
function buildEntries(procedureId: string, steps: ProcedureStep[]): ActivityEntry[] {
  const meta = loadProcedureLibrary().find((p) => p.id === procedureId);
  if (!meta) return [];
  const base = meta.createdAt ?? "2026-01-05";
  const creator = meta.createdBy ?? "Huỳnh Thái Hải";
  const editor = meta.updatedBy ?? creator;
  const target = { targetType: "procedure" as const, targetId: procedureId, module: "Thủ tục XDCB" };
  const entry = (id: string, at: string, actorName: string, action: string, rest: Partial<ActivityEntry> = {}): ActivityEntry => ({
    id: `${procedureId}-${id}`,
    at,
    actorName,
    actorRole: roleOf(actorName),
    action,
    ...target,
    ...rest,
  });

  const mains = steps.filter((s) => !s.code.includes("."));
  const subs = steps.filter((s) => s.code.includes("."));
  const pick = (list: ProcedureStep[], salt: string) => list[stableHash(`${procedureId}|${salt}`) % list.length];
  const staff = PERSONNEL_MOCK_DATA.staff;

  const entries: ActivityEntry[] = [
    entry("create", shiftDate(base, 0, "08:30"), creator, "Tạo quy trình", {
      changes: [
        { label: "Số bước", to: `${steps.length} bước (${mains.length} bước chính)` },
        ...(meta.department ? [{ label: "Tổ phụ trách", to: meta.department }] : []),
      ],
    }),
  ];

  if (steps.length > 0) {
    const timed = pick(steps, "days");
    const days = getPlannedDays(timed);
    entries.push(
      entry("days", shiftDate(base, 1, "10:15"), creator, `Đổi thời gian thực hiện [${timed.code}]`, {
        changes: [{ label: "Thời gian", from: `${Math.max(1, days - 5)} ngày`, to: `${days} ngày` }],
        targetName: timed.name,
      }),
    );
    const assigned = pick(steps, "assignee");
    const previous = staff[stableHash(`${procedureId}|prev`) % staff.length]?.name;
    if (assigned.assignedTo && previous && previous !== assigned.assignedTo) {
      entries.push(
        entry("assignee", shiftDate(base, 2, "14:40"), creator, `Đổi người thực hiện [${assigned.code}]`, {
          changes: [{ label: "Người thực hiện", from: previous, to: assigned.assignedTo }],
          targetName: assigned.name,
        }),
      );
    }
  }

  if (subs.length > 1) {
    const a = pick(subs, "parallel");
    entries.push(
      entry("order", shiftDate(base, 2, "16:05"), creator, `Sắp xếp thứ tự thực hiện [${a.code}]`, {
        changes: [{ label: "Cách làm", from: "Lần lượt sau bước trước", to: "Song song với các bước cùng đợt" }],
        targetName: a.name,
      }),
    );
  }

  if (meta.approvedBy) {
    entries.push(
      entry("approve", meta.approvedAt ?? shiftDate(base, 4, "09:00"), meta.approvedBy, "Duyệt quy trình", {
        changes: [{ label: "Trạng thái", from: "Chờ duyệt", to: "Đang áp dụng" }],
      }),
    );
  }

  const saved = loadSavedLogs(procedureId);
  // Lần cập nhật mẫu (chưa có lần lưu thật nào) để dòng "Ngày cập nhật" ở danh sách có dấu vết
  if (meta.updatedAt && saved.length === 0) {
    const optional = steps.find((s) => s.type === "CONDITIONAL");
    entries.push(
      entry("update", toIso(meta.updatedAt), editor, "Cập nhật quy trình", {
        changes: optional
          ? [{ label: `Bước [${optional.code}]`, from: "Bắt buộc", to: "Nếu có" }]
          : [{ label: "Số bước", to: `${steps.length} bước` }],
      }),
    );
  }

  saved.forEach((log) =>
    entries.push(
      entry(log.id, toIso(log.timestamp), log.performedBy, log.actionLabel, {
        actorRole: log.role || roleOf(log.performedBy),
        changes: log.changes,
        note: log.details,
      }),
    ),
  );

  if (!meta.enabled) {
    entries.push(
      entry("stop", toIso(meta.updatedAt ?? shiftDate(base, 6, "17:00")), editor, "Ngưng áp dụng quy trình", {
        changes: [{ label: "Trạng thái", to: "Đã ngưng" }],
      }),
    );
  }

  return entries.sort((x, y) => y.at.localeCompare(x.at));
}

/** Tab "Lịch sử thay đổi" của một quy trình: ai sửa gì, lúc nào — bấm dòng để xem cũ → mới */
export default function ProcedureChangeHistory({ procedureId, steps }: ProcedureChangeHistoryProps) {
  const [historyDate, setHistoryDate] = useState("");
  const all = useMemo(() => (procedureId ? buildEntries(procedureId, steps) : []), [procedureId, steps]);
  const entries = historyDate ? all.filter((e) => toLocalDate(e.at) === historyDate) : all;

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5">
        <div className="text-[13px] font-semibold text-slate-800">
          Lịch sử thay đổi <span className="font-normal text-slate-400">· {entries.length} thao tác</span>
        </div>
        <ActivityDateFilter value={historyDate} onChange={setHistoryDate} />
      </div>
      <div className="p-4">
        <ActivityTimeline
          key={historyDate}
          entries={entries}
          pageSize={15}
          emptyText={
            !procedureId
              ? "Quy trình chưa được lưu nên chưa có lịch sử."
              : historyDate
                ? "Không có thay đổi nào trong ngày đã chọn."
                : "Chưa có thay đổi nào được ghi nhận."
          }
        />
      </div>
    </div>
  );
}
