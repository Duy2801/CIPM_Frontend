"use client";

import React, { useState } from "react";
import {
  CloseOutlined,
  PlusOutlined,
  RollbackOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import {
  Button,
  Drawer,
  Flex,
  Input,
  Select,
  Tag,
  Text,
} from "@/components/ui";
import {
  FUNDING_SOURCE_OPTIONS,
  PERSONNEL_OPTIONS,
  PROJECT_STATUS_TABS,
  STAGE_BADGE_CLASSES,
  STAGE_DISPLAY_NAMES,
  WORK_TYPE_OPTIONS,
} from "../constants/project-enums";
import type {
  FundingSourceType,
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
  managerName: string;
  startDate: string;
  endDatePlanned: string;
  nature: ProjectNature;
  currentStage: ProjectStage;
  actualProgress: number;
  plannedProgress: number;
  note: string;
}

const createInitialState = (): FormState => {
  const today = new Date().toISOString().slice(0, 10);
  return {
    name: "",
    type: "Giao thông",
    fundingSource: "Ngân sách thành phố",
    totalInvestment: "",
    plan2026: "",
    managerName: "",
    startDate: today,
    endDatePlanned: "",
    nature: "new",
    currentStage: "PREPARATION",
    actualProgress: 0,
    plannedProgress: 0,
    note: "",
  };
};

function mapProjectToFormState(project: ProjectItem): FormState {
  return {
    name: project.name,
    type: project.type,
    fundingSource: project.fundingSource,
    totalInvestment: project.totalInvestment,
    plan2026: project.plan2026,
    managerName: project.managerName,
    startDate: project.startDate,
    endDatePlanned: project.endDatePlanned,
    nature: project.nature || (project.actualProgress > 0 ? "transitional" : "new"),
    currentStage: project.currentStage,
    actualProgress: project.actualProgress,
    plannedProgress: project.plannedProgress,
    note: project.note || "",
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

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      setErrorMsg("Vui lòng nhập tên công trình / dự án (*).");
      return;
    }
    if (!formData.type) {
      setErrorMsg("Vui lòng chọn loại công trình (*).");
      return;
    }
    if (!formData.fundingSource) {
      setErrorMsg("Vui lòng chọn nguồn vốn (*).");
      return;
    }
    if (formData.totalInvestment === "" || Number(formData.totalInvestment) <= 0) {
      setErrorMsg("Vui lòng nhập tổng mức đầu tư lớn hơn 0 (*).");
      return;
    }
    if (!formData.managerName) {
      setErrorMsg("Vui lòng chọn người phụ trách chính (*).");
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
      totalInvestment: Number(formData.totalInvestment),
      plan2026: formData.plan2026 === "" ? 0 : Number(formData.plan2026),
      managerName: formData.managerName,
      supervisorName: "Nguyễn Văn An",
      startDate: formData.startDate,
      endDatePlanned: formData.endDatePlanned,
      nature: formData.nature,
      currentStage: formData.currentStage || "PREPARATION",
      actualProgress: formData.nature === "new" ? 0 : (Number(formData.actualProgress) || 0),
      plannedProgress: Number(formData.plannedProgress) || 0,
      note: formData.note.trim(),
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
      width="min(680px, 100vw)"
      onClose={onClose}
      footer={
        <div className="flex items-center justify-start gap-3 px-1 py-1">
          <Button
            intent="primary"
            className="!bg-[#007A78] !border-[#007A78] text-white"
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
              <span className="font-mono text-xs font-bold text-[#007A78] bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
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

            {/* Loại công trình & Nguồn vốn */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              <Flex vertical gap={4}>
                <Text variant="label" className="text-[11px] font-semibold text-slate-700">
                  Nguồn vốn <span className="text-rose-500">*</span>
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
            </div>
          </div>

          {/* Khối 2: Vốn đầu tư & Thời gian triển khai */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3.5">
            <Text strong className="text-[11px] text-slate-800 uppercase tracking-wide block">
              Vốn đầu tư & Thời gian triển khai
            </Text>

            {/* Hàng 1: Tổng mức đầu tư & Kế hoạch vốn 2026 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Flex vertical gap={4}>
                <Text variant="label" className="text-[11px] font-semibold text-slate-700">
                  Tổng mức đầu tư<span className="text-rose-500">*</span>
                </Text>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="VD: 12.50"
                  value={formData.totalInvestment}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      totalInvestment: e.target.value === "" ? "" : Number(e.target.value),
                    });
                    setErrorMsg("");
                  }}
                  className="font-mono text-xs"
                />
              </Flex>

              <Flex vertical gap={4}>
                <Text variant="label" className="text-[11px] font-semibold text-slate-700">
                  Kế hoạch vốn 2026
                </Text>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="VD: 8.00"
                  value={formData.plan2026}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      plan2026: e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                  className="font-mono text-xs"
                />
              </Flex>
            </div>

            {/* Hàng 2: Người phụ trách chính & Ngày bắt đầu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Flex vertical gap={4}>
                <Text variant="label" className="text-[11px] font-semibold text-slate-700">
                  Người phụ trách chính <span className="text-rose-500">*</span>
                </Text>
                <Select
                  placeholder="— Chọn người phụ trách —"
                  value={formData.managerName || undefined}
                  onChange={(val) => {
                    setFormData({ ...formData, managerName: val });
                    setErrorMsg("");
                  }}
                  className="w-full text-xs"
                  options={PERSONNEL_OPTIONS.map((p) => ({
                    value: p.name,
                    label: `${p.name} (${p.role})`,
                  }))}
                />
              </Flex>

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
            </div>

            {/* Hàng 3: Ngày kết thúc kế hoạch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Flex vertical gap={4}>
                <Text variant="label" className="text-[11px] font-semibold text-slate-700">
                  Ngày kết thúc kế hoạch <span className="text-rose-500">*</span>
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
              <div className="hidden sm:block" />
            </div>
          </div>

          {/* Khối 3: Tiến độ & Trạng thái */}
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

          {/* Khối 4: Ghi chú */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-2">
            <Text variant="label" className="text-[11px] font-semibold text-slate-700 block">
              Ghi chú
            </Text>
            <textarea
              rows={3}
              placeholder="Mô tả chi tiết, lưu ý đặc biệt..."
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#007A78] focus:ring-1 focus:ring-[#007A78] transition-all resize-y"
            />
          </div>

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
