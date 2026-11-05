"use client";

import React, { useState } from "react";
import { App } from "antd";
import {
  ApartmentOutlined,
  ArrowLeftOutlined,
  DollarOutlined,
  HistoryOutlined,
  ProfileOutlined,
} from "@ant-design/icons";
import { Button, Card } from "@/components/ui";
import { InlineEditField, type SegmentedTabItem } from "@/components/workspace";
import { cn } from "@/utils/cn";
import { formatMoneyString } from "@/utils/format-money";
import { formatDateVi } from "@/utils/date";
import { useAuth } from "@/features/auth";
import { canUserDo } from "@/access-control";
import {
  FUNDING_SOURCE_OPTIONS,
  PERSONNEL_OPTIONS,
} from "../constants/project-enums";
import type {
  FundingSourceType,
  ProjectFormData,
  ProjectItem,
  ProjectNature,
} from "../types/project.types";
import { useProjectProcedure, type ProjectProcedureSync } from "../hooks/useProjectProcedure";
import type { ProcedureLibraryItem } from "@/features/construction-procedures/utils/procedure-library";
import { useProcedureLibrary } from "@/features/construction-procedures/hooks/useProcedureLibrary";
import { ProjectDocumentsSection } from "./detail/ProjectViewTab";
import ProjectProcedureTab from "./detail/ProjectProcedureTab";
import ProjectProcedurePicker, { procedureTarget, shortProcedureLabel } from "./ProjectProcedurePicker";
import ProjectHistoryTab from "./detail/ProjectHistoryTab";
import ProjectDisbursementTab from "./detail/ProjectDisbursementTab";
import WorkTypeSelect from "./WorkTypeSelect";

/** "proc:<phòng ban>" = tab quy trình của phòng ban đó */
type DetailTab = "info" | `proc:${string}` | "disbursement" | "history";

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
  /** Quy trình thay đổi: cập nhật phòng ban phụ trách + phần trăm hoàn thành của dự án */
  onProcedureSync: (projectId: string, sync: ProjectProcedureSync) => void;
  /** Tổng giải ngân của dự án thay đổi (thêm / xóa đợt ở tab Giải ngân) */
  onDisbursedChange: (projectId: string, total: number) => void;
}

/** Trang con chi tiết dự án: xem và sửa trực tiếp từng trường bằng bút chì, bấm "Lưu thay đổi" để ghi lại */
export default function ProjectDetailPage({
  project,
  onBack,
  onUpdateProject,
  onProcedureSync,
  onDisbursedChange,
}: ProjectDetailPageProps) {
  const { modal, message } = App.useApp();
  const { user } = useAuth();

  const isClosed = project.status === "closed";
  // Sửa thông tin chung: quyền nhập liệu M2
  const canEditInfo = canUserDo(user, "m2_projects", "input") && !isClosed;

  // Các trường đã sửa bằng bút chì nhưng chưa bấm "Lưu thay đổi"
  const [pending, setPending] = useState<EditablePatch>({});

  // Dự án đang hiển thị = bản gốc + các trường đang sửa
  const view: ProjectItem = { ...project, ...pending };
  const isChanged = (field: EditableField) => field in pending;
  const infoDirty = Object.keys(pending).length > 0;

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

  const discardChanges = () => {
    setPending({});
    setProcDraft(null);
    setLabelDraft({});
  };

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
            Bạn có đồng ý cập nhật {changeCount} thay đổi sau cho dự án{" "}
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
            {addedProcedures.map((id) => (
              <div key={`add-${id}`}>
                <span className="font-semibold text-slate-700">Áp dụng quy trình:</span>{" "}
                <span className="font-semibold text-emerald-700">{procedureName(id)}</span>
              </div>
            ))}
            {removedProcedures.map(([dept, id]) => (
              <div key={`rm-${dept}`}>
                <span className="font-semibold text-slate-700">Gỡ quy trình:</span>{" "}
                <span className="font-semibold text-[#DC2626]">{procedureName(id)}</span>{" "}
                <span className="text-slate-500">(xóa các bước và tiến độ)</span>
              </div>
            ))}
            {renamedProcedures.map(([id, label]) => (
              <div key={`rn-${id}`} className="flex flex-wrap items-baseline gap-x-1.5">
                <span className="font-semibold text-slate-700">Tên tab {procedureName(id)}:</span>
                <span className="text-slate-500 line-through">{savedTabLabels[id] || "Mặc định"}</span>
                <span className="text-slate-400">→</span>
                <span className="font-semibold text-[#DC2626]">{label || "Mặc định"}</span>
              </div>
            ))}
          </div>
        </div>
      ),
      okText: "Đồng ý lưu",
      cancelText: "Xem lại",
      okButtonProps: { className: "!bg-[#DC2626] !border-[#DC2626] hover:!bg-[#B91C1C]" },
      onOk: () => {
        if (infoDirty) {
          onUpdateProject(project.id, {
            ...pending,
            name: view.name,
            type: view.type,
            startDate: view.startDate,
            endDatePlanned: view.endDatePlanned,
            // Ghi vào lịch sử dự án: các trường đã đổi (cũ → mới)
            progressNote: pendingChanges.map((c) => `${c.label}: ${c.from || "Trống"} → ${c.to || "Trống"}`).join("; "),
          });
        }
        if (procedureChangeCount > 0) saveProcedureDraft();
        discardChanges();
        message.success("Đã cập nhật dự án.");
      },
    });

  // Quay lại khi còn thay đổi chưa lưu: hỏi trước để không mất dữ liệu
  const handleBack = () => {
    const unsavedProcedure = procedure.draftCount > 0 || procedureChangeCount > 0;
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
          {infoDirty && unsavedProcedure
            ? "Có thay đổi thông tin dự án và phân công quy trình chưa lưu."
            : infoDirty
              ? "Có thay đổi thông tin dự án chưa lưu."
              : "Có thay đổi quy trình chưa lưu."}{" "}
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
  const procedure = useProjectProcedure(project, (sync) => onProcedureSync(project.id, sync));
  const { appliedDepartments, departmentStatus } = procedure;

  const canViewProcedure = canUserDo(user, "m3_construction_procedures", "view");
  // Nhập giải ngân: quyền nhập liệu M4 (Tài chính & Quyết toán)
  const canDisburse = canUserDo(user, "m4_finance_settlement", "input") && !isClosed;
  const [tab, setActiveTab] = useState<DetailTab>("info");
  // Quy trình chọn được: quy trình đang bật + quy trình dự án đang dùng (kể cả đã ngưng)
  const { procedures: library } = useProcedureLibrary();
  const appliedProcedures = Object.fromEntries(
    appliedDepartments.flatMap((dept) => {
      const id = departmentStatus(dept)?.procedureId;
      return id ? [[dept, id]] : [];
    }),
  ) as Record<string, string>;
  const pickable = library.filter((p) => p.enabled || Object.values(appliedProcedures).includes(p.id));
  // Tên đầu mục (tên tab) đã lưu của từng quy trình (id → tên)
  const savedTabLabels: Record<string, string> = Object.fromEntries(
    appliedDepartments.flatMap((dept) => {
      const st = departmentStatus(dept);
      return st?.procedureId && st.tabLabel ? [[st.procedureId, st.tabLabel]] : [];
    }),
  );

  const detailTabs: SegmentedTabItem<DetailTab>[] = [
    { key: "info", icon: <ProfileOutlined />, label: "Thông tin chung" },
    // Mỗi quy trình áp dụng cho dự án là một tab
    ...(canViewProcedure
      ? appliedDepartments.map((dept) => ({
          key: `proc:${dept}` as const,
          icon: <ApartmentOutlined />,
          // Tên đầu mục đã đặt, không có thì tên quy trình rút gọn
          label: departmentStatus(dept)?.tabLabel || shortProcedureLabel(departmentStatus(dept)?.procedureName ?? dept),
        }))
      : []),
    { key: "disbursement", icon: <DollarOutlined />, label: "Giải ngân" },
    { key: "history", icon: <HistoryOutlined />, label: "Lịch sử" },
  ];
  // Tab vừa bị ẩn (gỡ quy trình) thì về "Thông tin chung"
  const activeTab: DetailTab = detailTabs.some((t) => t.key === tab) ? tab : "info";

  const canEditProcedures = procedure.canConfigure && !isClosed;

  // ── Quy trình: tích / bỏ tích / đổi tên tab chỉ ghi vào bản nháp, bấm "Lưu thay đổi" mới áp dụng ──
  const [procDraft, setProcDraft] = useState<Record<string, string> | null>(null);
  const [labelDraft, setLabelDraft] = useState<Record<string, string>>({});
  const shownProcedures = procDraft ?? appliedProcedures;
  const shownLabels = { ...savedTabLabels, ...labelDraft };

  const toggleProcedure = (item: ProcedureLibraryItem, checked: boolean) => {
    const rest = Object.fromEntries(Object.entries(shownProcedures).filter(([, id]) => id !== item.id));
    setProcDraft(checked ? { ...rest, [procedureTarget(item, rest)]: item.id } : rest);
  };

  const changeTabLabel = (procedureId: string, label: string) =>
    setLabelDraft((prev) => {
      const next = { ...prev, [procedureId]: label.trim() };
      if ((savedTabLabels[procedureId] ?? "") === label.trim()) delete next[procedureId];
      return next;
    });

  const appliedIds = new Set(Object.values(appliedProcedures));
  const shownIds = new Set(Object.values(shownProcedures));
  const removedProcedures = Object.entries(appliedProcedures).filter(([, id]) => !shownIds.has(id));
  const addedProcedures = Object.values(shownProcedures).filter((id) => !appliedIds.has(id));
  const renamedProcedures = Object.entries(labelDraft).filter(([id]) => shownIds.has(id));
  const procedureChangeCount = removedProcedures.length + addedProcedures.length + renamedProcedures.length;
  // Còn thay đổi chưa lưu (thông tin dự án hoặc quy trình)
  const isDirty = infoDirty || procedureChangeCount > 0;
  const changeCount = pendingChanges.length + procedureChangeCount;
  const procedureName = (id: string) =>
    library.find((p) => p.id === id)?.name ??
    Object.values(procedure.data.departmentStatuses ?? {}).find((st) => st.procedureId === id)?.procedureName ??
    "Quy trình";

  /** Ghi các thay đổi quy trình đang chờ */
  const saveProcedureDraft = () => {
    // Quy trình giữ nguyên dùng đúng khóa đã lưu; quy trình mới lấy chỗ còn trống (không đè lên quy trình đang giữ)
    const occupied: Record<string, string> = Object.fromEntries(
      Object.entries(appliedProcedures).filter(([, id]) => shownIds.has(id)),
    );
    const add = addedProcedures.flatMap((id) => {
      const item = library.find((p) => p.id === id);
      if (!item) return [];
      const department = procedureTarget(item, occupied);
      occupied[department] = id;
      return [{ department, procedure: item }];
    });
    const keyOf = Object.fromEntries(Object.entries(occupied).map(([dept, id]) => [id, dept]));
    procedure.saveProcedureChanges({
      remove: removedProcedures.map(([dept]) => dept),
      add,
      labels: Object.fromEntries(renamedProcedures.flatMap(([id, label]) => (keyOf[id] ? [[keyOf[id], label]] : []))),
    });
  };

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

      {activeTab.startsWith("proc:") && (
        <ProjectProcedureTab key={activeTab} department={activeTab.slice(5)} controller={procedure} />
      )}
      {activeTab === "disbursement" && (
        <ProjectDisbursementTab
          project={project}
          operatorName={user?.name || user?.displayName || "Cán bộ quản lý"}
          canDisburse={canDisburse}
          // Đầu mục giải ngân = tên các tab quy trình của dự án
          headings={appliedDepartments.map(
            (dept) =>
              departmentStatus(dept)?.tabLabel || shortProcedureLabel(departmentStatus(dept)?.procedureName ?? dept),
          )}
          onTotalChange={(total) => onDisbursedChange(project.id, total)}
        />
      )}
      {activeTab === "history" && <ProjectHistoryTab project={project} procedureLogs={procedure.data.history ?? []} />}

      {activeTab === "info" && (
        <div className="flex flex-col gap-3">
          {/* Thông tin dự án: tràn hết chiều ngang (cùng bố cục với trang thêm dự án) */}
          <Card surface="workspace" padding="none" rounded="lg" className="border border-slate-200/80 shadow-xs">
            <div className="space-y-4 p-4">
              <FieldGroup title="Thông tin chung" cols="even3">
                <InlineEditField
                  label={FIELD_LABELS.name}
                  changed={isChanged("name")}
                  value={view.name}
                  display={view.name}
                  editor={{ kind: "text", placeholder: "Tên công trình" }}
                  onSave={infoSaver("name", (v) => v)}
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
              </FieldGroup>

              <FieldGroup title="Vốn đầu tư" cols="even2">
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
              </FieldGroup>

              <FieldGroup title="Nhân sự & thời gian" cols={2}>
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
                  display={view.startDate ? formatDateVi(view.startDate) : "—"}
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
                  display={view.endDatePlanned ? formatDateVi(view.endDatePlanned) : "—"}
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
                    <div className="mt-0.5 text-xs font-semibold text-slate-900">{formatDateVi(project.actualEndDate)}</div>
                  </div>
                )}
              </FieldGroup>

              <ProjectProcedurePicker
                library={pickable}
                procedures={shownProcedures}
                tabLabels={shownLabels}
                onTabLabelChange={changeTabLabel}
                appliedNames={Object.fromEntries(
                  appliedDepartments.flatMap((dept) => {
                    const st = departmentStatus(dept);
                    return st?.procedureId ? [[st.procedureId, st.procedureName ?? dept]] : [];
                  }),
                )}
                onToggle={toggleProcedure}
                onUncheckMany={(items) => {
                  const ids = new Set(items.map((p) => p.id));
                  setProcDraft(Object.fromEntries(Object.entries(shownProcedures).filter(([, id]) => !ids.has(id))));
                  setLabelDraft((prev) => Object.fromEntries(Object.entries(prev).filter(([id]) => !ids.has(id))));
                }}
                disabled={!canEditProcedures}
                leading={{
                  label: FIELD_LABELS.type,
                  // Đổi loại dự án vẫn chờ "Lưu thay đổi" như các ô khác
                  control: (
                    <WorkTypeSelect
                      value={view.type}
                      disabled={!canEditInfo}
                      onChange={(v) => setField("type", v)}
                      className={cn(
                        isChanged("type") && "[&_.ant-select-selector]:!border-amber-400 [&_.ant-select-selector]:!bg-amber-50/60",
                      )}
                    />
                  ),
                }}
              />
            </div>
          </Card>

          {/* Tài liệu đính kèm: nằm dưới thông tin dự án */}
          <Card surface="workspace" padding="none" rounded="lg" className="border-0 shadow-xs">
            <ProjectDocumentsSection project={project} />
          </Card>
        </div>
      )}

      {/* Có thay đổi chưa lưu: nút lưu ở cuối trang, không khung */}
      {isDirty && activeTab === "info" && (
        <div className="flex flex-wrap items-center justify-end gap-2.5">
          <span className="mr-auto text-xs text-slate-600">
            Có <strong className="text-slate-900">{changeCount}</strong> thay đổi chưa lưu
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

/** Số cột theo độ rộng màn hình: màn rộng 4 cột cho đỡ trống */
const FIELD_GROUP_COLS = {
  2: "sm:grid-cols-2 xl:grid-cols-4",
  3: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  /** Nhóm đúng 3 trường: chia 3 ô bằng nhau, kín hết hàng */
  even3: "sm:grid-cols-3",
  /** Nhóm đúng 2 trường: chia đôi hàng */
  even2: "sm:grid-cols-2",
} as const;

/** Nhóm trường thông tin có tiêu đề */
function FieldGroup({
  title,
  cols = 3,
  children,
}: {
  title: string;
  cols?: keyof typeof FIELD_GROUP_COLS;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="m-0 mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">{title}</h3>
      {/* Mỗi trường là một ô nền nhạt để khối thông tin gọn, dễ dò theo hàng */}
      <div
        className={cn(
          "grid grid-cols-1 gap-2",
          "[&>*]:min-h-[52px] [&>*]:rounded-lg [&>*]:border [&>*]:border-slate-100 [&>*]:bg-slate-50/70 [&>*]:px-3 [&>*]:py-2",
          FIELD_GROUP_COLS[cols],
        )}
      >
        {children}
      </div>
    </section>
  );
}
