"use client";

import React, { useEffect, useMemo, useState } from "react";
import { SaveOutlined } from "@ant-design/icons";
import { Button, Flex, Input, Modal, Select, Text } from "@/components/ui";
import {
  FUNDING_SOURCE_OPTIONS,
  PERSONNEL_OPTIONS,
  PROJECT_STATUS_TABS,
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

export interface EditProjectModalProps {
  project: ProjectItem | null;
  open: boolean;
  onClose: () => void;
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

export default function EditProjectModal({
  project,
  open,
  onClose,
  onUpdateProject,
}: EditProjectModalProps) {
  const currentFiscalYear = new Date().getFullYear();

  const [formData, setFormData] = useState<FormState>({
    name: "",
    type: "Giao thông",
    fundingSource: "Ngân sách tỉnh",
    totalInvestment: "",
    plan2026: "",
    managerName: "",
    startDate: "",
    endDatePlanned: "",
    nature: "new",
    currentStage: "BIDDING",
    actualProgress: 0,
    plannedProgress: 0,
    note: "",
  });

  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (project) {
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
      setErrorMsg("");
    }
  }, [project]);

  // Options với fallback nếu dữ liệu có sẵn không nằm trong enum mặc định
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

  if (!project) return null;

  const handleSubmit = () => {
    if (project.status === "closed") {
      setErrorMsg("Dự án đã đóng. Không thể sửa thông tin.");
      return;
    }

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
      setErrorMsg("Ràng buộc 4.2.2: Ngày kết thúc kế hoạch phải sau ngày bắt đầu.");
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
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      centered
      width="min(720px, calc(100vw - 32px))"
      className="m-0"
      destroyOnHidden
      title={
        <div className="flex items-center justify-between pb-1">
          <span className="text-base font-bold text-slate-800">Chỉnh sửa dự án</span>
        </div>
      }
      footer={[
        <Button
          key="save"
          intent="primary"
          scale="sm"
          className="bg-[#007A78] hover:bg-[#006563] text-white"
          onClick={handleSubmit}
        >
          <SaveOutlined className="mr-1" />
          Lưu dự án
        </Button>,
        <Button key="cancel" scale="sm" onClick={onClose}>
          Đóng
        </Button>,
      ]}
    >
      <div className="space-y-3.5 py-1 text-xs select-none">
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
              setErrorMsg("");
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
                setErrorMsg("");
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
                setErrorMsg("");
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
                setErrorMsg("");
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
                setErrorMsg("");
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
                setErrorMsg("");
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
                setErrorMsg("");
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
                  setErrorMsg("");
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
                  setErrorMsg("");
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

        {/* Thông báo lỗi validation */}
        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {errorMsg}
          </div>
        )}
      </div>
    </Modal>
  );
}
