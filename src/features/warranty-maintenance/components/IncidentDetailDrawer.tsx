"use client";

import {
  AlertOutlined,
  CheckCircleFilled,
  CheckOutlined,
  ClockCircleFilled,
  ExclamationCircleOutlined,
  FileTextOutlined,
  PaperClipOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Flex, Tag, Text } from "@/components/ui";
import { daysBetween, formatDateVi } from "@/utils/date";
import { INCIDENT_STATUS_META, SEVERITY_META } from "../constants/warranty-labels";
import type { WarrantyController } from "../hooks/useWarrantyMaintenance";
import type { Incident } from "../types/warranty.types";
import { isIncidentOverdue } from "../utils/warranty-rules";

interface IncidentDetailDrawerProps {
  incident: Incident;
  controller: WarrantyController;
  onClose: () => void;
  onStartFix: (incident: Incident) => void;
  onAcceptFix: (incident: Incident) => void;
}

export default function IncidentDetailDrawer({
  incident,
  controller,
  onClose,
  onStartFix,
  onAcceptFix,
}: IncidentDetailDrawerProps) {
  const { warranties, today, permissions } = controller;
  const warranty = warranties.find((w) => w.id === incident.warrantyId);
  const overdue = isIncidentOverdue(incident, today);
  const statusMeta = INCIDENT_STATUS_META[incident.status];
  const severityMeta = SEVERITY_META[incident.severity];

  const facts = [
    { label: "Công trình", value: warranty?.workName ?? "—", wide: true },
    { label: "Nhà thầu chịu trách nhiệm", value: warranty?.contractor ?? "—", wide: true },
    { label: "Hợp đồng", value: warranty ? `HĐ ${warranty.contractCode}` : "—" },
    { label: "Vị trí sự cố", value: incident.location },
    { label: "Người báo cáo", value: incident.reportedBy },
    { label: "Ngày phát hiện", value: formatDateVi(incident.foundDate) },
    { label: "Hạn khắc phục", value: formatDateVi(incident.requiredFixDate) },
    { label: "Mức độ", value: severityMeta.label },
  ];

  return (
    <Drawer
      open
      width="min(680px, 100vw)"
      onClose={onClose}
      footer={
        <div className="flex items-center justify-start gap-2.5 px-1 py-1">
          {permissions.canManageIncidents && incident.status === "OPEN" && (
            <Button
              intent="primary"
              scale="sm"
              icon={<PlayCircleOutlined />}
              onClick={() => {
                onClose();
                onStartFix(incident);
              }}
            >
              Bắt đầu sửa
            </Button>
          )}
          {permissions.canManageIncidents && incident.status === "FIXING" && (
            <Button
              intent="primary"
              scale="sm"
              icon={<CheckOutlined />}
              onClick={() => {
                onClose();
                onAcceptFix(incident);
              }}
            >
              Nghiệm thu khắc phục
            </Button>
          )}
          <Button intent="outline" scale="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      }
      title={
        <span>
          <span className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold text-[#102A43]">{incident.code}</span>
            <Tag intent={severityMeta.intent} scale="md" className="m-0 font-medium">
              {severityMeta.label}
            </Tag>
            <Tag intent={statusMeta.intent} scale="md" className="m-0 font-medium">
              {statusMeta.label}
            </Tag>
          </span>
          <span className="block text-xs font-normal text-slate-500 mt-0.5">
            {warranty?.workName}
          </span>
        </span>
      }
    >
      {/* Banner cảnh báo quá hạn */}
      {overdue && (
        <aside className="mb-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] font-medium text-rose-800">
          <AlertOutlined className="shrink-0 text-rose-600" />
          <span>
            Đã quá hạn khắc phục {daysBetween(incident.requiredFixDate, today)} ngày (Hạn chót:{" "}
            {formatDateVi(incident.requiredFixDate)}). Yêu cầu đôn đốc nhà thầu khẩn cấp.
          </span>
        </aside>
      )}

      {/* Thông tin sự cố (Facts Grid) */}
      <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        {facts.map((fact) => (
          <div key={fact.label} className={fact.wide ? "col-span-2" : undefined}>
            <dt className="text-xs text-slate-500 font-medium">{fact.label}</dt>
            <dd className="m-0 text-[13px] font-semibold text-slate-800 mt-0.5">{fact.value}</dd>
          </div>
        ))}
      </dl>

      {/* Nội dung mô tả sự cố */}
      <section className="mt-4 rounded-xl border border-slate-200 p-4">
        <Flex align="center" gap={6} className="mb-2">
          <FileTextOutlined className="text-slate-500" />
          <Text className="text-xs font-bold uppercase tracking-wide text-slate-600">
            Mô tả chi tiết sự cố
          </Text>
        </Flex>
        <p className="m-0 text-[13px] leading-relaxed text-slate-800 whitespace-pre-wrap">
          {incident.description}
        </p>

        {/* Tệp đính kèm */}
        {incident.attachments && incident.attachments.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <Text className="text-xs text-slate-500 font-medium mb-1.5 block">
              Tài liệu / hình ảnh đính kèm ({incident.attachments.length}):
            </Text>
            <div className="flex flex-wrap gap-2">
              {incident.attachments.map((file, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <PaperClipOutlined className="text-slate-400" />
                  <span>{file}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Trạng thái & Kết quả khắc phục */}
      <section className="mt-4 rounded-xl border border-slate-200 p-4">
        <Flex align="center" justify="space-between" className="mb-2">
          <Text className="text-xs font-bold uppercase tracking-wide text-slate-600">
            Quá trình xử lý sự cố
          </Text>
          <span className="text-xs font-medium text-slate-500">
            {incident.status === "FIXED" ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircleFilled /> Đã hoàn tất nghiệm thu
              </span>
            ) : incident.status === "FIXING" ? (
              <span className="text-sky-700 font-semibold flex items-center gap-1">
                <ClockCircleFilled /> Nhà thầu đang sửa chữa
              </span>
            ) : (
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <ExclamationCircleOutlined /> Chờ bắt đầu xử lý
              </span>
            )}
          </span>
        </Flex>

        {incident.status === "FIXED" ? (
          <div className="rounded-lg bg-emerald-50/70 border border-emerald-200 p-3 text-xs text-emerald-900 space-y-1">
            <div className="flex justify-between">
              <span className="text-emerald-700">Ngày nghiệm thu hoàn thành:</span>
              <strong>{formatDateVi(incident.fixedDate!)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-700">Biên bản nghiệm thu số:</span>
              <strong className="font-mono">{incident.acceptanceDocument}</strong>
            </div>
          </div>
        ) : incident.status === "FIXING" ? (
          <div className="rounded-lg bg-sky-50 border border-sky-200 p-3 text-xs text-sky-900">
            Nhà thầu đang triển khai khắc phục hiện trường. Sau khi khắc phục xong, cán bộ phụ trách tiến hành lập biên bản nghiệm thu.
          </div>
        ) : (
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
            Sự cố đã được gửi thông báo đến nhà thầu {warranty?.contractor}. Chờ nhà thầu cử nhân sự khắc phục.
          </div>
        )}
      </section>
    </Drawer>
  );
}
