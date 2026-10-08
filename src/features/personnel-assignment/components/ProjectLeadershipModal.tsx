import { useEffect, useMemo, useState } from "react";
import {
  ExclamationCircleFilled,
  FileTextOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Form, Input, Select, Tag } from "@/components/ui";
import { formatDateVi } from "@/utils/date";
import { OVERLOAD_THRESHOLD } from "../constants/personnel-labels";
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

export default function ProjectLeadershipModal({
  data,
  project,
  errorText,
  onClose,
  onSubmit,
}: ProjectLeadershipModalProps) {
  const [form] = Form.useForm<ProjectLeadershipInput>();
  const [submitting, setSubmitting] = useState(false);

  // Trạng thái: CNDA đang đương nhiệm (chưa bị thu hồi quyền)
  const isCndaActive = Boolean(project?.mainExecutorId && !project?.cndaRevoked);

  // Lọc chỉ các dự án CHƯA ĐƯỢC PHÂN CÔNG (hoặc đã bị thu hồi CNDA cần phân công thay thế)
  const unassignedProjects = useMemo(() => {
    return data.projects.filter((p) => !p.mainExecutorId || p.cndaRevoked);
  }, [data.projects]);

  const watchedProjectId = Form.useWatch("projectId", form);
  const displayProject = project || (watchedProjectId ? data.projects.find((p) => p.id === watchedProjectId) : undefined);

  useEffect(() => {
    if (project) {
      form.setFieldsValue({
        projectId: project.id,
        mainExecutorId: project.mainExecutorId,
        mainSupervisorId: project.mainSupervisorId,
        note: project.note,
        actingDirectorId: project.actingDirectorId,
        actingDirectorNote: project.actingDirectorNote,
      });
    } else {
      form.resetFields();
    }
  }, [project, form]);

  // Grouped options for staff selection
  const staffOptions = useMemo(
    () =>
      data.teams.flatMap((team) => ({
        label: team.name,
        options: data.staff
          .filter((person) => person.teamId === team.id)
          .map((person) => {
            const workload = getWorkload(person.id, data.assignments);
            const overloaded = workload >= OVERLOAD_THRESHOLD;
            return {
              value: person.id,
              disabled: !person.accountActive,
              label: `${person.name} – ${person.title} · ${workload} việc đang mở${
                overloaded ? " (quá tải)" : ""
              }${person.accountActive ? "" : " – tài khoản đang khóa"}`,
            };
          }),
      })),
    [data.assignments, data.staff, data.teams],
  );

  // Prefer technical / supervisor team members for supervisor option, but allow all
  const supervisorOptions = useMemo(
    () =>
      data.teams.map((team) => ({
        label: team.name,
        options: data.staff
          .filter((person) => person.teamId === team.id)
          .map((person) => {
            const workload = getWorkload(person.id, data.assignments);
            return {
              value: person.id,
              disabled: !person.accountActive,
              label: `${person.name} – ${person.title} (${
                person.roleCode === "TECHNICAL_OFFICER" ? "Kỹ thuật/GS" : team.id
              }) · ${workload} việc`,
            };
          }),
      })),
    [data.assignments, data.staff, data.teams],
  );

  const handleFinish = async (values: ProjectLeadershipInput) => {
    setSubmitting(true);
    try {
      const payload: ProjectLeadershipInput = {
        projectId: project ? project.id : values.projectId,
        mainExecutorId: values.mainExecutorId,
        mainSupervisorId: values.mainSupervisorId,
        note: values.note?.trim(),
        actingDirectorId: project?.actingDirectorId,
        actingDirectorNote: project?.actingDirectorNote,
      };
      const success = await onSubmit(payload);
      if (success) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      open
      width="min(680px, 100vw)"
      destroyOnClose
      onClose={onClose}
      footer={
        <div className="flex items-center justify-start gap-3 px-1 py-1">
          {isCndaActive ? (
            <Button intent="outline" onClick={onClose}>
              Đóng
            </Button>
          ) : (
            <>
              <Button
                intent="primary"
                onClick={() => form.submit()}
                loading={submitting}
              >
                {project?.cndaRevoked
                  ? "Lưu thay thế nhân sự"
                  : project?.mainExecutorId
                  ? "Lưu điều chỉnh"
                  : "Xác nhận phân công"}
              </Button>
              <Button intent="outline" onClick={onClose} disabled={submitting}>
                Đóng
              </Button>
            </>
          )}
        </div>
      }
      title={
        <span>
          <span className="flex flex-wrap items-center gap-2">
            <SafetyCertificateOutlined className="text-[#0F4C81]" />
            <span className="text-base font-bold text-[#102A43]">
              {isCndaActive
                ? "Chi tiết phân công dự án"
                : project?.cndaRevoked
                ? "Phân công nhân sự thay thế CNDA"
                : project
                ? "Phân công lãnh đạo dự án"
                : "Phân công lãnh đạo dự án mới"}
            </span>
            {project?.status && (
              <Tag color="blue" className="m-0 text-xs font-normal">
                {project.status}
              </Tag>
            )}
          </span>
          {project && (
            <span className="mt-0.5 block text-xs font-normal text-slate-500">
              {project.code} · {project.name}
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

      {/* Thông báo khi đã thu hồi CNDA và đang chọn người thay thế */}
      {project?.cndaRevoked && (
        <aside
          role="note"
          className="mb-4 flex items-start gap-2.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs text-blue-900"
        >
          <SafetyCertificateOutlined className="mt-0.5 shrink-0 text-blue-600" />
          <div>
            <strong>Phân công cán bộ thay thế:</strong> Quyền Chủ nhiệm dự án cũ đã được thu hồi. Hãy chọn cán bộ mới bên dưới và bấm <strong>Lưu thay thế nhân sự</strong> để bổ nhiệm CNDA mới.
          </div>
        </aside>
      )}

      {/* Thông tin dự án dạng Facts Grid (hiển thị khi có project truyền vào hoặc khi vừa chọn dự án từ danh mục) */}
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
          {displayProject.assignedAt && (
            <div className="col-span-2">
              <dt className="text-xs font-medium text-slate-500">Ngày được phân công</dt>
              <dd className="m-0 mt-0.5 text-[13px] font-semibold text-emerald-700">
                {formatDateVi(displayProject.assignedAt)}
              </dd>
            </div>
          )}
          {displayProject.note && (
            <div className="col-span-2">
              <dt className="text-xs font-medium text-slate-500">Ghi chú hiện tại</dt>
              <dd className="m-0 mt-0.5 text-xs italic text-slate-600">{displayProject.note}</dd>
            </div>
          )}
        </dl>
      ) : null}

      <Form<ProjectLeadershipInput>
        key={project?.id || "new-project"}
        form={form}
        layout="vertical"
        initialValues={{
          projectId: project?.id,
          mainExecutorId: project?.mainExecutorId,
          mainSupervisorId: project?.mainSupervisorId,
          note: project?.note,
          actingDirectorId: project?.actingDirectorId,
          actingDirectorNote: project?.actingDirectorNote,
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

        {/* Khung chỉ định nhân sự lãnh đạo */}
        <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-600">
            <UserOutlined className="text-slate-500" />
            <span>Chỉ định nhân sự lãnh đạo</span>
          </div>

          <Form.Item
            name="mainExecutorId"
            label={
              <span className="text-[13px] font-semibold text-slate-800">
                1. Người thực hiện chính (Chủ nhiệm dự án)
              </span>
            }
            rules={[{ required: true, message: "Vui lòng chỉ định Người thực hiện chính." }]}
            extra={
              <span className="text-xs text-slate-400">
                Chỉ định 01 cán bộ chủ trì, chịu trách nhiệm chung về tiến độ và kết quả toàn dự án.
              </span>
            }
            className="mb-4"
          >
            <Select
              placeholder="Chọn cán bộ chủ nhiệm dự án"
              showSearch={{ optionFilterProp: "label" }}
              disabled={isCndaActive}
              options={staffOptions}
            />
          </Form.Item>

          <Form.Item
            name="mainSupervisorId"
            label={
              <span className="text-[13px] font-semibold text-slate-800">
                2. Người giám sát chính (Kỹ sư Giám sát KT)
              </span>
            }
            rules={[{ required: true, message: "Vui lòng chỉ định Người giám sát chính." }]}
            extra={
              <span className="text-xs text-slate-400">
                Chỉ định 01 cán bộ giám sát chính, có quyền giao việc và chỉ định người hỗ trợ từng giai đoạn.
              </span>
            }
            className="mb-0"
          >
            <Select
              placeholder="Chọn cán bộ kỹ sư giám sát chính"
              showSearch={{ optionFilterProp: "label" }}
              disabled={isCndaActive}
              options={supervisorOptions}
            />
          </Form.Item>
        </section>

        {/* Khung ý kiến chỉ đạo */}
        <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-600">
            <FileTextOutlined className="text-slate-500" />
            <span>Ý kiến chỉ đạo của Ban Giám đốc</span>
          </div>
          <Form.Item name="note" className="mb-0">
            <Input.TextArea
              rows={3}
              disabled={isCndaActive}
              placeholder="Ví dụ: Đẩy nhanh tiến độ GPMB trong Quý III, yêu cầu báo cáo tuần định kỳ..."
            />
          </Form.Item>
        </section>
      </Form>
    </Drawer>
  );
}
