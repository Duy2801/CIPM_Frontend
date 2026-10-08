"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CloseOutlined, RollbackOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Flex, Input, Select, Text } from "@/components/ui";
import {
  FUNDING_SOURCE_OPTIONS,
  PERSONNEL_OPTIONS,
  PROJECT_STATUS_TABS,
  WORK_TYPE_OPTIONS,
} from "../../constants/project-enums";
import type {
  FundingSourceType,
  ProjectFormData,
  ProjectItem,
  ProjectNature,
  ProjectStage,
  ProjectWorkType,
} from "../../types/project.types";

interface ProjectEditTabProps {
  project: ProjectItem;
  onBackToView: () => void;
  onUpdateProject: (projectId: string, data: ProjectFormData) => void;
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
  actualProgress: number | "";
  plannedProgress: number | "";
  note: string;
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
  const currentFiscalYear = new Date().getFullYear();

  // Form State: Cập nhật thông tin dự án
  const [formData, setFormData] = useState<FormState>({
    name: project.name || "",
    type: project.type || "Giao thông",
    fundingSource: project.fundingSource || "Ngân sách tỉnh",
    totalInvestment: project.totalInvestment ?? "",
    plan2026: project.plan2026 ?? "",
    managerName: project.managerName || "",
    startDate: project.startDate || "",
    endDatePlanned: project.endDatePlanned || "",
    nature: project.nature || (project.actualProgress > 0 ? "transitional" : "new"),
    currentStage: project.currentStage || "BIDDING",
    actualProgress: project.actualProgress ?? 0,
    plannedProgress: project.plannedProgress ?? 0,
    note: project.note || "",
  });
  const [editErrorMsg, setEditErrorMsg] = useState<string>("");

  useEffect(() => {
    setFormData({
      name: project.name || "",
      type: project.type || "Giao thông",
      fundingSource: project.fundingSource || "Ngân sách tỉnh",
      totalInvestment: project.totalInvestment ?? "",
      plan2026: project.plan2026 ?? "",
      managerName: project.managerName || "",
      startDate: project.startDate || "",
      endDatePlanned: project.endDatePlanned || "",
      nature: project.nature || (project.actualProgress > 0 ? "transitional" : "new"),
      currentStage: project.currentStage || "BIDDING",
      actualProgress: project.actualProgress ?? 0,
      plannedProgress: project.plannedProgress ?? 0,
      note: project.note || "",
    });
    setEditErrorMsg("");
  }, [project]);

  // Options người phụ trách & nguồn vốn có fallback
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

  const fundingSourceOptions = useMemo(() => {
    const base = FUNDING_SOURCE_OPTIONS.map((s) => ({ value: s, label: s }));
    if (formData.fundingSource && !base.some((b) => b.value === formData.fundingSource)) {
      return [{ value: formData.fundingSource, label: formData.fundingSource }, ...base];
    }
    return base;
  }, [formData.fundingSource]);

  // Xử lý lưu thông tin dự án
  const handleUpdateProjectSubmit = () => {
    if (project.status === "closed") {
      setEditErrorMsg("Dự án đã đóng. Không thể sửa thông tin.");
      return;
    }

    if (!formData.name.trim()) {
      setEditErrorMsg("Vui lòng nhập tên công trình / dự án (*).");
      return;
    }

    if (!formData.type) {
      setEditErrorMsg("Vui lòng chọn loại công trình (*).");
      return;
    }

    if (!formData.fundingSource) {
      setEditErrorMsg("Vui lòng chọn nguồn vốn (*).");
      return;
    }

    if (formData.totalInvestment === "" || Number(formData.totalInvestment) <= 0) {
      setEditErrorMsg("Vui lòng nhập tổng mức đầu tư lớn hơn 0 (*).");
      return;
    }

    if (!formData.managerName) {
      setEditErrorMsg("Vui lòng chọn người phụ trách chính (*).");
      return;
    }

    if (!formData.startDate) {
      setEditErrorMsg("Vui lòng chọn ngày bắt đầu (*).");
      return;
    }

    if (!formData.endDatePlanned) {
      setEditErrorMsg("Vui lòng chọn ngày kết thúc kế hoạch (*).");
      return;
    }

    if (new Date(formData.endDatePlanned) <= new Date(formData.startDate)) {
      setEditErrorMsg("Ràng buộc 4.2.2: Ngày kết thúc kế hoạch phải sau ngày bắt đầu.");
      return;
    }

    const payload: ProjectFormData = {
      name: formData.name.trim(),
      type: (formData.type as ProjectWorkType) || project.type,
      location: project.location,
      scale: project.scale,
      fundingSource: (formData.fundingSource as FundingSourceType) || project.fundingSource,
      totalInvestment: Number(formData.totalInvestment),
      plan2026: formData.plan2026 === "" ? 0 : Number(formData.plan2026),
      managerName: formData.managerName,
      supervisorName: project.supervisorName,
      startDate: formData.startDate,
      endDatePlanned: formData.endDatePlanned,
      nature: formData.nature,
      currentStage: formData.currentStage || project.currentStage,
      actualProgress: formData.nature === "new" ? 0 : (formData.actualProgress === "" ? 0 : Number(formData.actualProgress)),
      plannedProgress: formData.plannedProgress === "" ? 0 : Number(formData.plannedProgress),
      note: formData.note.trim(),
    };

    onUpdateProject(project.id, payload);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="rounded-xl border border-slate-200 p-4 space-y-3.5">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Mã dự án (Cố định):</span>
            <span className="font-mono text-xs font-bold text-[#007A78] bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
              {project.code}
            </span>
          </div>

          {/* TÊN CÔNG TRÌNH */}
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

          {/* LOẠI CÔNG TRÌNH & NGUỒN VỐN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            <Flex vertical gap={4}>
              <Text variant="label" className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">
                NGUỒN VỐN <span className="text-rose-500">*</span>
              </Text>
              <Select
                placeholder="— Chọn nguồn vốn —"
                value={formData.fundingSource || undefined}
                onChange={(val) => {
                  setFormData({ ...formData, fundingSource: val as FundingSourceType });
                  setEditErrorMsg("");
                }}
                className="w-full text-xs"
                options={fundingSourceOptions}
              />
            </Flex>
          </div>

          {/* TỔNG MỨC ĐẦU TƯ & KẾ HOẠCH VỐN 2026 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Flex vertical gap={4}>
              <Text variant="label" className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">
                TỔNG MỨC ĐẦU TƯ (TỶ ĐỒNG) <span className="text-rose-500">*</span>
              </Text>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="VD: 8.4"
                value={formData.totalInvestment}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    totalInvestment: e.target.value === "" ? "" : Number(e.target.value),
                  });
                  setEditErrorMsg("");
                }}
                className="font-mono text-xs"
              />
            </Flex>

            <Flex vertical gap={4}>
              <Text variant="label" className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">
                KẾ HOẠCH VỐN {currentFiscalYear} (TỶ ĐỒNG)
              </Text>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="VD: 5.0"
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

          {/* NGƯỜI PHỤ TRÁCH CHÍNH & NGÀY BẮT ĐẦU */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Flex vertical gap={4}>
              <Text variant="label" className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">
                NGƯỜI PHỤ TRÁCH CHÍNH <span className="text-rose-500">*</span>
              </Text>
              <Select
                placeholder="— Chọn người phụ trách —"
                value={formData.managerName || undefined}
                onChange={(val) => {
                  setFormData({ ...formData, managerName: val });
                  setEditErrorMsg("");
                }}
                className="w-full text-xs"
                options={personnelOptions}
              />
            </Flex>

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
          </div>

          {/* NGÀY KẾT THÚC KẾ HOẠCH */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <div className="hidden sm:block" />
          </div>

          {/* TIẾN ĐỘ & TRẠNG THÁI */}
          <div className="pt-2 border-t border-slate-100">
            <Text strong className="text-[11px] text-slate-500 uppercase tracking-wider block mb-2.5 font-bold">
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
                    setFormData((prev) => ({
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

          {/* GHI CHÚ */}
          <Flex vertical gap={4} className="pt-1">
            <Text variant="label" className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">
              GHI CHÚ
            </Text>
            <textarea
              rows={3}
              placeholder="Mô tả chi tiết, lưu ý đặc biệt..."
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#007A78] focus:ring-1 focus:ring-[#007A78] transition-all resize-y"
            />
          </Flex>

          {editErrorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {editErrorMsg}
            </div>
          )}
        </div>
      </div>

      {/* Footer thao tác chỉnh sửa thông tin (Cố định ở đáy, nút chức năng đứng TRƯỚC, Đóng đứng SAU) */}
      <footer className="shrink-0 border-t border-slate-200 bg-white px-5 py-3 flex items-center justify-start gap-2.5 z-10 shadow-[0_-2px_8px_rgba(0,0,0,0.03)]">
        <Button
          intent="primary"
          scale="sm"
          className="bg-[#007A78] border-[#007A78] hover:bg-[#005F5D] text-white"
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
