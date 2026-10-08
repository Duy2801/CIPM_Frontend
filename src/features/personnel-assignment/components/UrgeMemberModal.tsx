"use client";

import { useMemo, useState } from "react";
import {
  AlertOutlined,
  ClockCircleOutlined,
  ExclamationCircleFilled,
  SendOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Form, Input, Select, Tag, Text } from "@/components/ui";
import type { AuthUser } from "@/types/auth";
import type {
  Assignment,
  PersonnelDataset,
  PersonnelProject,
  Staff,
  UrgeMemberInput,
} from "../types/personnel.types";

interface UrgeMemberModalProps {
  project?: PersonnelProject;
  assignment?: Assignment;
  targetStaff?: Staff;
  data: PersonnelDataset;
  currentUser: AuthUser | null;
  onClose: () => void;
  onSubmit: (input: UrgeMemberInput) => Promise<boolean>;
}

const URGE_TEMPLATES = [
  "Đề nghị khẩn trương hoàn thành nội dung công việc đúng hạn được giao, báo cáo tiến độ định kỳ.",
  "Tiến độ thi công đang chậm so với kế hoạch, yêu cầu tăng cường nhân lực và làm bù khối lượng ngay.",
  "Yêu cầu phối hợp chặt chẽ với tư vấn giám sát nghiệm thu dứt điểm hạng mục này trong 48 giờ tới.",
  "Đôn đốc tập trung tháo gỡ vướng mắc hiện trường, báo cáo khó khăn trực tiếp cho Quyền Chủ nhiệm DA.",
  "Khẩn trương rà soát hồ sơ, đối chiếu số liệu và hoàn thiện thủ tục thanh quyết toán kịp tiến độ.",
];

export default function UrgeMemberModal({
  project,
  assignment,
  targetStaff,
  data,
  currentUser,
  onClose,
  onSubmit,
}: UrgeMemberModalProps) {
  const [form] = Form.useForm<UrgeMemberInput>();
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Xác định dự án hiện tại
  const currentProject = useMemo(() => {
    if (project) return project;
    if (assignment) return data.projects.find((p) => p.id === assignment.projectId);
    return undefined;
  }, [project, assignment, data.projects]);

  // Danh sách cán bộ trong dự án có thể đôn đốc
  const memberOptions = useMemo(() => {
    if (!currentProject) {
      return data.staff
        .filter((s) => s.accountActive)
        .map((s) => ({ value: s.id, label: `${s.name} – ${s.title}` }));
    }
    const teamMemberIds = currentProject.teamMembers || [];
    // Nếu có teamMembers thì lấy danh sách đó, nếu không lấy các cán bộ có nhiệm vụ trong dự án
    const staffIds = new Set<string>(teamMemberIds);
    if (currentProject.mainExecutorId) staffIds.add(currentProject.mainExecutorId);
    if (currentProject.mainSupervisorId) staffIds.add(currentProject.mainSupervisorId);
    data.assignments
      .filter((a) => a.projectId === currentProject.id)
      .forEach((a) => {
        if (a.assigneeId) staffIds.add(a.assigneeId);
        a.coAssigneeIds?.forEach((id) => staffIds.add(id));
      });

    return data.staff
      .filter((s) => staffIds.has(s.id) && s.accountActive)
      .map((s) => {
        const activeTasks = data.assignments.filter(
          (a) => a.projectId === currentProject.id && a.assigneeId === s.id && a.status !== "DONE"
        ).length;
        return {
          value: s.id,
          label: `${s.name} – ${s.title} (${activeTasks} việc đang làm)`,
        };
      });
  }, [currentProject, data.assignments, data.staff]);

  const defaultUrger =
    currentUser?.displayName ||
    currentUser?.name ||
    "Huỳnh Thái Hải (Giám đốc)";

  // Xác định cán bộ mặc định được chọn
  const defaultStaffId =
    targetStaff?.id ||
    assignment?.assigneeId ||
    currentProject?.mainExecutorId ||
    memberOptions[0]?.value;

  const handleFinish = async (values: UrgeMemberInput) => {
    setSubmitting(true);
    setErrorText(null);
    try {
      const payload: UrgeMemberInput = {
        projectId: currentProject?.id || values.projectId,
        staffId: values.staffId,
        assignmentId: assignment?.id || values.assignmentId,
        urgedBy: values.urgedBy?.trim() || defaultUrger,
        note: values.note?.trim(),
        urgencyLevel: values.urgencyLevel || "HIGH",
      };

      if (!payload.projectId) {
        setErrorText("Vui lòng chọn dự án.");
        return;
      }
      if (!payload.staffId) {
        setErrorText("Vui lòng chọn cán bộ nhận thông báo đôn đốc.");
        return;
      }
      if (!payload.note) {
        setErrorText("Vui lòng nhập nội dung chỉ đạo đôn đốc.");
        return;
      }

      const success = await onSubmit(payload);
      if (success) {
        onClose();
      }
    } catch (err: unknown) {
      setErrorText(err instanceof Error ? err.message : "Đã có lỗi xảy ra.");
    } finally {
      setSubmitting(false);
    }
  };

  const applyTemplate = (tpl: string) => {
    form.setFieldValue("note", tpl);
  };

  return (
    <Drawer
      open
      width="min(680px, 100vw)"
      onClose={onClose}
      destroyOnClose
      title={
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
            <ClockCircleOutlined className="text-lg" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <Text className="text-base font-bold text-[#102A43]">
                Đôn đốc tiến độ thành viên
              </Text>
              <Tag color="volcano" className="m-0 text-xs font-semibold">
                Chỉ đạo điều hành
              </Tag>
            </div>
            <Text className="block text-xs font-normal text-slate-500">
              {currentProject
                ? `${currentProject.code} · ${currentProject.name}`
                : "Gửi cảnh báo và yêu cầu đẩy nhanh tiến độ thực hiện"}
            </Text>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-start gap-2.5 px-1 py-1">
          <Button
            intent="primary"
            onClick={() => form.submit()}
            loading={submitting}
            className="!bg-rose-600 hover:!bg-rose-700 !border-rose-600"
            icon={<SendOutlined />}
          >
            Gửi chỉ đạo đôn đốc
          </Button>
          <Button intent="outline" onClick={onClose} disabled={submitting}>
            Đóng
          </Button>
        </div>
      }
    >
      {errorText && (
        <aside
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800"
        >
          <ExclamationCircleFilled className="mt-0.5 shrink-0 text-rose-500" />
          <span>
            <strong>Chưa thể gửi đôn đốc:</strong> {errorText}
          </span>
        </aside>
      )}

      {/* Thông tin ngữ cảnh */}
      <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50/50 p-3.5 text-xs text-slate-700">
        <div className="flex items-center gap-1.5 font-bold text-rose-900 mb-1">
          <AlertOutlined className="text-rose-600 text-sm" />
          <span>Mục đích đôn đốc:</span>
        </div>
        <Text className="text-slate-600 text-[12px] leading-relaxed block m-0">
          Chức năng dành cho <strong>Ban Giám đốc</strong> và <strong>Quyền Chủ nhiệm dự án</strong> nhằm
          nhắc nhở, thúc đẩy tiến độ hoàn thành các hạng mục, ngăn ngừa chậm tiến độ công trình.
          Hệ thống sẽ cập nhật trạng thái đôn đốc vào nhiệm vụ và tổ công tác.
        </Text>
      </div>

      <Form<UrgeMemberInput>
        form={form}
        layout="vertical"
        initialValues={{
          projectId: currentProject?.id,
          staffId: defaultStaffId,
          assignmentId: assignment?.id,
          urgedBy: defaultUrger,
          urgencyLevel: "HIGH",
          note: assignment
            ? `Đôn đốc thực hiện nhiệm vụ: "${assignment.title}". Đề nghị khẩn trương hoàn thành theo hạn chót.`
            : "Đề nghị khẩn trương đẩy nhanh tiến độ các phần việc được phân công trong dự án.",
        }}
        onFinish={handleFinish}
      >
        {!currentProject && (
          <Form.Item
            name="projectId"
            label="Chọn dự án"
            rules={[{ required: true, message: "Vui lòng chọn dự án." }]}
          >
            <Select
              placeholder="Chọn dự án cần đôn đốc"
              showSearch={{ optionFilterProp: "label" }}
              options={data.projects.map((p) => ({
                value: p.id,
                label: `${p.code} · ${p.name}`,
              }))}
            />
          </Form.Item>
        )}

        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 mb-4 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-700">
            <UserOutlined className="text-slate-500" />
            <span>Đối tượng tiếp nhận chỉ đạo</span>
          </div>

          <Form.Item
            name="staffId"
            label={<span className="text-[13px] font-semibold text-slate-800">Cán bộ cần đôn đốc</span>}
            rules={[{ required: true, message: "Vui lòng chọn cán bộ." }]}
            className="mb-2"
          >
            <Select
              placeholder="Chọn thành viên trong dự án"
              showSearch={{ optionFilterProp: "label" }}
              options={memberOptions}
            />
          </Form.Item>

          <Form.Item
            name="urgencyLevel"
            label={<span className="text-xs font-medium text-slate-600">Mức độ đôn đốc</span>}
            className="mb-0"
          >
            <Select
              options={[
                { value: "NORMAL", label: "Thông thường" },
                { value: "HIGH", label: "Ưu tiên cao – Đôn đốc tiến độ" },
                { value: "URGENT", label: "Khẩn cấp – Quá hạn / Chậm tiến độ" },
              ]}
            />
          </Form.Item>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 mb-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-700">
              Nội dung chỉ đạo đôn đốc
            </span>
            <span className="text-[11px] text-slate-400">Chọn mẫu nhanh bên dưới:</span>
          </div>

          {/* Quick template tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {URGE_TEMPLATES.map((tpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className="cursor-pointer rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-700 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-800 transition-colors text-left"
              >
                Mẫu {idx + 1}: {tpl.slice(0, 42)}...
              </button>
            ))}
          </div>

          <Form.Item
            name="note"
            rules={[{ required: true, message: "Vui lòng nhập nội dung chỉ đạo." }]}
            className="mb-0"
          >
            <Input.TextArea
              rows={4}
              placeholder="Nhập yêu cầu tiến độ, thời hạn phải hoàn thành hoặc chỉ đạo cụ thể..."
            />
          </Form.Item>
        </div>

        <Form.Item
          name="urgedBy"
          label={<span className="text-xs text-slate-600">Người ban hành đôn đốc (GĐ / PGĐ / Quyền CNDA)</span>}
          rules={[{ required: true, message: "Vui lòng nhập người ban hành." }]}
          className="mb-0"
        >
          <Input placeholder="Ví dụ: Huỳnh Thái Hải (Giám đốc)" />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
