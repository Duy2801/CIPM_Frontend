"use client";

import { useMemo, useState } from "react";
import { App } from "antd";
import {
  DownloadOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Input,
  Pagination,
  Select,
  Table,
  Tooltip,
} from "@/components/ui";
import type { ColumnsType } from "@/components/ui";
import { cn } from "@/utils/cn";
import { formatMoneyString } from "@/utils/format-money";
import { HOUSEHOLD_FILTER_LABELS, landTypeLabel } from "../constants/gpmb-steps";
import type { SiteClearanceController } from "../hooks/useSiteClearance";
import type {
  CompensationBreakdown,
  Household,
  HouseholdFilter,
} from "../types/gpmb.types";
import {
  COMPENSATION_GROUPS,
  COMPENSATION_GROUP_LABELS,
  summarizeCompensation,
  sumCompensation,
} from "../utils/gpmb-compensation";
import {
  getCurrentStep,
  getLegalStatus,
  hasReceivedPayment,
  matchesHouseholdFilter,
} from "../utils/gpmb-rules";
import CreateHouseholdDrawer from "./CreateHouseholdDrawer";


type Row = Household & { stt: number; money: CompensationBreakdown };
type PaymentFilter = "ALL" | "PAID" | "UNPAID";

const money = (value: number) => (value ? formatMoneyString(value) : "0");

const PAGE_SIZE = 20;

/**
 * Danh sách hộ dân được bồi thường: bảng tổng hợp chi trả theo phương án
 * (đất, hỗ trợ, cây trồng, vật kiến trúc, chính sách hỗ trợ). Bấm tên hộ để xem bảng kê chi tiết.
 */
export default function CompensationTab({
  controller,
  onOpenDetail,
}: {
  controller: SiteClearanceController;
  onOpenDetail: (household: Household) => void;
}) {
  const { message } = App.useApp();
  const { households, today, permissions } = controller;
  // Xem toàn bộ dự án (phân hệ GPMB): thêm cột dự án để biết hộ thuộc dự án nào
  const showProject =
    controller.projectId === "ALL" && controller.data.projects.length > 1;
  const projectName = (id: string) =>
    controller.data.projects.find((p) => p.id === id)?.name ?? "—";
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<HouseholdFilter>("ALL");
  const [payment, setPayment] = useState<PaymentFilter>("ALL");
  const [landType, setLandType] = useState<string>("ALL");
  const [projectFilter, setProjectFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  const filtersActive =
    Boolean(search.trim()) || filter !== "ALL" || payment !== "ALL" || landType !== "ALL" || projectFilter !== "ALL";
  const resetFilters = () => {
    setSearch("");
    setFilter("ALL");
    setPayment("ALL");
    setLandType("ALL");
    setProjectFilter("ALL");
    setPage(1);
  };
  /** Đổi bộ lọc thì về trang 1 */
  function onFilter<T>(set: (v: T) => void) {
    return (v: T) => {
      set(v);
      setPage(1);
    };
  }

  const landTypeOptions = useMemo(
    () => [...new Set(households.map((h) => h.landType).filter(Boolean))].sort(),
    [households],
  );

  const rows = useMemo<Row[]>(() => {
    const q = search.trim().toLowerCase();
    return households
      .filter((h) => matchesHouseholdFilter(h, filter, today))
      .filter((h) => payment === "ALL" || hasReceivedPayment(h) === (payment === "PAID"))
      .filter((h) => landType === "ALL" || h.landType === landType)
      .filter((h) => projectFilter === "ALL" || h.projectId === projectFilter)
      .filter(
        (h) =>
          !q ||
          [h.ownerName, h.idNumber].some((v) =>
            v?.toLowerCase().includes(q),
          ),
      )
      // Hộ mới thêm nằm đầu danh sách, còn lại theo mã hộ
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0) || a.code.localeCompare(b.code))
      .map((h, i) => ({ ...h, stt: i + 1, money: summarizeCompensation(h) }));
  }, [households, filter, payment, landType, projectFilter, search, today]);

  // Thống kê kinh phí của toàn bộ hộ trong phạm vi đang xem (không phụ thuộc ô tìm / bộ lọc)
  const stats = useMemo(() => {
    const all = households.map((h) => ({ h, money: summarizeCompensation(h) }));
    const paid = all.filter(({ h }) => hasReceivedPayment(h));
    return {
      totals: sumCompensation(all.map((x) => x.money)),
      count: all.length,
      paidCount: paid.length,
      paidAmount: paid.reduce((sum, x) => sum + x.money.total, 0),
    };
  }, [households]);

  const moneyColumn = (key: (typeof COMPENSATION_GROUPS)[number]) => ({
    title: COMPENSATION_GROUP_LABELS[key],
    key,
    width: 124,
    align: "right" as const,
    render: (_: unknown, row: Row) =>
      row.money.itemized && row.money[key] ? (
        <span className="tabular-nums text-slate-800">{money(row.money[key])}</span>
      ) : (
        <span className="text-slate-300">–</span>
      ),
  });

  const columns: ColumnsType<Row> = [
    {
      title: "STT",
      dataIndex: "stt",
      width: 56,
      align: "center",
      fixed: "left",
    },
    {
      title: "Họ tên",
      key: "owner",
      width: 210,
      fixed: "left",
      // Cả hàng bấm được để mở chi tiết (xem onRow của bảng)
      render: (_, row) => (
        <>
          <span className="block truncate text-[13px] font-semibold text-[#102A43]">
            {row.ownerName}
          </span>
          <span className="block truncate text-[11px] text-slate-500">
            CCCD {row.idNumber}
          </span>
        </>
      ),
    },
    ...(showProject
      ? [
          {
            title: "Dự án",
            key: "project",
            width: 180,
            render: (_: unknown, row: Row) => (
              <span
                className="line-clamp-2 text-[12px] text-slate-700"
                title={projectName(row.projectId)}
              >
                {projectName(row.projectId)}
              </span>
            ),
          },
        ]
      : []),
    {
      title: "Diện Tích (m2)",
      key: "area",
      width: 116,
      align: "right",
      render: (_, row) => (
        <>
          <span className="block tabular-nums text-[13px] text-slate-800">
            {row.areaM2
              ? new Intl.NumberFormat("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(row.areaM2)
              : "–"}
          </span>
          <Tooltip title={landTypeLabel(row.landType)}>
            <span className="block text-[11px] text-slate-500">{row.landType}</span>
          </Tooltip>
        </>
      ),
    },
    ...COMPENSATION_GROUPS.map(moneyColumn),
    {
      title: "Tổng",
      key: "total",
      width: 136,
      align: "right",
      render: (_, row) => (
        <span className="tabular-nums font-bold text-[#102A43]">
          {money(row.money.total)}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 140,
      align: "center",
      render: (_, row) => {
        const st = householdStatus(row, today);
        return (
          <span
            className={cn(
              "inline-flex rounded-full border px-2 py-0.5 text-[11.5px] font-semibold",
              st.className,
            )}
          >
            {st.label}
          </span>
        );
      },
    },
  ];

  const exportCsv = () => {
    const rowTotals = sumCompensation(rows.map((r) => r.money));
    const header = [
      "STT",
      "Mã hộ",
      "Họ tên",
      "CCCD",
      "Dự án",
      "Địa chỉ",
      "Diện tích thu hồi (m2)",
      "Loại đất",
      ...COMPENSATION_GROUPS.map((g) => COMPENSATION_GROUP_LABELS[g]),
      "Tổng cộng",
    ];
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = rows.map((r) =>
      [
        r.stt,
        r.code,
        r.ownerName,
        r.idNumber,
        projectName(r.projectId),
        r.address,
        r.areaM2.toFixed(2),
        r.landType,
        ...COMPENSATION_GROUPS.map((g) => r.money[g]),
        r.money.total,
      ].map(esc),
    );
    lines.push(
      [
        "",
        "",
        "Tổng cộng",
        "",
        "",
        "",
        "",
        "",
        ...COMPENSATION_GROUPS.map((g) => rowTotals[g]),
        rowTotals.total,
      ].map(esc),
    );
    const csv =
      "﻿" + [header.map(esc), ...lines].map((l) => l.join(",")).join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `Danh_sach_boi_thuong_GPMB_${today}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    message.success(`Đã xuất danh sách ${rows.length} hộ dân.`);
  };

  return (
    <div className="flex flex-col gap-3">
      <CompensationStats {...stats} />
      <Card
        surface="flat"
        padding="none"
        rounded="lg"
        className="overflow-hidden border-slate-200 shadow-sm shadow-slate-100"
      >
        <header className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="w-full sm:w-80">
              <Input
                allowClear
                intent="clean"
                prefix={<SearchOutlined className="text-xs text-slate-400" />}
                placeholder="Tìm họ tên, CCCD..."
                className="h-8 w-full text-xs"
                value={search}
                onChange={(e) => onFilter(setSearch)(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              {permissions.canExport && (
                <Button intent="outline" scale="sm" icon={<DownloadOutlined />} onClick={exportCsv} className="h-8 text-xs">
                  Xuất Excel
                </Button>
              )}
              {permissions.canEdit && (
                <Button
                  intent="primary"
                  scale="sm"
                  icon={<PlusOutlined />}
                  onClick={() => setCreateOpen(true)}
                  className="h-8 !border-[#DC2626] !bg-[#DC2626] px-3 text-xs font-semibold !text-white hover:!bg-[#B91C1C]"
                >
                  Thêm hộ dân
                </Button>
              )}
            </div>
          </div>

          {/* Bộ lọc theo các trường cần dùng khi rà soát phương án */}
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              label="Trạng thái"
              value={filter}
              onChange={onFilter(setFilter)}
              options={(Object.keys(HOUSEHOLD_FILTER_LABELS) as HouseholdFilter[]).map((k) => ({
                value: k,
                label: k === "ALL" ? "Tất cả" : HOUSEHOLD_FILTER_LABELS[k],
              }))}
            />
            <FilterSelect
              label="Chi trả"
              value={payment}
              onChange={onFilter(setPayment)}
              options={[
                { value: "ALL", label: "Tất cả" },
                { value: "PAID", label: "Đã chi trả" },
                { value: "UNPAID", label: "Chưa chi trả" },
              ]}
            />
            <FilterSelect
              label="Loại đất"
              value={landType}
              onChange={onFilter(setLandType)}
              options={[
                { value: "ALL", label: "Tất cả" },
                ...landTypeOptions.map((t) => ({ value: t, label: `${t} – ${landTypeLabel(t)}` })),
              ]}
            />
            {showProject && (
              <FilterSelect
                label="Dự án"
                value={projectFilter}
                onChange={onFilter(setProjectFilter)}
                options={[
                  { value: "ALL", label: "Tất cả" },
                  ...controller.data.projects.map((p) => ({ value: p.id, label: p.name })),
                ]}
              />
            )}
            {filtersActive && (
              <Button intent="textLink" scale="sm" onClick={resetFilters} className="h-8 text-xs">
                Xóa lọc
              </Button>
            )}
            {/* Phân trang đặt trên đầu bảng; chỉ 1 trang thì hiện tổng số hộ */}
            {rows.length > PAGE_SIZE ? (
              // Bọc div: CSS của antd ghi đè margin đặt thẳng lên Pagination nên ml-auto không có tác dụng
              <div className="ml-auto">
                <Pagination
                  size="small"
                  current={page}
                  onChange={setPage}
                  pageSize={PAGE_SIZE}
                  total={rows.length}
                  showSizeChanger={false}
                />
              </div>
            ) : (
              <span className="ml-auto text-xs text-slate-500">
                <strong className="text-slate-800">{rows.length}</strong> hộ
              </span>
            )}
          </div>
        </header>

        <Table<Row>
          rowKey="id"
          size="small"
          columns={columns}
          dataSource={rows}
          tableLayout="fixed"
          bordered
          scroll={{ x: showProject ? 1460 : 1280 }}
          // Bảng chỉ hiện trang đang chọn; nút phân trang nằm ở thanh lọc phía trên
          pagination={{ current: page, pageSize: PAGE_SIZE, placement: ["none"] }}
          onRow={(row) => ({
            onClick: () => onOpenDetail(row),
            onKeyDown: (e) => {
              if (e.key === "Enter") onOpenDetail(row);
            },
            tabIndex: 0,
          })}
          rowClassName={(row) =>
            cn(
              // Màu nền đặc (không trong suốt) và phủ cả ô cột cố định để cả hàng sáng đều khi rê chuột
              "cursor-pointer outline-none",
              getLegalStatus(row, today).state === "OVERDUE" && "[&>td]:!bg-rose-50",
              "hover:[&>td]:!bg-red-50 [&>td.ant-table-cell-row-hover]:!bg-red-50 focus-visible:[&>td]:!bg-red-50",
            )
          }
          className={cn(
            "[&_.ant-table-thead>tr>th]:!bg-slate-50 [&_.ant-table-thead>tr>th]:!py-2 [&_.ant-table-thead>tr>th]:leading-snug [&_.ant-table-thead>tr>th]:!text-center",
            "[&_.ant-table-thead>tr>th]:text-[12px] [&_.ant-table-thead>tr>th]:font-bold [&_.ant-table-thead>tr>th]:text-slate-600",
            // Căn giữa toàn bộ nội dung ô cho đồng bộ với tiêu đề
            // Bỏ qua hàng đo cột ẩn của antd (measure row) – nếu dính padding nó sẽ thành dải trống phía trên hàng 1
            "[&_.ant-table-tbody>tr:not(.ant-table-measure-row)>td]:!py-2.5 [&_.ant-table-tbody>tr>td]:!text-center",
          )}
          locale={{
            emptyText: (
              <div className="py-10 text-sm text-slate-500">
                Không có hộ dân nào khớp bộ lọc.
              </div>
            ),
          }}
        />

        <CreateHouseholdDrawer
          open={createOpen}
          data={controller.data}
          errorText={
            controller.feedback?.type === "error"
              ? controller.feedback.text
              : undefined
          }
          onClose={() => setCreateOpen(false)}
          onCreate={async (input) => {
            const res = await controller.createHousehold(input);
            // Hộ vừa thêm nằm đầu danh sách: bỏ lọc, về trang 1
            if (res) resetFilters();
            return res;
          }}
        />
      </Card>
    </div>
  );
}

/** Trạng thái một hộ (một nhãn): ưu tiên việc cần xử lý trước, rồi tới tình trạng chi trả / bàn giao */
function householdStatus(
  row: Household,
  today: string,
): { label: string; className: string } {
  if (getCurrentStep(row) === null)
    return {
      label: "Đã bàn giao đất",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  if (row.specialStatus === "ENFORCEMENT")
    return {
      label: "Cưỡng chế",
      className: "border-red-200 bg-red-50 text-red-700",
    };
  if (row.specialStatus === "UNCOOPERATIVE")
    return {
      label: "Không hợp tác",
      className: "border-orange-200 bg-orange-50 text-orange-700",
    };
  if (row.specialStatus === "OTHER")
    return {
      label: row.specialStatusLabel || "Khác",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    };
  if (row.specialStatus === "COMPLAINT")
    return {
      label: "Đang khiếu kiện",
      className: "border-sky-200 bg-sky-50 text-sky-700",
    };
  if (row.proposal)
    return {
      label: "Chờ duyệt",
      className: "border-violet-200 bg-violet-50 text-violet-700",
    };
  if (row.rejection)
    return {
      label: "Bị trả lại",
      className: "border-rose-200 bg-rose-50 text-rose-700",
    };
  if (getLegalStatus(row, today).state === "OVERDUE")
    return {
      label: "Quá hạn",
      className: "border-red-200 bg-red-50 text-red-700",
    };
  if (hasReceivedPayment(row))
    return {
      label: "Đã chi trả",
      className: "border-teal-200 bg-teal-50 text-teal-700",
    };
  return {
    label: "Chưa chi trả",
    className: "border-slate-200 bg-slate-50 text-slate-600",
  };
}

/** Thống kê kinh phí bồi thường, hỗ trợ (thay cho khối tiến độ quy trình khi xem danh sách hộ dân) */
function CompensationStats({
  totals,
  count,
  paidCount,
  paidAmount,
}: {
  totals: CompensationBreakdown;
  count: number;
  paidCount: number;
  paidAmount: number;
}) {
  const percent =
    totals.total > 0 ? Math.round((paidAmount / totals.total) * 100) : 0;
  return (
    <Card
      surface="workspace"
      padding="none"
      rounded="lg"
      className="border border-slate-200/80 shadow-xs"
    >
      <div className="px-5 pt-4 pb-3">
        {/* Tiêu đề · tổng kinh phí cùng một hàng, canh theo đường chân chữ */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <span className="text-base font-bold text-slate-900">
            Kinh phí bồi thường, hỗ trợ
          </span>
          <span className="whitespace-nowrap">
            <span className="text-2xl font-bold text-[#DC2626] tabular-nums">
              {money(totals.total)}
            </span>
            <span className="ml-1 text-xs font-medium text-slate-500">VNĐ</span>
          </span>
        </div>
        {/* Tiến độ chi trả: thanh trải hết chiều ngang, số liệu ngay bên dưới */}
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#DC2626] transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between gap-3 text-[11px] text-slate-500 tabular-nums">
          <span>
            Đã chi <strong className="text-slate-800">{money(paidAmount)}</strong> ({percent}%)
          </span>
          <span>
            {paidCount}/{count} hộ
          </span>
        </div>
      </div>
      <dl className="m-0 grid grid-cols-2 border-t border-slate-100 sm:grid-cols-3 lg:grid-cols-5">
        {COMPENSATION_GROUPS.map((g, i) => (
          <div
            key={g}
            className={cn(
              "min-w-0 px-5 py-3",
              i > 0 && "lg:border-l lg:border-slate-100",
            )}
          >
            <dt className="truncate text-[11px] text-slate-400">
              {COMPENSATION_GROUP_LABELS[g]}
            </dt>
            <dd className="m-0 mt-0.5 truncate text-sm font-semibold tabular-nums text-slate-800">
              {money(totals[g])}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <Select
      value={value}
      onChange={(v) => onChange(v as T)}
      popupMatchSelectWidth={false}
      className={cn(
        "min-w-36 text-xs",
        value !== "ALL" && "[&_.ant-select-selector]:!border-[#DC2626]/60 [&_.ant-select-selector]:!bg-red-50/40",
      )}
      labelRender={(opt) => (
        <span className="text-xs">
          <span className="text-slate-400">{label}: </span>
          <span className="font-medium text-slate-700">{opt.label}</span>
        </span>
      )}
      options={options}
    />
  );
}
