"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  CheckOutlined,
  ClockCircleOutlined,
  ExclamationOutlined,
  MinusOutlined,
  PaperClipOutlined,
  PlusOutlined,
  SearchOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Input,
  Pagination,
  Select,
  Text,
  Tooltip,
} from "@/components/ui";
import { SectionIntro } from "@/components/workspace";
import { cn } from "@/utils/cn";
import { formatDateVi } from "@/utils/date";
import { GPMB_STEPS } from "../constants/gpmb-steps";
import type { SiteClearanceController } from "../hooks/useSiteClearance";
import type { Household, HouseholdFilter } from "../types/gpmb.types";
import {
  getCurrentStep,
  getLegalStatus,
  isStepApplicable,
  matchesHouseholdFilter,
} from "../utils/gpmb-rules";
import CreateHouseholdDrawer from "./CreateHouseholdDrawer";

interface HouseholdMatrixTabProps {
  controller: SiteClearanceController;
  onOpenDetail: (household: Household, step?: number) => void;
  onUpdateStep: (household: Household) => void;
  onReject: (household: Household) => void;
}

type CellState = "done" | "current" | "soon" | "overdue" | "pending" | "skipped" | "todo";

const CELL_STYLES: Record<CellState, { className: string; icon?: ReactNode; label: string }> = {
  done: { className: "bg-emerald-500 text-white border-emerald-500", icon: <CheckOutlined className="text-[10px]" />, label: "Đã xong" },
  current: { className: "bg-sky-50 text-sky-800 border-sky-400 font-bold", label: "Đang làm" },
  soon: { className: "bg-amber-100 text-amber-900 border-amber-500 font-bold", label: "Sắp hết hạn" },
  overdue: { className: "bg-rose-500 text-white border-rose-500", icon: <ExclamationOutlined className="text-[10px] font-bold" />, label: "Quá hạn" },
  pending: { className: "bg-violet-100 text-violet-800 border-violet-500", icon: <ClockCircleOutlined className="text-[10px]" />, label: "Chờ duyệt" },
  skipped: {
    className: "border-slate-200 text-slate-300 bg-[repeating-linear-gradient(45deg,#f8fafc_0_3px,#fff_3px_6px)]",
    icon: <MinusOutlined className="text-[9px]" />,
    label: "Không áp dụng",
  },
  todo: { className: "bg-white border-slate-200 text-slate-300", label: "Chưa tới" },
};

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

const PAGE_SIZE = 10;

function getCellState(household: Household, step: number, today: string): CellState {
  if (household.records.some((record) => record.step === step)) return "done";
  if (!isStepApplicable(step, household)) return "skipped";
  if (getCurrentStep(household) !== step) return "todo";
  if (household.proposal) return "pending";
  const legal = getLegalStatus(household, today).state;
  if (legal === "OVERDUE") return "overdue";
  if (legal === "SOON") return "soon";
  return "current";
}

export default function HouseholdMatrixTab({
  controller,
  onOpenDetail,
  onUpdateStep,
}: HouseholdMatrixTabProps) {
  const { households, today, permissions } = controller;
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<HouseholdFilter>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return households
      .filter((item) => matchesHouseholdFilter(item, filter, today))
      .filter(
        (item) =>
          !query ||
          [item.ownerName, item.code, item.address, item.idNumber].some((value) =>
            value?.toLowerCase().includes(query),
          ),
      )
      .sort((a, b) => {
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

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, currentPage]);

  const counts = useMemo(() => {
    const result = {} as Record<HouseholdFilter, number>;
    FILTER_ORDER.forEach((key) => {
      result[key] = households.filter((item) =>
        matchesHouseholdFilter(item, key, today),
      ).length;
    });
    return result;
  }, [households, today]);

  return (
    <Card surface="flat" padding="none" rounded="lg" className="border-slate-200 shadow-sm shadow-slate-100 overflow-hidden">
      <SectionIntro
        title="Ma trận tiến độ hộ dân × 16 bước"
        description="Mỗi hàng là một hộ dân, mỗi cột là một bước. Bấm vào ô tiến độ đang làm để cập nhật hoặc bấm vào tên hộ để mở chi tiết."
        countLabel={`${rows.length} hộ dân`}
        readOnly={!permissions.canEdit && !permissions.canApprove}
        guide="Rê chuột lên ô để xem ngày & số văn bản. Bấm vào ô đang làm để cập nhật hoặc bấm tên hộ để mở chi tiết hồ sơ."
        actions={
          permissions.canEdit ? (
            <Button
              intent="primary"
              scale="sm"
              icon={<PlusOutlined />}
              onClick={() => setCreateDrawerOpen(true)}
              className="!bg-[#007A78] !border-[#007A78] hover:!bg-[#006361] !text-white text-xs font-semibold rounded-md shadow-2xs h-8 px-3"
            >
              Thêm hộ dân
            </Button>
          ) : undefined
        }
        toolbar={
          <div className="flex flex-col gap-3">
            {/* Hàng 1: Ô tìm kiếm (bên trái) + Nút Select trạng thái (bên cạnh) */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="w-72 sm:w-80">
                <Input
                  allowClear
                  intent="clean"
                  prefix={<SearchOutlined className="text-slate-400 text-xs" />}
                  placeholder="Tìm chủ hộ, CCCD, mã hộ..."
                  className="w-full text-xs h-8"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div className="w-48 sm:w-56">
                <Select
                  value={filter}
                  onChange={(val) => {
                    setFilter(val as HouseholdFilter);
                    setCurrentPage(1);
                  }}
                  className="w-full text-xs"
                  options={FILTER_ORDER.map((key) => ({
                    value: key,
                    label: `${CONCISE_FILTER_LABELS[key]} (${counts[key]})`,
                  }))}
                />
              </div>
            </div>

            {/* Hàng 2: Chú giải màu (trái) + Phân trang (phải) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-100 pt-2.5 gap-2.5">
              <ul className="m-0 flex list-none flex-wrap gap-x-3.5 gap-y-1 p-0" aria-label="Chú giải màu">
                {(Object.keys(CELL_STYLES) as CellState[]).map((state) => (
                  <li key={state} className="flex items-center gap-1.5 text-[11.5px] text-slate-600">
                    <span className={`flex h-4 w-4 items-center justify-center rounded border text-[9px] ${CELL_STYLES[state].className}`}>
                      {CELL_STYLES[state].icon}
                    </span>
                    {CELL_STYLES[state].label}
                  </li>
                ))}
              </ul>

              {/* Phân trang đặt bên phải hàng 2 - chỉ hiện khi > 10 */}
              {rows.length > PAGE_SIZE && (
                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                  <Text className="text-xs text-slate-500 font-medium">
                    Hiển thị {(currentPage - 1) * PAGE_SIZE + 1} -{" "}
                    {Math.min(currentPage * PAGE_SIZE, rows.length)} trong tổng số{" "}
                    {rows.length} hộ dân
                  </Text>
                  <Pagination
                    current={currentPage}
                    pageSize={PAGE_SIZE}
                    total={rows.length}
                    onChange={(page) => setCurrentPage(page)}
                    showSizeChanger={false}
                    hideOnSinglePage={true}
                  />
                </div>
              )}
            </div>
          </div>
        }
      />

      <div className="overflow-x-auto p-4">
        {paginatedRows.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <TeamOutlined className="mb-2 text-2xl text-slate-400" />
            <Text className="block text-sm">Không có hộ dân nào khớp bộ lọc.</Text>
            {(filter !== "ALL" || search) && (
              <Button
                intent="textLink"
                className="mt-1 text-[13px]"
                onClick={() => {
                  setSearch("");
                  setFilter("ALL");
                  setCurrentPage(1);
                }}
              >
                Xem tất cả hộ dân
              </Button>
            )}
          </div>
        ) : (
          <table className="w-full min-w-[980px] border-separate border-spacing-1 text-center">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="sticky left-0 z-10 min-w-[190px] max-w-[210px] bg-white px-2 py-1 text-left text-[12px] font-bold text-slate-600 border-b border-slate-200"
                >
                  Hộ dân
                </th>
                {GPMB_STEPS.map((step) => (
                  <th key={step.number} scope="col" className="w-[52px] min-w-[48px] align-bottom pb-1.5 border-b border-slate-200 px-0.5">
                    <Tooltip title={`Bước ${step.number}: ${step.title}`}>
                      <div className="cursor-default flex flex-col items-center justify-end">
                        <span className="block text-[13px] font-bold text-[#102A43] leading-tight">
                          {step.number}
                        </span>
                        <span className="block text-[10.5px] font-medium text-slate-500 leading-tight text-center mt-0.5">
                          {step.label}
                        </span>
                      </div>
                    </Tooltip>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((household) => {
                const legal = getLegalStatus(household, today);
                const isOverdue = legal.state === "OVERDUE";
                const currentStep = getCurrentStep(household);

                return (
                  <tr key={household.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Cột 1: Hộ dân (cố định bên trái) */}
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-white px-2 py-1 text-left font-normal border-r border-slate-100"
                    >
                      <button
                        type="button"
                        onClick={() => onOpenDetail(household)}
                        className="cursor-pointer text-left text-[13px] font-semibold text-[#102A43] hover:text-[#007A78] hover:underline block leading-tight truncate max-w-[190px]"
                      >
                        {household.ownerName}
                      </button>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <span>{household.code}</span>
                        {isOverdue && (
                          <span className="text-[10.5px] font-semibold text-rose-500">
                            · Quá hạn {Math.abs(legal.daysLeft ?? 0)}d
                          </span>
                        )}
                      </div>
                    </th>

                    {/* Cột 2..17: 16 bước ma trận */}
                    {GPMB_STEPS.map((step) => {
                      const state = getCellState(household, step.number, today);
                      const record = household.records.find((item) => item.step === step.number);
                      const style = CELL_STYLES[state];
                      const isCurrent = currentStep === step.number;
                      const detail = record
                        ? `${formatDateVi(record.completedAt)} · ${record.documentNo}${record.fileName ? ` (📎 ${record.fileName})` : ""}`
                        : style.label;

                      const isClickable = isCurrent || Boolean(record);

                      const handleCellClick = () => {
                        if (!isClickable) return;
                        if (isCurrent) {
                          if (household.proposal && permissions.canApprove) {
                            onOpenDetail(household, step.number);
                          } else if (permissions.canEdit) {
                            onUpdateStep(household);
                          } else {
                            onOpenDetail(household, step.number);
                          }
                        } else if (record) {
                          onOpenDetail(household, step.number);
                        }
                      };

                      return (
                        <td key={step.number} className="p-0 w-[52px] min-w-[48px]">
                          <Tooltip
                            title={
                              state === "todo"
                                ? `Bước ${step.number}: ${step.title} – Chưa tới bước này`
                                : state === "skipped"
                                ? `Bước ${step.number}: ${step.title} – Không áp dụng cho hộ này`
                                : `${household.ownerName} – Bước ${step.number}: ${detail}${record ? " (Bấm để xem/bổ sung tài liệu)" : isCurrent ? " (Bấm để cập nhật)" : ""}`
                            }
                          >
                            <button
                              type="button"
                              disabled={!isClickable}
                              onClick={isClickable ? handleCellClick : undefined}
                              className={cn(
                                "relative flex h-8 w-full items-center justify-center rounded-md border text-xs transition-all font-medium",
                                style.className,
                                isCurrent && "!bg-sky-50 !border-sky-400 !text-sky-800 font-bold",
                                isClickable
                                  ? "cursor-pointer hover:opacity-85 hover:scale-105"
                                  : "cursor-default opacity-60 select-none",
                              )}
                              aria-label={`Bước ${step.number}: ${style.label}`}
                            >
                              {style.icon ?? (state === "todo" ? "" : step.number)}
                              {record?.fileName && (
                                <span
                                  className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-white text-emerald-700 shadow-2xs border border-emerald-300"
                                  title={`Có tệp đính kèm: ${record.fileName}`}
                                >
                                  <PaperClipOutlined className="text-[7.5px]" />
                                </span>
                              )}
                            </button>
                          </Tooltip>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

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
