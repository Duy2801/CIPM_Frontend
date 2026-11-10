"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { App } from "antd";
import {
  DeleteOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  InboxOutlined,
  SearchOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Button, Card, Input, Pagination, Table, Tooltip } from "@/components/ui";
import type { ColumnsType } from "@/components/ui";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/utils/cn";
import { readXlsx } from "@/utils/xlsx-reader";
import { downloadBlob, writeXlsx } from "@/utils/xlsx-writer";
import { reportStorage } from "../services/report-storage";
import type { ReportFile } from "../types/report.types";
import ReportPreviewModal from "./ReportPreviewModal";

const PAGE_SIZE = 20;
const ACCEPT = ".xlsx,.xlsm,.xls,.xlsb,.csv";
const ACCEPT_RE = /\.(xlsx|xlsm|xls|xlsb|csv)$/i;

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

const formatDateTime = (ms: number) =>
  new Date(ms).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });

/** Số sheet của tệp; null nếu không đọc được (xls / xlsb / tệp lỗi) */
async function countSheets(file: File): Promise<number | null> {
  if (/\.csv$/i.test(file.name)) return 1;
  try {
    return (await readXlsx(file)).sheetNames.length;
  } catch {
    return null;
  }
}

type Row = ReportFile & { stt: number };

/** Báo cáo: nhập tệp Excel, xem trực tiếp trên trình duyệt, tải về, xuất danh sách ra Excel */
export default function ReportsScreen() {
  const { message, modal } = App.useApp();
  const user = useAuthStore((s) => s.user);
  const [reports, setReports] = useState<ReportFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [preview, setPreview] = useState<ReportFile | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    reportStorage
      .list()
      .then(setReports)
      .catch(() => message.error("Không tải được danh sách báo cáo."))
      .finally(() => setLoading(false));
  }, [message]);

  const rows = useMemo<Row[]>(() => {
    const q = search.trim().toLowerCase();
    return reports.filter((r) => !q || r.name.toLowerCase().includes(q)).map((r, i) => ({ ...r, stt: i + 1 }));
  }, [reports, search]);

  const importFiles = async (files: File[]) => {
    const valid = files.filter((f) => ACCEPT_RE.test(f.name));
    if (valid.length < files.length) message.warning("Chỉ nhận tệp Excel (.xlsx, .xlsm, .xls, .xlsb) hoặc .csv.");
    if (!valid.length) return;
    setImporting(true);
    try {
      const uploadedBy = user?.displayName || user?.name || "Không rõ";
      const added: ReportFile[] = [];
      for (const [i, file] of valid.entries()) {
        const report: ReportFile = {
          id: `RP-${Date.now()}-${i}`,
          name: file.name,
          size: file.size,
          sheetCount: await countSheets(file),
          uploadedAt: Date.now() + i,
          uploadedBy,
          blob: file,
        };
        await reportStorage.save(report);
        added.push(report);
      }
      setReports((prev) => [...added.reverse(), ...prev]);
      setPage(1);
      message.success(`Đã nhập ${added.length} tệp báo cáo.`);
    } catch {
      message.error("Không lưu được tệp. Có thể bộ nhớ trình duyệt đã đầy.");
    } finally {
      setImporting(false);
    }
  };

  const removeReport = (report: ReportFile) =>
    modal.confirm({
      title: "Xóa báo cáo?",
      content: `Tệp "${report.name}" sẽ bị xóa khỏi hệ thống.`,
      okText: "Xóa",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: async () => {
        await reportStorage.remove(report.id);
        setReports((prev) => prev.filter((r) => r.id !== report.id));
        message.success("Đã xóa báo cáo.");
      },
    });

  // Xuất danh sách báo cáo đang lọc ra file Excel
  const exportList = () => {
    const blob = writeXlsx([
      {
        name: "Danh sách báo cáo",
        widths: [6, 50, 10, 12, 24, 20],
        rows: [
          ["STT", "Tên tệp", "Số sheet", "Dung lượng", "Người nhập", "Ngày nhập"],
          ...rows.map((r) => [r.stt, r.name, r.sheetCount, formatSize(r.size), r.uploadedBy, formatDateTime(r.uploadedAt)]),
        ],
      },
    ]);
    downloadBlob(blob, `Danh_sach_bao_cao_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    void importFiles(Array.from(e.dataTransfer.files));
  };

  const columns: ColumnsType<Row> = [
    { title: "STT", dataIndex: "stt", width: 64, align: "center" },
    {
      title: "Tên tệp",
      key: "name",
      render: (_, row) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <FileExcelOutlined className="shrink-0 text-lg text-emerald-600" />
          <span className="min-w-0 truncate text-[13px] font-semibold text-[#102A43]" title={row.name}>
            {row.name}
          </span>
        </div>
      ),
    },
    {
      title: "Số sheet",
      key: "sheets",
      width: 100,
      align: "center",
      render: (_, row) => row.sheetCount ?? <span className="text-slate-400">—</span>,
    },
    { title: "Dung lượng", key: "size", width: 110, align: "center", render: (_, row) => formatSize(row.size) },
    { title: "Người nhập", dataIndex: "uploadedBy", width: 180, align: "center", ellipsis: true },
    { title: "Ngày nhập", key: "at", width: 160, align: "center", render: (_, row) => formatDateTime(row.uploadedAt) },
    {
      title: "",
      key: "actions",
      width: 96,
      align: "center",
      render: (_, row) => (
        // Chặn nổi bọt để bấm nút không mở xem tệp
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Tooltip title="Tải về">
            <button
              type="button"
              aria-label="Tải về"
              onClick={() => downloadBlob(row.blob, row.name)}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-slate-500 hover:bg-slate-100 hover:text-[#DC2626]"
            >
              <DownloadOutlined />
            </button>
          </Tooltip>
          <Tooltip title="Xóa">
            <button
              type="button"
              aria-label="Xóa"
              onClick={() => removeReport(row)}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-slate-500 hover:bg-red-50 hover:text-[#DC2626]"
            >
              <DeleteOutlined />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[2560px] flex-col gap-3">
      <Card
        surface="flat"
        padding="none"
        rounded="lg"
        className={cn(
          "relative overflow-hidden border-slate-200 shadow-sm shadow-slate-100",
          dragging && "ring-2 ring-[#DC2626]/40",
        )}
        onDragOver={(e: DragEvent) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e: DragEvent) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
        }}
        onDrop={onDrop}
      >
        <header className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0 flex-1 sm:max-w-sm">
            <Input
              allowClear
              intent="clean"
              prefix={<SearchOutlined className="text-xs text-slate-400" />}
              placeholder="Tìm tên tệp..."
              className="h-8 w-full text-xs"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            {rows.length > PAGE_SIZE && (
              <Pagination
                size="small"
                current={page}
                onChange={setPage}
                pageSize={PAGE_SIZE}
                total={rows.length}
                showSizeChanger={false}
              />
            )}
            <Button
              intent="outline"
              scale="sm"
              icon={<DownloadOutlined />}
              onClick={exportList}
              disabled={rows.length === 0}
              className="h-8 text-xs"
            >
              Xuất Excel
            </Button>
            <Button
              intent="primary"
              scale="sm"
              icon={<UploadOutlined />}
              loading={importing}
              onClick={() => fileRef.current?.click()}
              className="h-8 !border-[#DC2626] !bg-[#DC2626] px-3 text-xs font-semibold !text-white hover:!bg-[#B91C1C]"
            >
              Nhập Excel
            </Button>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => {
                void importFiles(Array.from(e.target.files ?? []));
                e.target.value = "";
              }}
            />
          </div>
        </header>

        <Table<Row>
          rowKey="id"
          size="small"
          loading={loading}
          columns={columns}
          dataSource={rows}
          tableLayout="fixed"
          scroll={{ x: 860 }}
          pagination={{ current: page, pageSize: PAGE_SIZE, placement: ["none"] }}
          onRow={(row) => ({
            onClick: () => setPreview(row),
            onKeyDown: (e) => {
              if (e.key === "Enter") setPreview(row);
            },
            tabIndex: 0,
          })}
          rowClassName="cursor-pointer outline-none hover:[&>td]:!bg-red-50 [&>td.ant-table-cell-row-hover]:!bg-red-50 focus-visible:[&>td]:!bg-red-50"
          className={cn(
            "[&_.ant-table-thead>tr>th]:!bg-slate-50 [&_.ant-table-thead>tr>th]:!py-2.5 [&_.ant-table-thead>tr>th]:text-[12px] [&_.ant-table-thead>tr>th]:font-bold [&_.ant-table-thead>tr>th]:text-slate-600",
            "[&_.ant-table-tbody>tr:not(.ant-table-measure-row)>td]:!py-2.5",
          )}
          locale={{
            emptyText: (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="mx-auto my-8 flex cursor-pointer flex-col items-center gap-2 border-0 bg-transparent text-slate-500 hover:text-[#DC2626]"
              >
                <InboxOutlined className="text-4xl text-slate-300" />
                <span className="text-sm font-semibold">
                  {search ? "Không có báo cáo nào khớp từ khóa." : "Chưa có báo cáo. Nhấn hoặc kéo thả tệp Excel vào đây."}
                </span>
              </button>
            ),
          }}
        />

        {dragging && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/80 text-sm font-semibold text-[#DC2626]">
            <InboxOutlined className="mr-2 text-2xl" /> Thả tệp Excel vào đây để nhập
          </div>
        )}
      </Card>

      {preview && <ReportPreviewModal report={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
