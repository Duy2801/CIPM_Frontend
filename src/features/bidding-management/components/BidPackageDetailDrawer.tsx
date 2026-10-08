"use client";

import {
  AlertOutlined,
  CheckCircleFilled,
  CheckOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  EditOutlined,
  ExclamationCircleFilled,
  FileTextOutlined,
  PaperClipOutlined,
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

export default function BidPackageDetailDrawer({
  pkg,
  controller,
  onClose,
  onUpdateStep,
  onReject,
}: BidPackageDetailDrawerProps) {
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
          />
        </div>

        {/* Lịch sử 9 bước chi tiết */}
        <div className="space-y-2">
          {BID_STEPS.map((step) => {
            const record = pkg.records.find((item) => item.step === step.number);
            const isCurrent = step.number === current;
            return (
              <div
                key={step.number}
                className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-xs transition-colors ${
                  record
                    ? "border-emerald-200 bg-white"
                    : isCurrent
                    ? "border-sky-300 bg-sky-50/70"
                    : "border-slate-100 bg-slate-50/50 opacity-70"
                }`}
              >
                <div className="mt-0.5 shrink-0 text-sm">
                  {record ? (
                    <CheckCircleFilled className="text-emerald-600" />
                  ) : (
                    <ClockCircleOutlined className={isCurrent ? "text-sky-600" : "text-slate-300"} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`font-semibold text-[13px] ${record || isCurrent ? "text-slate-800" : "text-slate-400"}`}>
                      {step.number}. {step.title}
                    </span>
                    {record && (
                      <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Đã xong
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-[11px] font-medium text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded">
                        Đang làm
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-slate-500 text-xs">
                    {record ? (
                      <div className="space-y-1">
                        <div>
                          Hoàn thành ngày <strong>{formatDateVi(record.completedAt)}</strong> · Số văn bản: <strong>{record.documentNo}</strong>
                          {record.approvedBy ? ` · Duyệt: ${record.approvedBy}` : ""}
                        </div>
                        {record.fileName && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-teal-50 border border-teal-200 text-[11px] font-medium text-teal-800">
                            <PaperClipOutlined className="text-teal-600 text-xs" />
                            <span className="font-mono">{record.fileName}</span>
                            {record.fileSize && <span className="text-slate-400">({record.fileSize})</span>}
                          </div>
                        )}
                      </div>
                    ) : isCurrent ? (
                      pkg.submission ? (
                        <div className="space-y-1">
                          <span className="text-violet-700 font-medium">
                            Đã nộp tờ trình ngày {formatDateVi(pkg.submission.submittedAt)} (số {pkg.submission.documentNo}) – Chờ phê duyệt
                          </span>
                          {pkg.submission.fileName && (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-violet-50 border border-violet-200 text-[11px] font-medium text-violet-800">
                              <PaperClipOutlined className="text-violet-600 text-xs" />
                              <span className="font-mono">{pkg.submission.fileName}</span>
                              {pkg.submission.fileSize && <span className="text-slate-400">({pkg.submission.fileSize})</span>}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span>Kết quả đầu ra dự kiến: {step.output}</span>
                      )
                    ) : (
                      <span>Đầu ra: {step.output}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </Drawer>
  );
}
