"use client";

import { CheckOutlined, ClockCircleOutlined, CloseOutlined, EditOutlined, SendOutlined } from "@ant-design/icons";
import { Button, Flex, Modal, Text } from "@/components/ui";
import { cn } from "@/utils/cn";
import { formatDateVi } from "@/utils/date";
import type { GpmbRolePermissions, Household } from "../types/gpmb.types";
import { getCurrentStep, getStepDefinition } from "../utils/gpmb-rules";

interface HouseholdActionsProps {
  household: Household;
  permissions: GpmbRolePermissions;
  onUpdateStep: (household: Household) => void;
  onApprove: (household: Household) => Promise<boolean>;
  onReject: (household: Household) => void;
  onOpenDetail?: (household: Household) => void;
  /** Bố cục ngang trong ma trận / ngăn chi tiết */
  layout?: "vertical" | "horizontal";
}

/** Nút thao tác trên một hộ dân – kích thước nhỏ gọn vừa vặn, màu sắc trang nhã */
export default function HouseholdActions({
  household,
  permissions,
  onUpdateStep,
  onApprove,
  onReject,
  onOpenDetail,
  layout = "horizontal",
}: HouseholdActionsProps) {
  const current = getCurrentStep(household);
  const definition = current ? getStepDefinition(current) : undefined;
  const { proposal } = household;

  const confirmApprove = () => {
    if (!proposal) return;
    const step = getStepDefinition(proposal.step);
    Modal.confirm({
      title: `Duyệt bước ${proposal.step} cho hộ ${household.ownerName}?`,
      icon: <CheckOutlined className="text-emerald-600" />,
      content: (
        <Flex vertical gap={4} className="pt-1 text-[13px] text-slate-600">
          <span>Bước: <strong>{step?.title}</strong></span>
          <span>Số văn bản: <strong>{proposal.documentNo}</strong></span>
          {proposal.fileName && <span>Biểu mẫu: {proposal.fileName}</span>}
          <span>Đề xuất bởi {proposal.proposedBy} ngày {formatDateVi(proposal.proposedAt)}</span>
          {proposal.note && <span className="italic">“{proposal.note}”</span>}
        </Flex>
      ),
      okText: "Duyệt",
      cancelText: "Xem lại",
      onOk: () => onApprove(household),
    });
  };

  // 1. Lãnh đạo duyệt hoặc trả lại hồ sơ
  if (proposal && permissions.canApprove) {
    return (
      <div className={cn("inline-flex items-center gap-1", layout === "vertical" && "flex-col")}>
        <button
          type="button"
          onClick={confirmApprove}
          className="inline-flex items-center gap-1 h-7 px-2 rounded text-[11px] font-medium bg-[#007A78] text-white hover:bg-[#006361] transition-colors cursor-pointer"
        >
          <CheckOutlined className="text-[10px]" />
          Duyệt B{proposal.step}
        </button>
        <button
          type="button"
          onClick={() => onReject(household)}
          className="inline-flex items-center gap-0.5 h-7 px-1.5 rounded text-[11px] font-medium border border-rose-200 text-rose-600 bg-white hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <CloseOutlined className="text-[9px]" />
          Trả lại
        </button>
      </div>
    );
  }

  // 2. Đang chờ lãnh đạo duyệt (đối với chuyên viên)
  if (proposal) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-violet-700 font-medium">
        <ClockCircleOutlined className="text-[10px]" />
        Chờ duyệt B{proposal.step}
      </span>
    );
  }

  // 3. Có bước cần cập nhật hoặc gửi đề xuất duyệt
  if (current && permissions.canEdit) {
    return (
      <button
        type="button"
        onClick={() => onUpdateStep(household)}
        className={cn(
          "inline-flex items-center justify-center gap-1 h-7 px-2.5 rounded text-[11px] font-medium transition-colors cursor-pointer",
          household.rejection
            ? "bg-rose-600 text-white hover:bg-rose-700"
            : "bg-[#007A78] text-white hover:bg-[#006361]",
        )}
      >
        {definition?.requiresApproval ? (
          <>
            <SendOutlined className="text-[10px]" />
            Đề xuất B{current}
          </>
        ) : (
          <>
            <EditOutlined className="text-[10px]" />
            Cập nhật B{current}
          </>
        )}
      </button>
    );
  }

  // 4. Đã hoàn tất cả 16 bước
  if (!current) {
    return <span className="text-[11px] font-medium text-emerald-700">Đã bàn giao đất</span>;
  }

  // 5. Nút mở chi tiết (khi chỉ có quyền xem)
  if (onOpenDetail) {
    return (
      <button
        type="button"
        onClick={() => onOpenDetail(household)}
        className="text-[11.5px] font-medium text-slate-500 hover:text-[#007A78] hover:underline cursor-pointer"
      >
        Chi tiết
      </button>
    );
  }

  return <Text className="text-[11px] text-slate-400">Đang thực hiện</Text>;
}
