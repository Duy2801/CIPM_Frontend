"use client";

import { PaperClipOutlined } from "@ant-design/icons";
import { Table, type ColumnsType } from "@/components/ui";
import { cn } from "@/utils/cn";
import { formatDateVi } from "@/utils/date";
import { useProjectDisbursements } from "../../../hooks/useProjectDisbursements";
import { DISBURSEMENT_KIND_LABEL, type DisbursementEntry } from "../../../utils/project-disbursement";
import { money } from "../../../utils/disbursement-format";

const TABLE_CLASS =
  "text-xs [&_.ant-table-thead>tr>th]:!bg-slate-100 [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!text-slate-600 [&_.ant-table-tbody>tr:hover>td]:!bg-red-50/40";

export default function DisbursementEntryTable({
  projectId,
  category,
  onView,
}: {
  projectId: string;
  category: string;
  onView: (entryId: string) => void;
}) {
  const { entries: all, remainingById: remaining } = useProjectDisbursements(projectId);
  const entries = all
    .filter((e) => e.category === category)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const columns: ColumnsType<DisbursementEntry> = [
    {
      title: "Ngày thực hiện",
      key: "date",
      align: "center",
      width: 110,
      render: (_, e) => <span className="text-slate-700">{formatDateVi(e.date)}</span>,
    },
    {
      title: "Loại thu chi",
      key: "kind",
      align: "center",
      width: 120,
      render: (_, e) => {
        const withdraw = e.kind === "withdraw";
        return (
          <span
            className={cn(
              "inline-flex w-[104px] justify-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold",
              withdraw ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700",
            )}
          >
            {DISBURSEMENT_KIND_LABEL[e.kind ?? "disburse"]}
          </span>
        );
      },
    },
    {
      title: "Nội dung giải ngân",
      key: "content",
      ellipsis: true,
      render: (_, e) =>
        e.content ? (
          <span className="font-medium text-slate-800" title={e.content}>
            {e.content}
          </span>
        ) : (
          <span className="italic text-slate-400">Không có nội dung</span>
        ),
    },
    {
      title: "Người thực hiện",
      key: "createdBy",
      align: "center",
      width: 170,
      ellipsis: true,
      render: (_, e) =>
        e.createdBy ? (
          <span className="text-slate-700" title={e.createdBy}>
            {e.createdBy}
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      title: "Nguồn vốn",
      key: "source",
      align: "center",
      width: 170,
      ellipsis: true,
      render: (_, e) =>
        e.fundingSource ? (
          <span className="text-slate-700">{e.fundingSource}</span>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      title: "Số tiền giải ngân",
      key: "amount",
      align: "center",
      width: 150,
      render: (_, e) => {
        const withdraw = e.kind === "withdraw";
        return (
          <span className={cn("whitespace-nowrap font-semibold", withdraw ? "text-rose-600" : "text-slate-900")}>
            {withdraw ? "−" : ""}
            {money(e.amount)}
          </span>
        );
      },
    },
    {
      title: "Số tiền còn lại",
      key: "remaining",
      align: "center",
      width: 150,
      render: (_, e) => {
        const left = remaining.get(e.id);
        return left === undefined ? (
          <span className="text-slate-300">—</span>
        ) : (
          <span className={cn("whitespace-nowrap", left < 0 ? "font-semibold text-rose-600" : "text-slate-700")}>
            {money(left)}
          </span>
        );
      },
    },
    {
      title: "File đính kèm",
      key: "files",
      align: "center",
      width: 110,
      render: (_, e) => {
        const count = e.attachments?.length ?? 0;
        return count > 0 ? (
          <span className="inline-flex items-center gap-1 text-[#0F4C81]">
            <PaperClipOutlined />
            {count} tệp
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        );
      },
    },
  ];

  return (
    <Table<DisbursementEntry>
      rowKey="id"
      size="middle"
      columns={columns}
      dataSource={entries}
      pagination={false}
      scroll={{ x: 1150 }}
      locale={{ emptyText: "Chưa có đợt giải ngân nào." }}
      onRow={(e) => ({ onClick: () => onView(e.id), className: "cursor-pointer" })}
      className={TABLE_CLASS}
    />
  );
}
