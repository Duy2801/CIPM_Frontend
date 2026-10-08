"use client";

import {
  AlertOutlined,
  BankOutlined,
  CheckCircleFilled,
  CheckOutlined,
  ClockCircleOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  StopOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Flex, Progress, Tag, Text, Tooltip } from "@/components/ui";
import { formatDateVi } from "@/utils/date";
import { BOND_STATUS_META, COUNTDOWN_META } from "../constants/warranty-labels";
import type { WarrantyController } from "../hooks/useWarrantyMaintenance";
import type { WarrantyRecord } from "../types/warranty.types";
import { getBondReturnBlocker, getCountdown, getOpenIncidents } from "../utils/warranty-rules";

interface WarrantyDetailDrawerProps {
  warranty: WarrantyRecord;
  controller: WarrantyController;
  onClose: () => void;
  onReportIncident: (warranty: WarrantyRecord) => void;
  onReturnBond: (warranty: WarrantyRecord) => void;
  onForfeitBond: (warranty: WarrantyRecord) => void;
  onOpenIncidentDetail?: (incidentId: string) => void;
  onEdit?: (warranty: WarrantyRecord) => void;
}

const formatBillions = (value: number) =>
  `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 }).format(value)} tỷ`;

export default function WarrantyDetailDrawer({
  warranty,
  controller,
  onClose,
  onReportIncident,
  onReturnBond,
  onForfeitBond,
  onOpenIncidentDetail,
  onEdit,
}: WarrantyDetailDrawerProps) {
  const { data, incidents, today, permissions } = controller;
  const project = data.projects.find((item) => item.id === warranty.projectId);
  const countdown = getCountdown(warranty, today);
  const meta = COUNTDOWN_META[countdown.level];
  const relatedIncidents = incidents.filter((item) => item.warrantyId === warranty.id);
  const openIncidents = getOpenIncidents(warranty.id, incidents);
  const blocker = getBondReturnBlocker(warranty, incidents, today);
  const bondMeta = BOND_STATUS_META[warranty.bondStatus];

  const facts = [
    { label: "Dự án", value: project ? `${project.code} · ${project.name}` : "—", wide: true },
    { label: "Hợp đồng", value: `HĐ ${warranty.contractCode}`, wide: false },
    { label: "Nhà thầu", value: warranty.contractor, wide: false },
    { label: "Ngày nghiệm thu bàn giao", value: formatDateVi(warranty.acceptanceDate) },
    { label: "Thời hạn bảo hành", value: `${warranty.months} tháng` },
    { label: "Ngày hết hạn bảo hành", value: formatDateVi(countdown.expiryDate) },
    { label: "Giá trị bảo lãnh", value: formatBillions(warranty.bondValue) },
    { label: "Ngân hàng phát hành", value: warranty.bank, wide: true },
    { label: "Trạng thái bảo lãnh", value: bondMeta.label },
    ...(warranty.bondClosedAt ? [{ label: "Ngày tất toán bảo lãnh", value: formatDateVi(warranty.bondClosedAt) }] : []),
  ];

  return (
    <Drawer
      open
      width="min(680px, 100vw)"
      onClose={onClose}
      footer={
        <div className="flex items-center justify-start gap-2.5 flex-wrap px-1 py-1">
          {permissions.canManageBond && warranty.bondStatus === "HOLDING" && (
            <>
              <Tooltip title={blocker}>
                <Button
                  intent="primary"
                  scale="sm"
                  icon={<CheckOutlined />}
                  disabled={Boolean(blocker)}
                  onClick={() => {
                    onClose();
                    onReturnBond(warranty);
                  }}
                >
                  Hoàn trả bảo lãnh
                </Button>
              </Tooltip>
              <Button
                intent="outline"
                scale="sm"
                icon={<StopOutlined />}
                onClick={() => {
                  onClose();
                  onForfeitBond(warranty);
                }}
                className="!border-rose-200 !text-rose-700 hover:!border-rose-400"
              >
                Thu hồi bảo lãnh
              </Button>
            </>
          )}
          {permissions.canManageIncidents && countdown.daysLeft >= 0 && (
            <Button
              intent="outline"
              scale="sm"
              icon={<PlusOutlined />}
              onClick={() => {
                onClose();
                onReportIncident(warranty);
              }}
            >
              Ghi nhận sự cố
            </Button>
          )}
          {onEdit && (
            <Button
              intent="outline"
              scale="sm"
              icon={<EditOutlined />}
              onClick={() => {
                onClose();
                onEdit(warranty);
              }}
              className="!border-teal-200 !text-teal-700 hover:!border-teal-400 hover:!bg-teal-50"
            >
              Cập nhật hồ sơ
            </Button>
          )}
          <Button intent="outline" scale="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      }
      title={
        <span>
          <span className="text-base font-bold text-[#102A43] block">
            {warranty.workName}
          </span>
          <span className="block text-xs font-normal text-slate-500 mt-0.5">
            Hợp đồng {warranty.contractCode} · {warranty.contractor}
          </span>
        </span>
      }
    >
      {/* Banner thời hạn bảo hành (đã tinh chỉnh thanh lịch, dịu mắt) */}
      <section className="mb-4 rounded-xl border border-slate-200/90 bg-slate-50/60 p-4">
        <Flex align="baseline" justify="space-between" gap="small">
          <span className="text-lg sm:text-xl font-bold text-slate-900">
            {countdown.daysLeft >= 0 ? `Còn ${countdown.daysLeft} ngày bảo hành` : "Đã hết hạn bảo hành"}
          </span>
          <span className="text-xs font-medium text-slate-500">{meta.label}</span>
        </Flex>
        <Progress
          percent={countdown.elapsedPercent}
          showInfo={false}
          size="small"
          strokeColor="#007A78"
          aria-label="Thời gian bảo hành đã qua"
          className="mt-2.5"
        />
        <Text className="block text-xs text-slate-500 mt-1.5">
          Đã trôi qua {countdown.elapsedPercent}% thời hạn (từ {formatDateVi(warranty.acceptanceDate)} đến {formatDateVi(countdown.expiryDate)})
        </Text>
      </section>

      {/* Thông tin chi tiết (Facts grid) */}
      <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        {facts.map((fact) => (
          <div key={fact.label} className={fact.wide ? "col-span-2" : undefined}>
            <dt className="text-xs text-slate-500 font-medium">{fact.label}</dt>
            <dd className="m-0 text-[13px] font-semibold text-slate-800 mt-0.5">{fact.value}</dd>
          </div>
        ))}
      </dl>

      {/* Danh sách sự cố phát sinh */}
      <section className="mt-4 rounded-xl border border-slate-200 p-4">
        <Flex align="center" justify="space-between" className="mb-2.5">
          <Text className="text-xs font-bold uppercase tracking-wide text-slate-600">
            Sự cố trong thời gian bảo hành ({relatedIncidents.length})
          </Text>
          {openIncidents.length > 0 && (
            <Tag intent="danger" scale="sm">
              {openIncidents.length} chưa khắc phục
            </Tag>
          )}
        </Flex>

        {relatedIncidents.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400">
            Không có sự cố nào phát sinh trong thời gian bảo hành
          </div>
        ) : (
          <div className="space-y-2">
            {relatedIncidents.map((incident) => (
              <div
                key={incident.id}
                onClick={() => onOpenIncidentDetail?.(incident.id)}
                className="flex items-start justify-between gap-3 p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-100 transition-colors cursor-pointer text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <strong className="text-[#007A78] font-mono">{incident.code}</strong>
                    <span className="text-slate-800 font-semibold truncate">{incident.description}</span>
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    Vị trí: {incident.location} · Hạn sửa: {formatDateVi(incident.requiredFixDate)}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <Tag intent={incident.status === "FIXED" ? "success" : incident.status === "FIXING" ? "info" : "warning"} scale="sm">
                    {incident.status === "FIXED" ? "Đã xong" : incident.status === "FIXING" ? "Đang sửa" : "Chờ sửa"}
                  </Tag>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </Drawer>
  );
}
