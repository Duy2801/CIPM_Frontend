"use client";

import React, { useMemo, useState } from "react";
import { App } from "antd";
import { ArrowLeftOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Input,
  MoneyInput,
  Select,
  StandardFileUpload,
  detectAttachmentType,
} from "@/components/ui";
import { cn } from "@/utils/cn";
import { parseMoney } from "@/utils/format-money";
import { isSameDepartment } from "@/features/construction-procedures/constants/procedure-department-templates";
import ProjectProcedurePicker, { procedureTarget } from "./ProjectProcedurePicker";
import {
  loadProcedureLibrary,
  type ProcedureLibraryItem,
} from "@/features/construction-procedures/utils/procedure-library";
import {
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
  /** Phòng ban → id quy trình áp dụng; phòng ban phụ trách của dự án lấy theo các khóa này */
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

/** Quy trình mặc định của các phòng ban (phòng ban chưa có quy trình nào thì bỏ qua) */
function withDefaultProcedures(library: ProcedureLibraryItem[], departments: string[]) {
  const next: Record<string, string> = {};
  for (const dept of departments) {
    const id = defaultProcedureId(library, dept);
    if (id) next[dept] = id;
  }
  return next;
}

const createInitialState = (library: ProcedureLibraryItem[]): FormState => ({
  name: "",
  type: "Giao thông",
  location: "",
  fundingSource: "Ngân sách thành phố",
  totalInvestment: "",
  plan2026: "",
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

  const departments = Object.keys(form.procedures);

  /** Tích / bỏ tích quy trình: áp dụng cho phòng ban của quy trình; bỏ tích thì phòng ban đó không còn phụ trách */
  const toggleProcedure = (procedure: ProcedureLibraryItem, checked: boolean) => {
    const rest = Object.fromEntries(Object.entries(form.procedures).filter(([, id]) => id !== procedure.id));
    if (!checked) {
      update({ procedures: rest });
      return;
    }
    // Quy trình không gắn phòng ban: áp cho phòng ban đầu tiên chưa có quy trình
    const target = procedureTarget(procedure, rest);
    update({ procedures: { ...rest, [target]: procedure.id } });
  };

  /** Đổi phòng ban áp dụng của quy trình không gắn phòng ban */
  const retargetProcedure = (procedureId: string, department: string) => {
    const rest = Object.fromEntries(Object.entries(form.procedures).filter(([, id]) => id !== procedureId));
    update({ procedures: { ...rest, [department]: procedureId } });
  };

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
    if (departments.length === 0) return "Vui lòng chọn ít nhất một quy trình dự án (*).";
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
        departments,
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
      </div>

      <div className="flex flex-col gap-3">
        {/* Thông tin dự án: tràn hết chiều ngang */}
        <Card surface="workspace" padding="none" rounded="lg" className="border border-slate-200/80 shadow-xs">
          <div className="space-y-5 p-5">
            <FieldGroup title="Thông tin chung">
              <Field label="Tên công trình / dự án" required className="sm:col-span-2 xl:col-span-3">
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

            <FieldGroup title="Nhân sự & thời gian" cols={2}>
              <Field label="Người phụ trách">
                <Select
                  value={form.managerName}
                  onChange={(val) => update({ managerName: val as string })}
                  options={PERSONNEL_SELECT_OPTIONS}
                  className="w-full text-xs"
                  popupMatchSelectWidth={false}
                />
              </Field>
              <Field label="Giám sát kỹ thuật">
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

            <ProjectProcedurePicker
              library={library}
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
/** Số cột trên màn rộng: chọn theo số ô mỗi hàng để các ô dàn đều hết chiều ngang */
const FIELD_GROUP_COLS = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 xl:grid-cols-3",
} as const;

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
      <h3 className="m-0 mb-3 border-b border-slate-100 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      <div className={cn("grid grid-cols-1 gap-x-6 gap-y-3.5", FIELD_GROUP_COLS[cols])}>{children}</div>
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
