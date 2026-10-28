"use client";

import React, { useMemo, useState } from "react";
import { ApartmentOutlined, HistoryOutlined, ProfileOutlined } from "@ant-design/icons";
import { Card } from "@/components/ui";
import { cn } from "@/utils/cn";
import { formatDateVi } from "@/utils/date";
import type { ProcedureHistoryLog } from "@/features/construction-procedures/types/procedure.types";
import type { ProjectItem } from "../../types/project.types";

type HistorySource = "info" | "procedure";
type HistoryFilter = "all" | HistorySource;
type HistoryTone = "success" | "danger" | "neutral";

interface HistoryEntry {
  id: string;
  /** "YYYY-MM-DD" hoặc "YYYY-MM-DD HH:mm" — dùng để sắp xếp */
  at: string;
  source: HistorySource;
  title: string;
  actor: string;
  role?: string;
  detail?: string;
  reason?: string;
  tone: HistoryTone;
}

const SOURCE_META: Record<HistorySource, { label: string; icon: React.ReactNode }> = {
  info: { label: "Thông tin dự án", icon: <ProfileOutlined /> },
  procedure: { label: "Quy trình", icon: <ApartmentOutlined /> },
};

const TONE_DOT: Record<HistoryTone, string> = {
  success: "bg-emerald-500",
  danger: "bg-rose-500",
  neutral: "bg-blue-500",
};

/** Màu theo hành động: duyệt / nghiệm thu = xanh lá, từ chối / rà soát = đỏ, còn lại = xanh dương */
function toneOf(label: string): HistoryTone {
  const text = label.toLowerCase();
  if (text.includes("từ chối") || text.includes("rà soát")) return "danger";
  if (text.includes("duyệt") || text.includes("nghiệm thu")) return "success";
  return "neutral";
}

const normalizeTime = (value: string) => value.replace("T", " ").slice(0, 16);

function buildEntries(project: ProjectItem, procedureLogs: ProcedureHistoryLog[]): HistoryEntry[] {
  const infoEntries: HistoryEntry[] = (project.progressHistory ?? []).map((h) => ({
    id: `info-${h.id}`,
    at: normalizeTime(h.updatedAt),
    source: "info",
    title: "Cập nhật thông tin dự án",
    actor: h.updatedBy,
    detail: h.note,
    tone: "neutral",
  }));
  const procedureEntries: HistoryEntry[] = procedureLogs.map((log) => ({
    id: `proc-${log.id}`,
    at: normalizeTime(log.timestamp),
    source: "procedure",
    title: log.actionLabel,
    actor: log.performedBy,
    role: log.role,
    detail: log.details,
    // Lý do thường đã nằm trong mô tả — chỉ hiện riêng khi mô tả chưa có
    reason: log.reason && !log.details?.includes(log.reason) ? log.reason : undefined,
    tone: toneOf(log.actionLabel),
  }));
  return [...infoEntries, ...procedureEntries].sort((a, b) => b.at.localeCompare(a.at));
}

/** Tab lịch sử: mọi thay đổi của dự án (thông tin chung + quy trình) theo dòng thời gian, mới nhất trước */
export default function ProjectHistoryTab({
  project,
  procedureLogs,
}: {
  project: ProjectItem;
  procedureLogs: ProcedureHistoryLog[];
}) {
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const entries = useMemo(() => buildEntries(project, procedureLogs), [project, procedureLogs]);
  const visible = filter === "all" ? entries : entries.filter((e) => e.source === filter);

  // Gom theo ngày để dễ đọc
  const groups = useMemo(() => {
    const map = new Map<string, HistoryEntry[]>();
    visible.forEach((e) => {
      const day = e.at.slice(0, 10);
      map.set(day, [...(map.get(day) ?? []), e]);
    });
    return [...map.entries()];
  }, [visible]);

  const filters: { key: HistoryFilter; label: string; count: number }[] = [
    { key: "all", label: "Tất cả", count: entries.length },
    { key: "info", label: SOURCE_META.info.label, count: entries.filter((e) => e.source === "info").length },
    { key: "procedure", label: SOURCE_META.procedure.label, count: entries.filter((e) => e.source === "procedure").length },
  ];

  return (
    <Card surface="workspace" padding="none" rounded="lg" className="border border-slate-200/80 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <HistoryOutlined className="text-slate-500" />
          Lịch sử thay đổi
        </div>
        <div className="flex gap-1">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "cursor-pointer rounded-md border-0 px-2.5 py-1 text-xs transition-colors",
                filter === f.key
                  ? "bg-red-50 font-semibold text-[#DC2626]"
                  : "bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700",
              )}
            >
              {f.label} <span className="tabular-nums">({f.count})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-4">
        {groups.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">Chưa có lịch sử thay đổi</div>
        ) : (
          <div className="space-y-5">
            {groups.map(([day, items]) => (
              <section key={day}>
                <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  {formatDateVi(day)}
                </div>
                <ol className="m-0 list-none space-y-0 border-l border-slate-200 pl-0">
                  {items.map((e) => (
                    <li key={e.id} className="relative pb-3 pl-5 last:pb-0">
                      <span
                        className={cn(
                          "absolute -left-1.25 top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white",
                          TONE_DOT[e.tone],
                        )}
                      />
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-xs font-semibold text-slate-900">{e.title}</span>
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                          {SOURCE_META[e.source].icon}
                          {SOURCE_META[e.source].label}
                        </span>
                        <span className="ml-auto font-mono text-[11px] text-slate-400">
                          {e.at.length > 10 ? e.at.slice(11) : ""}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        {e.actor}
                        {e.role ? ` · ${e.role}` : ""}
                      </div>
                      {e.detail && <p className="m-0 mt-1 text-xs leading-relaxed text-slate-600">{e.detail}</p>}
                      {e.reason && (
                        <p className="m-0 mt-1 rounded-md bg-rose-50 px-2 py-1 text-xs text-rose-700">
                          Lý do: {e.reason}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
