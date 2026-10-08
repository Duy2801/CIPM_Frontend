"use client";

import { useMemo, useState } from "react";
import {
  AlertOutlined,
  CheckCircleFilled,
  CrownOutlined,
  ExclamationCircleFilled,
  InfoCircleOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Form, Input, Select, Tag, Text } from "@/components/ui";
import type { AuthUser } from "@/types/auth";
import { getInitials } from "@/utils/initials";
import type {
  GrantActingDirectorInput,
  PersonnelDataset,
  PersonnelProject,
} from "../types/personnel.types";
import { getWorkload } from "../utils/personnel-rules";

interface GrantActingDirectorModalProps {
  project?: PersonnelProject;
  data: PersonnelDataset;
  currentUser: AuthUser | null;
  onClose: () => void;
  onSubmit: (input: GrantActingDirectorInput) => Promise<boolean>;
  onOpenAssignLeaders?: (project: PersonnelProject) => void;
}

export default function GrantActingDirectorModal({
  project,
  data,
  currentUser,
  onClose,
  onSubmit,
  onOpenAssignLeaders,
}: GrantActingDirectorModalProps) {
  const [form] = Form.useForm<GrantActingDirectorInput>();
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(
    project?.id,
  );

  const targetProject = useMemo(() => {
    if (project) return project;
    return data.projects.find((p) => p.id === selectedProjectId);
  }, [project, data.projects, selectedProjectId]);

  // Người thực hiện chính của dự án này
  const mainExecutor = useMemo(() => {
    if (!targetProject?.mainExecutorId) return undefined;
    return data.staff.find((s) => s.id === targetProject.mainExecutorId);
  }, [targetProject, data.staff]);

  const mainExecutorTeam = useMemo(() => {
    if (!mainExecutor) return undefined;
    return data.teams.find((t) => t.id === mainExecutor.teamId);
  }, [mainExecutor, data.teams]);

  const defaultAssigner =
    currentUser?.displayName ||
    currentUser?.name ||
    "Huỳnh Thái Hải (Giám đốc)";

  const handleFinish = async (values: GrantActingDirectorInput) => {
    setSubmitting(true);
    setErrorText(null);
    try {
      const projId = targetProject?.id || values.projectId;
      if (!projId) {
        setErrorText("Vui lòng chọn dự án.");
        return;
      }

      if (!targetProject?.mainExecutorId) {
        setErrorText(
          "Dự án này chưa có Người thực hiện chính. Cần phân công Người thực hiện chính trước khi cấp role Quyền Chủ nhiệm dự án."
        );
        return;
      }

      const payload: GrantActingDirectorInput = {
        projectId: projId,
        staffId: targetProject.mainExecutorId, // BẮT BUỘC là Người thực hiện chính
        assignedBy: values.assignedBy?.trim() || defaultAssigner,
        note: values.note?.trim(),
      };

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

  const defaultDecisionNote = mainExecutor
    ? `Ủy quyền cho đồng chí ${mainExecutor.name} giữ vai trò Quyền Chủ nhiệm dự án công trình ${targetProject?.name}. Toàn quyền bổ nhiệm thành viên tổ công tác, quản lý thành viên, phân công nhiệm vụ và đôn đốc tiến độ trong phạm vi dự án.`
    : "Ủy quyền toàn quyền phân công nhân sự, quản lý tổ công tác và đôn đốc thành viên trong phạm vi dự án.";

  return (
    <Drawer
      open
      width="min(680px, 100vw)"
      onClose={onClose}
      destroyOnClose
      title={
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
            <CrownOutlined className="text-lg" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <Text className="text-base font-bold text-[#102A43]">
                Cấp role Quyền Chủ nhiệm dự án
              </Text>
              <Tag color="gold" className="m-0 text-xs font-semibold">
                Ủy quyền Ban Giám đốc
              </Tag>
            </div>
            <Text className="block text-xs font-normal text-slate-500">
              {targetProject
                ? `${targetProject.code} · ${targetProject.name}`
                : "Cấp quyền điều hành toàn diện trong phạm vi dự án cho Người thực hiện chính"}
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
            disabled={!mainExecutor}
            className="!bg-amber-600 hover:!bg-amber-700 !border-amber-600 disabled:!bg-slate-300 disabled:!border-slate-300"
          >
            Xác nhận cấp Role Quyền CNDA
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
            <strong>Chưa thể cấp vai trò:</strong> {errorText}
          </span>
        </aside>
      )}

      {/* Hộp giải thích chính sách phân quyền & điều kiện bắt buộc */}
      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 text-xs text-slate-700">
        <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1.5">
          <SafetyCertificateOutlined className="text-amber-600 text-sm" />
          <span>Quy chế Phân quyền & Giới hạn an toàn (GĐ & PGĐ):</span>
        </div>
        <ul className="list-disc pl-4 space-y-1.5 text-slate-600 text-[12px] leading-relaxed m-0">
          <li>
            <strong>Điều kiện bắt buộc:</strong> Role &ldquo;Quyền Chủ nhiệm dự án&rdquo; chỉ được cấp cho cán bộ đang giữ vai trò <strong>Người thực hiện chính</strong> của dự án đó.
          </li>
          <li>
            <strong>Quyền hạn được trao:</strong> Có quyền <strong>bổ nhiệm thêm thành viên</strong> vào Tổ công tác dự án, <strong>quản lý thành viên</strong>, trực tiếp <strong>phân công nhiệm vụ theo giai đoạn</strong> và <strong>đôn đốc thành viên</strong> trong dự án.
          </li>
          <li>
            <strong>Quyền thu hồi tối cao:</strong> Giám đốc và Phó Giám đốc có quyền <strong>Thu hồi vai trò bất kỳ lúc nào</strong>. Khi thu hồi, cán bộ sẽ trở về quyền hạn chuyên môn thông thường.
          </li>
        </ul>
      </div>

      <Form<GrantActingDirectorInput>
        form={form}
        layout="vertical"
        initialValues={{
          projectId: targetProject?.id,
          staffId: targetProject?.mainExecutorId,
          assignedBy: defaultAssigner,
          note: targetProject?.actingDirectorNote || defaultDecisionNote,
        }}
        onFinish={handleFinish}
      >
        {!project && (
          <Form.Item
            name="projectId"
            label="Chọn dự án áp dụng"
            rules={[{ required: true, message: "Vui lòng chọn dự án." }]}
            className="mb-4"
          >
            <Select
              placeholder="Chọn dự án cần cấp quyền Quyền CNDA"
              showSearch={{ optionFilterProp: "label" }}
              value={selectedProjectId}
              onChange={(val) => {
                setSelectedProjectId(val);
                form.setFieldValue("projectId", val);
              }}
              options={data.projects.map((p) => {
                const executor = p.mainExecutorId
                  ? data.staff.find((s) => s.id === p.mainExecutorId)?.name
                  : "Chưa có Người TH chính";
                return {
                  value: p.id,
                  label: `${p.code} · ${p.name} (${executor})`,
                };
              })}
            />
          </Form.Item>
        )}

        {/* Khung kiểm tra điều kiện Người thực hiện chính */}
        {targetProject && (
          <div className="mb-4">
            {!mainExecutor ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-xs">
                <div className="flex items-start gap-2.5 text-rose-800">
                  <WarningOutlined className="text-base text-rose-600 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-[13px] block mb-1">
                      Chưa đủ điều kiện cấp role Quyền Chủ nhiệm dự án
                    </strong>
                    <p className="text-slate-600 m-0 leading-relaxed">
                      Công trình <strong>{targetProject.name}</strong> hiện chưa được chỉ định{" "}
                      <strong>Người thực hiện chính</strong>. Theo quy định, Giám đốc / Phó Giám đốc
                      phải phân công Người thực hiện chính trước khi cấp role Quyền Chủ nhiệm dự án.
                    </p>
                    {onOpenAssignLeaders && (
                      <Button
                        intent="primary"
                        scale="compact"
                        className="mt-3 !bg-rose-600 hover:!bg-rose-700 !border-rose-600"
                        onClick={() => {
                          onClose();
                          onOpenAssignLeaders(targetProject);
                        }}
                      >
                        Phân công Người thực hiện chính ngay
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-800">
                    <CheckCircleFilled className="text-emerald-600" />
                    <span>Cán bộ được cấp role: Người thực hiện chính của dự án</span>
                  </div>
                  <Tag color="green" className="m-0 text-[11px] font-semibold">
                    Đủ điều kiện quy chuẩn
                  </Tag>
                </div>

                <div className="flex items-center gap-3.5 bg-white p-3 rounded-lg border border-slate-200">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-sm font-bold text-white shadow-xs">
                    {getInitials(mainExecutor.name)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Text className="text-sm font-bold text-slate-900">
                        {mainExecutor.name}
                      </Text>
                      <Tag color="gold" className="m-0 text-[10px] font-bold py-0.2">
                        <CrownOutlined /> Quyền CNDA
                      </Tag>
                    </div>
                    <Text className="block text-xs text-slate-500 mt-0.5">
                      {mainExecutor.title} · {mainExecutorTeam?.name} · {mainExecutor.phone}
                    </Text>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-600">
                      <span>Khối lượng hiện tại: <strong>{getWorkload(mainExecutor.id, data.assignments)} nhiệm vụ</strong></span>
                      <span>·</span>
                      <span className="text-emerald-700 font-medium">Tài khoản đang hoạt động</span>
                    </div>
                  </div>
                </div>

                <input type="hidden" name="staffId" value={mainExecutor.id} />
              </div>
            )}
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white p-4 mb-4">
          <Form.Item
            name="assignedBy"
            label={<span className="text-xs font-semibold text-slate-700">Lãnh đạo cấp quyền (GĐ hoặc PGĐ phê duyệt)</span>}
            rules={[{ required: true, message: "Vui lòng nhập người cấp quyền." }]}
            className="mb-3"
          >
            <Input placeholder="Ví dụ: Huỳnh Thái Hải (Giám đốc)" />
          </Form.Item>

          <Form.Item
            name="note"
            label={<span className="text-xs font-semibold text-slate-700">Quyết định ủy quyền & Nội dung giao nhiệm vụ</span>}
            rules={[{ required: true, message: "Vui lòng nhập nội dung quyết định." }]}
            className="mb-0"
          >
            <Input.TextArea
              rows={3}
              placeholder="Nhập căn cứ quyết định hoặc phạm vi điều hành cụ thể..."
            />
          </Form.Item>
        </div>
      </Form>
    </Drawer>
  );
}
