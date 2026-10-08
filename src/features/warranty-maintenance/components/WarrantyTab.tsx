"use client";

import { useMemo, useState } from "react";
import {
  BankOutlined,
  CheckOutlined,
  DownloadOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { message } from "antd";
import {
  Button,
  Card,
  Flex,
  Input,
  Modal,
  Pagination,
  Select,
  Table,
  Text,
  Tooltip,
} from "@/components/ui";
import type { ColumnsType } from "@/components/ui";
import { SectionIntro } from "@/components/workspace";
import { formatDateVi } from "@/utils/date";
import { WARRANTY_FILTER_LABELS } from "../constants/warranty-labels";
import type { WarrantyController } from "../hooks/useWarrantyMaintenance";
import type { WarrantyFilter, WarrantyRecord } from "../types/warranty.types";
import { getBondReturnBlocker, getCountdown, getOpenIncidents, matchesWarrantyFilter } from "../utils/warranty-rules";

interface WarrantyTabProps {
  controller: WarrantyController;
  filter: WarrantyFilter;
  onFilterChange: (filter: WarrantyFilter) => void;
  onReportIncident: (warranty: WarrantyRecord) => void;
  onForfeitBond: (warranty: WarrantyRecord) => void;
  onOpenDetail: (warranty: WarrantyRecord) => void;
  onOpenCreate?: () => void;
  onOpenEdit?: (warranty: WarrantyRecord) => void;
}

const FILTER_ORDER: WarrantyFilter[] = ["ALL", "URGENT", "WATCH", "EXPIRED", "BOND_READY"];
const PAGE_SIZE = 10;
const formatBillions = (value: number) => `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 }).format(value)} tỷ`;

export default function WarrantyTab({
  controller,
  filter,
  onFilterChange,
  onReportIncident,
  onForfeitBond,
  onOpenDetail,
  onOpenCreate,
  onOpenEdit,
}: WarrantyTabProps) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { warranties, incidents, today, permissions, data } = controller;

  const counts = useMemo(() => {
    const result = {} as Record<WarrantyFilter, number>;
    FILTER_ORDER.forEach((key) => {
      result[key] = warranties.filter((item) => matchesWarrantyFilter(item, key, incidents, today)).length;
    });
    return result;
  }, [incidents, today, warranties]);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return warranties
      .filter((item) => matchesWarrantyFilter(item, filter, incidents, today))
      .filter((item) => {
        if (!query) return true;
        const project = data.projects.find((p) => p.id === item.projectId);
        return [item.workName, item.contractCode, item.contractor, item.bank, project?.name ?? ""].some(
          (field) => field.toLowerCase().includes(query),
        );
      })
      .sort((a, b) => {
        // Đang còn hạn: sắp hết hạn trước; đã hết hạn xếp cuối
        const da = getCountdown(a, today).daysLeft;
        const db = getCountdown(b, today).daysLeft;
        if ((da < 0) !== (db < 0)) return da < 0 ? 1 : -1;
        return da - db;
      });
  }, [data.projects, filter, incidents, search, today, warranties]);

  const totalPages = Math.ceil(rows.length / PAGE_SIZE) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRows = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    return rows.slice(startIndex, startIndex + PAGE_SIZE);
  }, [rows, safeCurrentPage]);

  const confirmReturn = (warranty: WarrantyRecord) => {
    Modal.confirm({
      title: "Hoàn trả bảo lãnh bảo hành?",
      icon: <BankOutlined className="text-emerald-600" />,
      content: (
        <Flex vertical gap={4} className="pt-1 text-[13px] text-slate-600">
          <span>Công trình: <strong>{warranty.workName}</strong></span>
          <span>Nhà thầu: {warranty.contractor}</span>
          <span>Giá trị: <strong>{formatBillions(warranty.bondValue)}</strong> · {warranty.bank}</span>
          <span className="text-slate-500">Thông tin sẽ được dùng cho bước 4 quy trình tất toán KBNN.</span>
        </Flex>
      ),
      okText: "Hoàn trả bảo lãnh",
      cancelText: "Đóng",
      onOk: () => controller.returnBond(warranty.id),
    });
  };

  const handleExportCSV = () => {
    let exportItems = [...rows];

    // Phạm vi xuất theo BRD Mục 5:
    // - GĐ & PGĐ (ALL): Xuất toàn bộ
    // - Tổ KT (OWN_PROJECTS): Chỉ xuất công trình thuộc DA mình phụ trách
    // - Kế toán trưởng (BOND_ONLY): Xuất báo cáo bảo lãnh bảo hành
    if (permissions.exportScope === "OWN_PROJECTS") {
      const userDisplayName = (controller.currentUser?.displayName || controller.currentUser?.name || "").trim().toLowerCase();
      const myProjectIds = new Set(
        data.projects
          .filter((p) => {
            const mgr = (p.name || "").toLowerCase();
            return !userDisplayName || mgr.includes(userDisplayName);
          })
          .map((p) => p.id)
      );
      exportItems = exportItems.filter((w) => myProjectIds.has(w.projectId));
      if (exportItems.length === 0) {
        message.info("Không có công trình bảo hành nào thuộc dự án bạn phụ trách/giám sát (DA mình) để xuất.");
        return;
      }
    }

    const headers = [
      "Mã công trình",
      "Tên công trình",
      "Mã hợp đồng",
      "Nhà thầu",
      "Dự án",
      "Ngày nghiệm thu",
      "Thời hạn (tháng)",
      "Ngày hết hạn",
      "Số ngày còn lại",
      "Giá trị bảo lãnh (tỷ)",
      "Ngân hàng phát hành",
      "Trạng thái bảo lãnh",
      "Số sự cố tồn đọng",
    ];

    const csvRows = exportItems.map((w) => {
      const p = data.projects.find((item) => item.id === w.projectId);
      const cd = getCountdown(w, today);
      const openInc = getOpenIncidents(w.id, incidents).length;
      return [
        `"${w.id}"`,
        `"${w.workName.replace(/"/g, '""')}"`,
        `"${w.contractCode}"`,
        `"${w.contractor.replace(/"/g, '""')}"`,
        `"${(p?.name || "").replace(/"/g, '""')}"`,
        `"${w.acceptanceDate}"`,
        w.months,
        `"${cd.expiryDate}"`,
        cd.daysLeft,
        w.bondValue.toFixed(3),
        `"${w.bank}"`,
        `"${w.bondStatus === "HOLDING" ? "Đang giữ" : w.bondStatus === "RETURNED" ? "Đã hoàn trả" : "Đã thu hồi"}"`,
        openInc,
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...csvRows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_cao_bao_hanh_BQL_HaTien_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    const scopeNote = permissions.exportScope === "OWN_PROJECTS" 
      ? "các dự án bạn phụ trách/giám sát (DA mình)"
      : permissions.exportScope === "BOND_ONLY"
      ? "dữ liệu bảo lãnh bảo hành (TC mình)"
      : "toàn bộ danh mục bảo hành";
    message.success(`Đã xuất báo cáo ${exportItems.length} công trình (${scopeNote}) thành công.`);
  };

  const statusOptions = useMemo(() => [
    ...FILTER_ORDER.map((key) => ({
      value: key,
      label: `${WARRANTY_FILTER_LABELS[key]} (${counts[key]})`,
    })),
  ], [counts]);

  const columns: ColumnsType<WarrantyRecord> = [
    {
      title: "Công trình & Hợp đồng",
      key: "work",
      width: "32%",
      render: (_, row) => {
        const project = data.projects.find((p) => p.id === row.projectId);
        return (
          <div className="py-0.5">
            <div className="text-xs text-slate-500 line-clamp-1" title={project?.name}>
              {project?.name}
            </div>
            <button
              type="button"
              onClick={() => onOpenDetail(row)}
              className="mt-0.5 block text-left text-sm font-semibold leading-snug text-slate-900 hover:text-teal-700 hover:underline cursor-pointer"
            >
              {row.workName}
            </button>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
              <span>HĐ {row.contractCode}</span>
              <span>·</span>
              <span>{row.contractor}</span>
            </div>
          </div>
        );
      },
    },
    {
      title: "Thời hạn bảo hành",
      key: "duration",
      width: "28%",
      render: (_, row) => {
        const countdown = getCountdown(row, today);
        const isUrgent = countdown.daysLeft >= 0 && countdown.daysLeft <= 30;
        const isWatch = countdown.daysLeft > 30 && countdown.daysLeft <= 90;
        const isExpired = countdown.daysLeft < 0;

        return (
          <div className="py-0.5">
            <div className="flex items-center gap-2">
              {isUrgent && (
                <span className="inline-flex items-center rounded bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
                  Còn {countdown.daysLeft} ngày
                </span>
              )}
              {isWatch && (
                <span className="inline-flex items-center rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                  Còn {countdown.daysLeft} ngày
                </span>
              )}
              {!isUrgent && !isWatch && !isExpired && (
                <span className="text-xs font-medium text-slate-700">
                  Còn {countdown.daysLeft} ngày
                </span>
              )}
              {isExpired && (
                <span className="text-xs text-slate-400">
                  Đã hết hạn
                </span>
              )}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              NT: {formatDateVi(row.acceptanceDate)} · Hết hạn: <span className="font-medium text-slate-700">{formatDateVi(countdown.expiryDate)}</span> ({row.months} tháng)
            </div>
          </div>
        );
      },
    },
    {
      title: "Bảo lãnh bảo hành",
      key: "bond",
      width: "18%",
      render: (_, row) => (
        <div className="py-0.5">
          <div className="text-sm font-semibold text-slate-900">{formatBillions(row.bondValue)}</div>
          <div className="mt-0.5 text-xs text-slate-500 line-clamp-1" title={row.bank}>{row.bank}</div>
          <div className="mt-0.5 text-[11.5px]">
            {row.bondStatus === "HOLDING" && (
              <span className="text-slate-500">Đang giữ bảo lãnh</span>
            )}
            {row.bondStatus === "RETURNED" && (
              <span className="font-medium text-emerald-600">
                Đã hoàn trả {row.bondClosedAt ? `(${formatDateVi(row.bondClosedAt)})` : ""}
              </span>
            )}
            {row.bondStatus === "FORFEITED" && (
              <span className="font-medium text-rose-600">Đã thu hồi (vi phạm)</span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Sự cố bảo hành",
      key: "incidents",
      width: "12%",
      render: (_, row) => {
        const openIncidents = getOpenIncidents(row.id, incidents);
        if (openIncidents.length > 0) {
          return (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600">
              <ExclamationCircleOutlined className="text-xs text-rose-500" />
              <span>{openIncidents.length} sự cố</span>
            </span>
          );
        }
        return <span className="text-xs text-slate-400">0 sự cố</span>;
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: "10%",
      align: "center",
      render: (_, row) => {
        const countdown = getCountdown(row, today);
        const blocker = getBondReturnBlocker(row, incidents, today);
        return (
          <div className="flex items-center justify-center gap-1 py-0.5">
            <Tooltip title="Xem chi tiết công trình">
              <Button
                intent="ghost"
                scale="sm"
                icon={<EyeOutlined />}
                onClick={() => onOpenDetail(row)}
                className="h-7 w-7 !p-0 text-slate-500 hover:!text-slate-900 hover:!bg-slate-100"
              />
            </Tooltip>
            {!permissions.isReadOnly && onOpenEdit && (
              <Tooltip title="Cập nhật hồ sơ bảo hành">
                <Button
                  intent="ghost"
                  scale="sm"
                  icon={<EditOutlined />}
                  onClick={() => onOpenEdit(row)}
                  className="h-7 w-7 !p-0 text-teal-600 hover:!text-teal-800 hover:!bg-teal-50"
                />
              </Tooltip>
            )}
            {permissions.canManageIncidents && countdown.daysLeft >= 0 && (
              <Tooltip title="Ghi nhận sự cố">
                <Button
                  intent="ghost"
                  scale="sm"
                  icon={<PlusOutlined />}
                  onClick={() => onReportIncident(row)}
                  className="h-7 w-7 !p-0 text-slate-500 hover:!text-slate-900 hover:!bg-slate-100"
                />
              </Tooltip>
            )}
            {permissions.canManageBond && row.bondStatus === "HOLDING" && (
              <>
                <Tooltip title={blocker || "Hoàn trả bảo lãnh"}>
                  <Button
                    intent="ghost"
                    scale="sm"
                    icon={<CheckOutlined />}
                    disabled={Boolean(blocker)}
                    onClick={() => confirmReturn(row)}
                    className="h-7 w-7 !p-0 text-emerald-600 hover:!text-emerald-700 hover:!bg-emerald-50 disabled:!text-slate-300"
                  />
                </Tooltip>
                <Tooltip title="Thu hồi bảo lãnh (vi phạm)">
                  <Button
                    intent="ghost"
                    scale="sm"
                    icon={<StopOutlined />}
                    onClick={() => onForfeitBond(row)}
                    className="h-7 w-7 !p-0 text-rose-500 hover:!text-rose-700 hover:!bg-rose-50"
                  />
                </Tooltip>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <Card surface="flat" padding="none" rounded="lg" className="border-slate-200 shadow-sm shadow-slate-100 overflow-hidden">
      <SectionIntro
        title="Thời hạn bảo hành công trình"
        description="Thời hạn tính từ ngày nghiệm thu hoàn thành. Xanh: còn > 90 ngày; Vàng: còn ≤ 90 ngày; Đỏ: còn ≤ 30 ngày."
        countLabel={`${rows.length} công trình`}
        readOnly={permissions.isReadOnly}
        guide="Chỉ hoàn trả bảo lãnh khi đã hết hạn bảo hành và mọi sự cố đã được khắc phục hoàn tất."
        actions={
          <div className="flex items-center gap-2">
            {permissions.canExport && (
              <Button
                intent="default"
                scale="sm"
                icon={<DownloadOutlined />}
                onClick={handleExportCSV}
                className="h-8 text-xs font-medium rounded-lg border-slate-200 text-slate-700 hover:text-teal-700 hover:border-teal-600 shadow-sm"
              >
                Xuất Excel
              </Button>
            )}
            {!permissions.isReadOnly && onOpenCreate && (
              <Button
                intent="primary"
                scale="sm"
                icon={<PlusOutlined />}
                onClick={onOpenCreate}
                className="!bg-[#007A78] !border-[#007A78] hover:!bg-[#006361] !text-white h-8 text-xs font-semibold rounded-lg shadow-sm"
              >
                Thêm bảo hành
              </Button>
            )}
          </div>
        }
        toolbar={
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            {/* Search and Status Filter bên trái */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="w-64 sm:w-80">
                <Input
                  allowClear
                  intent="clean"
                  prefix={<SearchOutlined className="text-slate-400 text-xs" />}
                  placeholder="Tìm tên công trình, mã HĐ, nhà thầu..."
                  className="w-full text-xs h-8"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <Select
                aria-label="Lọc theo trạng thái"
                value={filter}
                className="w-52 sm:w-56 h-8 text-xs [&_.ant-select-selector]:!rounded-lg"
                options={statusOptions}
                onChange={(val) => {
                  onFilterChange(val as WarrantyFilter);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Phân trang đặt cùng hàng bên phải */}
            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
              <Text className="text-xs text-slate-500 font-medium whitespace-nowrap">
                Hiển thị {rows.length === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1} -{" "}
                {Math.min(safeCurrentPage * PAGE_SIZE, rows.length)} trong tổng số{" "}
                {rows.length} công trình
              </Text>
              <Pagination
                size="small"
                current={safeCurrentPage}
                pageSize={PAGE_SIZE}
                total={rows.length}
                onChange={(page) => setCurrentPage(page)}
                showSizeChanger={false}
                hideOnSinglePage={false}
                className="!m-0"
              />
            </div>
          </div>
        }
      />

      <Table<WarrantyRecord>
        rowKey="id"
        columns={columns}
        dataSource={paginatedRows}
        size="middle"
        tableLayout="fixed"
        scroll={{ x: 1050 }}
        pagination={false}
        onRow={(record) => ({
          onClick: (e) => {
            const target = e.target as HTMLElement;
            if (target.closest("button") || target.closest("input") || target.closest("select")) {
              return;
            }
            onOpenDetail(record);
          },
          className: "cursor-pointer",
        })}
        className="[&_.ant-table-thead>tr>th]:bg-slate-50/90 [&_.ant-table-thead>tr>th]:py-3 [&_.ant-table-thead>tr>th]:text-[13px] [&_.ant-table-thead>tr>th]:font-bold [&_.ant-table-thead>tr>th]:text-slate-600 [&_.ant-table-tbody>tr>td]:py-3 [&_.ant-table-tbody>tr:hover>td]:!bg-teal-50/30"
        locale={{
          emptyText: (
            <div className="py-10 text-center text-slate-500">
              <Text className="block text-sm">Không có công trình nào khớp bộ lọc.</Text>
              {(filter !== "ALL" || search) && (
                <Button
                  intent="textLink"
                  className="mt-1 text-[13px]"
                  onClick={() => {
                    setSearch("");
                    onFilterChange("ALL");
                    setCurrentPage(1);
                  }}
                >
                  Xem tất cả công trình
                </Button>
              )}
            </div>
          ),
        }}
      />
    </Card>
  );
}
