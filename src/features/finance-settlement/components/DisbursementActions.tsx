"use client";

import { CheckCircleOutlined, CheckOutlined, CloseOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Flex, Modal, Text } from "@/components/ui";
import type { Disbursement, FinanceRolePermissions } from "../types/finance.types";
import { formatVndBillions, getContractUsagePercent } from "../utils/finance-rules";
import type { Contract, FinanceProject } from "../types/finance.types";

interface DisbursementActionsProps {
  disbursement: Disbursement;
  rolePermissions: FinanceRolePermissions;
  project?: FinanceProject;
  contract?: Contract;
  onApprove: (id: string) => Promise<boolean>;
  onReject: (disbursement: Disbursement) => void;
  onEdit: (disbursement: Disbursement) => void;
  /** Bảng dùng bố cục ngang gọn, ngăn chi tiết dùng nút to hơn */
  size?: "compact" | "comfortable";
}

/** Nút thao tác theo thẩm quyền – dùng chung cho bảng và ngăn chi tiết */
export default function DisbursementActions({
  disbursement,
  rolePermissions,
  project,
  contract,
  onApprove,
  onReject,
  onEdit,
  size = "compact",
}: DisbursementActionsProps) {
  const scale = size === "compact" ? "compact" : "sm";
  const canApproveThis =
    (disbursement.status === "PENDING_CHIEF" && rolePermissions.canApproveChief) ||
    (disbursement.status === "PENDING_DIRECTOR" && rolePermissions.canApproveDirector);

  const confirmApprove = () => {
    const isChiefLevel = disbursement.status === "PENDING_CHIEF";
    const usage = contract
      ? getContractUsagePercent(contract.disbursed + disbursement.amount, contract.value)
      : undefined;

    Modal.confirm({
      title: isChiefLevel ? `Duyệt cấp 1 hồ sơ ${disbursement.code}?` : `Phê duyệt cấp 2 hồ sơ ${disbursement.code}?`,
      icon: <CheckCircleOutlined className="text-emerald-600" />,
      content: (
        <Flex vertical gap={6} className="pt-1 text-[13px] text-slate-600">
          <span>Dự án: <strong>{project?.name}</strong></span>
          <span>Bên nhận: <strong>{disbursement.payee}</strong></span>
          <span>Số tiền: <strong className="text-[#102A43]">{formatVndBillions(disbursement.amount)}</strong></span>
          {usage?.isWarning && (
            <span className="rounded-md bg-amber-50 px-2 py-1 text-amber-800">
              Sau đợt này hợp đồng {contract?.code} đạt {usage.percent}% giá trị.
            </span>
          )}
          <span className="text-slate-500">
            {isChiefLevel
              ? "Sau khi duyệt, hồ sơ được chuyển Giám đốc phê duyệt cấp 2."
              : "Sau khi phê duyệt, hồ sơ đủ điều kiện chuyển Kho bạc Nhà nước."}
          </span>
        </Flex>
      ),
      okText: isChiefLevel ? "Duyệt cấp 1" : "Phê duyệt",
      cancelText: "Xem lại",
      onOk: () => onApprove(disbursement.id),
    });
  };

  if (canApproveThis) {
    const isChiefLevel = disbursement.status === "PENDING_CHIEF";
    return (
      <Flex gap={8} wrap={false} align="center" justify="center" className="whitespace-nowrap">
        <Button
          intent="primary"
          scale={scale}
          icon={isChiefLevel ? <CheckOutlined /> : <CheckCircleOutlined />}
          onClick={confirmApprove}
          className={!isChiefLevel ? "bg-[#007A78] border-[#007A78] text-white" : "bg-amber-600 border-amber-600 text-white"}
        >
          {isChiefLevel ? "Duyệt cấp 1" : "Ký duyệt KBNN"}
        </Button>
        {rolePermissions.canReject && (
          <Button
            intent="outline"
            scale={scale}
            icon={<CloseOutlined />}
            onClick={() => onReject(disbursement)}
            className="!border-rose-200 !text-rose-700 hover:!border-rose-400"
          >
            Trả lại
          </Button>
        )}
      </Flex>
    );
  }

  if (disbursement.status === "REJECTED" && rolePermissions.canCreateDisbursement) {
    return (
      <Button intent="danger" scale={scale} icon={<EditOutlined />} onClick={() => onEdit(disbursement)}>
        Sửa &amp; trình lại
      </Button>
    );
  }

  if (disbursement.status === "APPROVED") {
    return (
      <Text className="whitespace-nowrap text-[13px] font-semibold text-emerald-700">
        <CheckCircleOutlined className="mr-1" /> Đã ký duyệt KBNN
      </Text>
    );
  }

  if (disbursement.status === "PENDING_CHIEF") {
    return (
      <span className="inline-flex items-center text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
        Chờ KTT duyệt C1
      </span>
    );
  }

  if (disbursement.status === "PENDING_DIRECTOR") {
    return (
      <span className="inline-flex items-center text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
        Chờ GĐ ký C2
      </span>
    );
  }

  if (disbursement.status === "REJECTED") {
    return (
      <span className="inline-flex items-center text-xs font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
        Đã trả lại KTV
      </span>
    );
  }

  return <Text className="text-[13px] text-slate-400">Chờ cấp khác</Text>;
}
