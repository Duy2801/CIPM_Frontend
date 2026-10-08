"use client";

import { useMemo, useState } from "react";
import { message } from "antd";
import {
  DownloadOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  RightOutlined,
  SearchOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Flex,
  Input,
  Progress,
  Select,
  Table,
  Tag,
  Text,
} from "@/components/ui";
import type { ColumnsType } from "@/components/ui";
import { SectionIntro } from "@/components/workspace";
import { cn } from "@/utils/cn";
import {
  GPMB_STEPS,
  LAND_TYPE_LABELS,
  TOTAL_GPMB_STEPS,
} from "../constants/gpmb-steps";
import type { SiteClearanceController } from "../hooks/useSiteClearance";
import type { Household, HouseholdFilter } from "../types/gpmb.types";
import {
  getCurrentStep,
  getLegalStatus,
  getStepDefinition,
  matchesHouseholdFilter,
} from "../utils/gpmb-rules";
import CreateHouseholdDrawer from "./CreateHouseholdDrawer";
import HouseholdActions from "./HouseholdActions";
import { LegalDeadlineTag, SpecialStatusTag } from "./HouseholdBadges";

const CONCISE_FILTER_LABELS: Record<HouseholdFilter, string> = {
  ALL: "Tất cả",
  OVERDUE: "Quá hạn",
  SOON: "Sắp hết hạn",
  PENDING_APPROVAL: "Chờ duyệt",
  REJECTED: "Bị trả lại",
  SPECIAL: "Khiếu kiện",
  PAYMENT_READY: "Chờ chi trả",
  DONE: "Đã bàn giao",
};

interface HouseholdTabProps {
  controller: SiteClearanceController;
  filter: HouseholdFilter;
  onFilterChange: (filter: HouseholdFilter) => void;
  onOpenDetail: (household: Household) => void;
  onUpdateStep: (household: Household) => void;
  onReject: (household: Household) => void;
}

const FILTER_ORDER: HouseholdFilter[] = [
  "ALL",
  "OVERDUE",
  "SOON",
  "PENDING_APPROVAL",
  "REJECTED",
  "SPECIAL",
  "PAYMENT_READY",
  "DONE",
];

export default function HouseholdTab({
  controller,
  filter,
  onFilterChange,
  onOpenDetail,
  onUpdateStep,
  onReject,
}: HouseholdTabProps) {
  const [search, setSearch] = useState("");
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const { households, today, permissions } = controller;

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return households
      .filter((item) => matchesHouseholdFilter(item, filter, today))
      .filter(
        (item) =>
          !query ||
          [item.ownerName, item.code, item.address].some((value) =>
            value.toLowerCase().includes(query),
          ),
      )
      .sort((a, b) => {
        // Hộ quá hạn và chờ duyệt lên đầu để người dùng xử lý trước
        const weight = (item: Household) => {
          const legal = getLegalStatus(item, today).state;
          if (legal === "OVERDUE") return 0;
          if (item.proposal || item.rejection) return 1;
          if (legal === "SOON") return 2;
          return 3;
        };
        return weight(a) - weight(b) || a.code.localeCompare(b.code);
      });
  }, [filter, households, search, today]);

  const columns: ColumnsType<Household> = [
    {
      title: "Hộ dân",
      key: "owner",
      width: 220,
      render: (_, row) => (
        <div className="group block w-full text-left py-0.5">
          <span className="block text-sm font-bold text-[#102A43] group-hover:text-[#0F4C81] group-hover:underline leading-snug">
            {row.ownerName}{" "}
            <RightOutlined className="text-[9px] text-slate-400 group-hover:text-[#0F4C81] transition-transform group-hover:translate-x-0.5" />
          </span>
          <span className="mt-0.5 block text-xs text-slate-500 font-medium">
            {row.code} · CCCD {row.idNumber}
          </span>
        </div>
      ),
    },
    {
      title: "Thu hồi & Bồi thường",
      key: "compensation_land",
      width: 190,
      render: (_, row) => (
        <div className="py-0.5">
          <Text className="block text-sm font-bold text-[#102A43] leading-tight">
            {new Intl.NumberFormat("vi-VN", {
              maximumFractionDigits: 3,
            }).format(row.compensation)}{" "}
            tỷ
          </Text>
          <Text className="mt-0.5 block text-xs text-slate-500">
            {new Intl.NumberFormat("vi-VN").format(row.areaM2)} m² ·{" "}
            {LAND_TYPE_LABELS[row.landType]}
          </Text>
        </div>
      ),
    },
    {
      title: "Tiến độ thực hiện",
      key: "step",
      width: 260,
      render: (_, row) => {
        const current = getCurrentStep(row);
        const done = row.records.length;
        const percent = Math.round((done / TOTAL_GPMB_STEPS) * 100);
        return (
          <div className="py-0.5">
            <div className="flex items-center justify-between text-xs mb-1">
              <span
                className="font-semibold text-slate-800 truncate"
                title={
                  current
                    ? `Bước ${current}: ${getStepDefinition(current)?.title}`
                    : "Đã hoàn tất"
                }
              >
                {current
                  ? `Bước ${current}: ${getStepDefinition(current)?.title}`
                  : "Đã hoàn tất 16 bước"}
              </span>
              <span className="text-[11px] font-medium text-slate-400 shrink-0 ml-2">
                {done}/{TOTAL_GPMB_STEPS}
              </span>
            </div>
            <Progress
              percent={percent}
              showInfo={false}
              size="small"
              strokeColor="#059669"
              railColor="#E2E8F0"
              className="!m-0 !h-1.5"
            />
            {row.rejection && !row.proposal && (
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
      title: "Trạng thái",
      key: "status",
      width: 180,
      render: (_, row) => {
        const legal = getLegalStatus(row, today);
        const isSpecial = row.specialStatus !== "NORMAL";
        const hasDeadlineAlert =
          legal.state === "OVERDUE" || legal.state === "SOON";

        return (
          <div className="flex flex-wrap items-center gap-1.5 py-0.5">
            {hasDeadlineAlert && <LegalDeadlineTag status={legal} />}
            {isSpecial && <SpecialStatusTag status={row.specialStatus} />}
            {!hasDeadlineAlert && !isSpecial && (
              <Tag
                intent="success"
                scale="sm"
                className="m-0 font-medium text-xs"
              >
                Đúng tiến độ
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 140,
      align: "center",
      render: (_, row) => (
        <HouseholdActions
          household={row}
          permissions={permissions}
          onUpdateStep={onUpdateStep}
          onApprove={(household) => controller.approveProposal(household.id)}
          onReject={onReject}
          onOpenDetail={onOpenDetail}
        />
      ),
    },
  ];

  const counts = useMemo(() => {
    const result = {} as Record<HouseholdFilter, number>;
    FILTER_ORDER.forEach((key) => {
      result[key] = households.filter((item) =>
        matchesHouseholdFilter(item, key, today),
      ).length;
    });
    return result;
  }, [households, today]);

  const handleExportCSV = () => {
    if (!permissions.canExport) {
      message.warning("Bạn không có quyền xuất báo cáo bồi thường GPMB theo phân quyền BRD Mục 5.");
      return;
    }

    const headers = [
      "Mã hộ",
      "Chủ hộ",
      "CCCD",
      "Địa chỉ",
      "Diện tích (m2)",
      "Loại đất",
      "Tiền bồi thường (tỷ)",
      "Bước hiện tại",
      "Tên bước",
      "Trạng thái đặc biệt",
    ];

    const csvRows = rows.map((h) => {
      const current = getCurrentStep(h);
      const stepDef = current ? getStepDefinition(current) : null;
      return [
        `"${h.code}"`,
        `"${h.ownerName.replace(/"/g, '""')}"`,
        `"${h.idNumber}"`,
        `"${(h.address || "").replace(/"/g, '""')}"`,
        h.areaM2,
        `"${LAND_TYPE_LABELS[h.landType] || h.landType}"`,
        h.compensation.toFixed(3),
        current ?? 16,
        `"${(stepDef?.title || (current === null ? "Đã bàn giao mặt bằng" : "")).replace(/"/g, '""')}"`,
        `"${h.specialStatus || "Bình thường"}"`,
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...csvRows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_cao_GPMB_BQL_HaTien_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    message.success(`Đã xuất báo cáo ${rows.length} hộ dân GPMB (BT mình) thành công.`);
  };

  return (
    <Card
      surface="flat"
      padding="none"
      rounded="lg"
      className="border-slate-200 shadow-sm shadow-slate-100"
    >
      <SectionIntro
        title="Hồ sơ hộ dân bị thu hồi đất"
        description={`Mỗi hộ đi qua ${GPMB_STEPS.length} bước độc lập. Bấm vào tên hộ dân để xem toàn bộ lịch sử các bước và biểu mẫu đã nộp.`}
        countLabel={`${rows.length} hộ phù hợp`}
        readOnly={!permissions.canEdit && !permissions.canApprove}
        guide={
          permissions.canApprove
            ? "Hộ có nút “Duyệt bước” là đề xuất đang chờ bạn. Hộ quá hạn pháp lý luôn nằm trên cùng."
            : "Bấm nút “Cập nhật bước” để ghi nhận bước tiếp theo. Bước 9, 13, 15 sẽ được gửi lãnh đạo duyệt."
        }
        actions={
          <div className="flex items-center gap-2">
            {permissions.canExport && (
              <Button
                intent="default"
                icon={<DownloadOutlined />}
                onClick={handleExportCSV}
                className="text-xs h-8 border-slate-200 text-slate-700 hover:text-teal-700 hover:border-teal-600 shadow-sm"
              >
                Xuất Excel
              </Button>
            )}
            {permissions.canEdit && (
              <Button
                intent="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateDrawerOpen(true)}
                className="!bg-[#007A78] !border-[#007A78] hover:!bg-[#006361] !text-white text-xs h-8 shadow-sm"
              >
                Thêm hộ dân
              </Button>
            )}
          </div>
        }
        toolbar={
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-72 sm:w-80">
              <Input
                allowClear
                intent="clean"
                prefix={<SearchOutlined className="text-slate-400" />}
                placeholder="Tìm chủ hộ, CCCD..."
                className="w-full text-xs"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="w-48 sm:w-56">
              <Select
                value={filter}
                onChange={(val) => onFilterChange(val as HouseholdFilter)}
                className="w-full text-xs"
                options={FILTER_ORDER.map((key) => ({
                  value: key,
                  label: `${CONCISE_FILTER_LABELS[key]} (${counts[key]})`,
                }))}
              />
            </div>
          </div>
        }
      />

      <Table
        rowKey="id"
        columns={columns}
        dataSource={rows}
        size="middle"
        tableLayout="fixed"
        scroll={{ x: 990 }}
        onRow={(record) => ({
          onClick: (e) => {
            const target = e.target as HTMLElement;
            if (
              target.closest("button") ||
              target.closest("a") ||
              target.closest("input") ||
              target.closest(".ant-btn") ||
              target.closest(".ant-dropdown") ||
              target.closest(".ant-popconfirm") ||
              target.closest(".ant-select")
            ) {
              return;
            }
            onOpenDetail(record);
          },
          className: "cursor-pointer hover:bg-slate-50/70 transition-colors",
        })}
        rowClassName={(row) => {
          const legal = getLegalStatus(row, today).state;
          if (legal === "OVERDUE") return "align-top [&>td]:!bg-rose-50/50 cursor-pointer";
          if (row.proposal && permissions.canApprove)
            return "align-top [&>td]:!bg-violet-50/50 cursor-pointer";
          return "align-top cursor-pointer";
        }}
        pagination={{
          pageSize: 10,
          hideOnSinglePage: true,
          showSizeChanger: false,
        }}
        className="[&_.ant-table-thead>tr>th]:bg-slate-50/90 [&_.ant-table-thead>tr>th]:py-3 [&_.ant-table-thead>tr>th]:text-[13px] [&_.ant-table-thead>tr>th]:font-bold [&_.ant-table-thead>tr>th]:text-slate-600 [&_.ant-table-tbody>tr>td]:py-3"
        locale={{
          emptyText: (
            <div className="py-10 text-center text-slate-500">
              <TeamOutlined className="mb-2 text-2xl text-slate-400" />
              <Text className="block text-sm">
                Không có hộ dân nào khớp bộ lọc.
              </Text>
              {(filter !== "ALL" || search) && (
                <Button
                  intent="textLink"
                  className="mt-1 text-[13px]"
                  onClick={() => {
                    setSearch("");
                    onFilterChange("ALL");
                  }}
                >
                  Xem tất cả hộ dân
                </Button>
              )}
            </div>
          ),
        }}
      />

      <CreateHouseholdDrawer
        open={createDrawerOpen}
        data={controller.data}
        errorText={
          controller.feedback?.type === "error"
            ? controller.feedback.text
            : undefined
        }
        onClose={() => setCreateDrawerOpen(false)}
        onCreate={controller.createHousehold}
      />
    </Card>
  );
}
