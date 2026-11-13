"use client";

import { useMemo, useState } from "react";
import {
  CloseOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { Button, Flex, Input, Select, StandardFileUpload, Text, detectAttachmentType } from "@/components/ui";
import {
  PERSONNEL_OPTIONS,
  PROJECT_STATUS_TABS,
  WORK_TYPE_OPTIONS,
} from "../../../constants/project-enums";
import type {
  ProjectFormData,
  ProjectItem,
  ProjectNature,
  ProjectStage,
  ProjectWorkType,
} from "../../../types/project.types";
import {
  formFromProject,
  toEditProjectFormData,
  validateEditForm,
  type EditProjectForm,
} from "../../../utils/edit-project-form";
import ProjectDepartmentsField from "./ProjectDepartmentsField";

interface ProjectEditTabProps {
  project: ProjectItem;
  onBackToView: () => void;
  onUpdateProject: (projectId: string, data: ProjectFormData) => void;
}

const PROJECT_NATURE_OPTIONS = [
  { value: "new", label: "Dự án mới (Khởi công mới)" },
  { value: "transitional", label: "Dự án cũ (Chuyển tiếp)" },
];

const STAGE_OPTIONS = PROJECT_STATUS_TABS.filter((t) => t.key !== "ALL").map((t) => ({
  value: t.key,
  label: t.label,
}));

export default function ProjectEditTab({
  project,
  onBackToView,
  onUpdateProject,
}: ProjectEditTabProps) {
  const [formData, setFormData] = useState<EditProjectForm>(() => formFromProject(project));
  const [editErrorMsg, setEditErrorMsg] = useState<string>("");
  const [prevProjectId, setPrevProjectId] = useState<string>(project.id);

  if (project.id !== prevProjectId) {
    setPrevProjectId(project.id);
    setFormData(formFromProject(project));
    setEditErrorMsg("");
  }

  const personnelOptions = useMemo(() => {
    const base = PERSONNEL_OPTIONS.map((p) => ({
      value: p.name,
      label: `${p.name} (${p.role})`,
    }));
    if (formData.managerName && !base.some((b) => b.value === formData.managerName)) {
      return [{ value: formData.managerName, label: formData.managerName }, ...base];
    }
    return base;
  }, [formData.managerName]);

  const handleUpdateProjectSubmit = () => {
    const error = validateEditForm(formData, project);
    if (error) {
      setEditErrorMsg(error);
      return;
    }
    onUpdateProject(project.id, toEditProjectFormData(formData, project));
  };

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="rounded-xl border border-slate-200 p-4 space-y-3.5">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Mã dự án (Cố định):</span>
            <span className="font-mono text-xs font-bold text-[#DC2626] bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
              {project.code}
            </span>
          </div>

          <Flex vertical gap={4}>
            <Text variant="label" className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">
              TÊN CÔNG TRÌNH <span className="text-rose-500">*</span>
            </Text>
            <Input
              placeholder="VD: Cầu Tô Châu nối dài..."
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setEditErrorMsg("");
              }}
              className="text-xs"
            />
          </Flex>

          <Flex vertical gap={4}>
            <Text variant="label" className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">
              LOẠI CÔNG TRÌNH <span className="text-rose-500">*</span>
            </Text>
            <Select
              placeholder="— Chọn loại công trình —"
              value={formData.type || undefined}
              onChange={(val) => {
                setFormData({ ...formData, type: val as ProjectWorkType });
                setEditErrorMsg("");
              }}
              className="w-full text-xs"
              options={WORK_TYPE_OPTIONS.map((t) => ({ value: t, label: t }))}
            />
          </Flex>

          <Flex vertical gap={4} className="w-full">
            <div className="flex items-center justify-between">
              <Text variant="label" className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">
                CHỦ NHIỆM DỰ ÁN <span className="text-slate-400 font-normal lowercase">(người phụ trách chung toàn dự án)</span>
              </Text>
              <span className="text-[10px] text-[#DC2626] bg-red-50 px-2 py-0.5 rounded border border-red-200 font-medium">
                Mặc định Giám đốc BQL
              </span>
            </div>
            <Select
              placeholder="— Chọn chủ nhiệm dự án —"
              value={formData.managerName || "Huỳnh Thái Hải"}
              onChange={(val) => {
                setFormData({ ...formData, managerName: val });
                setEditErrorMsg("");
              }}
              className="w-full text-xs"
              options={personnelOptions}
            />
          </Flex>

          <ProjectDepartmentsField
            departments={formData.departments}
            onChange={(departments) => {
              setFormData({ ...formData, departments });
              setEditErrorMsg("");
            }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Flex vertical gap={4}>
              <Text variant="label" className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">
                NGÀY BẮT ĐẦU <span className="text-rose-500">*</span>
              </Text>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => {
                  setFormData({ ...formData, startDate: e.target.value });
                  setEditErrorMsg("");
                }}
                className="font-mono text-xs"
              />
            </Flex>

            <Flex vertical gap={4}>
              <Text variant="label" className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">
                NGÀY KẾT THÚC KẾ HOẠCH <span className="text-rose-500">*</span>
              </Text>
              <Input
                type="date"
                value={formData.endDatePlanned}
                onChange={(e) => {
                  setFormData({ ...formData, endDatePlanned: e.target.value });
                  setEditErrorMsg("");
                }}
                className="font-mono text-xs"
              />
            </Flex>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <Text strong className="text-[11px] text-[#DC2626] uppercase tracking-wider block mb-2.5 font-bold">
              TIẾN ĐỘ & TRẠNG THÁI
            </Text>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Flex vertical gap={4}>
                <Text variant="label" className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">
                  TÍNH CHẤT DỰ ÁN <span className="text-rose-500">*</span>
                </Text>
                <Select
                  value={formData.nature}
                  onChange={(val) => {
                    const nextNature = val as ProjectNature;
                    setFormData((prev: EditProjectForm) => ({
                      ...prev,
                      nature: nextNature,
                      ...(nextNature === "new" ? { actualProgress: 0 } : {}),
                    }));
                    setEditErrorMsg("");
                  }}
                  className="w-full text-xs"
                  options={PROJECT_NATURE_OPTIONS}
                />
              </Flex>

              <Flex vertical gap={4}>
                <Text variant="label" className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">
                  GIAI ĐOẠN HIỆN TẠI <span className="text-rose-500">*</span>
                </Text>
                <Select
                  placeholder="— Chọn giai đoạn —"
                  value={formData.currentStage || undefined}
                  onChange={(val) => {
                    setFormData({ ...formData, currentStage: val as ProjectStage });
                    setEditErrorMsg("");
                  }}
                  className="w-full text-xs"
                  options={STAGE_OPTIONS}
                />
              </Flex>

              <Flex vertical gap={4}>
                <Text variant="label" className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">
                  TIẾN ĐỘ THỰC TẾ (%)
                </Text>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0"
                  disabled={formData.nature === "new"}
                  value={formData.nature === "new" ? 0 : formData.actualProgress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      actualProgress: e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                  className="font-mono text-xs disabled:bg-slate-100 disabled:text-slate-500"
                />
                <span className="text-[11px] text-slate-400 mt-0.5">
                  {formData.nature === "new"
                    ? "Dự án mới: Mặc định 0%"
                    : "Dự án cũ: Cho phép cập nhật %"}
                </span>
              </Flex>

              <Flex vertical gap={4}>
                <Text variant="label" className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">
                  TIẾN ĐỘ KẾ HOẠCH (%)
                </Text>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0"
                  value={formData.plannedProgress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      plannedProgress: e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                  className="font-mono text-xs"
                />
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Mục tiêu kế hoạch tiến độ cần đạt
                </span>
              </Flex>
            </div>
          </div>

          <StandardFileUpload
            title="Đính kèm hồ sơ / tài liệu dự án (PDF, DOCX, XLSX, Ảnh)"
            value={(formData.documents || []).map((doc) => ({
              id: doc.id,
              name: doc.fileName || doc.name,
              size: doc.fileSize || "1.0 MB",
              type: detectAttachmentType(doc.fileName || doc.name),
            }))}
            onChange={(files) => {
              const updatedDocs = files.map((f) => ({
                id: f.id,
                name: f.name.replace(/\.[^/.]+$/, ""),
                fileName: f.name,
                fileSize: f.size,
                uploadedAt: new Date().toISOString().slice(0, 10),
                type: f.rawFile?.type || "application/octet-stream",
              }));
              setFormData((prev) => ({ ...prev, documents: updatedDocs }));
            }}
          />

          {editErrorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {editErrorMsg}
            </div>
          )}
        </div>
      </div>

      <footer className="shrink-0 border-t border-slate-200 bg-white px-5 py-3 flex items-center justify-start gap-2.5 z-10 shadow-[0_-2px_8px_rgba(0,0,0,0.03)] flex-wrap">
        <Button
          intent="primary"
          scale="sm"
          className="bg-[#DC2626] border-[#DC2626] hover:bg-[#B91C1C] text-white"
          onClick={handleUpdateProjectSubmit}
        >
          <SaveOutlined className="mr-1" />
          Lưu dự án
        </Button>
        <Button scale="sm" onClick={onBackToView}>
          <CloseOutlined className="mr-1" />
          Đóng
        </Button>
      </footer>
    </div>
  );
}
