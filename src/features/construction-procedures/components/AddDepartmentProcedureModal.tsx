"use client";

import React, { useState, useEffect } from "react";
import {
  CheckOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Input, Modal, Select, Tag, Tooltip } from "@/components/ui";
import type { ProcedureStep } from "../types/procedure.types";
import {
  DEPARTMENT_PROCEDURE_TEMPLATES,
  getDepartmentStaff,
} from "../constants/procedure-department-templates";

interface AddDepartmentProcedureModalProps {
  open: boolean;
  onClose: () => void;
  departmentName: string;
  projectName: string;
  onConfirmAddProcedure: (newSteps: ProcedureStep[]) => void;
}

export default function AddDepartmentProcedureModal({
  open,
  onClose,
  departmentName,
  projectName,
  onConfirmAddProcedure,
}: AddDepartmentProcedureModalProps) {
  const template = DEPARTMENT_PROCEDURE_TEMPLATES[departmentName];
  const staffList = getDepartmentStaff(departmentName);

  // Danh sách các bước đang cấu hình
  const [editingSteps, setEditingSteps] = useState<ProcedureStep[]>(() => {
    if (template) return template.createSteps();
    return [];
  });

  // Khi modal mở hoặc đổi department
  useEffect(() => {
    if (template) {
      setEditingSteps(template.createSteps());
    } else {
      // Mẫu mặc định nếu phòng ban chưa có template sẵn
      setEditingSteps([
        {
          id: `step-${Date.now()}-1`,
          order: 1,
          code: "B-01",
          groupCode: "PB",
          groupTitle: departmentName,
          name: `Nhiệm vụ chuyên môn 1 (${departmentName})`,
          type: "MANDATORY",
          responsibleUnit: departmentName,
          department: departmentName,
          durationMargin: "5–10 ngày",
          durationDaysMin: 5,
          durationDaysMax: 10,
          isEnabled: true,
          status: "NOT_STARTED",
          plannedDays: 7,
          attachments: [],
        },
      ]);
    }
  }, [departmentName, template, open]);

  // Cập nhật người thực hiện cho 1 bước
  const handleAssignMember = (stepId: string, memberName: string) => {
    const memberObj = staffList.find((s) => s.name === memberName);
    setEditingSteps((prev) =>
      prev.map((s) => {
        if (s.id === stepId) {
          return {
            ...s,
            assignedTo: memberName,
            assignedToId: memberObj?.id,
            assignedBy: "Lead " + departmentName,
            assignedAt: new Date().toISOString().slice(0, 10),
          };
        }
        return s;
      })
    );
  };

  // Thêm bước mới
  const handleAddNewStep = () => {
    const nextOrder = editingSteps.length + 1;
    const prefix = departmentName.includes("Giám sát")
      ? "GS"
      : departmentName.includes("Kế hoạch")
      ? "KH"
      : departmentName.includes("Đấu thầu")
      ? "DT"
      : departmentName.includes("Bồi thường")
      ? "BT"
      : "PB";

    const newStep: ProcedureStep = {
      id: `custom-step-${Date.now()}`,
      order: nextOrder,
      code: `${prefix}-0${nextOrder}`,
      groupCode: prefix,
      groupTitle: departmentName,
      name: "",
      type: "MANDATORY",
      responsibleUnit: departmentName,
      department: departmentName,
      durationMargin: "5–7 ngày",
      durationDaysMin: 5,
      durationDaysMax: 7,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 5,
      attachments: [],
    };
    setEditingSteps([...editingSteps, newStep]);
  };

  // Xóa bước
  const handleDeleteStep = (stepId: string) => {
    setEditingSteps((prev) => prev.filter((s) => s.id !== stepId));
  };

  // Cập nhật tên bước
  const handleStepNameChange = (stepId: string, name: string) => {
    setEditingSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, name } : s))
    );
  };

  const handleSave = () => {
    if (editingSteps.length === 0) {
      alert("Vui lòng thêm ít nhất 1 bước thủ tục.");
      return;
    }
    const emptyNameStep = editingSteps.find((s) => !s.name.trim());
    if (emptyNameStep) {
      alert("Vui lòng nhập đầy đủ tên cho tất cả các bước thủ tục.");
      return;
    }
    onConfirmAddProcedure(editingSteps);
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      centered
      width={900}
      title={
        <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
          <div>
            <div className="leading-tight">
              Thêm Quy trình Thủ tục Phòng ban — <span className="text-[#DC2626]">{departmentName}</span>
            </div>
            <div className="text-xs font-normal text-slate-500 mt-0.5">
              Áp dụng cho dự án: <strong>{projectName}</strong>
            </div>
          </div>
        </div>
      }
      footer={[
        <Button key="cancel" scale="compact" onClick={onClose}>
          Hủy bỏ
        </Button>,
        <Button
          key="confirm"
          intent="primary"
          scale="compact"
          icon={<CheckOutlined />}
          className="bg-[#DC2626] hover:bg-red-700 text-white font-semibold"
          onClick={handleSave}
        >
          Xác nhận thêm ({editingSteps.length} bước)
        </Button>,
      ]}
    >
      <div className="py-2 space-y-4">
        {/* Banner hướng dẫn Lead */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900 flex items-start gap-2.5">
          <InfoCircleOutlined className="text-blue-600 text-sm mt-0.5 shrink-0" />
          <div className="leading-relaxed">
            Là <strong>Lead (Tổ trưởng) {departmentName}</strong>, bạn có toàn quyền định nghĩa quy trình chuyên môn của phòng ban và <strong>phân công người thực hiện</strong> cho từng thành viên trong tổ. Sau khi thêm, các bước sẽ hiển thị ngay tại Màn hình số 3.
          </div>
        </div>

        {/* Danh sách các bước của phòng ban */}
        <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
          {editingSteps.map((step, idx) => (
            <div
              key={step.id}
              className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs hover:border-slate-300 transition-all flex flex-col gap-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {step.code || `B-${idx + 1}`}
                  </span>
                  <Tag intent={step.type === "MANDATORY" ? "info" : "warning"} scale="sm">
                    {step.type === "MANDATORY" ? "Bắt buộc" : "Điều kiện"}
                  </Tag>
                  <Tag intent="default" scale="sm">
                    {step.durationMargin || "Theo kế hoạch"}
                  </Tag>
                </div>

                <div className="flex items-center gap-2">
                  {/* Phân công thành viên phụ trách */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <UserOutlined className="text-slate-400" />
                    <span className="font-medium text-slate-500">Người thực hiện:</span>
                    <Select
                      className="w-44 h-7 text-xs"
                      placeholder="— Chọn thành viên —"
                      value={step.assignedTo || undefined}
                      onChange={(val) => handleAssignMember(step.id, val as string)}
                      options={staffList.map((st) => ({
                        value: st.name,
                        label: `${st.name} (${st.title})`,
                      }))}
                    />
                  </div>

                  <Button
                    scale="xs"
                    intent="outline"
                    className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:border-rose-300"
                    onClick={() => handleDeleteStep(step.id)}
                    title="Xóa bước này"
                  >
                    <DeleteOutlined className="text-xs" />
                  </Button>
                </div>
              </div>

              {/* Tên bước */}
              <div>
                <Input
                  className="w-full text-xs h-8 font-medium text-slate-800"
                  placeholder="Nhập tên bước công việc..."
                  value={step.name}
                  onChange={(e) => handleStepNameChange(step.id, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Nút thêm bước mới */}
        <div className="pt-1">
          <Button
            intent="outline"
            scale="compact"
            icon={<PlusOutlined />}
            onClick={handleAddNewStep}
            className="w-full text-xs font-semibold border-dashed border-slate-300 text-slate-700 hover:text-[#DC2626] hover:border-[#DC2626]"
          >
            + Thêm bước thủ tục mới cho {departmentName}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
