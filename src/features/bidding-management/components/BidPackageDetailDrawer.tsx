"use client";

import { useState } from "react";
import {
  AlertOutlined,
  CalendarOutlined,
  CheckCircleFilled,
  CheckOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  DownloadOutlined,
  DownOutlined,
  EditOutlined,
  ExclamationCircleFilled,
  FilePdfOutlined,
  PaperClipOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Flex, Modal, Tag, Text } from "@/components/ui";
import { formatDateVi } from "@/utils/date";
import { StepTrack } from "@/components/workspace";
import { BID_STEPS } from "../constants/bidding-steps";
import type { BiddingController } from "../hooks/useBiddingManagement";
import type { BidPackage } from "../types/bidding.types";
import {
  getBidDeadlineStatus,
  getBidStepDefinition,
  getCompletedBidSteps,
  getContractDeadlineStatus,
  getCurrentBidStep,
} from "../utils/bidding-rules";

interface BidPackageDetailDrawerProps {
  pkg: BidPackage;
  controller: BiddingController;
  onClose: () => void;
  onUpdateStep: (pkg: BidPackage) => void;
  onReject: (pkg: BidPackage) => void;
}

const formatPrice = (value?: number) =>
  value === undefined ? "—" : `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 }).format(value)} tỷ`;

const TRACK_STEPS = BID_STEPS.map((step) => ({ number: step.number, label: step.label }));

/** Tạo tệp PDF hợp lệ để người dùng tải về máy có thể mở xem trực tiếp */
function downloadBiddingPdf(fileName: string, title: string, details: string[]) {
  const contentLines = [
    "CONG HOA XA HOI CHU NGHIA VIET NAM",
    "Doc lap - Tu do - Hanh phuc",
    "----------------------------------------",
    "BAN QUAN LY DU AN DAU TU XAY DUNG KHU VUC HA TIEN",
    "",
    title.toUpperCase(),
    "",
    ...details,
    "",
    "Can cu: Luat Dau thau so 22/2023/QH15, Nghi dinh so 24/2024/ND-CP.",
    "Van ban dien tu ky so xac thuc boi Ban QLDA.",
  ];

  const streamLines = [
    "BT",
    "/F1 12 Tf",
    "50 780 Td",
    ...contentLines.flatMap((line, idx) => {
      const isHeader = idx < 6;
      const clean = line.replace(/[\\()]/g, "");
      return [
        isHeader ? "/F1 12 Tf" : "/F1 10 Tf",
        `(${clean}) Tj`,
        "0 -18 Td",
      ];
    }),
    "ET",
  ].join("\n");

  const streamLength = streamLines.length;
  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length ${streamLength} >>
stream
${streamLines}
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000224 00000 n 
0000000305 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${400 + streamLength}
%%EOF`;

  const blob = new Blob([pdfString], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function BidPackageDetailDrawer({
  pkg,
  controller,
  onClose,
  onUpdateStep,
  onReject,
}: BidPackageDetailDrawerProps) {
  const [expandedStepNumber, setExpandedStepNumber] = useState<number | null>(null);
  const { data, permissions, today } = controller;
  const project = data.projects.find((p) => p.id === pkg.projectId);
  const current = getCurrentBidStep(pkg);
  const definition = current ? getBidStepDefinition(current) : undefined;
  const completedSteps = getCompletedBidSteps(pkg);
  const { submission } = pkg;

  const bidDeadline = getBidDeadlineStatus(pkg, today);
  const contractDeadline = getContractDeadlineStatus(pkg, today);
  const deadline = bidDeadline.state !== "NONE" ? bidDeadline : contractDeadline;
  const deadlineLabel = bidDeadline.state !== "NONE" ? "Hạn nộp HSDT" : "Hạn ký hợp đồng";

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
      onOk: async () => {
        await controller.approveSubmission(pkg.id);
        onClose();
      },
    });
  };

  const facts = [
    { label: "Dự án", value: project ? `${project.code} · ${project.name}` : "—", wide: true },
    { label: "Hình thức lựa chọn", value: pkg.method },
    { label: "Loại gói thầu", value: pkg.type },
    { label: "Giá gói thầu (dự toán)", value: formatPrice(pkg.estimatedPrice) },
    {
      label: "Giá trúng thầu",
      value: pkg.winningPrice !== undefined ? formatPrice(pkg.winningPrice) : "Chưa có kết quả",
    },
    {
      label: "Nhà thầu trúng thầu",
      value: pkg.winner ?? "Chưa xác định",
      wide: true,
    },
  ];

  return (
    <Drawer
      open
      width="min(680px, 100vw)"
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-2 px-1 py-1">
          {submission && permissions.canApprove && (
            <>
              <Button
                intent="primary"
                scale="sm"
                icon={<CheckOutlined />}
                onClick={confirmApprove}
              >
                Duyệt bước {submission.step}
              </Button>
              <Button
                intent="outline"
                scale="sm"
                icon={<CloseOutlined />}
                onClick={() => {
                  onClose();
                  onReject(pkg);
                }}
                className="!border-rose-200 !text-rose-700 hover:!border-rose-400"
              >
                Trả lại
              </Button>
            </>
          )}
          {current && permissions.canEdit && !submission && (
            <Button
              intent={pkg.rejection ? "danger" : "primary"}
              scale="sm"
              icon={definition?.requiresApproval ? <SendOutlined /> : <EditOutlined />}
              onClick={() => {
                onClose();
                onUpdateStep(pkg);
              }}
            >
              {definition?.requiresApproval
                ? pkg.rejection
                  ? `Trình duyệt lại bước ${current}`
                  : `Trình duyệt bước ${current}`
                : pkg.rejection
                  ? `Cập nhật lại bước ${current}`
                  : `Cập nhật bước ${current}`}
            </Button>
          )}
          <Button intent="default" scale="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      }
      title={
        <span>
          <span className="flex items-center gap-2">
            <span className="text-base font-bold text-[#102A43]">{pkg.code}</span>
            <Tag intent="subtle" scale="md" className="m-0 font-semibold">{pkg.type}</Tag>
            {current === null && <Tag intent="success" scale="md">Đã ký HĐ</Tag>}
            {submission && <Tag intent="warning" scale="md">Chờ duyệt bước {submission.step}</Tag>}
          </span>
          <span className="block text-xs font-normal text-slate-500 mt-0.5">{pkg.name}</span>
        </span>
      }
    >
      {/* Cảnh báo bị trả lại */}
      {pkg.rejection && !pkg.submission && (
        <aside className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5">
          <ExclamationCircleFilled className="mt-0.5 text-rose-500 shrink-0" />
          <span>
            <Text strong className="block text-[13px] text-rose-900">
              Lý do trả lại bước {pkg.rejection.step} (bởi {pkg.rejection.by} ngày {formatDateVi(pkg.rejection.at)})
            </Text>
            <Text className="block text-[13px] text-rose-800 mt-0.5">{pkg.rejection.reason}</Text>
          </span>
        </aside>
      )}

      {/* Cảnh báo mốc thời gian */}
      {deadline.state !== "NONE" && (deadline.state === "WARNING" || deadline.state === "DANGER" || deadline.state === "PASSED") && (
        <aside
          className={`mb-4 flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-[13px] font-medium ${
            deadline.state === "PASSED" || deadline.state === "DANGER"
              ? "border border-rose-200 bg-rose-50 text-rose-800"
              : "border border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          <AlertOutlined className="shrink-0" />
          <span>
            {deadline.state === "PASSED"
              ? `${deadlineLabel} đã quá hạn ${Math.abs(deadline.daysLeft ?? 0)} ngày (${formatDateVi(deadline.date!)}).`
              : `Còn ${deadline.daysLeft} ngày đến ${deadlineLabel.toLowerCase()} (${formatDateVi(deadline.date!)}).`}
          </span>
        </aside>
      )}

      {/* Thông tin chính của gói thầu */}
      <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        {facts.map((fact) => (
          <div key={fact.label} className={fact.wide ? "col-span-2" : undefined}>
            <dt className="text-xs text-slate-500 font-medium">{fact.label}</dt>
            <dd className="m-0 text-[13px] font-semibold text-slate-800 mt-0.5">{fact.value}</dd>
          </div>
        ))}
        {pkg.winningPrice !== undefined && pkg.estimatedPrice > pkg.winningPrice && (
          <div className="col-span-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Tiết kiệm qua đấu thầu</span>
            <span className="font-bold text-emerald-700 text-[13px]">
              {formatPrice(pkg.estimatedPrice - pkg.winningPrice)} ({Math.round(((pkg.estimatedPrice - pkg.winningPrice) / pkg.estimatedPrice) * 100)}%)
            </span>
          </div>
        )}
      </dl>

      {/* Tờ trình đang chờ duyệt (nếu có) */}
      {submission && (
        <section className="mt-4 rounded-xl border border-violet-200 bg-violet-50/60 p-4">
          <Flex align="center" justify="space-between" className="mb-2">
            <Text className="text-sm font-bold text-violet-900">
              Tờ trình bước {submission.step}: {getBidStepDefinition(submission.step)?.title}
            </Text>
            <Tag intent="warning" scale="sm">Chờ phê duyệt</Tag>
          </Flex>
          <div className="grid grid-cols-2 gap-2 text-xs text-violet-900">
            <div>
              <span className="text-violet-600 block">Số tờ trình:</span>
              <strong className="text-[13px]">{submission.documentNo}</strong>
            </div>
            <div>
              <span className="text-violet-600 block">Người trình:</span>
              <strong className="text-[13px]">{submission.submittedBy} ({formatDateVi(submission.submittedAt)})</strong>
            </div>
            {submission.winner && (
              <div className="col-span-2 pt-1 border-t border-violet-200/60 flex items-center justify-between">
                <span>Nhà thầu đề xuất trúng: <strong>{submission.winner}</strong></span>
                {submission.winningPrice !== undefined && (
                  <span>Giá đề xuất: <strong className="text-emerald-800">{formatPrice(submission.winningPrice)}</strong></span>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Tiến độ 9 bước */}
      <section className="mt-4 rounded-xl border border-slate-200 p-4">
        <Flex align="center" justify="space-between" className="mb-2.5">
          <div>
            <Text className="block text-sm font-bold text-[#102A43]">
              {current ? `Bước ${current}: ${getBidStepDefinition(current)?.title}` : "Đã hoàn thành 9 bước lựa chọn nhà thầu"}
            </Text>
            <Text className="block text-xs text-slate-500">
              Tiến độ: {completedSteps.length}/9 bước hoàn thành
            </Text>
          </div>
        </Flex>

        <div className="mb-4">
          <StepTrack
            steps={TRACK_STEPS}
            completed={completedSteps}
            current={current}
            currentTone={pkg.rejection && !pkg.submission ? "danger" : "normal"}
            compact
            ariaLabel={`Tiến độ 9 bước gói thầu ${pkg.code}`}
            onStepClick={(stepNum) => setExpandedStepNumber((prev) => (prev === stepNum ? null : stepNum))}
          />
        </div>

        {/* Lịch sử 9 bước chi tiết - Bấm vào bước nào thì mở rộng dữ liệu & tệp đính kèm ngay bên dưới bước đó */}
        <div className="space-y-2.5">
          {BID_STEPS.map((step) => {
            const record = pkg.records.find((item) => item.step === step.number);
            const isCurrent = step.number === current;
            const isPending = isCurrent && Boolean(pkg.submission);
            const isExpanded = expandedStepNumber === step.number;

            return (
              <div
                key={step.number}
                onClick={() => setExpandedStepNumber((prev) => (prev === step.number ? null : step.number))}
                className={`rounded-xl border p-3 text-xs transition-all cursor-pointer group hover:shadow-xs ${
                  record
                    ? isExpanded
                      ? "border-emerald-400 bg-emerald-50/30 shadow-2xs"
                      : "border-emerald-200 bg-white hover:border-emerald-300"
                    : isPending
                    ? isExpanded
                      ? "border-violet-400 bg-violet-50 shadow-2xs"
                      : "border-violet-300 bg-violet-50/60 hover:border-violet-400"
                    : isCurrent
                    ? isExpanded
                      ? "border-sky-400 bg-sky-50 shadow-2xs"
                      : "border-sky-300 bg-sky-50/70 hover:border-sky-400"
                    : isExpanded
                    ? "border-slate-300 bg-white shadow-2xs"
                    : "border-slate-200/80 bg-slate-50/50 opacity-80 hover:opacity-100 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0 text-base">
                    {record ? (
                      <CheckCircleFilled className="text-emerald-600" />
                    ) : isPending ? (
                      <ClockCircleOutlined className="text-violet-600" />
                    ) : (
                      <ClockCircleOutlined className={isCurrent ? "text-sky-600" : "text-slate-300"} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`font-bold text-[13px] ${record || isCurrent ? "text-slate-900 group-hover:text-teal-800" : "text-slate-500"}`}>
                        {step.number}. {step.title}
                      </span>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {record && (
                          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Đã xong
                          </span>
                        )}
                        {isPending && (
                          <span className="text-[11px] font-semibold text-violet-800 bg-violet-100 border border-violet-200 px-2 py-0.5 rounded-full">
                            Chờ phê duyệt
                          </span>
                        )}
                        {isCurrent && !isPending && (
                          <span className="text-[11px] font-semibold text-sky-800 bg-sky-100 border border-sky-200 px-2 py-0.5 rounded-full">
                            Đang làm
                          </span>
                        )}
                        {!record && !isCurrent && (
                          <span className="text-[10.5px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            Chưa tới
                          </span>
                        )}
                        <DownOutlined
                          className={`text-[10px] text-slate-400 transition-transform ml-1 ${
                            isExpanded ? "rotate-180 text-teal-700 font-bold" : "group-hover:text-teal-700"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="mt-1 text-slate-600 text-xs">
                      {record ? (
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-700">
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
                            <CalendarOutlined className="text-emerald-700" />
                            Hoàn thành ngày {formatDateVi(record.completedAt)}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span>
                            Số văn bản: <strong className="font-mono text-slate-800">{record.documentNo}</strong>
                          </span>
                          {record.approvedBy && (
                            <>
                              <span className="text-slate-300">·</span>
                              <span>Duyệt: <strong className="text-slate-800">{record.approvedBy}</strong></span>
                            </>
                          )}
                          {!isExpanded && record.fileName && (
                            <span className="text-[11px] text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200/80 font-medium ml-1">
                              📎 1 tệp đính kèm
                            </span>
                          )}
                        </div>
                      ) : isCurrent ? (
                        pkg.submission ? (
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-violet-900 font-medium">
                            <span className="inline-flex items-center gap-1 font-bold">
                              <CalendarOutlined className="text-violet-700" />
                              Đã nộp tờ trình ngày {formatDateVi(pkg.submission.submittedAt)}
                            </span>
                            <span className="text-violet-300">·</span>
                            <span>Số: <strong className="font-mono">{pkg.submission.documentNo}</strong></span>
                            <span className="text-violet-300">·</span>
                            <span>Người trình: <strong>{pkg.submission.submittedBy}</strong></span>
                            {!isExpanded && pkg.submission.fileName && (
                              <span className="text-[11px] text-violet-700 bg-violet-100 px-1.5 py-0.2 rounded border border-violet-200/80 font-medium ml-1">
                                📎 Tờ trình đính kèm
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-slate-600">
                            Đầu ra dự kiến: <strong>{step.output}</strong> ({step.duration})
                          </div>
                        )
                      ) : (
                        <div className="text-slate-500">
                          Đầu ra: {step.output} · Thời gian: {step.duration}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Phần nội dung mở rộng bên dưới bước khi được click */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-200/80 pl-7 space-y-2.5">
                    {record ? (
                      <div className="rounded-lg border border-slate-200 bg-slate-50/90 p-3 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-lg">
                              <FilePdfOutlined />
                            </span>
                            <div className="min-w-0">
                              <div className="font-mono text-xs font-bold text-slate-900 truncate max-w-[260px] sm:max-w-[340px]">
                                {record.fileName || `Ho_so_buoc_${step.number}_${pkg.code}.pdf`}
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                <span>{record.fileSize || "1.45 MB"}</span>
                                <span>·</span>
                                <span>Tài liệu PDF điện tử</span>
                                <span>·</span>
                                <span className="text-emerald-700 font-medium flex items-center gap-1">
                                  <SafetyCertificateOutlined /> Đã ký số
                                </span>
                              </div>
                            </div>
                          </div>

                          <Button
                            intent="primary"
                            scale="xs"
                            icon={<DownloadOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadBiddingPdf(
                                record.fileName || `Ho_so_buoc_${step.number}_${pkg.code}.pdf`,
                                step.title,
                                [
                                  `So van ban: ${record.documentNo}`,
                                  `Ngay hoan thanh: ${formatDateVi(record.completedAt)}`,
                                  `Goi thau: ${pkg.code} - ${pkg.name}`,
                                  `Du an: ${project?.name || pkg.projectId}`,
                                  `Nguoi lap: ${record.by}`,
                                  record.approvedBy ? `Nguoi duyet: ${record.approvedBy}` : "",
                                ].filter(Boolean)
                              );
                            }}
                            className="!bg-[#007A78] !border-[#007A78] hover:!bg-[#006361] text-white font-medium text-xs shrink-0 shadow-2xs"
                          >
                            Tải về máy
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-[11.5px] text-slate-600">
                          <div>
                            <span className="text-slate-400">Đầu ra quy định:</span> <strong>{step.output}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400">Thời gian quy định:</span> <strong>{step.duration}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400">Cán bộ thực hiện:</span> <strong>{record.by}</strong>
                          </div>
                          {record.approvedBy && (
                            <div>
                              <span className="text-slate-400">Cấp phê duyệt:</span> <strong>{record.approvedBy}</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : isPending ? (
                      <div className="rounded-lg border border-violet-200 bg-violet-50/80 p-3 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-lg">
                              <FilePdfOutlined />
                            </span>
                            <div className="min-w-0">
                              <div className="font-mono text-xs font-bold text-violet-950 truncate max-w-[260px] sm:max-w-[340px]">
                                {pkg.submission?.fileName || "To_trinh_phe_duyet.pdf"}
                              </div>
                              <div className="text-[11px] text-violet-700 flex items-center gap-2 mt-0.5">
                                <span>{pkg.submission?.fileSize || "2.85 MB"}</span>
                                <span>·</span>
                                <span>Tờ trình ký số</span>
                                <span>·</span>
                                <span className="font-medium text-violet-800">Chờ phê duyệt</span>
                              </div>
                            </div>
                          </div>

                          <Button
                            intent="primary"
                            scale="xs"
                            icon={<DownloadOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadBiddingPdf(
                                pkg.submission?.fileName || "To_trinh_phe_duyet.pdf",
                                `TỜ TRÌNH ${step.title.toUpperCase()}`,
                                [
                                  `So to trinh: ${pkg.submission?.documentNo || ""}`,
                                  `Ngay trinh: ${pkg.submission ? formatDateVi(pkg.submission.submittedAt) : ""}`,
                                  `Goi thau: ${pkg.code} - ${pkg.name}`,
                                  `Nguoi trinh: ${pkg.submission?.submittedBy || ""}`,
                                  pkg.submission?.winner ? `Nha thau de xuat: ${pkg.submission.winner}` : "",
                                  pkg.submission?.winningPrice ? `Gia de xuat: ${pkg.submission.winningPrice} ty dong` : "",
                                ].filter(Boolean)
                              );
                            }}
                            className="!bg-violet-700 !border-violet-700 hover:!bg-violet-800 text-white font-medium text-xs shrink-0 shadow-2xs"
                          >
                            Tải tờ trình
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-violet-200/60 text-[11.5px] text-violet-900">
                          <div>
                            <span className="text-violet-600">Người trình:</span> <strong>{pkg.submission?.submittedBy}</strong>
                          </div>
                          <div>
                            <span className="text-violet-600">Ngày nộp tờ trình:</span> <strong>{pkg.submission && formatDateVi(pkg.submission.submittedAt)}</strong>
                          </div>
                          {pkg.submission?.winner && (
                            <div>
                              <span className="text-violet-600">Nhà thầu đề xuất:</span> <strong>{pkg.submission.winner}</strong>
                            </div>
                          )}
                          {pkg.submission?.winningPrice !== undefined && (
                            <div>
                              <span className="text-violet-600">Giá đề xuất:</span> <strong>{formatPrice(pkg.submission.winningPrice)}</strong>
                            </div>
                          )}
                        </div>

                        {permissions.canApprove && (
                          <div className="pt-2 flex items-center gap-2 border-t border-violet-200/60">
                            <Button
                              scale="xs"
                              intent="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmApprove();
                              }}
                              className="!bg-emerald-600 !border-emerald-600 hover:!bg-emerald-700 text-white font-medium"
                            >
                              Phê duyệt bước {step.number}
                            </Button>
                            <Button
                              scale="xs"
                              intent="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                onReject(pkg);
                              }}
                              className="!border-rose-300 !text-rose-700 hover:!bg-rose-50"
                            >
                              Trả lại tờ trình
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : isCurrent ? (
                      <div className="rounded-lg border border-sky-200 bg-sky-50/70 p-3 space-y-2 text-[11.5px] text-slate-700">
                        <div>
                          <span className="font-semibold text-slate-900">Đầu ra cần có:</span> {step.output}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900">Thời gian quy định:</span> {step.duration}
                        </div>
                        {permissions.canEdit && (
                          <div className="pt-2">
                            <Button
                              scale="xs"
                              intent="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateStep(pkg);
                              }}
                              className="!bg-[#007A78] !border-[#007A78] hover:!bg-[#006361] text-white font-medium"
                            >
                              Cập nhật & Đính kèm tài liệu bước {step.number}
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-[11.5px] text-slate-500 space-y-1">
                        <div><span className="font-semibold text-slate-600">Đầu ra quy định:</span> {step.output}</div>
                        <div><span className="font-semibold text-slate-600">Thời gian quy định:</span> {step.duration}</div>
                        <div className="italic text-slate-400">Bước này chưa tới lượt thực hiện theo quy trình.</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </Drawer>
  );
}
