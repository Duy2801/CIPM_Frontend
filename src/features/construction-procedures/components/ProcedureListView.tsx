"use client";

import { useMemo, useState } from "react";
import { BranchesOutlined, EditOutlined, FolderAddOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Input, Select, Switch, Table, Tag, Tooltip, type ColumnsType } from "@/components/ui";
import { cn } from "@/utils/cn";
import { normalizeSearchText } from "@/utils/search-text";
import {
  PROCEDURE_STATUS_LABELS,
  type ProcedureLibraryItem,
  type ProcedureStatus,
} from "@/shared/construction-procedures/utils/procedure-library";
import { getProcedureDays } from "@/shared/construction-procedures/utils/procedure-progress";

interface ProcedureListViewProps {
  procedures: ProcedureLibraryItem[];
  onOpen: (procedureId: string) => void;
  onCreate: () => void;
  onToggle: (procedure: ProcedureLibraryItem, enabled: boolean) => void;
}

const STATUS_INTENTS: Record<ProcedureStatus, "success" | "info" | "warning" | "muted"> = {
  APPLIED: "success",
  PROCESSING: "info",
  PENDING_APPROVAL: "warning",
  STOPPED: "muted",
};

const formatDate = (iso: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : null);

const formatLocalDate = (iso: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

const EMPTY = <span className="text-slate-300">—</span>;

const timeOf = (iso: string | null) => (iso ? new Date(iso).getTime() || 0 : 0);

export default function ProcedureListView({ procedures, onOpen, onCreate, onToggle }: ProcedureListViewProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProcedureStatus | undefined>();

  const visible = useMemo(() => {
    const key = normalizeSearchText(search.trim());
    return procedures.filter(
      (p) =>
        (!status || p.status === status) &&
        (!key || normalizeSearchText(`${p.name} ${p.category} ${p.department ?? ""}`).includes(key)),
    );
  }, [procedures, search, status]);

  const columns: ColumnsType<ProcedureLibraryItem> = [
    {
      title: "Tên quy trình",
      key: "name",
      render: (_, p) => (
        <div className="flex items-center gap-2">
          <BranchesOutlined className="shrink-0 text-[#DC2626]" />
          <span className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900" title={p.name}>
            {p.name}
          </span>
        </div>
      ),
    },
    {
      title: "Version",
      key: "version",
      width: 90,
      align: "center",
      render: (_, p) => (
        <Tag intent="subtle" scale="md" className="font-mono font-semibold" title={`Version ${p.version}`}>
          v{p.version.replace(/^v/i, "")}
        </Tag>
      ),
    },
    {
      title: "Số ngày hoàn thành",
      key: "days",
      width: 150,
      align: "center",
      render: (_, p) => <span className="tabular-nums text-slate-700">{getProcedureDays(p.steps)} ngày</span>,
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 130,
      align: "center",
      render: (_, p) => (
        <Tag intent={STATUS_INTENTS[p.status]} scale="md" className="whitespace-nowrap !rounded-full font-semibold">
          {PROCEDURE_STATUS_LABELS[p.status]}
        </Tag>
      ),
    },
    {
      title: "Người tạo",
      key: "createdBy",
      width: 140,
      ellipsis: true,
      render: (_, p) => p.createdBy || EMPTY,
    },
    {
      title: "Người duyệt",
      key: "approvedBy",
      width: 140,
      ellipsis: true,
      render: (_, p) => p.approvedBy || EMPTY,
    },
    {
      title: "Ngày tạo",
      key: "createdAt",
      width: 130,
      align: "center",
      defaultSortOrder: "descend",
      sortDirections: ["descend", "ascend", "descend"],
      sorter: (a, b) =>
        timeOf(a.createdAt) - timeOf(b.createdAt) || timeOf(a.updatedAt ?? a.createdAt) - timeOf(b.updatedAt ?? b.createdAt),
      render: (_, p) => <span className="tabular-nums">{formatDate(p.createdAt) ?? EMPTY}</span>,
    },
    {
      title: "Ngày cập nhật",
      key: "updatedAt",
      width: 140,
      align: "center",
      sortDirections: ["descend", "ascend", "descend"],
      sorter: (a, b) => timeOf(a.updatedAt ?? a.createdAt) - timeOf(b.updatedAt ?? b.createdAt),
      render: (_, p) => (
        <span className="tabular-nums">{formatLocalDate(p.updatedAt) ?? formatDate(p.createdAt) ?? EMPTY}</span>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 100,
      align: "center",
      render: (_, p) => (
        <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Tooltip title="Chỉnh sửa quy trình">
            <Button
              intent="outline"
              scale="compact"
              icon={<EditOutlined />}
              aria-label={`Chỉnh sửa ${p.name}`}
              onClick={() => onOpen(p.id)}
              className="!h-7 !w-7 !p-0 !border-[#DC2626] !text-[#DC2626] hover:!bg-red-50/60"
            />
          </Tooltip>
          <Tooltip title={p.enabled ? "Tắt quy trình" : "Bật quy trình"}>
            <Switch
              size="small"
              checked={p.enabled}
              aria-label={`${p.enabled ? "Tắt" : "Bật"} ${p.name}`}
              onChange={(checked) => onToggle(p, checked)}
              className={cn(p.enabled && "!bg-[#DC2626]")}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-1 sm:flex-nowrap">
          <Input
            allowClear
            intent="clean"
            aria-label="Tìm quy trình"
            prefix={<SearchOutlined className="text-slate-400" />}
            placeholder="Tìm tên hoặc loại quy trình..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full text-sm sm:max-w-md"
          />
          <Select
            allowClear
            aria-label="Lọc theo trạng thái"
            placeholder="Tất cả trạng thái"
            value={status}
            onChange={(v) => setStatus(v as ProcedureStatus | undefined)}
            options={(Object.keys(PROCEDURE_STATUS_LABELS) as ProcedureStatus[]).map((s) => ({
              value: s,
              label: PROCEDURE_STATUS_LABELS[s],
            }))}
            className="h-9 w-full text-sm sm:w-48"
          />
        </div>
        <Button
          intent="primary"
          scale="compact"
          icon={<FolderAddOutlined />}
          onClick={onCreate}
          className="h-9 shrink-0 text-xs"
        >
          Thêm quy trình mới
        </Button>
      </div>

      <Table<ProcedureLibraryItem>
        rowKey="id"
        size="middle"
        columns={columns}
        dataSource={visible}
        pagination={false}
        scroll={{ x: 1200 }}
        locale={{
          emptyText:
            search.trim() || status
              ? "Không tìm thấy quy trình phù hợp với bộ lọc."
              : 'Chưa có quy trình nào. Bấm "Thêm quy trình mới" để bắt đầu.',
        }}
        onRow={(p) => ({ onClick: () => onOpen(p.id), className: "cursor-pointer" })}
        className="text-xs [&_.ant-table-thead>tr>th]:!bg-slate-100 [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:uppercase [&_.ant-table-thead>tr>th]:tracking-wider [&_.ant-table-thead>tr>th]:!text-slate-600 [&_.ant-table-tbody>tr:hover>td]:!bg-red-50/40"
      />
    </div>
  );
}
