"use client";

import {
  AlertOutlined,
  BankOutlined,
  CheckCircleFilled,
  ExclamationCircleOutlined,
  FieldTimeOutlined,
  FileDoneOutlined,
  FileProtectOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import { Card, Col, Flex, Progress, Row, Text } from "@/components/ui";
import type { DisbursementStatusFilter } from "../types/finance.types";
import { formatVndBillions } from "../utils/finance-rules";

interface FinanceKpiSectionProps {
  year: number;
  planned: number;
  disbursed: number;
  ratio: number;
  pendingChief: number;
  pendingDirector: number;
  rejectedCount?: number;
  contractWarningCount?: number;
  roleCode?: string;
  onFilterClick?: (status: DisbursementStatusFilter) => void;
}

function describeRatio(ratio: number): { text: string; className: string } {
  if (ratio >= 80) return { text: "Đạt tiến độ giải ngân tốt", className: "text-emerald-700" };
  if (ratio >= 50) return { text: "Đang ở mức trung bình", className: "text-amber-700" };
  return { text: "Cần đẩy nhanh tiến độ", className: "text-rose-700" };
}

export default function FinanceKpiSection({
  year,
  planned,
  disbursed,
  ratio,
  pendingChief,
  pendingDirector,
  rejectedCount = 0,
  contractWarningCount = 0,
  roleCode,
  onFilterClick,
}: FinanceKpiSectionProps) {
  const ratioStatus = describeRatio(ratio);
  const pending = pendingChief + pendingDirector;

  // Cấu hình thẻ KPI phù hợp với trọng tâm và phân công thực tế của từng vai trò
  let items: {
    key: string;
    label: string;
    value: string | number;
    note: React.ReactNode;
    icon: React.ReactNode;
    iconClass: string;
    valueClass: string;
    progress?: number;
    onClick?: () => void;
    highlightBorder?: string;
  }[];

  if (roleCode === "ACCOUNTANT") {
    // KẾ TOÁN VIÊN: Tập trung vào hồ sơ bị trả lại cần sửa, đề nghị đã lập chờ duyệt & vốn năm
    items = [
      {
        key: "planned",
        label: `Kế hoạch vốn ${year}`,
        value: formatVndBillions(planned),
        note: <>Đã bao gồm các nguồn giao</>,
        icon: <BankOutlined />,
        iconClass: "bg-slate-100 text-[#102A43]",
        valueClass: "text-[#102A43]",
      },
      {
        key: "disbursed",
        label: "Đã giải ngân được duyệt",
        value: formatVndBillions(disbursed),
        note: <>Đạt <strong>{ratio}%</strong> kế hoạch năm</>,
        progress: Math.min(100, ratio),
        icon: <CheckCircleFilled />,
        iconClass: "bg-emerald-50 text-emerald-700",
        valueClass: "text-emerald-700",
      },
      {
        key: "rejected",
        label: "Hồ sơ bị trả lại (cần sửa)",
        value: rejectedCount,
        note: rejectedCount > 0 ? (
          <span className="font-semibold text-rose-700">Cần bổ sung chứng từ &amp; trình lại</span>
        ) : (
          <span className="text-emerald-700">Không có hồ sơ bị trả lại</span>
        ),
        icon: rejectedCount > 0 ? <AlertOutlined /> : <CheckCircleFilled />,
        iconClass: rejectedCount > 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-700",
        valueClass: rejectedCount > 0 ? "text-rose-600" : "text-emerald-700",
        highlightBorder: rejectedCount > 0 ? "!border-rose-300 bg-rose-50/15" : undefined,
        onClick: rejectedCount > 0 && onFilterClick ? () => onFilterClick("REJECTED") : undefined,
      },
      {
        key: "pending",
        label: "Đề nghị TT đang chờ duyệt",
        value: pending,
        note: (
          <>
            Chờ KTT: <strong>{pendingChief}</strong> · Chờ GĐ: <strong>{pendingDirector}</strong>
          </>
        ),
        icon: <FieldTimeOutlined />,
        iconClass: pending > 0 ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-400",
        valueClass: pending > 0 ? "text-amber-700" : "text-slate-400",
        onClick: onFilterClick ? () => onFilterClick("PENDING_CHIEF") : undefined,
      },
    ];
  } else if (roleCode === "CHIEF_ACCOUNTANT") {
    // KẾ TOÁN TRƯỞNG: Thẩm tra duyệt cấp 1, cảnh báo trần 95% hợp đồng, hồ sơ chờ Giám đốc
    items = [
      {
        key: "pendingChief",
        label: "Chờ KTT thẩm tra duyệt C1",
        value: pendingChief,
        note: pendingChief > 0 ? (
          <span className="font-semibold text-amber-800">Cần kiểm tra chứng từ &amp; chuyển GĐ</span>
        ) : (
          <span className="text-slate-500">Đã hoàn thành thẩm tra cấp 1</span>
        ),
        icon: <FieldTimeOutlined />,
        iconClass: pendingChief > 0 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-400",
        valueClass: pendingChief > 0 ? "text-amber-700" : "text-slate-400",
        highlightBorder: pendingChief > 0 ? "!border-amber-300 bg-amber-50/15" : undefined,
        onClick: pendingChief > 0 && onFilterClick ? () => onFilterClick("PENDING_CHIEF") : undefined,
      },
      {
        key: "contractWarning",
        label: "Cảnh báo trần hợp đồng (≥95%)",
        value: contractWarningCount,
        note: contractWarningCount > 0 ? (
          <span className="font-semibold text-rose-700">Hợp đồng chạm trần, cần thẩm tra kỹ</span>
        ) : (
          <span className="text-emerald-700">Hạn mức hợp đồng an toàn</span>
        ),
        icon: <FileProtectOutlined />,
        iconClass: contractWarningCount > 0 ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700",
        valueClass: contractWarningCount > 0 ? "text-rose-600" : "text-emerald-700",
      },
      {
        key: "pendingDirector",
        label: "Đang chờ Giám đốc ký C2",
        value: pendingDirector,
        note: <>Đã qua KTT thẩm tra xong</>,
        icon: <FileDoneOutlined />,
        iconClass: pendingDirector > 0 ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-400",
        valueClass: pendingDirector > 0 ? "text-blue-700" : "text-slate-400",
        onClick: onFilterClick ? () => onFilterClick("PENDING_DIRECTOR") : undefined,
      },
      {
        key: "ratio",
        label: "Tỷ lệ giải ngân toàn Ban",
        value: `${ratio}%`,
        progress: Math.min(100, ratio),
        note: <span className={ratioStatus.className}>{ratioStatus.text}</span>,
        icon: <RiseOutlined />,
        iconClass: "bg-teal-50 text-[#007A78]",
        valueClass: "text-[#007A78]",
      },
    ];
  } else if (roleCode === "ADMIN") {
    // GIÁM ĐỐC: Phê duyệt cấp 2 (ký KBNN), giám sát tổng vốn và tỷ lệ giải ngân
    items = [
      {
        key: "pendingDirector",
        label: "Chờ Giám đốc ký duyệt C2",
        value: pendingDirector,
        note: pendingDirector > 0 ? (
          <span className="font-semibold text-teal-800">Đã qua KTT thẩm tra, sẵn sàng ký KBNN</span>
        ) : (
          <span className="text-slate-500">Không có hồ sơ chờ ký duyệt</span>
        ),
        icon: <ExclamationCircleOutlined />,
        iconClass: pendingDirector > 0 ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-400",
        valueClass: pendingDirector > 0 ? "text-[#007A78]" : "text-slate-400",
        highlightBorder: pendingDirector > 0 ? "!border-teal-300 bg-teal-50/15" : undefined,
        onClick: pendingDirector > 0 && onFilterClick ? () => onFilterClick("PENDING_DIRECTOR") : undefined,
      },
      {
        key: "ratio",
        label: "Tiến độ giải ngân 2026",
        value: `${ratio}%`,
        progress: Math.min(100, ratio),
        note: <span className={ratioStatus.className}>{ratioStatus.text}</span>,
        icon: <RiseOutlined />,
        iconClass: "bg-teal-50 text-[#007A78]",
        valueClass: "text-[#007A78]",
      },
      {
        key: "disbursed",
        label: "Tổng đã giải ngân KBNN",
        value: formatVndBillions(disbursed),
        note: <>Kế hoạch vốn: <strong>{formatVndBillions(planned)}</strong></>,
        icon: <CheckCircleFilled />,
        iconClass: "bg-emerald-50 text-emerald-700",
        valueClass: "text-emerald-700",
      },
      {
        key: "pendingChief",
        label: "Hồ sơ tại Tổ HC-TH (Cấp 1)",
        value: pendingChief,
        note: <>Kế toán trưởng đang thẩm tra</>,
        icon: <FieldTimeOutlined />,
        iconClass: "bg-slate-100 text-slate-500",
        valueClass: "text-slate-600",
      },
    ];
  } else {
    // CÁC VAI TRÒ KHÁC HOẶC TRA CỨU
    items = [
      {
        key: "planned",
        label: `Kế hoạch vốn ${year}`,
        value: formatVndBillions(planned),
        note: <>Đã gồm điều chỉnh giữa năm</>,
        icon: <BankOutlined />,
        iconClass: "bg-slate-100 text-[#102A43]",
        valueClass: "text-[#102A43]",
      },
      {
        key: "disbursed",
        label: "Đã giải ngân",
        value: formatVndBillions(disbursed),
        note: <>Còn <strong>{formatVndBillions(Math.max(0, planned - disbursed))}</strong> chưa giải ngân</>,
        icon: <CheckCircleFilled />,
        iconClass: "bg-emerald-50 text-emerald-700",
        valueClass: "text-emerald-700",
      },
      {
        key: "ratio",
        label: "Tỷ lệ giải ngân",
        value: `${ratio}%`,
        progress: Math.min(100, ratio),
        note: <span className={ratioStatus.className}>{ratioStatus.text}</span>,
        icon: <RiseOutlined />,
        iconClass: "bg-teal-50 text-[#007A78]",
        valueClass: "text-[#007A78]",
      },
      {
        key: "pending",
        label: "Hồ sơ đang chờ duyệt",
        value: pending,
        note: <>Cấp 1 (KTT): <strong>{pendingChief}</strong> · Cấp 2 (GĐ): <strong>{pendingDirector}</strong></>,
        icon: <FieldTimeOutlined />,
        iconClass: pending > 0 ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-400",
        valueClass: pending > 0 ? "text-amber-700" : "text-slate-400",
      },
    ];
  }

  return (
    <Row gutter={[12, 12]}>
      {items.map((item) => (
        <Col xs={24} sm={12} xl={6} key={item.key}>
          <Card
            surface="flat"
            padding="compact"
            className={`h-full border-slate-200 transition-all rounded-xl ${item.highlightBorder ?? ""} ${
              item.onClick ? "cursor-pointer hover:border-teal-400 hover:shadow-xs" : ""
            }`}
            onClick={item.onClick}
          >
            <div className="flex h-full flex-col justify-between">
              {/* Hàng 1: Tiêu đề và Icon đồng nhất vị trí */}
              <div className="flex items-start justify-between gap-2">
                <Text className="min-h-[34px] flex items-start text-[11px] font-bold uppercase tracking-wider text-slate-500 leading-[17px] min-w-0 flex-1">
                  {item.label}
                </Text>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base ${item.iconClass}`}>
                  {item.icon}
                </span>
              </div>

              {/* Hàng 2: Số liệu nổi bật - căn thẳng hàng ngang trên cả 4 thẻ */}
              <div className="mt-1">
                <Text className={`block text-2xl font-black leading-tight ${item.valueClass}`}>
                  {item.value}
                </Text>
              </div>

              {/* Hàng 3: Khung tiến độ cố định để các thẻ luôn đều nhau */}
              <div className="h-2.5 my-1.5 flex items-center">
                {item.progress !== undefined ? (
                  <Progress
                    percent={item.progress}
                    showInfo={false}
                    size="small"
                    strokeColor="#007A78"
                    className="m-0 w-full"
                    aria-label={`Tỷ lệ giải ngân ${item.value}`}
                  />
                ) : (
                  <div className="w-full h-1" />
                )}
              </div>

              {/* Hàng 4: Chú thích đáy thẻ đồng nhất chiều cao */}
              <div className="min-h-[34px] flex items-start text-xs text-slate-500 leading-[17px]">
                {item.note}
              </div>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
}
