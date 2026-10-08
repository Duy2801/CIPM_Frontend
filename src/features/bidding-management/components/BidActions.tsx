"use client";

import { CheckOutlined, CloseOutlined, EditOutlined, SendOutlined } from "@ant-design/icons";
import { Button, Flex, Modal, Text } from "@/components/ui";
import { formatDateVi } from "@/utils/date";
import type { BidPackage, BiddingRolePermissions } from "../types/bidding.types";
import { getBidStepDefinition, getCurrentBidStep } from "../utils/bidding-rules";

interface BidActionsProps {
  pkg: BidPackage;
  permissions: BiddingRolePermissions;
  onUpdateStep: (pkg: BidPackage) => void;
  onApprove: (pkg: BidPackage) => Promise<boolean>;
  onReject: (pkg: BidPackage) => void;
  onOpenDetail?: () => void;
}

const formatPrice = (value?: number) =>
  value === undefined ? "—" : `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 }).format(value)} tỷ`;

export default function BidActions({
  pkg,
  permissions,
  onUpdateStep,
  onApprove,
  onReject,
  onOpenDetail,
}: BidActionsProps) {
  const current = getCurrentBidStep(pkg);
  const definition = current ? getBidStepDefinition(current) : undefined;
  const { submission } = pkg;

  const confirmApprove = () => {
    if (!submission) return;
    const isResult = submission.step === 8;
    Modal.confirm({
      title: isResult ? `Phê duyệt kết quả lựa chọn nhà thầu ${pkg.code}?` : `Phê duyệt KHLCNT gói ${pkg.code}?`,
      icon: <CheckOutlined className="text-emerald-600" />,
      content: (
        <Flex vertical gap={4} className="pt-1 text-[13px] text-slate-600">
          <span>Gói thầu: <strong>{pkg.name}</strong></span>
          <span>Tờ trình số {submission.documentNo} · {submission.submittedBy} · {formatDateVi(submission.submittedAt)}</span>
          <span>Giá gói thầu: <strong>{formatPrice(pkg.estimatedPrice)}</strong></span>
          {isResult && (
            <>
              <span>Nhà thầu trúng thầu: <strong>{submission.winner}</strong></span>
              <span>
                Giá trúng thầu: <strong>{formatPrice(submission.winningPrice)}</strong>
                {submission.winningPrice !== undefined && (
                  <> (tiết kiệm {formatPrice(pkg.estimatedPrice - submission.winningPrice)})</>
                )}
              </span>
            </>
          )}
        </Flex>
      ),
      okText: "Phê duyệt",
      cancelText: "Xem lại",
      onOk: () => onApprove(pkg),
    });
  };

  if (submission && permissions.canApprove) {
    return (
      <Flex vertical gap={4} className="w-full">
        <Button intent="primary" scale="sm" icon={<CheckOutlined />} onClick={confirmApprove} className="w-full !px-2 text-xs font-semibold h-7.5 justify-center whitespace-nowrap">
          Duyệt bước {submission.step}
        </Button>
        <Button
          intent="outline"
          scale="sm"
          icon={<CloseOutlined />}
          onClick={() => onReject(pkg)}
          className="w-full !px-2 !border-rose-200 !text-rose-700 hover:!border-rose-400 text-xs h-7 justify-center whitespace-nowrap"
        >
          Trả lại
        </Button>
      </Flex>
    );
  }

  if (submission) {
    return <Text className="text-xs text-violet-700 font-semibold block leading-snug">Chờ duyệt bước {submission.step}</Text>;
  }

  if (current && permissions.canEdit) {
    const isRecheck = Boolean(pkg.rejection && !pkg.submission);
    return (
      <Button
        intent={isRecheck ? "danger" : "primary"}
        scale="sm"
        icon={definition?.requiresApproval ? <SendOutlined /> : <EditOutlined />}
        onClick={() => onUpdateStep(pkg)}
        className="w-full !px-2 text-xs font-semibold justify-center h-8 whitespace-nowrap"
      >
        {definition?.requiresApproval
          ? isRecheck
            ? `Trình duyệt lại bước ${current}`
            : `Trình duyệt bước ${current}`
          : isRecheck
            ? `Cập nhật lại bước ${current}`
            : `Cập nhật bước ${current}`}
      </Button>
    );
  }

  if (!current) return <Text className="text-xs font-medium text-emerald-700">Đã ký HĐ</Text>;

  if (onOpenDetail) {
    return (
      <Button
        intent="textLink"
        scale="sm"
        onClick={onOpenDetail}
        className="text-xs font-semibold text-[#0F4C81]"
      >
        Xem chi tiết
      </Button>
    );
  }

  return <Text className="text-xs text-slate-400">Đang thực hiện</Text>;
}
