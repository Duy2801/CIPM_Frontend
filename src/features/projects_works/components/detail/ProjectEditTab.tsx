"use client";

import { useMemo, useState } from "react";
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  FileTextOutlined,
  PaperClipOutlined,
  PlusOutlined,
  SaveOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Button, Flex, Input, Select, StandardFileUpload, Text, detectAttachmentType } from "@/components/ui";
import {
  DEPARTMENT_OPTIONS,
  PERSONNEL_OPTIONS,
  PROJECT_STATUS_TABS,
  WORK_TYPE_OPTIONS,
} from "../../constants/project-enums";
import type {
  FundingSourceType,
  ProjectDocument,
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
  departments: string[];
  managerName: string;
  startDate: string;
  endDatePlanned: string;
  nature: ProjectNature;
  currentStage: ProjectStage;
  actualProgress: number | "";
  plannedProgress: number | "";
  note: string;
  documents: ProjectDocument[];
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
  // Form State: Cập nhật thông tin dự án
  const [formData, setFormData] = useState<FormState>({
    name: project.name || "",
    type: project.type || "Giao thông",
    fundingSource: project.fundingSource || "Ngân sách tỉnh",
    totalInvestment: project.totalInvestment ?? "",
    plan2026: project.plan2026 ?? "",
    departments: project.departments && project.departments.length > 0 ? project.departments : ["Tổ Giám sát – Kỹ thuật"],
    managerName: project.managerName || "Huỳnh Thái Hải",
    startDate: project.startDate || "",
    endDatePlanned: project.endDatePlanned || "",
    nature: project.nature || (project.actualProgress > 0 ? "transitional" : "new"),
    currentStage: project.currentStage || "BIDDING",
    actualProgress: project.actualProgress ?? 0,
    plannedProgress: project.plannedProgress ?? 0,
    note: project.note || "",
    documents: project.documents || [],
  });
  const [editErrorMsg, setEditErrorMsg] = useState<string>("");
  const [prevProjectId, setPrevProjectId] = useState<string>(project.id);

  if (project.id !== prevProjectId) {
    setPrevProjectId(project.id);
    setFormData({
      name: project.name || "",
      type: project.type || "Giao thông",
      fundingSource: project.fundingSource || "Ngân sách tỉnh",
      totalInvestment: project.totalInvestment ?? "",
      plan2026: project.plan2026 ?? "",
      departments: project.departments && project.departments.length > 0 ? project.departments : ["Tổ Giám sát – Kỹ thuật"],
      managerName: project.managerName || "Huỳnh Thái Hải",
      startDate: project.startDate || "",
      endDatePlanned: project.endDatePlanned || "",
      nature: project.nature || (project.actualProgress > 0 ? "transitional" : "new"),
      currentStage: project.currentStage || "BIDDING",
      actualProgress: project.actualProgress ?? 0,
      plannedProgress: project.plannedProgress ?? 0,
      note: project.note || "",
      documents: project.documents || [],
    });
    setEditErrorMsg("");
  }

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

    if (!formData.departments || formData.departments.length === 0) {
      setEditErrorMsg("Vui lòng chọn ít nhất một phòng ban phụ trách (*).");
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
      totalInvestment: formData.totalInvestment === "" ? (project.totalInvestment ?? 0) : Number(formData.totalInvestment),
      plan2026: formData.plan2026 === "" ? 0 : Number(formData.plan2026),
      departments: formData.departments,
      managerName: formData.managerName?.trim() || "Huỳnh Thái Hải",
      supervisorName: project.supervisorName || "Huỳnh Thái Hải",
      startDate: formData.startDate,
      endDatePlanned: formData.endDatePlanned,
      nature: formData.nature,
      currentStage: formData.currentStage || project.currentStage,
      actualProgress: formData.nature === "new" ? 0 : (formData.actualProgress === "" ? 0 : Number(formData.actualProgress)),
      plannedProgress: formData.plannedProgress === "" ? 0 : Number(formData.plannedProgress),
      note: formData.note.trim(),
      documents: formData.documents,
    };

    onUpdateProject(project.id, payload);
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

          {/* LOẠI CÔNG TRÌNH */}
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

          {/* HÀNG: CHỦ NHIỆM DỰ ÁN (1 hàng riêng biệt toàn chiều rộng) */}
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

          {/* HÀNG: PHÒNG BAN PHỤ TRÁCH (1 hàng riêng biệt dạng thẻ chọn thông minh) */}
          <div className="space-y-2">
            <Text variant="label" className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide block">
              PHÒNG BAN PHỤ TRÁCH <span className="text-rose-500">*</span>
            </Text>

            {/* Danh sách các phòng ban: mỗi phòng 1 hàng để hiển thị đầy đủ tên, rõ ràng, không bị co cụm */}
            <div className="flex flex-col gap-1.5">
              {DEPARTMENT_OPTIONS.map((dept) => {
                const isSelected = formData.departments.includes(dept.value);
                return (
                  <button
                    key={dept.value}
                    type="button"
                    onClick={() => {
                      const next = isSelected
                        ? formData.departments.filter((d: string) => d !== dept.value)
                        : [...formData.departments, dept.value];
                      setFormData({ ...formData, departments: next });
                      setEditErrorMsg("");
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-red-50/70 border-[#DC2626] text-[#DC2626] shadow-xs ring-1 ring-red-200"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`font-mono text-xs px-2 py-0.5 rounded font-bold shrink-0 ${
                          isSelected
                            ? "bg-[#DC2626] text-white"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {dept.short}
                      </span>
                      <span className="text-xs font-semibold text-slate-800" title={dept.label}>
                        {dept.value}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isSelected ? (
                        <span className="text-[11px] font-semibold text-[#DC2626] flex items-center gap-1">
                          <CheckOutlined className="text-xs" /> Đã chọn
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <PlusOutlined className="text-xs" /> Bấm để chọn
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <span className="block text-[11px] text-slate-400">
              Bấm trực tiếp vào từng phòng ban để chọn hoặc bỏ chọn phối hợp thực hiện dự án.
            </span>
          </div>

          {/* HÀNG: THỜI GIAN TRIỂN KHAI (NGÀY BẮT ĐẦU & NGÀY KẾT THÚC KẾ HOẠCH) */}
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
                    setFormData((prev: FormState) => ({
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


          {/* TÀI LIỆU DỰ ÁN (ĐÍNH KÈM) - KHÔNG BẮT BUỘC */}
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

          {editErrorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {editErrorMsg}
            </div>
          )}
        </div>
      </div>

      {/* Footer thao tác chỉnh sửa thông tin (Cố định ở đáy, nút chức năng đứng TRƯỚC, Đóng đứng SAU) */}
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
