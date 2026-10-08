"use client";

import { useMemo, useState } from "react";
import {
  DownloadOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
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
} from "@/components/ui";
import type { ColumnsType } from "@/components/ui";
import { SectionIntro, StepTrack } from "@/components/workspace";
import { BID_STEPS } from "../constants/bidding-steps";
import type { BiddingController } from "../hooks/useBiddingManagement";
import type { BidPackage, PackageFilter } from "../types/bidding.types";
import {
  getBidDeadlineStatus,
  getBidStepDefinition,
  getCompletedBidSteps,
  getCurrentBidStep,
  matchesPackageFilter,
} from "../utils/bidding-rules";
import BidActions from "./BidActions";
import BidDeadlineTag from "./BidDeadlineTag";

interface BidPackageTabProps {
  controller: BiddingController;
  filter: PackageFilter;
  onFilterChange: (filter: PackageFilter) => void;
  onOpenDetail: (pkg: BidPackage) => void;
  onUpdateStep: (pkg: BidPackage) => void;
  onReject: (pkg: BidPackage) => void;
  onCreatePackage?: () => void;
}

const FILTER_ORDER: PackageFilter[] = [
  "ALL",
  "DEADLINE",
  "PENDING_APPROVAL",
  "REJECTED",
  "CONTRACT_DUE",
  "IN_PROGRESS",
  "DONE",
];

const PACKAGE_FILTER_SELECT_LABELS: Record<PackageFilter, string> = {
  ALL: "Tất cả trạng thái",
  DEADLINE: "Sắp hết hạn",
  PENDING_APPROVAL: "Chờ phê duyệt",
  REJECTED: "Bị trả lại",
  CONTRACT_DUE: "Cần ký HĐ",
  IN_PROGRESS: "Đang thực hiện",
  DONE: "Đã ký HĐ",
};

const PAGE_SIZE = 10;
const TRACK_STEPS = BID_STEPS.map((step) => ({ number: step.number, label: step.label }));
const formatPrice = (value: number) => `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 }).format(value)} tỷ`;

export default function BidPackageTab({
  controller,
  filter,
  onFilterChange,
  onOpenDetail,
  onUpdateStep,
  onReject,
  onCreatePackage,
}: BidPackageTabProps) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { packages, today, permissions, data } = controller;

  const counts = useMemo(() => {
    const result = {} as Record<PackageFilter, number>;
    FILTER_ORDER.forEach((key) => {
      result[key] = packages.filter((pkg) => matchesPackageFilter(pkg, key, today)).length;
    });
    return result;
  }, [packages, today]);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return packages
      .filter((pkg) => matchesPackageFilter(pkg, filter, today))
      .filter((pkg) => !query || [pkg.code, pkg.name, pkg.winner ?? ""].some((value) => value.toLowerCase().includes(query)))
      .sort((a, b) => {
        const weight = (pkg: BidPackage) => {
          if (getBidDeadlineStatus(pkg, today).state === "DANGER") return 0;
          if (pkg.submission || pkg.rejection) return 1;
          if (getCurrentBidStep(pkg) === null) return 3;
          return 2;
        };
        return weight(a) - weight(b) || a.code.localeCompare(b.code);
      });
  }, [filter, packages, search, today]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, currentPage]);

  const columns: ColumnsType<BidPackage> = [
    {
      title: "Gói thầu",
      key: "name",
      width: "30%",
      render: (_, row) => (
        <div className="py-0.5">
          <button
            type="button"
            onClick={() => onOpenDetail(row)}
            className="text-sm font-bold text-[#102A43] hover:text-[#007A78] hover:underline text-left cursor-pointer leading-snug"
          >
            {row.name}
          </button>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-bold text-[#007A78]">{row.code}</span>
            <span>·</span>
            <span>{row.method}</span>
          </div>
          <div className="text-[11px] text-slate-400 truncate mt-0.5" title={data.projects.find((p) => p.id === row.projectId)?.name}>
            {data.projects.find((p) => p.id === row.projectId)?.name}
          </div>
        </div>
      ),
    },
    {
      title: "Giá gói thầu",
      key: "price",
      width: "14%",
      align: "center",
      render: (_, row) => (
        <div className="py-0.5 text-center">
          <Text className="block text-sm font-bold text-[#102A43] leading-tight">
            {formatPrice(row.estimatedPrice)}
          </Text>
        </div>
      ),
    },
    {
      title: "Tiến độ 9 bước",
      key: "progress",
      width: "26%",
      render: (_, row) => {
        const current = getCurrentBidStep(row);
        return (
          <div className="py-0.5">
            <Text
              className="mb-1 block text-xs font-semibold text-slate-800 truncate"
              title={current ? `Bước ${current}: ${getBidStepDefinition(current)?.title}` : "Đã ký hợp đồng"}
            >
              {current ? `Bước ${current}: ${getBidStepDefinition(current)?.title}` : "Đã ký hợp đồng"}
            </Text>
            <StepTrack
              steps={TRACK_STEPS}
              completed={getCompletedBidSteps(row)}
              current={current}
              currentTone={row.rejection && !row.submission ? "danger" : "normal"}
              compact
              ariaLabel={`Tiến độ gói thầu ${row.code}`}
            />
            {row.rejection && !row.submission && (
              <div className="mt-1 flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-xs text-rose-700">
                <ExclamationCircleOutlined className="shrink-0 text-[11px]" />
                <span className="truncate" title={row.rejection.reason}>
                  Bị trả lại: {row.rejection.reason}
                </span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Mốc thời gian",
      key: "deadline",
      width: "13%",
      align: "center",
      render: (_, row) => <BidDeadlineTag pkg={row} today={today} />,
    },
    {
      title: "Thao tác",
      key: "action",
      width: "16%",
      align: "center",
      render: (_, row) => (
        <BidActions
          pkg={row}
          permissions={permissions}
          onUpdateStep={onUpdateStep}
          onApprove={(pkg) => controller.approveSubmission(pkg.id)}
          onReject={onReject}
          onOpenDetail={() => onOpenDetail(row)}
        />
      ),
    },
  ];

  return (
    <Card surface="flat" padding="none" rounded="lg" className="border-slate-200 shadow-sm shadow-slate-100 overflow-hidden">
      <SectionIntro
        title="Danh sách gói thầu"
        description="Mỗi dự án gồm nhiều gói thầu độc lập. Mỗi gói đi qua 9 bước lựa chọn nhà thầu theo Luật Đấu thầu 2023."
        countLabel={`${rows.length} gói thầu`}
        readOnly={permissions.isReadOnly}
        guide="Bấm vào tên gói thầu hoặc nút “Xem chi tiết” để mở ngăn kéo xem đầy đủ thông tin, văn bản và 9 bước lịch sử."
        actions={
          <Flex gap="small" wrap="wrap" align="center">
            {permissions.canExport && (
              <Button
                intent="outline"
                scale="sm"
                icon={<DownloadOutlined />}
                onClick={() =>
                  Modal.info({
                    title: "Xuất báo cáo đấu thầu",
                    content: (
                      <Text className="text-[13px]">
                        Danh sách {controller.kpis.total} gói thầu đã sẵn sàng tải về dạng Excel.
                      </Text>
                    ),
                    okText: "Đã hiểu",
                  })
                }
                className="h-8 text-xs font-medium rounded-lg"
              >
                Xuất báo cáo
              </Button>
            )}
            {permissions.canEdit && onCreatePackage && (
              <Button
                intent="primary"
                scale="sm"
                icon={<PlusOutlined />}
                onClick={onCreatePackage}
                className="!bg-[#007A78] !border-[#007A78] hover:!bg-[#006361] !text-white text-xs font-semibold rounded-lg shadow-sm h-8 px-3.5"
              >
                Tạo gói thầu
              </Button>
            )}
          </Flex>
        }
        toolbar={
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Cụm tìm kiếm và lọc trạng thái đặt bên trái */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Ô tìm kiếm */}
              <div className="w-64 sm:w-72">
                <Input
                  allowClear
                  intent="clean"
                  prefix={<SearchOutlined className="text-slate-400 text-xs" />}
                  placeholder="Tìm mã, tên gói thầu, nhà thầu..."
                  className="w-full text-xs h-8"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              {/* Dropdown chọn trạng thái gói thầu */}
              <Select
                aria-label="Lọc theo trạng thái"
                value={filter}
                className="w-48 sm:w-52 h-8 text-xs [&_.ant-select-selector]:!rounded-lg"
                options={FILTER_ORDER.map((key) => ({
                  value: key,
                  label: `${PACKAGE_FILTER_SELECT_LABELS[key]} (${counts[key]})`,
                }))}
                onChange={(val) => {
                  onFilterChange(val as PackageFilter);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Phân trang đặt cùng 1 hàng bên phải */}
            {rows.length > PAGE_SIZE && (
              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                <Text className="text-xs text-slate-500 font-medium whitespace-nowrap">
                  Hiển thị {(currentPage - 1) * PAGE_SIZE + 1} -{" "}
                  {Math.min(currentPage * PAGE_SIZE, rows.length)} trong tổng số{" "}
                  {rows.length} gói thầu
                </Text>
                <Pagination
                  current={currentPage}
                  pageSize={PAGE_SIZE}
                  total={rows.length}
                  onChange={(page: number) => setCurrentPage(page)}
                  showSizeChanger={false}
                  hideOnSinglePage={true}
                  className="!m-0"
                />
              </div>
            )}
          </div>
        }
      />
      <Table
        rowKey="id"
        columns={columns}
        dataSource={paginatedRows}
        size="middle"
        tableLayout="fixed"
        pagination={false}
        onRow={(record) => ({
          onClick: (e) => {
            const target = e.target as HTMLElement;
            // Tránh trigger khi người dùng click vào button hoặc input thao tác
            if (target.closest("button") || target.closest("input") || target.closest("select")) {
              return;
            }
            onOpenDetail(record);
          },
          className: "cursor-pointer",
        })}
        rowClassName={(row) => {
          const base = "align-top cursor-pointer";
          if (getBidDeadlineStatus(row, today).state === "DANGER") return `${base} [&>td]:!bg-rose-50/50`;
          if (row.submission && permissions.canApprove) return `${base} [&>td]:!bg-violet-50/50`;
          return base;
        }}
        className="[&_.ant-table-thead>tr>th]:bg-slate-50/90 [&_.ant-table-thead>tr>th]:py-3 [&_.ant-table-thead>tr>th]:text-[13px] [&_.ant-table-thead>tr>th]:font-bold [&_.ant-table-thead>tr>th]:text-slate-600 [&_.ant-table-tbody>tr>td]:py-3 [&_.ant-table-tbody>tr:hover>td]:!bg-teal-50/30"
        locale={{
          emptyText: (
            <div className="py-10 text-center text-slate-500">
              <Text className="block text-sm">Không có gói thầu nào khớp bộ lọc.</Text>
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
                  Xem tất cả gói thầu
                </Button>
              )}
            </div>
          ),
        }}
      />
    </Card>
  );
}
