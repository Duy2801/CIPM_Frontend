"use client";

import { useMemo, useState } from "react";
import {
  CheckCircleFilled,
  ClockCircleOutlined,
  DownloadOutlined,
  EditOutlined,
  EnvironmentOutlined,
  ExclamationCircleFilled,
  FileDoneOutlined,
  FileTextOutlined,
  MinusCircleOutlined,
  PaperClipOutlined,
  PlusOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Flex, Form, Input, Modal, StandardFileUpload, Text } from "@/components/ui";
import { formatMoneyString } from "@/utils/format-money";
import { formatDateVi, todayIso } from "@/utils/date";
import { cn } from "@/utils/cn";
import { GPMB_STEPS, LAND_TYPE_LABELS } from "../constants/gpmb-steps";
import type { SiteClearanceController } from "../hooks/useSiteClearance";
import type { Household, StepRecord } from "../types/gpmb.types";
import { getCurrentStep, getLegalStatus, isStepApplicable } from "../utils/gpmb-rules";
import { downloadGpmbDocument } from "../utils/gpmb-download";
import HouseholdActions from "./HouseholdActions";
import { LegalDeadlineTag, SpecialStatusTag } from "./HouseholdBadges";

interface HouseholdDetailDrawerProps {
  household: Household;
  controller: SiteClearanceController;
  initialStep?: number;
  onClose: () => void;
  onUpdateStep: (household: Household) => void;
  onReject: (household: Household) => void;
}

export default function HouseholdDetailDrawer({
  household,
  controller,
  initialStep,
  onClose,
  onUpdateStep,
  onReject,
}: HouseholdDetailDrawerProps) {
  const { permissions, today, data } = controller;
  const current = getCurrentStep(household);
  const project = data.projects.find((item) => item.id === household.projectId);

  // Bước đang được chọn xem chi tiết trong Drawer (mặc định là bước truyền vào, hoặc bước hiện tại, hoặc bước 1)
  const [activeStepNumber, setActiveStepNumber] = useState<number>(() => {
    if (initialStep && initialStep >= 1 && initialStep <= 16) return initialStep;
    return current || 1;
  });

  // State quản lý modal bổ sung / sửa tài liệu cho bước đã xong
  const [editingRecord, setEditingRecord] = useState<StepRecord | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [supplementForm] = Form.useForm<{
    documentNo: string;
    fileName?: string;
    note?: string;
  }>();

  const handleOpenSupplement = (record: StepRecord) => {
    setEditingRecord(record);
    setSelectedFileName(record.fileName || "");
    supplementForm.setFieldsValue({
      documentNo: record.documentNo || "",
      fileName: record.fileName || "",
      note: record.note || "",
    });
  };

  const handleSaveSupplement = async (values: {
    documentNo: string;
    fileName?: string;
    note?: string;
  }) => {
    if (!editingRecord) return;
    setSubmitting(true);
    try {
      await controller.updateStepRecord(household.id, editingRecord.step, {
        documentNo: values.documentNo,
        fileName: values.fileName || undefined,
        note: values.note,
      });
      setEditingRecord(null);
    } finally {
      setSubmitting(false);
    }
  };

  const facts = [
    { label: "Mã hộ", value: household.code },
    { label: "CCCD", value: household.idNumber },
    { label: "Địa chỉ", value: household.address },
    { label: "Diện tích thu hồi", value: `${new Intl.NumberFormat("vi-VN").format(household.areaM2)} m²` },
    { label: "Loại đất", value: LAND_TYPE_LABELS[household.landType] },
    {
      label: "Tiền bồi thường",
      value: `${formatMoneyString(household.compensation)} VNĐ`,
    },
  ];

  // Chi tiết bước đang chọn xem
  const activeStepDef = useMemo(
    () => GPMB_STEPS.find((s) => s.number === activeStepNumber) || GPMB_STEPS[0],
    [activeStepNumber]
  );
  const activeRecord = useMemo(
    () => household.records.find((r) => r.step === activeStepNumber),
    [household.records, activeStepNumber]
  );
  const isCurrentActive = activeStepNumber === current;
  const isApplicableActive = isStepApplicable(activeStepNumber, household);

  const editingStepDef = editingRecord
    ? GPMB_STEPS.find((s) => s.number === editingRecord.step)
    : null;

  return (
    <>
      <Drawer
        open
        width="min(680px, 100vw)"
        onClose={onClose}
        footer={
          <div className="flex items-center justify-start gap-2.5 px-1 py-1">
            <Button intent="outline" scale="sm" onClick={onClose}>
              Đóng
            </Button>
          </div>
        }
        title={
          <span>
            <span className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold text-[#102A43]">{household.ownerName}</span>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {household.code}
              </span>
              <SpecialStatusTag status={household.specialStatus} />
              {current === null && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  Đã hoàn tất 16 bước
                </span>
              )}
            </span>
            <span className="block text-xs font-normal text-slate-500 mt-0.5">
              {project?.name} · {household.address}
            </span>
          </span>
        }
      >
        {/* KHỐI 1: THÔNG TIN HỘ DÂN */}
        <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="text-xs text-slate-500">{fact.label}</dt>
              <dd className="m-0 text-sm font-semibold text-slate-800">{fact.value}</dd>
            </div>
          ))}
        </dl>

        <Flex align="center" gap={8} className="mt-3 px-0.5">
          <Text className="text-xs font-semibold text-slate-600">Tình trạng:</Text>
          <SpecialStatusTag status={household.specialStatus} />
        </Flex>

        {/* KHỐI 2: THANH CHUYỂN BƯỚC NHANH (16 BƯỚC MA TRẬN) */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-800">
              Chọn bước xem chi tiết (1–16)
            </span>
            <span className="text-[11px] text-slate-500">
              Đã xong: <span className="font-bold text-amber-600">{household.records.length}</span>/16 bước
            </span>
          </div>

          <div className="grid grid-cols-8 gap-1.5 pt-1">
            {GPMB_STEPS.map((s) => {
              const rec = household.records.find((r) => r.step === s.number);
              const isCurr = s.number === current;
              const isSel = s.number === activeStepNumber;

              return (
                <button
                  key={s.number}
                  type="button"
                  onClick={() => setActiveStepNumber(s.number)}
                  className={cn(
                    "relative flex h-8 flex-col items-center justify-center rounded-lg border text-xs font-semibold transition-all cursor-pointer",
                    rec && "bg-amber-500 text-white border-amber-500 hover:bg-amber-600",
                    isCurr && !rec && (
                      getLegalStatus(household, today).state === "OVERDUE"
                        ? "bg-rose-50 text-rose-700 border-rose-300 font-bold ring-1 ring-rose-200"
                        : "bg-amber-100 text-amber-900 border-amber-400 font-bold ring-1 ring-amber-300"
                    ),
                    !rec && !isCurr && "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100",
                    isSel && "!ring-2 !ring-[#DC2626] !ring-offset-2 font-bold shadow-xs scale-105"
                  )}
                  title={`Bước ${s.number}: ${s.title}${rec ? " (Đã xong)" : isCurr ? " (Đang làm)" : ""}`}
                >
                  <span>B{s.number}</span>
                  {rec?.fileName && (
                    <span
                      className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-white text-amber-700 shadow-2xs border border-amber-300"
                      title="Có tệp đính kèm"
                    >
                      <PaperClipOutlined className="text-[7.5px]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* KHỐI 3: CHI TIẾT ĐẦY ĐỦ CỦA BƯỚC ĐANG CHỌN */}
        <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-4">
          {/* Tiêu đề bước */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0",
                  activeRecord
                    ? "bg-amber-500 text-white"
                    : isCurrentActive
                    ? "bg-[#DC2626] text-white"
                    : "bg-slate-200 text-slate-600"
                )}
              >
                {activeStepDef.number}
              </span>
              <div>
                <span className="text-sm font-bold text-[#102A43] block">
                  Bước {activeStepDef.number}: {activeStepDef.title}
                </span>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  {activeStepDef.label} {activeStepDef.requiresApproval ? "· Cần lãnh đạo phê duyệt" : "· Tổ Bồi thường thực hiện"}
                </span>
              </div>
            </div>

            {/* Trạng thái bước */}
            <div>
              {activeRecord ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200">
                  <CheckCircleFilled className="text-amber-600 text-xs" /> Đã hoàn thành
                </span>
              ) : isCurrentActive ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
                  <ClockCircleOutlined className="text-blue-600 text-xs" /> Đang thực hiện
                </span>
              ) : !isApplicableActive ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 text-xs font-medium">
                  <MinusCircleOutlined /> Không áp dụng
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-slate-400 bg-slate-50 border border-slate-200">
                  Chưa tới bước này
                </span>
              )}
            </div>
          </div>

          {/* Tiêu chí pháp lý & Biểu mẫu quy định */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50/70 p-3 rounded-lg border border-slate-100">
            <div>
              <span className="text-slate-400 block text-[11px] font-medium">Sản phẩm đầu ra yêu cầu</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">
                {activeStepDef.output}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] font-medium">Thời hạn pháp lý quy định</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">
                {activeStepDef.legalDays
                  ? `${activeStepDef.legalDays} ngày ${activeStepDef.mandatory ? "(bắt buộc)" : ""}`
                  : "Không quy định thời hạn"}
              </span>
            </div>
            {activeStepDef.forms && (
              <div className="sm:col-span-2 pt-1 border-t border-slate-200/60">
                <span className="text-slate-400 block text-[11px] font-medium">Biểu mẫu bắt buộc theo quy định</span>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 inline-block text-xs">
                    📄 {activeStepDef.forms}
                  </span>
                  <Button
                    scale="xs"
                    intent="secondary"
                    icon={<DownloadOutlined />}
                    onClick={() => {
                      const forms = activeStepDef.forms!;
                      downloadGpmbDocument({
                        fileName: `Bieu_mau_buoc_${activeStepDef.number}_${forms.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
                        title: `BIỂU MẪU QUY ĐỊNH BƯỚC ${activeStepDef.number}: ${forms}`,
                        details: [
                          `Tên bước: ${activeStepDef.title}`,
                          `Biểu mẫu áp dụng: ${forms}`,
                          `Sản phẩm đầu ra yêu cầu: ${activeStepDef.output}`,
                          `Thời hạn pháp lý: ${activeStepDef.legalDays ? `${activeStepDef.legalDays} ngày ${activeStepDef.mandatory ? "(bắt buộc)" : ""}` : "Không quy định"}`,
                          `Căn cứ pháp lý: Luật Đất đai 2024, Nghị định 88/2024/NĐ-CP.`,
                          `Áp dụng cho hộ dân: ${household.ownerName} (${household.code})`,
                          `Dự án: ${project?.name || "Dự án GPMB"}`,
                        ],
                      });
                    }}
                    className="!bg-white !border-slate-300 !text-slate-700 hover:!border-[#DC2626] hover:!text-[#DC2626] text-xs font-semibold shadow-2xs"
                  >
                    Tải biểu mẫu
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* NỘI DUNG NẾU BƯỚC ĐÃ HOÀN THÀNH */}
          {activeRecord && (
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Thông tin thực hiện & Hồ sơ lưu trữ
                </span>
                {permissions.canEdit && (
                  <Button
                    scale="xs"
                    intent="secondary"
                    className="!text-[#DC2626] !bg-white hover:!bg-slate-100 font-semibold"
                    onClick={() => handleOpenSupplement(activeRecord)}
                  >
                    {activeRecord.fileName ? "✎ Cập nhật tệp đính kèm" : "+ Bổ sung tệp đính kèm"}
                  </Button>
                )}
              </div>

              <dl className="m-0 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                <div>
                  <dt className="text-slate-500 text-[11px]">Số văn bản / biên bản:</dt>
                  <dd className="m-0 font-mono font-bold text-slate-900 mt-0.5 text-xs">
                    {activeRecord.documentNo}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-[11px]">Ngày hoàn thành:</dt>
                  <dd className="m-0 font-mono font-semibold text-slate-800 mt-0.5">
                    {formatDateVi(activeRecord.completedAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-[11px]">Cán bộ thực hiện:</dt>
                  <dd className="m-0 font-medium text-slate-800 mt-0.5">
                    {activeRecord.by}
                  </dd>
                </div>
                {activeRecord.approvedBy && (
                  <div>
                    <dt className="text-slate-500 text-[11px]">Lãnh đạo phê duyệt:</dt>
                    <dd className="m-0 font-semibold text-violet-800 mt-0.5">
                      {activeRecord.approvedBy}
                    </dd>
                  </div>
                )}
              </dl>

              {/* TỆP ĐÍNH KÈM CỦA BƯỚC */}
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                  Tài liệu đính kèm của bước:
                </span>
                {activeRecord.fileName ? (
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs hover:border-[#DC2626] transition-colors">
                    <div
                      className="flex items-center gap-2 min-w-0 cursor-pointer flex-1"
                      onClick={() =>
                        downloadGpmbDocument({
                          fileName: activeRecord.fileName!,
                          title: `BƯỚC ${activeStepDef.number}: ${activeStepDef.title}`,
                          details: [
                            `Chủ hộ: ${household.ownerName} (${household.code})`,
                            `Số CCCD: ${household.idNumber || "—"}`,
                            `Địa chỉ: ${household.address}`,
                            `Số văn bản: ${activeRecord.documentNo}`,
                            `Ngày hoàn thành: ${formatDateVi(activeRecord.completedAt)}`,
                            `Cán bộ thực hiện: ${activeRecord.by}`,
                            activeRecord.approvedBy ? `Lãnh đạo duyệt: ${activeRecord.approvedBy}` : "",
                            `Dự án: ${project?.name || "Dự án GPMB"}`,
                          ].filter(Boolean),
                        })
                      }
                      title="Bấm để tải về tài liệu này"
                    >
                      <span className="w-8 h-8 rounded-lg bg-slate-100 text-[#DC2626] flex items-center justify-center shrink-0">
                        <FileTextOutlined className="text-base" />
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs font-mono font-bold text-slate-800 truncate block hover:text-[#DC2626] hover:underline">
                          {activeRecord.fileName}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Đã lưu trữ hồ sơ GPMB · Bấm để tải về
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        scale="xs"
                        intent="primary"
                        icon={<DownloadOutlined />}
                        onClick={() =>
                          downloadGpmbDocument({
                            fileName: activeRecord.fileName!,
                            title: `BƯỚC ${activeStepDef.number}: ${activeStepDef.title}`,
                            details: [
                              `Chủ hộ: ${household.ownerName} (${household.code})`,
                              `Số CCCD: ${household.idNumber || "—"}`,
                              `Địa chỉ: ${household.address}`,
                              `Số văn bản: ${activeRecord.documentNo}`,
                              `Ngày hoàn thành: ${formatDateVi(activeRecord.completedAt)}`,
                              `Cán bộ thực hiện: ${activeRecord.by}`,
                              activeRecord.approvedBy ? `Lãnh đạo duyệt: ${activeRecord.approvedBy}` : "",
                              `Dự án: ${project?.name || "Dự án GPMB"}`,
                            ].filter(Boolean),
                          })
                        }
                        className="!bg-[#DC2626] !border-[#DC2626] hover:!bg-[#B91C1C] text-white font-medium text-xs shadow-2xs"
                      >
                        Tải về
                      </Button>
                      {permissions.canEdit && (
                        <button
                          type="button"
                          onClick={() => handleOpenSupplement(activeRecord)}
                          className="text-xs font-semibold text-slate-500 hover:text-[#DC2626] hover:underline cursor-pointer px-1.5 py-1"
                        >
                          Thay tệp
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 text-xs text-amber-800">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileDoneOutlined className="text-amber-600 shrink-0" />
                      <span className="truncate">Chưa có tệp scan đính kèm</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        scale="xs"
                        intent="secondary"
                        icon={<DownloadOutlined />}
                        onClick={() =>
                          downloadGpmbDocument({
                            fileName: `Trich_luc_buoc_${activeStepDef.number}_${household.code}.pdf`,
                            title: `TRÍCH LỤC HỒ SƠ BƯỚC ${activeStepDef.number}: ${activeStepDef.title}`,
                            details: [
                              `Chủ hộ: ${household.ownerName} (${household.code})`,
                              `Số văn bản: ${activeRecord.documentNo}`,
                              `Ngày hoàn thành: ${formatDateVi(activeRecord.completedAt)}`,
                              `Cán bộ thực hiện: ${activeRecord.by}`,
                              activeRecord.approvedBy ? `Lãnh đạo duyệt: ${activeRecord.approvedBy}` : "",
                              `Dự án: ${project?.name || "Dự án GPMB"}`,
                            ].filter(Boolean),
                          })
                        }
                        className="!bg-white !border-amber-300 text-amber-900 hover:!bg-amber-100 text-xs font-medium shadow-2xs"
                      >
                        Tải trích lục
                      </Button>
                      {permissions.canEdit && (
                        <button
                          type="button"
                          onClick={() => handleOpenSupplement(activeRecord)}
                          className="font-bold text-[#DC2626] hover:underline cursor-pointer ml-1"
                        >
                          + Tải tệp lên
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {activeRecord.note && (
                <div className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-500">Ghi chú:</span> {activeRecord.note}
                </div>
              )}
            </div>
          )}

          {/* NỘI DUNG NẾU LÀ BƯỚC ĐANG LÀM */}
          {isCurrentActive && !activeRecord && (
            <div className="rounded-lg border border-sky-200 bg-sky-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-900">
                  Bước đang trong tiến độ thực hiện
                </span>
                <LegalDeadlineTag status={getLegalStatus(household, today)} />
              </div>
              <div className="text-xs text-slate-600">
                Hộ dân đang ở bước này kể từ ngày:{" "}
                <strong className="text-slate-900 font-mono">{formatDateVi(household.currentStepStartedAt)}</strong>.
              </div>

              {household.rejection && !household.proposal && (
                <div className="rounded-md bg-rose-50 p-2.5 text-xs text-rose-800 border border-rose-200">
                  <ExclamationCircleFilled className="text-rose-500 mr-1" />
                  <strong>Lãnh đạo trả lại:</strong> {household.rejection.reason} ({formatDateVi(household.rejection.at)})
                </div>
              )}

              {household.proposal && (
                <div className="rounded-md bg-violet-50 p-3 text-xs text-violet-800 border border-violet-200">
                  <div>
                    Đã đề xuất ngày {formatDateVi(household.proposal.proposedAt)}, số văn bản {household.proposal.documentNo} – đang chờ duyệt.
                  </div>
                  {household.proposal.fileName && (
                    <div className="mt-2 flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-violet-200 shadow-2xs">
                      <div className="flex items-center gap-1.5 font-mono text-violet-900 font-semibold text-xs truncate">
                        <PaperClipOutlined className="text-violet-600 shrink-0" />
                        <span className="truncate">{household.proposal.fileName}</span>
                      </div>
                      <Button
                        scale="xs"
                        intent="secondary"
                        icon={<DownloadOutlined />}
                        onClick={() =>
                          downloadGpmbDocument({
                            fileName: household.proposal!.fileName!,
                            title: `TỜ TRÌNH ĐỀ XUẤT BƯỚC ${current}: ${household.proposal!.documentNo}`,
                            details: [
                              `Chủ hộ: ${household.ownerName} (${household.code})`,
                              `Số văn bản tờ trình: ${household.proposal!.documentNo}`,
                              `Ngày đề xuất: ${formatDateVi(household.proposal!.proposedAt)}`,
                              `Dự án: ${project?.name || "Dự án GPMB"}`,
                            ],
                          })
                        }
                        className="!text-violet-700 !bg-violet-50 hover:!bg-violet-100 font-medium text-xs shrink-0 shadow-2xs"
                      >
                        Tải về
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex items-center gap-2">
                <HouseholdActions
                  household={household}
                  permissions={permissions}
                  layout="horizontal"
                  onUpdateStep={onUpdateStep}
                  onApprove={(item) => controller.approveProposal(item.id)}
                  onReject={onReject}
                />
              </div>
            </div>
          )}

          {/* NỘI DUNG NẾU LÀ BƯỚC CHƯA TỚI HOẶC BỎ QUA */}
          {!activeRecord && !isCurrentActive && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
              {!isApplicableActive ? (
                <span>Bước này không áp dụng cho hộ dân này theo quy định phân loại đất/tình trạng.</span>
              ) : (
                <span>Bước này chưa tới lượt thực hiện. Hộ dân hiện đang ở Bước {current || 1}.</span>
              )}
            </div>
          )}
        </section>
      </Drawer>

      {/* Modal bổ sung / cập nhật tài liệu cho bước đã xong */}
      {editingRecord && editingStepDef && (
        <Modal
          open={Boolean(editingRecord)}
          title={
            <div className="flex items-center gap-2">
              <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-bold text-white">
                Bước {editingRecord.step}
              </span>
              <span className="font-bold text-[#102A43]">
                Bổ sung tài liệu: {editingStepDef.title}
              </span>
            </div>
          }
          onCancel={() => setEditingRecord(null)}
          footer={[
            <Button
              key="submit"
              intent="primary"
              scale="sm"
              loading={submitting}
              onClick={() => supplementForm.submit()}
            >
              Lưu tài liệu
            </Button>,
            <Button
              key="cancel"
              intent="outline"
              scale="sm"
              onClick={() => setEditingRecord(null)}
            >
              Đóng
            </Button>,
          ]}
        >
          <div className="text-xs text-slate-600 mb-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-400">Hộ dân:</span>{" "}
              <strong className="text-slate-800">{household.ownerName}</strong> ({household.code})
            </div>
            <div className="mt-0.5">
              <span className="text-slate-400">Ngày hoàn thành:</span>{" "}
              <span className="font-mono text-slate-700">{formatDateVi(editingRecord.completedAt)}</span>
            </div>
            {editingStepDef.forms && (
              <div className="mt-0.5">
                <span className="text-slate-400">Biểu mẫu quy định:</span>{" "}
                <span className="font-semibold text-slate-700">{editingStepDef.forms}</span>
              </div>
            )}
          </div>

          <Form
            form={supplementForm}
            layout="vertical"
            onFinish={handleSaveSupplement}
          >
            <Form.Item
              name="documentNo"
              label={<span className="text-xs font-semibold text-slate-700">Số văn bản / biên bản <span className="text-rose-500">*</span></span>}
              rules={[{ required: true, whitespace: true, message: "Vui lòng nhập số văn bản." }]}
              className="mb-3"
            >
              <Input placeholder="Ví dụ: 125/BB-BT hoặc 45/QĐ-UBND" className="h-9 text-xs" />
            </Form.Item>

            <div className="mb-3">
              <StandardFileUpload
                title={`Tệp đính kèm ${editingStepDef.forms ? `(${editingStepDef.forms})` : "(tùy chọn)"}`}
                subTitle="Biên bản scan, quyết định, phiếu khảo sát (PDF, DOCX, ảnh)"
                singleFileName={selectedFileName}
                onSingleFileNameChange={(name) => {
                  supplementForm.setFieldsValue({ fileName: name });
                  setSelectedFileName(name);
                }}
              />
            </div>

            <Form.Item
              name="note"
              label={<span className="text-xs font-semibold text-slate-700">Ghi chú bổ sung (nếu có)</span>}
              className="mb-2"
            >
              <Input.TextArea
                rows={2}
                placeholder="Ghi chú thêm về tệp scan, ngày lưu trữ, người bàn giao..."
                className="resize-none text-xs"
              />
            </Form.Item>
          </Form>
        </Modal>
      )}
    </>
  );
}


