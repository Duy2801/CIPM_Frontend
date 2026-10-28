"use client";

import React, { useState } from "react";
import {
  CloseOutlined,
  DeleteOutlined,
  FileTextOutlined,
  PaperClipOutlined,
  PlusOutlined,
  SaveOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Drawer,
  Flex,
  Input,
  MoneyInput,
  Select,
  StandardFileUpload,
  Tag,
  Text,
  STANDARD_DRAWER_WIDTH,
  detectAttachmentType,
} from "@/components/ui";
import type { UploadedAttachment } from "@/components/ui";
import { parseMoney } from "@/utils/format-money";
import {
  DEPARTMENT_OPTIONS,
  FUNDING_SOURCE_OPTIONS,
  PERSONNEL_OPTIONS,
  PROJECT_STATUS_TABS,
  STAGE_BADGE_CLASSES,
  STAGE_DISPLAY_NAMES,
  WORK_TYPE_OPTIONS,
} from "../constants/project-enums";
import type {
  FundingSourceType,
  ProjectDocument,
  ProjectFormData,
  ProjectItem,
  ProjectNature,
  ProjectStage,
  ProjectWorkType,
} from "../types/project.types";

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
  nextAutoCode: string;
  editingProject?: ProjectItem | null;
  onCreateProject: (data: ProjectFormData, autoCode: string) => void;
  onUpdateProject?: (projectId: string, data: ProjectFormData) => void;
}

interface FormState {
  name: string;
  type: ProjectWorkType | "";
  fundingSource: FundingSourceType | "";
  totalInvestment: number | "";
  plan2026: number | "";
  departments: string[];
  managerName: string;
  startDate: string;
  endDatePlanned: string;
  nature: ProjectNature;
  currentStage: ProjectStage;
  actualProgress: number;
  plannedProgress: number;
  note: string;
  documents: ProjectDocument[];
}

const createInitialState = (): FormState => {
  const today = new Date().toISOString().slice(0, 10);
  return {
    name: "",
    type: "Giao thông",
    fundingSource: "Ngân sách thành phố",
    totalInvestment: "",
    plan2026: "",
    departments: ["Tổ Giám sát – Kỹ thuật", "Tổ Kế hoạch – Kỹ thuật"],
    managerName: "Huỳnh Thái Hải",
    startDate: today,
    endDatePlanned: "",
    nature: "new",
    currentStage: "PREPARATION",
    actualProgress: 0,
    plannedProgress: 0,
    note: "",
    documents: [],
  };
};

function mapProjectToFormState(project: ProjectItem): FormState {
  return {
    name: project.name,
    type: project.type,
    fundingSource: project.fundingSource,
    totalInvestment: project.totalInvestment,
    plan2026: project.plan2026,
    departments: project.departments && project.departments.length > 0
      ? project.departments
      : ["Tổ Giám sát – Kỹ thuật"],
    managerName: project.managerName || "Huỳnh Thái Hải",
    startDate: project.startDate,
    endDatePlanned: project.endDatePlanned,
    nature: project.nature || (project.actualProgress > 0 ? "transitional" : "new"),
    currentStage: project.currentStage,
    actualProgress: project.actualProgress,
    plannedProgress: project.plannedProgress,
    note: project.note || "",
    documents: project.documents || [],
  };
}

const PROJECT_NATURE_OPTIONS = [
  { value: "new", label: "Dự án mới (Khởi công mới)" },
  { value: "transitional", label: "Dự án cũ (Chuyển tiếp)" },
];

const STAGE_OPTIONS = PROJECT_STATUS_TABS.filter((t) => t.key !== "ALL").map((t) => ({
  value: t.key,
  label: t.label,
}));

export default function CreateProjectModal({
  open,
  onClose,
  nextAutoCode,
  editingProject,
  onCreateProject,
  onUpdateProject,
}: CreateProjectModalProps) {
  const isEditMode = Boolean(editingProject);
  const [formData, setFormData] = useState<FormState>(() =>
    editingProject ? mapProjectToFormState(editingProject) : createInitialState()
  );
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newDocs: ProjectDocument[] = Array.from(files).map((file) => ({
      id: `DOC-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: file.name.replace(/\.[^/.]+$/, ""),
      fileName: file.name,
      fileSize:
        file.size < 1024 * 1024
          ? `${(file.size / 1024).toFixed(1)} KB`
          : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadedAt: new Date().toISOString().slice(0, 10),
      type: file.type || "application/octet-stream",
    }));

    setFormData((prev) => ({
      ...prev,
      documents: [...(prev.documents || []), ...newDocs],
    }));

    e.target.value = "";
  };

  const handleRemoveDocument = (docId: string) => {
    setFormData((prev) => ({
      ...prev,
      documents: (prev.documents || []).filter((d) => d.id !== docId),
    }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      setErrorMsg("Vui lòng nhập tên công trình / dự án (*).");
      return;
    }
    if (!formData.type) {
      setErrorMsg("Vui lòng chọn loại công trình (*).");
      return;
    }
    if (!formData.departments || formData.departments.length === 0) {
      setErrorMsg("Vui lòng chọn ít nhất một phòng ban phụ trách (*).");
      return;
    }
    if (!formData.startDate) {
      setErrorMsg("Vui lòng chọn ngày bắt đầu (*).");
      return;
    }
    if (!formData.endDatePlanned) {
      setErrorMsg("Vui lòng chọn ngày kết thúc kế hoạch (*).");
      return;
    }
    if (new Date(formData.endDatePlanned) <= new Date(formData.startDate)) {
      setErrorMsg("Ràng buộc: Ngày kết thúc kế hoạch phải sau ngày bắt đầu.");
      return;
    }

    const payload: ProjectFormData = {
      name: formData.name.trim(),
      type: (formData.type as ProjectWorkType) || "Giao thông",
      fundingSource: (formData.fundingSource as FundingSourceType) || "Ngân sách thành phố",
      totalInvestment: formData.totalInvestment === "" ? 0 : Number(formData.totalInvestment),
      plan2026: formData.plan2026 === "" ? 0 : Number(formData.plan2026),
      departments: formData.departments,
      managerName: formData.managerName?.trim() || "Huỳnh Thái Hải",
      supervisorName: "Huỳnh Thái Hải",
      startDate: formData.startDate,
      endDatePlanned: formData.endDatePlanned,
      nature: formData.nature,
      currentStage: formData.currentStage || "PREPARATION",
      actualProgress: formData.nature === "new" ? 0 : (Number(formData.actualProgress) || 0),
      plannedProgress: Number(formData.plannedProgress) || 0,
      note: formData.note.trim(),
      documents: formData.documents,
    };

    if (editingProject && onUpdateProject) {
      onUpdateProject(editingProject.id, payload);
    } else {
      onCreateProject(payload, nextAutoCode);
    }

    onClose();
  };

  const projectCode = editingProject?.code ?? nextAutoCode;

  return (
    <Drawer
      open={open}
      closable={false}
      width={STANDARD_DRAWER_WIDTH}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-start gap-3 px-1 py-1 flex-wrap">
          <Button
            intent="primary"
            className="!bg-[#DC2626] !border-[#DC2626] text-white"
            onClick={handleSubmit}
          >
            {isEditMode ? (
              <>
                <SaveOutlined className="mr-1" />
                Lưu dự án
              </>
            ) : (
              <>
                <PlusOutlined className="mr-1" />
                Lưu dự án
              </>
            )}
          </Button>
          <Button intent="outline" onClick={onClose}>
            <CloseOutlined className="mr-1" />
            Đóng
          </Button>
        </div>
      }
      className="[&_.ant-drawer-body]:flex [&_.ant-drawer-body]:flex-col [&_.ant-drawer-body]:min-h-full"
      title={
        <div className="w-full flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Flex align="center" gap={8} className="flex-wrap">
              <span className="text-base font-bold text-[#102A43]">{projectCode}</span>
              <Tag intent="brand" scale="sm">
                {isEditMode ? "Chỉnh sửa" : "Tạo mới"}
              </Tag>
              <span
                className={`text-[11px] px-2 py-0.5 rounded font-medium border ${
                  STAGE_BADGE_CLASSES[formData.currentStage]
                }`}
              >
                {STAGE_DISPLAY_NAMES[formData.currentStage]}
              </span>
            </Flex>
            <span className="block text-xs font-normal text-slate-500 mt-1 line-clamp-1">
              {formData.name.trim()
                ? formData.name
                : "Khởi tạo hồ sơ dự án & công trình mới"}
            </span>
          </div>
        </div>
      }
    >
      <div className="flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-4">
          {/* Khối 1: Thông tin cơ bản */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3.5">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Mã dự án (Hệ thống tự sinh):</span>
              <span className="font-mono text-xs font-bold text-[#DC2626] bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                {projectCode}
              </span>
            </div>

            {/* Tên công trình */}
            <Flex vertical gap={4}>
              <Text variant="label" className="text-[11px] font-semibold text-slate-700">
                Tên công trình / dự án <span className="text-rose-500">*</span>
              </Text>
              <Input
                placeholder="VD: Khu TĐC Rạch Đùng – Giai đoạn 2"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  setErrorMsg("");
                }}
                className="text-xs"
              />
            </Flex>

            {/* Loại công trình */}
            <Flex vertical gap={4}>
              <Text variant="label" className="text-[11px] font-semibold text-slate-700">
                Loại công trình <span className="text-rose-500">*</span>
              </Text>
              <Select
                placeholder="— Chọn loại công trình —"
                value={formData.type || undefined}
                onChange={(val) => {
                  setFormData({ ...formData, type: val as ProjectWorkType });
                  setErrorMsg("");
                }}
                className="w-full text-xs"
                options={WORK_TYPE_OPTIONS.map((t) => ({ value: t, label: t }))}
              />
            </Flex>

            {/* Nguồn vốn & Tổng mức đầu tư */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Flex vertical gap={4}>
                <Text variant="label" className="text-[11px] font-semibold text-slate-700">
                  Nguồn vốn
                </Text>
                <Select
                  placeholder="— Chọn nguồn vốn —"
                  value={formData.fundingSource || undefined}
                  onChange={(val) => {
                    setFormData({ ...formData, fundingSource: val as FundingSourceType });
                    setErrorMsg("");
                  }}
                  className="w-full text-xs"
                  options={FUNDING_SOURCE_OPTIONS.map((s) => ({ value: s, label: s }))}
                />
              </Flex>

              <Flex vertical gap={4}>
                <Text variant="label" className="text-[11px] font-semibold text-slate-700">
                  Tổng mức đầu tư (VNĐ)
                </Text>
                <MoneyInput
                  placeholder="VD: 1.000.000.000"
                  value={formData.totalInvestment === "" ? "" : formData.totalInvestment}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const val = raw === "" ? "" : parseMoney(raw);
                    setFormData({ ...formData, totalInvestment: val });
                    setErrorMsg("");
                  }}
                  className="text-xs font-mono"
                />
              </Flex>
            </div>
          </div>

          {/* Khối 2: Phân công & Đơn vị phụ trách */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-4">
            <Text strong className="text-[11px] text-slate-800 uppercase tracking-wide block">
              Phân công & Đơn vị phụ trách
            </Text>

            {/* HÀNG 1: CHỦ NHIỆM DỰ ÁN (1 hàng riêng biệt toàn chiều rộng) */}
            <Flex vertical gap={4} className="w-full">
              <div className="flex items-center justify-between">
                <Text variant="label" className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">
                  Chủ nhiệm dự án <span className="text-slate-400 font-normal lowercase">(người phụ trách chung toàn dự án)</span>
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
                  setErrorMsg("");
                }}
                className="w-full text-xs"
                options={PERSONNEL_OPTIONS.map((p) => ({
                  value: p.name,
                  label: `${p.name} — ${p.role} (${p.dept})`,
                }))}
              />
            </Flex>

            {/* HÀNG 2: PHÒNG BAN PHỤ TRÁCH (Chọn qua Select & hiển thị danh sách trong khung bên dưới) */}
            <Flex vertical gap={6} className="w-full pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <Text variant="label" className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">
                  Phòng ban phụ trách <span className="text-rose-500">*</span>
                </Text>
                {formData.departments.length > 0 && (
                  <span className="text-[11px] text-slate-500 font-medium">
                    Đã chọn: <strong className="text-[#DC2626]">{formData.departments.length}</strong> phòng ban
                  </span>
                )}
              </div>

              {/* Input Select dùng để thêm phòng ban */}
              <Select
                placeholder={
                  DEPARTMENT_OPTIONS.filter((d) => !formData.departments.includes(d.value)).length > 0
                    ? "+ Chọn thêm phòng ban phụ trách..."
                    : "Đã chọn đủ tất cả phòng ban"
                }
                value={null}
                disabled={DEPARTMENT_OPTIONS.filter((d) => !formData.departments.includes(d.value)).length === 0}
                onChange={(val) => {
                  if (val && !formData.departments.includes(val)) {
                    setFormData({ ...formData, departments: [...formData.departments, val] });
                    setErrorMsg("");
                  }
                }}
                className="w-full text-xs"
                options={DEPARTMENT_OPTIONS.filter((d) => !formData.departments.includes(d.value)).map((dept) => ({
                  value: dept.value,
                  label: `${dept.short} — ${dept.value}`,
                }))}
              />

              {/* Khung hiển thị các phòng ban đã thêm */}
              {formData.departments.length > 0 ? (
                <div className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between px-1 pb-1">
                    <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                      Danh sách phòng ban đã thêm
                    </span>
                    {formData.departments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, departments: [] })}
                        className="text-[11px] text-slate-400 hover:text-red-600 cursor-pointer transition-colors"
                      >
                        Xóa tất cả
                      </button>
                    )}
                  </div>
                  {formData.departments.map((deptVal: string) => {
                    const deptInfo = DEPARTMENT_OPTIONS.find((d) => d.value === deptVal);
                    const short = deptInfo?.short || "PB";
                    return (
                      <div
                        key={deptVal}
                        className="flex items-center justify-between px-3 py-2 rounded-md bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-mono text-xs px-2 py-0.5 rounded font-bold bg-[#DC2626] text-white shrink-0">
                            {short}
                          </span>
                          <span className="text-xs font-semibold text-slate-800" title={deptVal}>
                            {deptVal}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const next = formData.departments.filter((d: string) => d !== deptVal);
                            setFormData({ ...formData, departments: next });
                          }}
                          className="text-slate-400 hover:text-[#DC2626] hover:bg-red-50 p-1 rounded-md transition-colors cursor-pointer shrink-0 ml-2"
                          title={`Xóa ${deptVal}`}
                        >
                          <CloseOutlined className="text-xs" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500">
                  Chưa có phòng ban phụ trách nào được chọn. Vui lòng chọn từ menu ở trên.
                </div>
              )}
            </Flex>
          </div>

          {/* Khối 3: Thời gian triển khai */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3.5">
            <Text strong className="text-[11px] text-slate-800 uppercase tracking-wide block">
              Thời gian triển khai
            </Text>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Flex vertical gap={4}>
                <Text variant="label" className="text-[11px] font-semibold text-slate-700">
                  Ngày bắt đầu <span className="text-rose-500">*</span>
                </Text>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => {
                    setFormData({ ...formData, startDate: e.target.value });
                    setErrorMsg("");
                  }}
                  className="font-mono text-xs"
                />
              </Flex>

              <Flex vertical gap={4}>
                <Text variant="label" className="text-[11px] font-semibold text-slate-700">
                  Ngày kết thúc <span className="text-rose-500">*</span>
                </Text>
                <Input
                  type="date"
                  value={formData.endDatePlanned}
                  onChange={(e) => {
                    setFormData({ ...formData, endDatePlanned: e.target.value });
                    setErrorMsg("");
                  }}
                  className="font-mono text-xs"
                />
              </Flex>
            </div>
          </div>

          {/* Khối 4: Tiến độ & Trạng thái */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3.5">
            <Text strong className="text-[11px] text-slate-800 uppercase tracking-wide block">
              Tiến độ & Trạng thái
            </Text>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Flex vertical gap={4}>
                <Text variant="label" className="text-[11px] font-semibold text-slate-700">
                  Tính chất dự án <span className="text-rose-500">*</span>
                </Text>
                <Select
                  value={formData.nature}
                  onChange={(val) => {
                    const nextNature = val as ProjectNature;
                    setFormData((prev) => ({
                      ...prev,
                      nature: nextNature,
                      ...(nextNature === "new" ? { actualProgress: 0 } : {}),
                    }));
                    setErrorMsg("");
                  }}
                  className="w-full text-xs"
                  options={PROJECT_NATURE_OPTIONS}
                />
              </Flex>

              <Flex vertical gap={4}>
                <Text variant="label" className="text-[11px] font-semibold text-slate-700">
                  Giai đoạn hiện tại <span className="text-rose-500">*</span>
                </Text>
                <Select
                  placeholder="— Chọn giai đoạn —"
                  value={formData.currentStage || undefined}
                  onChange={(val) => {
                    setFormData({ ...formData, currentStage: val as ProjectStage });
                    setErrorMsg("");
                  }}
                  className="w-full text-xs"
                  options={STAGE_OPTIONS}
                />
              </Flex>

              <Flex vertical gap={4}>
                <Text variant="label" className="text-[11px] font-semibold text-slate-700">
                  Tiến độ thực tế (%)
                </Text>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  disabled={formData.nature === "new"}
                  value={formData.nature === "new" ? 0 : formData.actualProgress}
                  onChange={(e) =>
                    setFormData({ ...formData, actualProgress: Number(e.target.value) })
                  }
                  className="font-mono text-xs disabled:bg-slate-100 disabled:text-slate-500"
                />
                <span className="text-[11px] text-slate-400">
                  {formData.nature === "new"
                    ? "Dự án mới: Mặc định 0%"
                    : "Dự án cũ: Cho phép cập nhật %"}
                </span>
              </Flex>

              <Flex vertical gap={4}>
                <Text variant="label" className="text-[11px] font-semibold text-slate-700">
                  Tiến độ kế hoạch (%)
                </Text>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.plannedProgress}
                  onChange={(e) =>
                    setFormData({ ...formData, plannedProgress: Number(e.target.value) })
                  }
                  className="font-mono text-xs"
                />
                <span className="text-[11px] text-slate-400">
                  Mục tiêu kế hoạch tiến độ cần đạt
                </span>
              </Flex>
            </div>
          </div>

          {/* Khối 5: Tài liệu đính kèm (Không bắt buộc) */}
          <StandardFileUpload
            title="Đính kèm hồ sơ / tài liệu dự án (PDF, DOCX, XLSX, Ảnh)"
            subTitle="Chấp nhận .pdf, .docx, .doc, .xlsx, .png, .jpg (Không bắt buộc)"
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

          {/* Error Message */}
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
