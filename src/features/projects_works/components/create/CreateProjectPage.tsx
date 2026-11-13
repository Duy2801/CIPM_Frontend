"use client";

import { useState } from "react";
import { App } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Input,
  Select,
  StandardFileUpload,
  detectAttachmentType,
} from "@/components/ui";
import { PERSONNEL_SELECT_OPTIONS, PROJECT_NATURE_OPTIONS } from "../../constants/project-enums";
import { useCreateProjectForm } from "../../hooks/useCreateProjectForm";
import type { ProjectFormData, ProjectNature } from "@/shared/projects_works/types/project.types";
import { NATURE_STORAGE_KEY } from "../../utils/custom-options";
import CustomOptionSelect from "../shared/CustomOptionSelect";
import FundingSourceRows from "../shared/FundingSourceRows";
import ProjectProcedurePicker from "../shared/ProjectProcedurePicker";
import WorkTypeSelect from "../shared/WorkTypeSelect";
import { FormField, FormFieldGroup } from "./ProjectFormFields";

interface CreateProjectPageProps {
  nextAutoCode: string;
  onBack: () => void;
  onCreateProject: (data: ProjectFormData, autoCode: string, files: File[]) => void;
}

export default function CreateProjectPage({ nextAutoCode, onBack, onCreateProject }: CreateProjectPageProps) {
  const { modal } = App.useApp();
  const [rawFiles, setRawFiles] = useState<Record<string, File>>({});
  const { form, update, library, toggleProcedure, submit, errorMsg, isDirty } = useCreateProjectForm((data) =>
    onCreateProject(
      data,
      nextAutoCode,
      (data.documents ?? []).flatMap((doc) => (rawFiles[doc.id] ? [rawFiles[doc.id]] : [])),
    ),
  );

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

  return (
    <div className="flex flex-col gap-3">
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
        <Card surface="workspace" padding="none" rounded="lg" className="border border-slate-200/80 shadow-xs">
          <div className="space-y-5 p-5">
            <FormFieldGroup title="Thông tin chung">
              <FormField label="Tên công trình / dự án" required className="sm:col-span-2 xl:col-span-3">
                <Input
                  autoFocus
                  placeholder="VD: Khu TĐC Rạch Đùng – Giai đoạn 2"
                  value={form.name}
                  onChange={(e) => update({ name: e.target.value })}
                  className="w-full text-xs"
                />
              </FormField>
              <FormField label="Tính chất dự án" required>
                <CustomOptionSelect
                  storageKey={NATURE_STORAGE_KEY}
                  baseOptions={PROJECT_NATURE_OPTIONS}
                  value={form.nature}
                  onChange={(val) => update({ nature: val as ProjectNature })}
                  addPlaceholder="Nhập tính chất dự án mới..."
                />
              </FormField>
              <FormField label="Địa bàn xây dựng">
                <Input
                  placeholder="TP. Hà Tiên"
                  value={form.location}
                  onChange={(e) => update({ location: e.target.value })}
                  className="w-full text-xs"
                />
              </FormField>
            </FormFieldGroup>

            <FormFieldGroup title="Vốn đầu tư" cols={1}>
              <FundingSourceRows value={form.fundings} onChange={(fundings) => update({ fundings })} />
            </FormFieldGroup>

            <FormFieldGroup title="Nhân sự & thời gian" cols={2}>
              <FormField label="Người phụ trách">
                <Select
                  value={form.managerName}
                  onChange={(val) => update({ managerName: val as string })}
                  options={PERSONNEL_SELECT_OPTIONS}
                  className="w-full text-xs"
                />
              </FormField>
              <FormField label="Giám sát kỹ thuật">
                <Select
                  value={form.supervisorName}
                  onChange={(val) => update({ supervisorName: val as string })}
                  options={PERSONNEL_SELECT_OPTIONS}
                  className="w-full text-xs"
                />
              </FormField>
              <FormField label="Ngày bắt đầu" required>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => update({ startDate: e.target.value })}
                  className="w-full font-mono text-xs"
                />
              </FormField>
              <FormField label="Ngày kết thúc" required>
                <Input
                  type="date"
                  value={form.endDatePlanned}
                  onChange={(e) => update({ endDatePlanned: e.target.value })}
                  className="w-full font-mono text-xs"
                />
              </FormField>
            </FormFieldGroup>

            <ProjectProcedurePicker
              library={library}
              procedures={form.procedures}
              onToggle={toggleProcedure}
              onUncheckMany={(items) => {
                const ids = new Set(items.map((p) => p.id));
                update({
                  procedures: Object.fromEntries(Object.entries(form.procedures).filter(([, id]) => !ids.has(id))),
                  tabLabels: Object.fromEntries(Object.entries(form.tabLabels).filter(([id]) => !ids.has(id))),
                });
              }}
              leading={{
                label: "Loại dự án",
                control: (
                  <WorkTypeSelect value={form.type} onChange={(val) => update({ type: val })} />
                ),
              }}
              tabLabels={form.tabLabels}
              onTabLabelChange={(procedureId, label) => {
                const rest = Object.fromEntries(Object.entries(form.tabLabels).filter(([id]) => id !== procedureId));
                update({ tabLabels: label.trim() ? { ...rest, [procedureId]: label.trim() } : rest });
              }}
            />
          </div>
        </Card>

        <Card surface="workspace" padding="none" rounded="lg" className="border border-slate-200/80 shadow-xs">
          <div className="p-4">
            <StandardFileUpload
              title="Tài liệu đính kèm (PDF, DOCX, XLSX, Ảnh)"
              value={form.documents.map((doc) => ({
                id: doc.id,
                name: doc.fileName || doc.name,
                size: doc.fileSize || "1.0 MB",
                type: detectAttachmentType(doc.fileName || doc.name),
              }))}
              onChange={(files) => {
                setRawFiles((prev) =>
                  Object.fromEntries(
                    files.flatMap((f) => {
                      const raw = f.rawFile ?? prev[f.id];
                      return raw ? [[f.id, raw]] : [];
                    }),
                  ),
                );
                update({
                  documents: files.map((f) => ({
                    id: f.id,
                    name: f.name.replace(/\.[^/.]+$/, ""),
                    fileName: f.name,
                    fileSize: f.size,
                    uploadedAt: new Date().toISOString().slice(0, 10),
                    type: f.rawFile?.type || "application/octet-stream",
                  })),
                });
              }}
            />
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2.5">
        {errorMsg && <span className="mr-auto text-xs font-medium text-rose-600">{errorMsg}</span>}
        <Button intent="outline" scale="sm" onClick={handleBack} className="px-5">
          Hủy
        </Button>
        <Button
          intent="primary"
          scale="sm"
          onClick={submit}
          className="!bg-[#DC2626] !border-[#DC2626] hover:!bg-[#B91C1C] px-5 font-semibold"
        >
          Lưu dự án
        </Button>
      </div>
    </div>
  );
}

