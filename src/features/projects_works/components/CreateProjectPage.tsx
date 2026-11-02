"use client";

import React, { useMemo, useState } from "react";
import { App } from "antd";
import { ArrowLeftOutlined, CloseOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Checkbox,
  Input,
  MoneyInput,
  Select,
  StandardFileUpload,
  detectAttachmentType,
} from "@/components/ui";
import { cn } from "@/utils/cn";
import { parseMoney } from "@/utils/format-money";
import { isSameDepartment } from "@/features/construction-procedures/constants/procedure-department-templates";
import {
  loadProcedureLibrary,
  type ProcedureLibraryItem,
} from "@/features/construction-procedures/utils/procedure-library";
import {
  DEPARTMENT_OPTIONS,
  FUNDING_SOURCE_OPTIONS,
  PERSONNEL_OPTIONS,
  WORK_TYPE_OPTIONS,
} from "../constants/project-enums";
import type {
  FundingSourceType,
  ProjectDocument,
  ProjectFormData,
  ProjectNature,
  ProjectWorkType,
} from "../types/project.types";

interface CreateProjectPageProps {
  nextAutoCode: string;
  onBack: () => void;
  onCreateProject: (data: ProjectFormData, autoCode: string) => void;
}

interface FormState {
  name: string;
  type: ProjectWorkType | "";
  location: string;
  fundingSource: FundingSourceType | "";
  totalInvestment: number | "";
  plan2026: number | "";
  departments: string[];
  /** Phòng ban → id quy trình áp dụng */
  procedures: Record<string, string>;
  managerName: string;
  supervisorName: string;
  startDate: string;
  endDatePlanned: string;
  nature: ProjectNature;
  documents: ProjectDocument[];
}

const DEFAULT_DEPARTMENTS = ["Tổ Giám sát – Kỹ thuật", "Tổ Kế hoạch – Kỹ thuật"];
const DEFAULT_PERSON = "Huỳnh Thái Hải";

/** Quy trình mặc định của phòng ban: quy trình đang bật của chính phòng ban, ưu tiên quy trình đã duyệt */
function defaultProcedureId(library: ProcedureLibraryItem[], department: string) {
  const own = library.filter((p) => p.enabled && p.department && isSameDepartment(p.department, department));
  return (own.find((p) => p.status === "APPLIED") ?? own[0])?.id;
}

/** Giữ quy trình của phòng ban còn lại; phòng ban mới thêm (chưa có trong `previous`) lấy quy trình mặc định */
function withDefaultProcedures(
  library: ProcedureLibraryItem[],
  departments: string[],
  current: Record<string, string> = {},
  previous: string[] = [],
) {
  const next: Record<string, string> = {};
  for (const dept of departments) {
    const id = previous.includes(dept) ? current[dept] : (current[dept] ?? defaultProcedureId(library, dept));
    if (id) next[dept] = id;
  }
  return next;
}

/** Phòng ban (theo danh mục dự án) của quy trình; quy trình tự tạo không gắn phòng ban → undefined */
const procedureDepartment = (procedure: ProcedureLibraryItem) =>
  procedure.department
    ? (DEPARTMENT_OPTIONS.find((d) => isSameDepartment(d.value, procedure.department))?.value ?? procedure.department)
    : undefined;

const createInitialState = (library: ProcedureLibraryItem[]): FormState => ({
  name: "",
  type: "Giao thông",
  location: "",
  fundingSource: "Ngân sách thành phố",
  totalInvestment: "",
  plan2026: "",
  departments: DEFAULT_DEPARTMENTS,
  procedures: withDefaultProcedures(library, DEFAULT_DEPARTMENTS),
  managerName: DEFAULT_PERSON,
  supervisorName: DEFAULT_PERSON,
  startDate: new Date().toISOString().slice(0, 10),
  endDatePlanned: "",
  nature: "new",
  documents: [],
});

const PROJECT_NATURE_OPTIONS = [
  { value: "new", label: "Dự án mới (Khởi công mới)" },
  { value: "transitional", label: "Dự án cũ (Chuyển tiếp)" },
];

const PERSONNEL_SELECT_OPTIONS = PERSONNEL_OPTIONS.map((p) => ({
  value: p.name,
  label: `${p.name} — ${p.role} (${p.dept})`,
}));

/** Trang "Thêm dự án mới": cùng bố cục với trang chi tiết dự án, chọn luôn quy trình áp dụng cho từng phòng ban */
export default function CreateProjectPage({ nextAutoCode, onBack, onCreateProject }: CreateProjectPageProps) {
  const { modal } = App.useApp();
  // Chỉ quy trình đang bật mới được chọn áp dụng
  const library = useMemo(() => loadProcedureLibrary().filter((p) => p.enabled), []);
  const [initial] = useState(() => createInitialState(library));
  const [form, setForm] = useState<FormState>(initial);
  const [errorMsg, setErrorMsg] = useState("");

  const isDirty = JSON.stringify(form) !== JSON.stringify(initial);

  const update = (patch: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setErrorMsg("");
  };

  const setDepartments = (departments: string[]) =>
    update({ departments, procedures: withDefaultProcedures(library, departments, form.procedures, form.departments) });

  /** Tích / bỏ tích quy trình: áp dụng cho phòng ban của quy trình (tự thêm phòng ban nếu chưa có) */
  const toggleProcedure = (procedure: ProcedureLibraryItem, checked: boolean) => {
    const rest = Object.fromEntries(Object.entries(form.procedures).filter(([, id]) => id !== procedure.id));
    if (!checked) {
      update({ procedures: rest });
      return;
    }
    // Quy trình không gắn phòng ban: áp cho phòng ban đầu tiên chưa có quy trình
    const target = procedureDepartment(procedure) ?? form.departments.find((d) => !rest[d]) ?? form.departments[0];
    if (!target) {
      setErrorMsg("Chọn phòng ban phụ trách trước khi chọn quy trình không gắn phòng ban.");
      return;
    }
    update({
      departments: form.departments.includes(target) ? form.departments : [...form.departments, target],
      procedures: { ...rest, [target]: procedure.id },
    });
  };

  /** Đổi phòng ban áp dụng của quy trình không gắn phòng ban */
  const retargetProcedure = (procedureId: string, department: string) => {
    const rest = Object.fromEntries(Object.entries(form.procedures).filter(([, id]) => id !== procedureId));
    update({ procedures: { ...rest, [department]: procedureId } });
  };

  const remainingDepartments = DEPARTMENT_OPTIONS.filter((d) => !form.departments.includes(d.value));

  const handleBack = () => {
    if (!isDirty) {
      onBack();
      return;
    }
    modal.confirm({
      centered: true,
      width: 420,
      title: "Bỏ dự án đang nhập?",
      content: <p className="m-0 text-xs text-slate-600">Thông tin đã nhập chưa được lưu sẽ bị bỏ.</p>,
      okText: "Bỏ thông tin",
      cancelText: "Tiếp tục nhập",
      okButtonProps: { danger: true },
      onOk: onBack,
    });
  };

  const validate = () => {
    if (!form.name.trim()) return "Vui lòng nhập tên công trình / dự án (*).";
    if (!form.type) return "Vui lòng chọn loại công trình (*).";
    if (form.departments.length === 0) return "Vui lòng chọn ít nhất một phòng ban phụ trách (*).";
    if (!form.startDate) return "Vui lòng chọn ngày bắt đầu (*).";
    if (!form.endDatePlanned) return "Vui lòng chọn ngày kết thúc kế hoạch (*).";
    if (new Date(form.endDatePlanned) <= new Date(form.startDate))
      return "Ràng buộc: Ngày kết thúc kế hoạch phải sau ngày bắt đầu.";
    return "";
  };

  const handleSubmit = () => {
    const error = validate();
    if (error) {
      setErrorMsg(error);
      return;
    }

    onCreateProject(
      {
        name: form.name.trim(),
        type: form.type || "Giao thông",
        location: form.location.trim() || undefined,
        fundingSource: form.fundingSource || "Ngân sách thành phố",
        totalInvestment: form.totalInvestment === "" ? 0 : Number(form.totalInvestment),
        plan2026: form.plan2026 === "" ? 0 : Number(form.plan2026),
        departments: form.departments,
        managerName: form.managerName.trim() || DEFAULT_PERSON,
        supervisorName: form.supervisorName.trim() || DEFAULT_PERSON,
        startDate: form.startDate,
        endDatePlanned: form.endDatePlanned,
        nature: form.nature,
        currentStage: "PREPARATION",
        actualProgress: 0,
        plannedProgress: 0,
        note: "",
        documents: form.documents,
        procedures: form.procedures,
      },
      nextAutoCode,
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Đầu trang: quay lại + mã dự án tự sinh */}
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <Button
          intent="outline"
          scale="compact"
          icon={<ArrowLeftOutlined />}
          aria-label="Quay lại danh sách dự án"
          title="Quay lại danh sách dự án"
          onClick={handleBack}
          className="h-9! w-9! shrink-0 p-0!"
        />
        <h1 className="m-0 min-w-0 truncate text-base font-bold text-slate-900">
          Thêm dự án mới{form.name.trim() && <span className="text-[#DC2626]"> {form.name.trim()}</span>}
        </h1>
        <span className="rounded border border-slate-200 bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-bold text-[#DC2626]">
          {nextAutoCode}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {/* Thông tin dự án: tràn hết chiều ngang */}
        <Card surface="workspace" padding="none" rounded="lg" className="border border-slate-200/80 shadow-xs">
          <div className="space-y-5 p-5">
            <FieldGroup title="Thông tin chung">
              <Field label="Tên công trình / dự án" required className="sm:col-span-2 xl:col-span-4">
                <Input
                  autoFocus
                  placeholder="VD: Khu TĐC Rạch Đùng – Giai đoạn 2"
                  value={form.name}
                  onChange={(e) => update({ name: e.target.value })}
                  className="w-full text-xs"
                />
              </Field>
              <Field label="Loại dự án" required>
                <Select
                  placeholder="— Chọn loại công trình —"
                  value={form.type || undefined}
                  onChange={(val) => update({ type: val as ProjectWorkType })}
                  options={WORK_TYPE_OPTIONS.map((t) => ({ value: t, label: t }))}
                  className="w-full text-xs"
                />
              </Field>
              <Field label="Tính chất dự án" required>
                <Select
                  value={form.nature}
                  onChange={(val) => update({ nature: val as ProjectNature })}
                  options={PROJECT_NATURE_OPTIONS}
                  className="w-full text-xs"
                />
              </Field>
              <Field label="Địa bàn xây dựng">
                <Input
                  placeholder="TP. Hà Tiên"
                  value={form.location}
                  onChange={(e) => update({ location: e.target.value })}
                  className="w-full text-xs"
                />
              </Field>
            </FieldGroup>

            <FieldGroup title="Vốn đầu tư">
              <Field label="Nguồn vốn">
                <Select
                  value={form.fundingSource || undefined}
                  onChange={(val) => update({ fundingSource: val as FundingSourceType })}
                  options={FUNDING_SOURCE_OPTIONS.map((s) => ({ value: s, label: s }))}
                  className="w-full text-xs"
                />
              </Field>
              <Field label="Tổng mức đầu tư (VNĐ)">
                <MoneyInput
                  placeholder="VD: 1.000.000.000"
                  value={form.totalInvestment}
                  onChange={(e) => update({ totalInvestment: e.target.value === "" ? "" : parseMoney(e.target.value) })}
                  className="w-full font-mono text-xs"
                />
              </Field>
              <Field label={`Kế hoạch vốn ${new Date().getFullYear()} (VNĐ)`}>
                <MoneyInput
                  placeholder="Chưa giao kế hoạch"
                  value={form.plan2026}
                  onChange={(e) => update({ plan2026: e.target.value === "" ? "" : parseMoney(e.target.value) })}
                  className="w-full font-mono text-xs"
                />
              </Field>
            </FieldGroup>

            <FieldGroup title="Nhân sự & thời gian">
              <Field label="Người phụ trách" className="xl:col-span-2">
                <Select
                  value={form.managerName}
                  onChange={(val) => update({ managerName: val as string })}
                  options={PERSONNEL_SELECT_OPTIONS}
                  className="w-full text-xs"
                  popupMatchSelectWidth={false}
                />
              </Field>
              <Field label="Giám sát kỹ thuật" className="xl:col-span-2">
                <Select
                  value={form.supervisorName}
                  onChange={(val) => update({ supervisorName: val as string })}
                  options={PERSONNEL_SELECT_OPTIONS}
                  className="w-full text-xs"
                  popupMatchSelectWidth={false}
                />
              </Field>
              <Field label="Ngày bắt đầu" required>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => update({ startDate: e.target.value })}
                  className="w-full font-mono text-xs"
                />
              </Field>
              <Field label="Ngày kết thúc" required>
                <Input
                  type="date"
                  value={form.endDatePlanned}
                  onChange={(e) => update({ endDatePlanned: e.target.value })}
                  className="w-full font-mono text-xs"
                />
              </Field>
            </FieldGroup>

            <DepartmentProcedures
              departments={form.departments}
              procedures={form.procedures}
              library={library}
              remaining={remainingDepartments}
              onDepartmentsChange={setDepartments}
            />

            <ProcedurePicker
              library={library}
              departments={form.departments}
              procedures={form.procedures}
              onToggle={toggleProcedure}
              onRetarget={retargetProcedure}
            />
          </div>
        </Card>

        {/* Tài liệu đính kèm: nằm dưới thông tin dự án */}
        <Card surface="workspace" padding="none" rounded="lg" className="border border-slate-200/80 shadow-xs">
          <div className="p-4">
            <StandardFileUpload
              title="Tài liệu đính kèm (PDF, DOCX, XLSX, Ảnh)"
              subTitle="Chấp nhận .pdf, .docx, .doc, .xlsx, .png, .jpg (Không bắt buộc)"
              value={form.documents.map((doc) => ({
                id: doc.id,
                name: doc.fileName || doc.name,
                size: doc.fileSize || "1.0 MB",
                type: detectAttachmentType(doc.fileName || doc.name),
              }))}
              onChange={(files) =>
                update({
                  documents: files.map((f) => ({
                    id: f.id,
                    name: f.name.replace(/\.[^/.]+$/, ""),
                    fileName: f.name,
                    fileSize: f.size,
                    uploadedAt: new Date().toISOString().slice(0, 10),
                    type: f.rawFile?.type || "application/octet-stream",
                  })),
                })
              }
            />
          </div>
        </Card>
      </div>

      {/* Thanh lưu bám đáy màn hình */}
      <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
        <span className={cn("mr-auto text-xs", errorMsg ? "font-medium text-rose-600" : "text-slate-500")}>
          {errorMsg || "Các trường có dấu * là bắt buộc"}
        </span>
        <Button intent="outline" scale="sm" onClick={handleBack} className="px-5">
          Hủy
        </Button>
        <Button
          intent="primary"
          scale="sm"
          icon={<PlusOutlined />}
          onClick={handleSubmit}
          className="!bg-[#DC2626] !border-[#DC2626] hover:!bg-[#B91C1C] px-5 font-semibold"
        >
          Lưu dự án
        </Button>
      </div>
    </div>
  );
}

/** Nhóm trường có tiêu đề; lưới 4 cột trên màn rộng (giống trang chi tiết dự án) */
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

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <span className="mb-1 block text-[11px] font-medium text-slate-500">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
    </div>
  );
}

interface DepartmentProceduresProps {
  departments: string[];
  procedures: Record<string, string>;
  library: ProcedureLibraryItem[];
  remaining: readonly (typeof DEPARTMENT_OPTIONS)[number][];
  onDepartmentsChange: (next: string[]) => void;
}

/** Phòng ban phụ trách; mỗi dòng hiện quy trình đang chọn cho phòng ban đó */
function DepartmentProcedures({ departments, procedures, library, remaining, onDepartmentsChange }: DepartmentProceduresProps) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-1.5">
        <h3 className="m-0 text-[11px] font-bold uppercase tracking-wide text-slate-500">
          Phòng ban phụ trách <span className="text-rose-500">*</span>
        </h3>
        {departments.length > 1 && (
          <button
            type="button"
            onClick={() => onDepartmentsChange([])}
            className="cursor-pointer border-0 bg-transparent p-0 text-[11px] text-slate-400 transition-colors hover:text-red-600"
          >
            Xóa tất cả
          </button>
        )}
      </div>

      <Select
        placeholder={remaining.length > 0 ? "+ Chọn thêm phòng ban phụ trách..." : "Đã chọn đủ tất cả phòng ban"}
        value={null}
        disabled={remaining.length === 0}
        onChange={(val) => val && onDepartmentsChange([...departments, val as string])}
        options={remaining.map((d) => ({ value: d.value, label: `${d.short} — ${d.value}` }))}
        className="w-full text-xs"
      />

      {departments.length > 0 ? (
        <div className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200">
          {departments.map((dept) => {
            const short = DEPARTMENT_OPTIONS.find((d) => d.value === dept)?.short ?? "PB";
            const procedure = library.find((p) => p.id === procedures[dept]);
            return (
              <div key={dept} className="flex items-center gap-3 bg-white px-3 py-2">
                <span className="shrink-0 rounded bg-[#DC2626] px-2 py-0.5 font-mono text-xs font-bold text-white">
                  {short}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800" title={dept}>
                  {dept}
                </span>
                <span
                  className={cn("min-w-0 truncate text-[11px]", procedure ? "text-slate-600" : "italic text-slate-400")}
                  title={procedure?.name}
                >
                  {procedure ? `Quy trình: ${procedure.name}` : "Chưa chọn quy trình"}
                </span>
                <button
                  type="button"
                  onClick={() => onDepartmentsChange(departments.filter((d) => d !== dept))}
                  className="shrink-0 cursor-pointer rounded-md border-0 bg-transparent p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-[#DC2626]"
                  title={`Xóa ${dept}`}
                  aria-label={`Xóa ${dept}`}
                >
                  <CloseOutlined className="text-xs" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-center text-xs text-slate-500">
          Chưa có phòng ban phụ trách nào được chọn. Vui lòng chọn từ menu ở trên.
        </div>
      )}
    </section>
  );
}

interface ProcedurePickerProps {
  library: ProcedureLibraryItem[];
  departments: string[];
  procedures: Record<string, string>;
  onToggle: (procedure: ProcedureLibraryItem, checked: boolean) => void;
  onRetarget: (procedureId: string, department: string) => void;
}

/** Tích chọn nhiều quy trình cho dự án; mỗi phòng ban áp dụng một quy trình */
function ProcedurePicker({ library, departments, procedures, onToggle, onRetarget }: ProcedurePickerProps) {
  // Quy trình đang tích → phòng ban áp dụng
  const appliedTo = new Map(Object.entries(procedures).map(([dept, id]) => [id, dept]));

  return (
    <section>
      <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-1.5">
        <h3 className="m-0 text-[11px] font-bold uppercase tracking-wide text-slate-500">Quy trình dự án</h3>
        <span className="text-[11px] text-slate-500">
          Đã chọn: <strong className="text-[#DC2626]">{appliedTo.size}</strong> quy trình
        </span>
      </div>

      {library.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-center text-xs text-slate-500">
          Chưa có quy trình nào đang bật trong phân hệ Quy trình.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          {library.map((procedure) => {
            const dept = procedureDepartment(procedure);
            const target = appliedTo.get(procedure.id);
            const checked = Boolean(target);
            const short = DEPARTMENT_OPTIONS.find((d) => d.value === dept)?.short;
            const meta = [short ?? dept ?? "Không gắn phòng ban", `${procedure.steps.length} bước`];
            if (procedure.version) meta.push(`Version ${procedure.version}`);
            return (
              <div
                key={procedure.id}
                className={cn(
                  "rounded-lg border px-3 py-2 transition-colors",
                  checked ? "border-[#DC2626]/50 bg-red-50/40" : "border-slate-200 bg-white hover:border-slate-300",
                )}
              >
                <Checkbox
                  checked={checked}
                  onChange={(e) => onToggle(procedure, e.target.checked)}
                  className="w-full text-xs [&>span:last-child]:min-w-0"
                >
                  <span className="block truncate text-xs font-semibold text-slate-800" title={procedure.name}>
                    {procedure.name}
                  </span>
                  <span className="block text-[11px] text-slate-500">{meta.join(" · ")}</span>
                </Checkbox>
                {/* Quy trình không gắn phòng ban: chọn phòng ban áp dụng */}
                {checked && !dept && (
                  <Select
                    size="small"
                    aria-label={`Phòng ban áp dụng ${procedure.name}`}
                    value={target}
                    onChange={(v) => onRetarget(procedure.id, v as string)}
                    options={departments.map((d) => ({ value: d, label: `Áp dụng cho: ${d}` }))}
                    className="mt-1.5 w-full text-xs"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
      <p className="m-0 mt-1.5 text-[11px] text-slate-400">
        Mỗi phòng ban áp dụng một quy trình: tích quy trình khác cùng phòng ban sẽ thay quy trình cũ. Phòng ban của quy
        trình được thêm tự động. Có thể đổi lại ở tab “Quy trình” của dự án.
      </p>
    </section>
  );
}
