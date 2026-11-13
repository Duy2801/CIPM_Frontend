"use client";

import { useState } from "react";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Drawer, STANDARD_DRAWER_WIDTH } from "@/components/ui";
import { cn } from "@/utils/cn";
import { formatMoneyString } from "@/utils/format-money";
import { formatDateVi } from "@/utils/date";
import { useProjectDisbursements } from "../../../hooks/useProjectDisbursements";
import type { DisbursementAttachment } from "../../../utils/project-disbursement";
import DisbursementFilePreview from "./DisbursementFilePreview";

export default function DisbursementRecordDrawer({
  projectId,
  entryId,
  onClose,
}: {
  projectId: string;
  entryId: string;
  onClose: () => void;
}) {
  const { project, entries, unit } = useProjectDisbursements(projectId);
  const [preview, setPreview] = useState<DisbursementAttachment>();
  const entry = entries.find((e) => e.id === entryId);
  if (!entry) return null;

  const projectName = project?.name ?? "";
  const withdraw = entry.kind === "withdraw";
  const verb = withdraw ? "thu hồi" : "giải ngân";
  const files = entry.attachments ?? [];

  return (
    <Drawer
      open
      onClose={onClose}
      width={STANDARD_DRAWER_WIDTH}
      styles={{ body: { background: "#f8fafc", padding: 16 } }}
      title={
        <div className="flex items-center gap-3 py-1">
          <Button
            intent="outline"
            scale="compact"
            icon={<ArrowLeftOutlined />}
            aria-label="Quay lại"
            title="Quay lại"
            onClick={onClose}
            className="h-9! w-9! shrink-0 p-0!"
          />
          <div className="min-w-0">
            <div className="text-base font-bold text-slate-900">Chi tiết đợt {verb}</div>
            <div className="truncate text-xs font-normal text-slate-500" title={projectName}>
              {projectName}
            </div>
          </div>
        </div>
      }
    >
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className={cn("px-5 py-5", withdraw ? "bg-rose-50/50" : "bg-red-50/40")}>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "rounded px-2 py-0.5 text-[11px] font-semibold",
                withdraw ? "bg-rose-100 text-rose-700" : "bg-red-100 text-[#DC2626]",
              )}
            >
              {withdraw ? "Thu hồi" : "Giải ngân"}
            </span>
            <span className="truncate text-xs font-medium text-slate-600" title={entry.category}>
              {entry.category}
            </span>
          </div>
          <div className={cn("mt-2 text-[28px] font-bold leading-none tracking-tight", withdraw ? "text-rose-600" : "text-slate-900")}>
            {withdraw ? "−" : ""}
            {formatMoneyString(entry.amount)}
            <span className="ml-1.5 text-sm font-semibold text-slate-400">VNĐ</span>
          </div>
        </div>

        <dl className="m-0 divide-y divide-slate-100 px-5">
          <DetailRow label={unit === "đầu mục" ? "Đầu mục" : "Danh mục"} value={entry.category} />
          {entry.fundingSource && <DetailRow label="Nguồn vốn" value={entry.fundingSource} />}
          <DetailRow label={`Ngày ${verb}`} value={formatDateVi(entry.date)} />
          <DetailRow label="Người thực hiện" value={entry.createdBy} />
          <DetailRow
            label={withdraw ? "Lý do thu hồi" : "Nội dung"}
            value={entry.content || <span className="font-normal italic text-slate-400">Không có nội dung</span>}
            multiline
          />
        </dl>

        <div className="border-t border-slate-100 px-5 py-4">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Chứng từ</span>
            <span className="text-[11px] text-slate-400">{files.length} tệp</span>
          </div>
          {files.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 py-4 text-center text-xs text-slate-400">
              Không có tệp đính kèm
            </div>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {files.map((f) => {
                const ext = (f.name.split(".").pop() ?? "").toUpperCase().slice(0, 4);
                return (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => setPreview(f)}
                      title="Bấm để xem tệp"
                      className="group/file flex w-full cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5 text-left transition hover:border-red-200 hover:shadow-sm"
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[10px] font-bold",
                          ext === "PDF" ? "bg-red-50 text-[#DC2626]" : "bg-slate-100 text-slate-500",
                        )}
                      >
                        {ext || "FILE"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-slate-800 group-hover/file:text-[#DC2626]">
                          {f.name}
                        </span>
                        {f.size && <span className="mt-0.5 block text-[11px] text-slate-400">{f.size}</span>}
                      </span>
                      <span className="shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold text-slate-500 transition group-hover/file:bg-red-50 group-hover/file:text-[#DC2626]">
                        Xem
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {preview && (
        <DisbursementFilePreview
          file={preview}
          entry={entry}
          projectName={projectName}
          onClose={() => setPreview(undefined)}
        />
      )}
    </Drawer>
  );
}

function DetailRow({ label, value, multiline }: { label: string; value: React.ReactNode; multiline?: boolean }) {
  return (
    <div className={cn("flex gap-4 py-3 text-xs", multiline ? "items-start" : "items-center")}>
      <dt className="w-32 shrink-0 text-slate-500">{label}</dt>
      <dd className={cn("m-0 min-w-0 flex-1 font-semibold text-slate-800", multiline ? "whitespace-pre-wrap leading-relaxed" : "truncate")}>
        {value}
      </dd>
    </div>
  );
}
