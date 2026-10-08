"use client";

import { useState } from "react";
import {
  CrownOutlined,
  IdcardOutlined,
  InfoCircleOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UserAddOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Col, Drawer, Form, Input, Row, Select, Text } from "@/components/ui";
import { SYSTEM_ROLE_META } from "../constants/personnel-labels";
import type { PersonnelDataset, StaffInput, TeamId } from "../types/personnel.types";

interface StaffFormValues extends Omit<StaffInput, "isLeader" | "title"> {
  title?: string;
  teamRole: "MEMBER" | "LEADER";
}

interface StaffModalProps {
  data: PersonnelDataset;
  errorText?: string;
  onClose: () => void;
  onCreate: (input: StaffInput) => Promise<boolean>;
}

export default function StaffModal({ data, errorText, onClose, onCreate }: StaffModalProps) {
  const [form] = Form.useForm<StaffFormValues>();
  const [submitting, setSubmitting] = useState(false);

  const selectedTeamId = Form.useWatch("teamId", form);
  const selectedTeamRole = Form.useWatch("teamRole", form);

  const currentTeam = data.teams.find((t) => t.id === selectedTeamId);
  const currentLeader = data.staff.find((s) => s.id === currentTeam?.leaderId);

  const handleFinish = async (values: StaffFormValues) => {
    setSubmitting(true);
    try {
      const isLeader = values.teamRole === "LEADER";
      let title = "Chuyên viên";
      if (values.teamId === "BGD") {
        title = isLeader ? "Phó Giám đốc" : "Chuyên viên Ban Giám đốc";
      } else if (values.teamId === "GSKT") {
        title = isLeader ? "Tổ trưởng Giám sát – Kỹ thuật" : "Kỹ sư giám sát";
      } else if (values.teamId === "HCTH") {
        title = isLeader ? "Kế toán trưởng" : "Kế toán viên";
      } else if (values.teamId === "BT") {
        title = isLeader ? "Tổ trưởng Bồi thường – GPMB" : "Chuyên viên bồi thường";
      }

      const payload: StaffInput = {
        name: values.name.trim(),
        citizenId: values.citizenId?.trim(),
        teamId: values.teamId,
        title,
        employment: values.employment,
        phone: values.phone?.trim(),
        email: values.email?.trim(),
        roleCode: values.roleCode,
        isLeader,
        username: values.email?.trim(),
        password: "1111",
        accountActive: true,
      };
      const success = await onCreate(payload);
      if (success) {
        form.resetFields();
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const teamOptions = data.teams.map((t) => {
    const leader = data.staff.find((s) => s.id === t.leaderId);
    return {
      value: t.id,
      label: (
        <div className="flex items-center justify-between">
          <span>{t.name} ({t.id})</span>
          {leader && (
            <span className="text-[11px] text-slate-400 font-normal">
              Lead: {leader.name}
            </span>
          )}
        </div>
      ),
    };
  });

  const teamRoleOptions = [
    {
      value: "MEMBER",
      label: (
        <div className="flex items-center gap-1.5">
          <UserOutlined className="text-slate-400" />
          <span>Thành viên tổ</span>
        </div>
      ),
    },
    {
      value: "LEADER",
      label: (
        <div className="flex items-center gap-1.5">
          <CrownOutlined className="text-amber-500" />
          <span className="font-semibold text-amber-900">
            {selectedTeamId === "BGD" ? "Lãnh đạo Ban (Giám đốc / PGĐ)" : "Tổ trưởng / Phụ trách tổ (Lead)"}
          </span>
        </div>
      ),
    },
  ];

  const handleTeamChange = (newTeamId: TeamId) => {
    // Nếu đang chọn vai trò là LEADER thì gợi ý chức danh và vai trò hệ thống tương ứng
    if (form.getFieldValue("teamRole") === "LEADER") {
      applyLeaderDefaults(newTeamId);
    }
  };

  const handleTeamRoleChange = (role: "MEMBER" | "LEADER") => {
    if (role === "LEADER") {
      applyLeaderDefaults(form.getFieldValue("teamId") || selectedTeamId);
    }
  };

  const applyLeaderDefaults = (teamId?: TeamId) => {
    if (teamId === "BGD") {
      form.setFieldValue("roleCode", "DEPUTY_DIRECTOR");
    } else if (teamId === "GSKT") {
      form.setFieldValue("roleCode", "TECHNICAL_OFFICER");
    } else if (teamId === "HCTH") {
      form.setFieldValue("roleCode", "CHIEF_ACCOUNTANT");
    } else if (teamId === "BT") {
      form.setFieldValue("roleCode", "COMPENSATION_OFFICER");
    }
  };

  const roleOptions = Object.entries(SYSTEM_ROLE_META).map(([code, meta]) => ({
    value: code,
    label: `${meta.label}`,
  }));

  return (
    <Drawer
      open
      width="min(680px, 100vw)"
      closable={false}
      onClose={onClose}
      destroyOnClose
      className="[&_.ant-drawer-header]:py-3 [&_.ant-drawer-body]:p-4 [&_.ant-drawer-footer]:py-2.5"
      title={
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F4C81]/10 text-[#0F4C81]">
            <UserAddOutlined className="text-base" />
          </span>
          <div>
            <Text className="text-base font-bold text-[#102A43]">
              Thêm nhân sự mới
            </Text>
            <Text className="block text-xs font-normal text-slate-500">
              Khởi tạo thông tin hồ sơ và phân quyền vai trò trên hệ thống
            </Text>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-start gap-3 px-1 py-1">
          <Button
            intent="primary"
            onClick={() => form.submit()}
            loading={submitting}
          >
            Thêm nhân sự
          </Button>
          <Button
            intent="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Đóng
          </Button>
        </div>
      }
    >
      {errorText && (
        <div role="alert" className="mb-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
          <InfoCircleOutlined className="mt-0.5 text-rose-500" />
          <span><strong>Chưa thể tạo nhân sự:</strong> {errorText}</span>
        </div>
      )}

      <Form<StaffFormValues>
        form={form}
        layout="vertical"
        className="[&_.ant-form-item]:mb-2.5 [&_.ant-form-item-label]:!pb-0.5 [&_.ant-form-item-label>label]:text-xs [&_.ant-form-item-label>label]:font-semibold [&_.ant-form-item-label>label]:text-slate-700"
        initialValues={{
          employment: "Viên chức",
          teamId: (data.teams[1]?.id ?? "GSKT") as TeamId,
          teamRole: "MEMBER",
          roleCode: "TECHNICAL_OFFICER",
        }}
        onFinish={handleFinish}
      >
        {/* Section 1: Thông tin hồ sơ nhân sự */}
        <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50/40 p-3.5">
          <div className="mb-2.5 flex items-center gap-1.5 border-b border-slate-200/70 pb-1.5">
            <IdcardOutlined className="text-[#0F4C81]" />
            <Text className="text-xs font-bold text-[#102A43]">Thông tin hồ sơ nhân sự</Text>
          </div>

          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="name"
                label="Họ và tên cán bộ"
                rules={[{ required: true, whitespace: true, message: "Vui lòng nhập họ và tên." }]}
              >
                <Input placeholder="Ví dụ: Nguyễn Văn An" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="citizenId"
                label="Số Căn cước công dân (CCCD)"
                rules={[
                  { required: true, whitespace: true, message: "Vui lòng nhập số CCCD." },
                  { pattern: /^\d{12}$/, message: "Số CCCD phải gồm đúng 12 chữ số." },
                ]}
              >
                <Input
                  prefix={<IdcardOutlined className="text-slate-400" />}
                  placeholder="Ví dụ: 091095012345 (12 số)"
                  maxLength={12}
                />
              </Form.Item>
            </Col>

            {/* Tổ / Bộ phận và Vị trí trong tổ */}
            <Col xs={24} sm={12}>
              <Form.Item
                name="teamId"
                label="Tổ / Bộ phận trực thuộc"
                rules={[{ required: true, message: "Vui lòng chọn tổ công tác." }]}
              >
                <Select
                  placeholder="Chọn tổ bộ phận"
                  options={teamOptions}
                  onChange={handleTeamChange}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="teamRole"
                label="Vị trí trong tổ / bộ phận"
                rules={[{ required: true, message: "Vui lòng chọn vị trí trong tổ." }]}
                tooltip="Chọn cán bộ là Thành viên hay Tổ trưởng / Phụ trách tổ (Lead)"
              >
                <Select
                  options={teamRoleOptions}
                  onChange={handleTeamRoleChange}
                />
              </Form.Item>
            </Col>

            {/* Thông báo ngữ cảnh khi chọn Lead hoặc Member */}
            <Col xs={24} className="mb-2">
              {selectedTeamRole === "LEADER" ? (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-900">
                  <CrownOutlined className="mt-0.5 text-sm text-amber-600 shrink-0" />
                  <div className="space-y-0.5">
                    <div>
                      Cán bộ sẽ được chỉ định làm{" "}
                      <strong>
                        {selectedTeamId === "BGD" ? "Lãnh đạo Ban" : "Tổ trưởng / Phụ trách"}
                      </strong>{" "}
                      của <strong>{currentTeam?.name}</strong>.
                    </div>
                    <div className="text-[11px] text-amber-700">
                      {currentLeader ? (
                        <>* Hiện tại cán bộ <strong>{currentLeader.name}</strong> đang giữ vai trò phụ trách tổ này (sẽ được thay thế khi tạo nhân sự).</>
                      ) : (
                        "Tổ này hiện chưa có phụ trách chính thức."
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                currentLeader && (
                  <div className="flex items-center gap-1.5 px-1 text-[11px] text-slate-500">
                    <TeamOutlined className="text-slate-400" />
                    <span>
                      Phụ trách tổ hiện tại: <strong>{currentLeader.name}</strong> ({currentLeader.title})
                    </span>
                  </div>
                )
              )}
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="employment"
                label="Loại hình biên chế"
                rules={[{ required: true, message: "Vui lòng chọn loại biên chế." }]}
              >
                <Select
                  options={[
                    { value: "Viên chức", label: "Viên chức" },
                    { value: "Hợp đồng", label: "Hợp đồng lao động" },
                  ]}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="phone"
                label="Số điện thoại liên hệ"
                rules={[{ required: true, whitespace: true, message: "Vui lòng nhập số điện thoại." }]}
              >
                <Input prefix={<PhoneOutlined className="text-slate-400" />} placeholder="09xx.xxx.xxx" />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                name="email"
                label="Email công vụ"
                rules={[
                  { required: true, whitespace: true, message: "Vui lòng nhập email." },
                  { type: "email", message: "Email không đúng định dạng." },
                ]}
              >
                <Input prefix={<MailOutlined className="text-slate-400" />} placeholder="canbo@hatien.gov.vn" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Section 2: Vai trò & Phân quyền hệ thống */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-3.5">
          <div className="mb-2.5 flex items-center gap-1.5 border-b border-slate-200/70 pb-1.5">
            <SafetyCertificateOutlined className="text-teal-700" />
            <Text className="text-xs font-bold text-[#102A43]">Vai trò & Phân quyền hệ thống</Text>
          </div>

          <Row gutter={[16, 0]} align="middle">
            <Col xs={24} sm={12}>
              <Form.Item
                name="roleCode"
                label="Vai trò hệ thống"
                rules={[{ required: true, message: "Vui lòng phân vai trò hệ thống." }]}
                className="!mb-0"
              >
                <Select options={roleOptions} placeholder="Chọn vai trò hệ thống" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <div className="mt-4 sm:mt-5 rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-500">
                <Text className="block text-[11px] leading-4 text-slate-500">
                  * Tài khoản theo <strong>Email</strong>, mật khẩu mặc định là <code className="rounded bg-slate-100 px-1 py-0.5 font-mono font-bold text-slate-700">1111</code>.
                </Text>
              </div>
            </Col>
          </Row>
        </div>
      </Form>
    </Drawer>
  );
}
