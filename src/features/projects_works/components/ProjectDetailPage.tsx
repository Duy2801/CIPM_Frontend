"use client";

import React, { useState } from "react";
import { App } from "antd";
import {
  ApartmentOutlined,
  AuditOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  SafetyCertificateOutlined,
  ArrowLeftOutlined,
  FormOutlined,
  HistoryOutlined,
  ProfileOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Button, Card, Select, Tooltip } from "@/components/ui";
import { InlineEditField, ProjectScopeProvider, type SegmentedTabItem } from "@/components/workspace";
import { cn } from "@/utils/cn";
import { formatMoneyString } from "@/utils/format-money";
import { useAuth } from "@/features/auth";
import { canUserDo } from "@/access-control";
import {
  DEPARTMENT_OPTIONS,
  FUNDING_SOURCE_OPTIONS,
  PERSONNEL_OPTIONS,
  WORK_TYPE_OPTIONS,
} from "../constants/project-enums";
import type {
  FundingSourceType,
  ProjectFormData,
  ProjectItem,
  ProjectNature,
  ProjectWorkType,
} from "../types/project.types";
import { useProjectProcedure } from "../hooks/useProjectProcedure";
import { SiteClearanceResettlementScreen } from "@/features/site-clearance-resettlement";
import { BiddingManagementScreen } from "@/features/bidding-management";
import { FinanceSettlementScreen } from "@/features/finance-settlement";
import { WarrantyMaintenanceScreen } from "@/features/warranty-maintenance";
import { ProjectDocumentsSection } from "./detail/ProjectViewTab";
import ProjectProcedureConfigTab from "./detail/ProjectProcedureConfigTab";
import ProjectHistoryTab from "./detail/ProjectHistoryTab";

type DetailTab = "info" | "procedure" | "gpmb" | "bidding" | "finance" | "warranty" | "history";

/** Các trường sửa được bằng bút chì trên trang chi tiết */
type EditablePatch = Partial<
  Pick<
    ProjectItem,
    | "name"
    | "type"
    | "location"
    | "fundingSource"
    | "totalInvestment"
    | "plan2026"
    | "managerName"
    | "supervisorName"
    | "departments"
    | "startDate"
    | "endDatePlanned"
    | "nature"
  >
>;
type EditableField = keyof EditablePatch;

const NATURE_LABELS: Record<ProjectNature, string> = {
  new: "Dự án mới (Khởi công mới)",
  transitional: "Dự án cũ (Chuyển tiếp)",
};

const FIELD_LABELS: Record<EditableField, string> = {
  name: "Tên dự án",
  type: "Loại dự án",
  location: "Địa bàn xây dựng",
  fundingSource: "Nguồn vốn",
  totalInvestment: "Tổng mức đầu tư",
  plan2026: `Kế hoạch vốn ${new Date().getFullYear()}`,
  managerName: "Người phụ trách",
  supervisorName: "Giám sát kỹ thuật",
  departments: "Phòng ban phụ trách",
  startDate: "Ngày bắt đầu",
  endDatePlanned: "Ngày kết thúc",
  nature: "Tính chất dự án",
};

const PERSONNEL_SELECT_OPTIONS = PERSONNEL_OPTIONS.map((p) => ({
  value: p.name,
  label: `${p.name} (${p.role})`,
}));

/** Định dạng giá trị một trường để hiển thị / so sánh trong hộp xác nhận */
function formatField(field: EditableField, project: ProjectItem): string {
  switch (field) {
    case "totalInvestment":
    case "plan2026":
      return `${formatMoneyString(project[field] || 0)} VNĐ`;
    case "nature":
      return project.nature ? NATURE_LABELS[project.nature] : "";
    case "departments":
      return (project.departments ?? []).join(", ");
    default:
      return String(project[field] ?? "");
  }
}

/** Đọc số tiền người dùng gõ (cho phép dấu chấm / phẩy / khoảng trắng phân tách) */
const parseMoney = (raw: string) => Number(raw.replace(/[.,\s]/g, ""));

const validateMoney = (raw: string) =>
  /^[\d.,\s]+$/.test(raw) && Number.isFinite(parseMoney(raw)) ? undefined : "Vui lòng nhập số tiền hợp lệ.";

interface ProjectDetailPageProps {
  project: ProjectItem;
  onBack: () => void;
  onUpdateProject: (projectId: string, data: ProjectFormData) => void;
}

/** Trang con chi tiết dự án: xem và sửa trực tiếp từng trường bằng bút chì, bấm "Lưu thay đổi" để ghi lại */
export default function ProjectDetailPage({
  project,
  onBack,
  onUpdateProject,
}: ProjectDetailPageProps) {
  const { modal } = App.useApp();
  const { user } = useAuth();

  const isClosed = project.status === "closed";
  // Sửa thông tin chung: quyền nhập liệu M2
  const canEditInfo = canUserDo(user, "m2_projects", "input") && !isClosed;

  // Các trường đã sửa bằng bút chì nhưng chưa bấm "Lưu thay đổi"
  const [pending, setPending] = useState<EditablePatch>({});

  // Dự án đang hiển thị = bản gốc + các trường đang sửa
  const view: ProjectItem = { ...project, ...pending };
  const isChanged = (field: EditableField) => field in pending;
  const isDirty = Object.keys(pending).length > 0;

  // Ghi nhận trường vừa sửa; sửa về đúng giá trị cũ thì bỏ khỏi danh sách chờ lưu
  const setField = <K extends EditableField>(field: K, value: EditablePatch[K]) => {
    setPending((prev) => {
      const next = { ...prev, [field]: value };
      if (JSON.stringify(value) === JSON.stringify(project[field])) delete next[field];
      return next;
    });
  };
  const infoSaver = <K extends EditableField>(field: K, parse: (raw: string) => EditablePatch[K]) =>
    canEditInfo ? (raw: string) => setField(field, parse(raw)) : undefined;

  const discardChanges = () => setPending({});

  const pendingChanges = (Object.keys(pending) as EditableField[]).map((field) => ({
    label: FIELD_LABELS[field],
    from: formatField(field, project),
    to: formatField(field, view),
  }));

  const confirmSaveChanges = () =>
    modal.confirm({
      centered: true,
      width: 480,
      title: "Xác nhận thay đổi thông tin dự án",
      content: (
        <div className="space-y-2.5 text-xs">
          <p className="m-0 text-slate-600">
            Bạn có đồng ý cập nhật {pendingChanges.length} thông tin sau cho dự án{" "}
            <strong className="text-slate-900">{project.code}</strong>?
          </p>
          <div className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50/70 p-2.5">
            {pendingChanges.map((c) => (
              <div key={c.label} className="flex flex-wrap items-baseline gap-x-1.5">
                <span className="font-semibold text-slate-700">{c.label}:</span>
                <span className="text-slate-500 line-through">{c.from || "Trống"}</span>
                <span className="text-slate-400">→</span>
                <span className="font-semibold text-[#DC2626]">{c.to || "Trống"}</span>
              </div>
            ))}
          </div>
        </div>
      ),
      okText: "Đồng ý lưu",
      cancelText: "Xem lại",
      okButtonProps: { className: "!bg-[#DC2626] !border-[#DC2626] hover:!bg-[#B91C1C]" },
      onOk: () => {
        onUpdateProject(project.id, {
          ...pending,
          name: view.name,
          type: view.type,
          startDate: view.startDate,
          endDatePlanned: view.endDatePlanned,
          // Ghi vào lịch sử dự án: các trường đã đổi (cũ → mới)
          progressNote: pendingChanges.map((c) => `${c.label}: ${c.from || "Trống"} → ${c.to || "Trống"}`).join("; "),
        });
        discardChanges();
      },
    });

  // Quay lại khi còn thay đổi chưa lưu: hỏi trước để không mất dữ liệu
  const handleBack = () => {
    const unsavedProcedure = procedure.draftCount > 0;
    if (!isDirty && !unsavedProcedure) {
      onBack();
      return;
    }
    modal.confirm({
      centered: true,
      width: 420,
      title: "Bỏ các thay đổi chưa lưu?",
      content: (
        <p className="m-0 text-xs text-slate-600">
          {isDirty && unsavedProcedure
            ? "Có thay đổi thông tin dự án và phân công quy trình chưa lưu."
            : isDirty
              ? "Có thay đổi thông tin dự án chưa lưu."
              : `Có ${procedure.draftCount} bước quy trình đã sửa chưa lưu.`}{" "}
          Quay lại sẽ bỏ các thay đổi này.
        </p>
      ),
      okText: "Bỏ thay đổi",
      cancelText: "Tiếp tục sửa",
      okButtonProps: { danger: true },
      onOk: onBack,
    });
  };

  const personName = (name: string) => (name === "Chưa phân công" ? "Chờ BQL phân công (M5)" : name || "—");

  // Quy trình áp dụng cho dự án (dùng chung dữ liệu với phân hệ Quy trình dự án)
  const procedure = useProjectProcedure(project);

  const canViewProcedure = canUserDo(user, "m3_construction_procedures", "view");
  const [activeTab, setActiveTab] = useState<DetailTab>("info");

  const detailTabs: SegmentedTabItem<DetailTab>[] = [
    { key: "info", icon: <ProfileOutlined />, label: "Thông tin chung" },
    ...(canViewProcedure ? [{ key: "procedure" as const, icon: <ApartmentOutlined />, label: "Quy trình" }] : []),
    // GPMB, đấu thầu, tài chính, bảo hành của riêng dự án này — ai có quyền xem phân hệ nào thì thấy tab đó
    ...(canUserDo(user, "m6_site_clearance", "view")
      ? [{ key: "gpmb" as const, icon: <EnvironmentOutlined />, label: "GPMB" }]
      : []),
    ...(canUserDo(user, "m7_bidding", "view")
      ? [{ key: "bidding" as const, icon: <AuditOutlined />, label: "Đấu thầu" }]
      : []),
    ...(canUserDo(user, "m4_finance_settlement", "view")
      ? [{ key: "finance" as const, icon: <DollarOutlined />, label: "Tài chính" }]
      : []),
    ...(canUserDo(user, "m8_warranty", "view")
      ? [{ key: "warranty" as const, icon: <SafetyCertificateOutlined />, label: "Bảo hành & Bảo trì" }]
      : []),
    { key: "history", icon: <HistoryOutlined />, label: "Lịch sử" },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Đầu trang: quay lại + tên dự án đang xem */}
      <div className="flex min-w-0 items-center gap-3">
        <Button
          intent="outline"
          scale="compact"
          icon={<ArrowLeftOutlined />}
          aria-label="Quay lại danh sách dự án"
          title="Quay lại danh sách dự án"
          onClick={handleBack}
          className="h-9! w-9! shrink-0 p-0!"
        />
        <h1 className="m-0 min-w-0 truncate text-base font-bold text-slate-900" title={view.name}>
          Chi tiết dự án <span className="text-[#DC2626]">{view.name}</span>
        </h1>
      </div>

      {/* Các tab của dự án */}
      <DetailTabBar items={detailTabs} activeKey={activeTab} onChange={setActiveTab} />

      {isClosed && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Dự án đã đóng nên chỉ xem được. Mở lại dự án từ danh sách nếu cần tiếp tục cập nhật.
        </div>
      )}

      {activeTab === "procedure" && <ProjectProcedureConfigTab project={project} controller={procedure} />}
      {activeTab === "history" && <ProjectHistoryTab project={project} procedureLogs={procedure.data.history ?? []} />}
      {/* GPMB, đấu thầu, tài chính, bảo hành: chỉ dữ liệu của dự án này, không chọn dự án khác */}
      <ProjectScopeProvider projectId={project.id}>
        {activeTab === "gpmb" && <SiteClearanceResettlementScreen projectId={project.id} />}
        {activeTab === "bidding" && <BiddingManagementScreen projectId={project.id} />}
        {activeTab === "finance" && <FinanceSettlementScreen projectId={project.id} />}
        {activeTab === "warranty" && <WarrantyMaintenanceScreen projectId={project.id} />}
      </ProjectScopeProvider>

      {activeTab === "info" && (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          {/* Cột trái: thông tin chung — bấm bút chì để sửa từng trường */}
          <Card surface="workspace" padding="none" rounded="lg" className="border border-slate-200/80 shadow-xs">
            <div className="space-y-5 p-5">
              <FieldGroup title="Thông tin chung">
                <InlineEditField
                  className="sm:col-span-2 xl:col-span-4"
                  label={FIELD_LABELS.name}
                  changed={isChanged("name")}
                  value={view.name}
                  display={view.name}
                  editor={{ kind: "text", placeholder: "Tên công trình" }}
                  onSave={infoSaver("name", (v) => v)}
                />
                <InlineEditField
                  label={FIELD_LABELS.type}
                  changed={isChanged("type")}
                  value={view.type}
                  display={view.type}
                  editor={{ kind: "select", options: WORK_TYPE_OPTIONS.map((t) => ({ value: t, label: t })) }}
                  onSave={infoSaver("type", (v) => v as ProjectWorkType)}
                />
                <InlineEditField
                  label={FIELD_LABELS.nature}
                  changed={isChanged("nature")}
                  value={view.nature ?? ""}
                  display={view.nature ? NATURE_LABELS[view.nature] : "—"}
                  editor={{
                    kind: "select",
                    options: (Object.keys(NATURE_LABELS) as ProjectNature[]).map((n) => ({
                      value: n,
                      label: NATURE_LABELS[n],
                    })),
                  }}
                  onSave={infoSaver("nature", (v) => v as ProjectNature)}
                />
                <InlineEditField
                  label={FIELD_LABELS.location}
                  changed={isChanged("location")}
                  value={view.location ?? ""}
                  display={view.location || "TP. Hà Tiên"}
                  editor={{ kind: "text", placeholder: "Phường / xã" }}
                  onSave={infoSaver("location", (v) => v)}
                />
                <div>
                  <span className="text-[11px] font-medium text-slate-500">Cơ quan quản lý</span>
                  <div className="mt-0.5 text-xs font-semibold text-slate-900">Ban QLDA ĐTXD Hà Tiên</div>
                </div>
              </FieldGroup>

              <FieldGroup title="Vốn đầu tư">
                <InlineEditField
                  label={FIELD_LABELS.fundingSource}
                  changed={isChanged("fundingSource")}
                  value={view.fundingSource}
                  display={view.fundingSource}
                  editor={{ kind: "select", options: FUNDING_SOURCE_OPTIONS.map((f) => ({ value: f, label: f })) }}
                  onSave={infoSaver("fundingSource", (v) => v as FundingSourceType)}
                />
                <InlineEditField
                  label={FIELD_LABELS.totalInvestment}
                  changed={isChanged("totalInvestment")}
                  value={String(view.totalInvestment || 0)}
                  display={`${formatMoneyString(view.totalInvestment || 0)} VNĐ`}
                  editor={{ kind: "text", placeholder: "Số tiền (VNĐ)" }}
                  validate={validateMoney}
                  onSave={infoSaver("totalInvestment", parseMoney)}
                />
                <InlineEditField
                  label={FIELD_LABELS.plan2026}
                  changed={isChanged("plan2026")}
                  value={String(view.plan2026 || 0)}
                  display={view.plan2026 > 0 ? `${formatMoneyString(view.plan2026)} VNĐ` : "Chưa giao kế hoạch"}
                  editor={{ kind: "text", placeholder: "Số tiền (VNĐ)" }}
                  validate={validateMoney}
                  onSave={infoSaver("plan2026", parseMoney)}
                />
              </FieldGroup>

              <FieldGroup title="Nhân sự & thời gian">
                <InlineEditField
                  label={FIELD_LABELS.managerName}
                  changed={isChanged("managerName")}
                  value={view.managerName}
                  display={personName(view.managerName)}
                  editor={{ kind: "select", options: PERSONNEL_SELECT_OPTIONS }}
                  onSave={infoSaver("managerName", (v) => v)}
                />
                <InlineEditField
                  label={FIELD_LABELS.supervisorName}
                  changed={isChanged("supervisorName")}
                  value={view.supervisorName}
                  display={personName(view.supervisorName)}
                  editor={{ kind: "select", options: PERSONNEL_SELECT_OPTIONS }}
                  onSave={infoSaver("supervisorName", (v) => v)}
                />
                <InlineEditField
                  label={FIELD_LABELS.startDate}
                  changed={isChanged("startDate")}
                  value={view.startDate}
                  display={<span className="font-mono">{view.startDate}</span>}
                  editor={{ kind: "date" }}
                  validate={(next) =>
                    view.endDatePlanned && next > view.endDatePlanned
                      ? "Ngày bắt đầu không được sau ngày kết thúc."
                      : undefined
                  }
                  onSave={infoSaver("startDate", (v) => v)}
                />
                <InlineEditField
                  label={FIELD_LABELS.endDatePlanned}
                  changed={isChanged("endDatePlanned")}
                  value={view.endDatePlanned}
                  display={<span className="font-mono">{view.endDatePlanned}</span>}
                  editor={{ kind: "date" }}
                  validate={(next) =>
                    view.startDate && next <= view.startDate
                      ? "Ngày kết thúc phải sau ngày bắt đầu."
                      : undefined
                  }
                  onSave={infoSaver("endDatePlanned", (v) => v)}
                />
                {project.actualEndDate && (
                  <div>
                    <span className="text-[11px] font-medium text-slate-500">Hoàn thành thực tế</span>
                    <div className="mt-0.5 font-mono text-xs font-semibold text-slate-900">{project.actualEndDate}</div>
                  </div>
                )}
              </FieldGroup>

              <DepartmentsField
                changed={isChanged("departments")}
                value={view.departments ?? []}
                onSave={canEditInfo ? (next) => setField("departments", next) : undefined}
              />
            </div>
          </Card>

          {/* Cột phải: tài liệu đính kèm — trên màn rộng cao bằng khối thông tin bên cạnh, danh sách cuộn bên trong */}
          <div className="relative min-h-[320px]">
            <Card
              surface="workspace"
              padding="none"
              rounded="lg"
              className="border-0 shadow-xs xl:absolute xl:inset-0 [&>.ant-card-body]:h-full"
            >
              <ProjectDocumentsSection project={project} fill />
            </Card>
          </div>
        </div>
      )}

      {/* Có thay đổi chưa lưu: thanh lưu bám đáy màn hình */}
      {isDirty && activeTab === "info" && (
        <div className="sticky bottom-0 z-10 flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
          <span className="mr-auto text-xs text-slate-600">
            Có <strong className="text-slate-900">{pendingChanges.length}</strong> thông tin đã sửa chưa lưu
          </span>
          <Button intent="outline" scale="sm" onClick={discardChanges} className="px-5">
            Hủy thay đổi
          </Button>
          <Button
            intent="primary"
            scale="sm"
            onClick={confirmSaveChanges}
            className="!bg-[#DC2626] !border-[#DC2626] hover:!bg-[#B91C1C] px-5 font-semibold"
          >
            Lưu thay đổi
          </Button>
        </div>
      )}
    </div>
  );
}

/** Thanh tab của trang chi tiết: tab đang chọn nền đỏ chữ trắng */
function DetailTabBar({
  items,
  activeKey,
  onChange,
}: {
  items: SegmentedTabItem<DetailTab>[];
  activeKey: DetailTab;
  onChange: (key: DetailTab) => void;
}) {
  return (
    <div className="border-b border-slate-200 pb-2">
      <div role="tablist" className="flex min-w-0 gap-1.5 overflow-x-auto">
        {items.map((item) => {
          const isActive = item.key === activeKey;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(item.key)}
              className={cn(
                "flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border-0 px-4 py-2 text-sm transition-colors",
                isActive
                  ? "bg-[#DC2626] font-semibold text-white shadow-[0_2px_6px_rgba(220,38,38,0.25)]"
                  : "bg-transparent font-medium text-slate-600 hover:bg-red-50 hover:text-[#DC2626]",
              )}
            >
              <span className="text-[15px] leading-none">{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Nhóm trường thông tin có tiêu đề; lưới 4 cột trên màn rộng, 2 cột trên màn vừa */
function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="m-0 mb-3 border-b border-slate-100 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      <div className="grid grid-cols-1 gap-x-6 gap-y-3.5 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
    </section>
  );
}

interface DepartmentsFieldProps {
  value: string[];
  changed?: boolean;
  onSave?: (next: string[]) => void;
  className?: string;
}

/** Phòng ban phụ trách (chọn nhiều): bấm bút chì để mở ô chọn, bấm ra ngoài là nhận */
function DepartmentsField({ value, changed, onSave, className }: DepartmentsFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string[]>(value);

  return (
    <div className={`min-w-0 pt-3 border-t border-slate-100 ${className ?? ""}`}>
      <div className="flex items-center gap-1.5">
        <TeamOutlined className="text-xs text-blue-600" />
        <span className="text-[11px] font-medium text-slate-500">{FIELD_LABELS.departments}</span>
        {changed && (
          <span className="rounded bg-amber-100 px-1.5 py-px text-[10px] font-semibold text-amber-800">Đã sửa</span>
        )}
        {onSave && !editing && (
          <Tooltip title="Sửa phòng ban phụ trách">
            <button
              type="button"
              aria-label="Sửa phòng ban phụ trách"
              onClick={() => {
                setDraft(value);
                setEditing(true);
              }}
              className="inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white p-0 text-xs text-slate-500 shadow-2xs transition-colors hover:border-[#DC2626]/40 hover:bg-red-50 hover:text-[#DC2626]"
            >
              <FormOutlined />
            </button>
          </Tooltip>
        )}
      </div>

      {editing ? (
        <Select
          autoFocus
          defaultOpen
          mode="multiple"
          size="small"
          value={draft}
          onChange={(next) => setDraft(next as string[])}
          onBlur={() => {
            setEditing(false);
            onSave?.(draft);
          }}
          options={DEPARTMENT_OPTIONS.map((d) => ({ value: d.value, label: d.label }))}
          placeholder="Chọn phòng ban phụ trách"
          className="mt-1 w-full text-xs"
        />
      ) : (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {value.length > 0 ? (
            value.map((dept) => (
              <span
                key={dept}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-2xs"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                {dept}
              </span>
            ))
          ) : (
            <span className="text-xs italic text-slate-400">Chưa phân công phòng ban phụ trách</span>
          )}
        </div>
      )}
    </div>
  );
}
