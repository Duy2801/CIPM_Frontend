"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ApartmentOutlined,
  CheckCircleOutlined,
  ExclamationCircleFilled,
  FileTextOutlined,
  PartitionOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Form, Input, Select, Tag } from "@/components/ui";
import { formatDateVi } from "@/utils/date";
import { DEPARTMENT_OPTIONS } from "@/features/projects_works/constants/project-enums";
import { getSharedProjects } from "@/stores/project.store";
import { OVERLOAD_THRESHOLD, PROCEDURE_STAGE_GROUPS } from "../constants/personnel-labels";
import type {
  PersonnelDataset,
  PersonnelProject,
  ProjectLeadershipInput,
} from "../types/personnel.types";
import { getWorkload } from "../utils/personnel-rules";

interface ProjectLeadershipModalProps {
  data: PersonnelDataset;
  project?: PersonnelProject;
  errorText?: string;
  onClose: () => void;
  onSubmit: (input: ProjectLeadershipInput) => Promise<boolean>;
}

export const CIPM_DEPARTMENTS = [
  {
    code: "KHKT",
    short: "KHKT",
    name: "Tổ Kế hoạch – Kỹ thuật",
    fullName: "Tổ Kế hoạch – Kỹ thuật (Chuẩn bị ĐT & Thiết kế)",
  },
  {
    code: "GSKT",
    short: "GSKT",
    name: "Tổ Giám sát – Kỹ thuật",
    fullName: "Tổ Giám sát – Kỹ thuật",
  },
  {
    code: "BT",
    short: "BT",
    name: "Tổ Bồi thường – GPMB – TĐC",
    fullName: "Tổ Bồi thường – GPMB – TĐC",
  },
  {
    code: "DT",
    short: "DT",
    name: "Tổ Quản lý Đấu thầu",
    fullName: "Tổ Quản lý Đấu thầu",
  },
  {
    code: "HCTH",
    short: "HCTH",
    name: "Tổ Hành chính – Tổng hợp",
    fullName: "Tổ Hành chính – Tổng hợp (Tài chính - Kế toán)",
  },
];

export function toDeptCode(dept?: string): string {
  if (!dept) return "GSKT";
  const upper = dept.toUpperCase().trim();
  if (upper.includes("KẾ HOẠCH") || upper === "KHKT") return "KHKT";
  if (upper.includes("GIÁM SÁT") || upper === "GSKT") return "GSKT";
  if (upper.includes("BỒI THƯỜNG") || upper.includes("GPMB") || upper === "BT") return "BT";
  if (upper.includes("ĐẤU THẦU") || upper === "DT") return "DT";
  if (upper.includes("HÀNH CHÍNH") || upper.includes("TỔNG HỢP") || upper === "HCTH") return "HCTH";
  return dept;
}

// Hàm gợi ý phòng ban mặc định theo tính chất từng giai đoạn
function getDefaultDeptForStage(stageCode: string, availableDepts: string[]): string {
  const normalized = (availableDepts || []).map(toDeptCode);
  if (["I", "II", "IV", "V"].includes(stageCode)) {
    if (normalized.includes("KHKT")) return "KHKT";
  }
  if (stageCode === "III") {
    if (normalized.includes("DT")) return "DT";
    if (normalized.includes("KHKT")) return "KHKT";
  }
  if (stageCode === "VI") {
    if (normalized.includes("GSKT")) return "GSKT";
    if (normalized.includes("BT")) return "BT";
  }
  if (stageCode === "VII") {
    if (normalized.includes("HCTH")) return "HCTH";
    if (normalized.includes("GSKT")) return "GSKT";
    if (normalized.includes("KHKT")) return "KHKT";
  }
  return normalized[0] || "GSKT";
}

export default function ProjectLeadershipModal({
  data,
  project,
  errorText,
  onClose,
  onSubmit,
}: ProjectLeadershipModalProps) {
  const [form] = Form.useForm<ProjectLeadershipInput>();
  const [submitting, setSubmitting] = useState(false);

  // Lọc danh sách dự án
  const unassignedProjects = useMemo(() => {
    return data.projects.filter((p) => !p.mainExecutorId || p.cndaRevoked);
  }, [data.projects]);

  const watchedProjectId = Form.useWatch("projectId", form);
  const displayProject = project || (watchedProjectId ? data.projects.find((p) => p.id === watchedProjectId) : undefined);

  // Tìm Giám đốc mặc định
  const defaultDirector = useMemo(() => {
    return (
      data.staff.find((s) => s.id === "ST-001") ||
      data.staff.find((s) => s.name === "Huỳnh Thái Hải") ||
      data.staff.find((s) => s.title.includes("Giám đốc") && s.roleCode === "ADMIN") ||
      data.staff[0]
    );
  }, [data.staff]);

  // Xác định Chủ nhiệm dự án (Người phụ trách chung) từ Màn hình 2
  const currentManagerName = useMemo(() => {
    if (displayProject?.managerName) return displayProject.managerName;
    if (displayProject?.mainExecutorId) {
      const staff = data.staff.find((s) => s.id === displayProject.mainExecutorId);
      if (staff) return staff.name;
    }
    const sharedPrj = getSharedProjects().find((p) => p.id === displayProject?.id);
    if (sharedPrj?.managerName) return sharedPrj.managerName;
    return defaultDirector?.name || "Huỳnh Thái Hải";
  }, [displayProject, data.staff, defaultDirector]);

  const currentManagerStaff = useMemo(() => {
    return (
      data.staff.find(
        (s) => s.name === currentManagerName || s.id === displayProject?.mainExecutorId
      ) || defaultDirector
    );
  }, [data.staff, currentManagerName, displayProject?.mainExecutorId, defaultDirector]);

  // Xác định danh sách phòng ban ban đầu của dự án (từ project hoặc sharedStore)
  const initialDepts = useMemo(() => {
    let rawDepts: string[] = [];
    if (displayProject?.departments && displayProject.departments.length > 0) {
      rawDepts = displayProject.departments;
    } else {
      const sharedPrj = getSharedProjects().find((p) => p.id === displayProject?.id);
      if (sharedPrj?.departments && sharedPrj.departments.length > 0) {
        rawDepts = sharedPrj.departments;
      } else {
        rawDepts = ["GSKT", "KHKT", "BT"];
      }
    }
    return Array.from(new Set(rawDepts.map(toDeptCode)));
  }, [displayProject]);

  const [selectedDepts, setSelectedDepts] = useState<string[]>(initialDepts);

  // Khởi tạo phân công 7 giai đoạn
  const [stageDeptMap, setStageDeptMap] = useState<Record<string, string>>(() => {
    const initialMap: Record<string, string> = {};
    PROCEDURE_STAGE_GROUPS.forEach((st) => {
      const existingAssignment = displayProject
        ? data.assignments.find(
            (a) =>
              a.projectId === displayProject.id &&
              a.assignmentLevel === "PHASE_LEAD" &&
              a.stage === st.value
          )
        : undefined;

      if (existingAssignment?.teamId) {
        const dept = toDeptCode(existingAssignment.teamId);
        if (initialDepts.includes(dept)) {
          initialMap[st.value] = dept;
        } else {
          initialMap[st.value] = getDefaultDeptForStage(st.value, initialDepts);
        }
      } else {
        initialMap[st.value] = getDefaultDeptForStage(st.value, initialDepts);
      }
    });
    return initialMap;
  });

  // Đồng bộ khi đổi displayProject
  useEffect(() => {
    if (displayProject) {
      const rawDepts =
        displayProject.departments && displayProject.departments.length > 0
          ? displayProject.departments
          : getSharedProjects().find((p) => p.id === displayProject.id)?.departments || ["GSKT", "KHKT", "BT"];

      const depts = Array.from(new Set(rawDepts.map(toDeptCode)));
      setSelectedDepts(depts);

      const newMap: Record<string, string> = {};
      PROCEDURE_STAGE_GROUPS.forEach((st) => {
        const existingAssignment = data.assignments.find(
          (a) =>
            a.projectId === displayProject.id &&
            a.assignmentLevel === "PHASE_LEAD" &&
            a.stage === st.value
        );
        if (existingAssignment?.teamId) {
          const dept = toDeptCode(existingAssignment.teamId);
          if (depts.includes(dept)) {
            newMap[st.value] = dept;
          } else {
            newMap[st.value] = getDefaultDeptForStage(st.value, depts);
          }
        } else {
          newMap[st.value] = getDefaultDeptForStage(st.value, depts);
        }
      });
      setStageDeptMap(newMap);

      form.setFieldsValue({
        projectId: displayProject.id,
        mainExecutorId: currentManagerStaff?.id || displayProject.mainExecutorId || defaultDirector?.id || "ST-001",
        mainSupervisorId: displayProject.mainSupervisorId || currentManagerStaff?.id || defaultDirector?.id || "ST-001",
        note: displayProject.note,
      });
    } else {
      form.resetFields();
      setSelectedDepts(["GSKT", "KHKT", "BT"]);
    }
  }, [displayProject, defaultDirector, currentManagerStaff, form, data.assignments]);


  // Cập nhật khi user thêm/bớt phòng ban phụ trách dự án
  const handleDepartmentsChange = (newDepts: string[]) => {
    const normalized = newDepts.map(toDeptCode);
    setSelectedDepts(normalized);
  };

  // Cập nhật khi user chọn phòng ban cho một giai đoạn cụ thể
  const handleStageDeptChange = (stageCode: string, dept: string) => {
    const code = toDeptCode(dept);
    setStageDeptMap((prev) => ({
      ...prev,
      [stageCode]: code,
    }));
  };

  const handleFinish = async (values: ProjectLeadershipInput) => {
    setSubmitting(true);
    try {
      const targetProjectId = project ? project.id : values.projectId;
      const stageAssignments = PROCEDURE_STAGE_GROUPS.map((st) => {
        const currentDept = stageDeptMap[st.value];
        const dept =
          currentDept && selectedDepts.includes(currentDept)
            ? currentDept
            : getDefaultDeptForStage(st.value, selectedDepts);
        return {
          stageCode: st.value,
          stageTitle: st.fullName,
          department: dept,
        };
      });

      const allDepts = Array.from(new Set(selectedDepts.map(toDeptCode)));

      const payload: ProjectLeadershipInput = {
        projectId: targetProjectId,
        mainExecutorId: currentManagerStaff?.id || displayProject?.mainExecutorId || defaultDirector?.id || "ST-001",
        mainSupervisorId: values.mainSupervisorId || currentManagerStaff?.id || defaultDirector?.id || "ST-001",
        departments: allDepts,
        stageAssignments,
        note: values.note?.trim(),
      };

      const success = await onSubmit(payload);
      if (success) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const stageDeptOptions = useMemo(() => {
    // Chỉ hiển thị các phòng ban đã được thêm vào dự án
    const normalizedSelected = selectedDepts.map(toDeptCode);
    const projectDepts = CIPM_DEPARTMENTS.filter((d) =>
      normalizedSelected.includes(d.code) || normalizedSelected.includes(d.short)
    );
    const list = projectDepts.length > 0 ? projectDepts : CIPM_DEPARTMENTS;
    return list.map((d) => ({
      value: d.code,
      label: `[${d.short}] ${d.name}`,
    }));
  }, [selectedDepts]);

  const multipleDeptOptions = useMemo(
    () =>
      CIPM_DEPARTMENTS.map((d) => ({
        value: d.code,
        label: `${d.name} (${d.short})`,
      })),
    []
  );

  return (
    <Drawer
      open
      width="min(760px, 100vw)"
      destroyOnClose
      onClose={onClose}
      footer={
        <div className="flex items-center justify-start gap-3 px-1 py-1">
          <button
            type="button"
            onClick={() => form.submit()}
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-lg bg-[#DC2626] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#B91C1C] transition-colors disabled:opacity-50"
          >
            {project?.mainExecutorId ? "Lưu điều chỉnh phân công" : "Xác nhận phân công"}
          </button>
          <Button intent="outline" onClick={onClose} disabled={submitting}>
            Đóng
          </Button>
        </div>
      }
      title={
        <span>
          <span className="flex flex-wrap items-center gap-2">
            <SafetyCertificateOutlined className="text-[#DC2626]" />
            <span className="text-base font-bold text-[#102A43]">
              Phân công thực hiện dự án & Giai đoạn
            </span>
            {displayProject?.status && (
              <Tag className="m-0 text-xs font-normal border-red-200 bg-red-50 text-[#DC2626]">
                {displayProject.status}
              </Tag>
            )}
          </span>
          {displayProject && (
            <span className="mt-0.5 block text-xs font-normal text-slate-500">
              {displayProject.code} · {displayProject.name}
            </span>
          )}
        </span>
      }
    >
      {errorText && (
        <aside
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] text-rose-800"
        >
          <ExclamationCircleFilled className="mt-0.5 shrink-0 text-rose-500" />
          <span>
            <strong>Chưa thể lưu:</strong> {errorText}
          </span>
        </aside>
      )}

      {/* Thông tin dự án dạng Facts Grid */}
      {displayProject ? (
        <dl className="m-0 mb-4 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div>
            <dt className="text-xs font-medium text-slate-500">Mã công trình</dt>
            <dd className="m-0 mt-0.5 text-[13px] font-semibold text-slate-800">
              {displayProject.code}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Tình trạng dự án</dt>
            <dd className="m-0 mt-0.5 text-[13px] font-semibold text-slate-800">
              {displayProject.status ?? "Đang thi công"}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs font-medium text-slate-500">Tên dự án</dt>
            <dd className="m-0 mt-0.5 text-[13px] font-semibold text-slate-800">
              {displayProject.name}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Thời gian bắt đầu</dt>
            <dd className="m-0 mt-0.5 text-[13px] font-semibold text-slate-800">
              {displayProject.startDate ? formatDateVi(displayProject.startDate) : "Chưa thiết lập"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Thời gian hoàn thành</dt>
            <dd className="m-0 mt-0.5 text-[13px] font-semibold text-slate-800">
              {displayProject.endDate ? formatDateVi(displayProject.endDate) : "Chưa thiết lập"}
            </dd>
          </div>
        </dl>
      ) : null}

      <Form<ProjectLeadershipInput>
        key={displayProject?.id || "new-project"}
        form={form}
        layout="vertical"
        initialValues={{
          projectId: displayProject?.id,
          mainExecutorId: currentManagerStaff?.id || displayProject?.mainExecutorId || defaultDirector?.id || "ST-001",
          mainSupervisorId: displayProject?.mainSupervisorId || currentManagerStaff?.id || defaultDirector?.id || "ST-001",
          note: displayProject?.note,
        }}
        onFinish={handleFinish}
      >
        {!project && (
          <Form.Item
            name="projectId"
            label="Chọn dự án cần phân công"
            rules={[{ required: true, message: "Vui lòng chọn dự án." }]}
            className="mb-4"
          >
            <Select
              placeholder={unassignedProjects.length > 0 ? "Chọn dự án từ danh mục" : "Tất cả dự án đã được phân công"}
              showSearch={{ optionFilterProp: "label" }}
              disabled={unassignedProjects.length === 0}
              options={unassignedProjects.map((p) => ({
                value: p.id,
                label: `${p.code} · ${p.name}`,
              }))}
            />
          </Form.Item>
        )}

        {/* Khung 1: Chủ nhiệm dự án & Phòng ban tham gia */}
        <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-700">
              <UserOutlined className="text-[#DC2626]" />
              <span>1. Chủ nhiệm dự án & Phòng ban phụ trách</span>
            </div>
            <span className="text-[11px] text-[#DC2626] bg-red-50 px-2 py-0.5 rounded font-medium border border-red-200">
              Cố định từ Màn hình 2
            </span>
          </div>

          {/* Hiển thị cố định Chủ nhiệm dự án (không cho sửa ở màn hình này) */}
          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50/80 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12.5px] font-semibold text-slate-800">
                Chủ nhiệm dự án (Người phụ trách chung toàn dự án)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-red-100 border border-red-200 flex items-center justify-center font-bold text-sm text-[#DC2626] shrink-0">
                {currentManagerName.split(" ").slice(-1)[0]?.charAt(0) || "H"}
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-slate-800">
                  {currentManagerName}
                  <span className="text-xs font-normal text-slate-500 ml-1.5">
                    ({currentManagerStaff?.title || "Giám đốc BQL"})
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Chủ nhiệm dự án được tạo hoặc cập nhật tại Màn hình 2 (Danh mục công trình), không thể chỉnh sửa tại màn hình này.
                </div>
              </div>
            </div>
            <Form.Item name="mainExecutorId" hidden>
              <Input />
            </Form.Item>
          </div>

          {/* Hiển thị cố định Phòng ban phụ trách dự án (mỗi phòng ban 1 dòng, không thể chỉnh sửa ở đây) */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12.5px] font-semibold text-slate-800 flex items-center gap-1.5">
                <ApartmentOutlined className="text-[#DC2626]" />
                Phòng ban phụ trách dự án ({selectedDepts.length} phòng ban)
              </span>
            </div>

            <div className="space-y-1.5">
              {selectedDepts.map((deptCode) => {
                const dept = CIPM_DEPARTMENTS.find((d) => d.code === deptCode || d.short === deptCode);
                const deptName = dept?.name || deptCode;
                const deptShort = dept?.short || deptCode;
                return (
                  <div
                    key={deptCode}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200/90 bg-white shadow-2xs hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex h-6 min-w-6 items-center justify-center rounded bg-red-50 border border-red-200 text-[11px] font-bold font-mono text-[#DC2626] shrink-0">
                        {deptShort}
                      </span>
                      <span className="text-[12.5px] font-bold text-slate-800 truncate">
                        {deptName}
                      </span>
                    </div>
                    <span className="text-[10.5px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                      Phối hợp thực hiện
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="text-[11px] text-slate-500 mt-2">
              Phòng ban phụ trách được tạo hoặc cập nhật tại Màn hình 2 (Danh mục công trình), không thể chỉnh sửa tại màn hình này.
            </div>
          </div>
        </section>

        {/* Khung 2: Phân công giai đoạn quy trình (Màn hình 3) cho các phòng ban */}
        <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-700">
              <ApartmentOutlined className="text-[#DC2626]" />
              <span>2. Giao giai đoạn quy trình (Màn hình 3) cho các phòng ban</span>
            </div>
            <span className="text-[11px] text-[#DC2626] bg-red-50 px-2 py-0.5 rounded font-medium border border-red-200">
              7 nhóm giai đoạn chuẩn
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-3.5 leading-relaxed">
            Chỉ định phòng ban chuyên môn chịu trách nhiệm chính cho từng nhóm giai đoạn trong quy trình thủ tục XDCB.
            Khi phòng ban nộp hồ sơ giai đoạn, hệ thống sẽ chuyển trực tiếp lên Ban Giám đốc xem xét phê duyệt.
          </p>

          <div className="space-y-2">
            {PROCEDURE_STAGE_GROUPS.map((stage) => {
              const currentDept = stageDeptMap[stage.value];
              const assignedDept =
                currentDept && selectedDepts.includes(currentDept)
                  ? currentDept
                  : getDefaultDeptForStage(stage.value, selectedDepts);

              return (
                <div
                  key={stage.value}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span className="flex h-7 w-8 shrink-0 items-center justify-center rounded font-mono text-xs font-bold bg-white border border-slate-200 text-slate-700">
                      {stage.value}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-slate-800 leading-tight">
                        {stage.fullName}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {stage.label}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 w-full sm:w-[260px]">
                    <Select
                      className="w-full text-xs"
                      value={assignedDept}
                      onChange={(val) => handleStageDeptChange(stage.value, val as string)}
                      options={stageDeptOptions}
                      placeholder="Chọn phòng ban phụ trách"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Khung 3: Ý kiến chỉ đạo của Ban Giám đốc */}
        <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-600">
            <FileTextOutlined className="text-[#DC2626]" />
            <span>3. Ý kiến chỉ đạo của Ban Giám đốc</span>
          </div>
          <Form.Item name="note" className="mb-0">
            <Input.TextArea
              rows={3}
              placeholder="Ví dụ: Đẩy nhanh tiến độ GPMB trong Quý III, yêu cầu các phòng ban nộp hồ sơ giai đoạn đúng thời hạn..."
            />
          </Form.Item>
        </section>
      </Form>
    </Drawer>
  );
}
