"use client";

import React, { useState } from "react";
import {
  CheckCircleFilled,
  IdcardOutlined,
  KeyOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  SaveOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { message } from "antd";
import {
  Avatar,
  Button,
  Card,
  Col,
  Flex,
  Form,
  Input,
  Row,
  Tabs,
  Tag,
  Text,
} from "@/components/ui";
import { useAuthStore } from "@/stores/auth.store";

interface ProfileFormValues {
  displayName: string;
  phone: string;
  email: string;
}

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [profileForm] = Form.useForm<ProfileFormValues>();
  const [passwordForm] = Form.useForm<PasswordFormValues>();

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Khởi tạo giá trị form từ user hiện tại
  React.useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        displayName: user.displayName ?? user.name ?? "",
        phone: user.phone ?? "",
        email: user.email ?? "",
      });
    }
  }, [user, profileForm]);

  // Cập nhật thông tin hồ sơ
  const handleUpdateProfile = async (values: ProfileFormValues) => {
    setSavingProfile(true);
    try {
      const updatedDisplayName = values.displayName.trim();
      const initials = updatedDisplayName
        ? updatedDisplayName
            .split(" ")
            .filter(Boolean)
            .slice(-2)
            .map((w) => w[0].toUpperCase())
            .join("")
        : user?.initials;

      updateUser({
        displayName: updatedDisplayName,
        name: updatedDisplayName,
        phone: values.phone.trim(),
        email: values.email.trim(),
        initials: initials || user?.initials,
      });

      message.success("Cập nhật thông tin cá nhân thành công!");
    } catch {
      message.error("Có lỗi xảy ra khi cập nhật thông tin!");
    } finally {
      setSavingProfile(false);
    }
  };

  // Đổi mật khẩu
  const handleChangePassword = async (values: PasswordFormValues) => {
    setSavingPassword(true);
    try {
      if (values.currentPassword !== "123456") {
        message.error("Mật khẩu hiện tại không chính xác (mật khẩu mặc định là '123456')");
        setSavingPassword(false);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      message.success("Đổi mật khẩu thành công! Vui lòng ghi nhớ mật khẩu mới.");
      passwordForm.resetFields();
    } catch {
      message.error("Đã xảy ra lỗi khi đổi mật khẩu!");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-1">
      <Row gutter={[20, 20]} align="stretch">
        {/* Cột trái: Tóm tắt thông tin & Thẻ phân quyền */}
        <Col xs={24} lg={8} className="flex flex-col gap-3.5">
          <Card
            title={<span className="text-sm font-bold text-slate-800">Hồ sơ cán bộ</span>}
            surface="workspace"
            padding="compact"
            className="shadow-sm"
          >
            {/* Header tóm tắt có Avatar */}
            <div className="flex items-center gap-3 pb-3 mb-2 border-b border-slate-100">
              <Avatar
                variant="brand"
                shape="circle"
                size={48}
                className="text-base font-bold shadow-sm shrink-0"
              >
                {user?.initials ?? "HT"}
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-800 text-[15px] leading-tight truncate">
                  {user?.displayName ?? user?.name ?? "Cán bộ ban"}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 truncate">
                  Mã định danh: <span className="font-mono text-slate-700 font-medium">{user?.id ?? "N/A"}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Tag color="cyan" className="font-semibold !text-[11px] !m-0 !py-0 !px-1.5">
                    {user?.roleName ?? user?.role ?? "Cán bộ"}
                  </Tag>
                  {user?.department && (
                    <Tag color="blue" className="font-semibold !text-[11px] !m-0 !py-0 !px-1.5">
                      {user.department}
                    </Tag>
                  )}
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <UserOutlined className="text-slate-400" />
                  Họ và tên
                </span>
                <span className="font-semibold text-slate-800 text-right">
                  {user?.displayName ?? user?.name ?? "—"}
                </span>
              </div>

              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <span className="text-slate-400 font-mono text-[11px]">@</span>
                  Tên đăng nhập
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-medium text-slate-700">
                    {user?.username ?? user?.name ?? "—"}
                  </span>
                  <Tag className="!text-[10px] !m-0 !py-0 !px-1 text-slate-400 border-dashed">Cố định</Tag>
                </div>
              </div>

              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <SafetyCertificateOutlined className="text-slate-400" />
                  Chức danh
                </span>
                <span className="font-semibold text-emerald-700 text-right">
                  {user?.roleName ?? user?.role ?? "—"}
                </span>
              </div>

              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <IdcardOutlined className="text-slate-400" />
                  Đơn vị công tác
                </span>
                <span className="font-medium text-slate-800 text-right">
                  {user?.department ?? "BQL ĐTXD TP. Hà Tiên"}
                </span>
              </div>

              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <PhoneOutlined className="text-slate-400" />
                  Số điện thoại
                </span>
                <span className="font-medium text-slate-800 text-right">
                  {user?.phone ?? "0297.xxx.xxx"}
                </span>
              </div>

              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <MailOutlined className="text-slate-400" />
                  Email liên hệ
                </span>
                <span className="font-medium text-slate-800 text-right">
                  {user?.email ?? "cán_bộ@hatien.gov.vn"}
                </span>
              </div>
            </div>
          </Card>

          {/* Card trạng thái tài khoản */}
          <Card surface="workspace" padding="compact" className="shadow-sm">
            <Flex align="center" gap={10}>
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircleFilled className="text-base" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800">Trạng thái tài khoản: Hoạt động</div>
                <div className="text-[11px] text-slate-500">Đã đồng bộ đầy đủ thẩm quyền nội bộ</div>
              </div>
            </Flex>
          </Card>
        </Col>

        {/* Cột phải: Tabs Cập nhật thông tin & Đổi mật khẩu */}
        <Col xs={24} lg={16}>
          <Card surface="workspace" padding="compact" className="shadow-sm h-full">
            <Tabs
              defaultActiveKey="info"
              items={[
                {
                  key: "info",
                  label: (
                    <span className="flex items-center gap-1.5 text-sm">
                      <UserOutlined />
                      Cập nhật thông tin
                    </span>
                  ),
                  children: (
                    <div className="pt-1">
                      <div className="mb-3">
                        <div className="text-sm font-bold text-slate-800">
                          Thông tin hồ sơ cán bộ
                        </div>
                        <Text type="secondary" className="text-xs">
                          Cập nhật họ tên hiển thị và các kênh liên lạc phục vụ công tác điều hành, thông báo.
                        </Text>
                      </div>

                      <Form
                        form={profileForm}
                        layout="vertical"
                        onFinish={handleUpdateProfile}
                        requiredMark={false}
                        className="space-y-2.5"
                      >
                        <Form.Item
                          name="displayName"
                          label={<span className="text-xs font-semibold text-slate-700">Họ và tên cán bộ</span>}
                          rules={[{ required: true, message: "Vui lòng nhập họ và tên" }]}
                          className="!mb-2.5"
                        >
                          <Input
                            prefix={<UserOutlined className="text-slate-400" />}
                            placeholder="Nhập họ và tên cán bộ"
                            className="h-9"
                          />
                        </Form.Item>

                        <Row gutter={12}>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              name="phone"
                              label={<span className="text-xs font-semibold text-slate-700">Số điện thoại di động</span>}
                              rules={[
                                { required: true, message: "Vui lòng nhập số điện thoại" },
                                { pattern: /^[0-9+.\s()-]{8,15}$/, message: "Số điện thoại không hợp lệ" },
                              ]}
                              className="!mb-2.5"
                            >
                              <Input
                                prefix={<PhoneOutlined className="text-slate-400" />}
                                placeholder="VD: 0918.xxx.xxx"
                                className="h-9"
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={12}>
                            <Form.Item
                              name="email"
                              label={<span className="text-xs font-semibold text-slate-700">Địa chỉ Email liên hệ</span>}
                              rules={[
                                { required: true, message: "Vui lòng nhập email" },
                                { type: "email", message: "Email không đúng định dạng" },
                              ]}
                              className="!mb-2.5"
                            >
                              <Input
                                prefix={<MailOutlined className="text-slate-400" />}
                                placeholder="VD: can_bo@hatien.gov.vn"
                                className="h-9"
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        {/* Phần thông tin cố định chỉ đọc */}
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2 mt-1">
                          <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                            <LockOutlined className="text-slate-400" />
                            Thông tin hệ thống quản lý (Cố định, không chỉnh sửa)
                          </div>
                          <Row gutter={[12, 6]} className="text-xs">
                            <Col span={12}>
                              <span className="text-slate-500">Tên đăng nhập: </span>
                              <span className="font-mono font-medium text-slate-700">
                                {user?.username ?? user?.name}
                              </span>
                            </Col>
                            <Col span={12}>
                              <span className="text-slate-500">Mã định danh (ID): </span>
                              <span className="font-mono font-medium text-slate-700">
                                {user?.id ?? "N/A"}
                              </span>
                            </Col>
                            <Col span={12}>
                              <span className="text-slate-500">Vai trò / Chức danh: </span>
                              <span className="font-medium text-slate-700">
                                {user?.roleName ?? user?.role}
                              </span>
                            </Col>
                            <Col span={12}>
                              <span className="text-slate-500">Phòng ban công tác: </span>
                              <span className="font-medium text-slate-700">
                                {user?.department ?? "BQL ĐTXD TP. Hà Tiên"}
                              </span>
                            </Col>
                          </Row>
                        </div>

                        <div className="pt-2 flex justify-end">
                          <Button
                            type="primary"
                            htmlType="submit"
                            loading={savingProfile}
                            icon={<SaveOutlined />}
                            className="h-9 px-5 font-medium"
                          >
                            Lưu thông tin
                          </Button>
                        </div>
                      </Form>
                    </div>
                  ),
                },
                {
                  key: "password",
                  label: (
                    <span className="flex items-center gap-1.5 text-sm">
                      <KeyOutlined />
                      Đổi mật khẩu
                    </span>
                  ),
                  children: (
                    <div className="pt-1">
                      <div className="mb-3">
                        <div className="text-sm font-bold text-slate-800">
                          Đổi mật khẩu tài khoản
                        </div>
                        <Text type="secondary" className="text-xs">
                          Mật khẩu mới nên có tối thiểu 6 ký tự để đảm bảo an toàn truy cập dữ liệu ban.
                        </Text>
                      </div>

                      <Form
                        form={passwordForm}
                        layout="vertical"
                        onFinish={handleChangePassword}
                        requiredMark={false}
                        className="space-y-2.5 max-w-md"
                      >
                        <Form.Item
                          name="currentPassword"
                          label={<span className="text-xs font-semibold text-slate-700">Mật khẩu hiện tại</span>}
                          rules={[{ required: true, message: "Vui lòng nhập mật khẩu hiện tại" }]}
                          className="!mb-2.5"
                        >
                          <Input.Password
                            prefix={<LockOutlined className="text-slate-400" />}
                            placeholder="Nhập mật khẩu hiện tại (mặc định: 123456)"
                            className="h-9"
                          />
                        </Form.Item>

                        <Form.Item
                          name="newPassword"
                          label={<span className="text-xs font-semibold text-slate-700">Mật khẩu mới</span>}
                          rules={[
                            { required: true, message: "Vui lòng nhập mật khẩu mới" },
                            { min: 6, message: "Mật khẩu mới phải có tối thiểu 6 ký tự" },
                          ]}
                          className="!mb-2.5"
                        >
                          <Input.Password
                            prefix={<KeyOutlined className="text-slate-400" />}
                            placeholder="Nhập mật khẩu mới"
                            className="h-9"
                          />
                        </Form.Item>

                        <Form.Item
                          name="confirmPassword"
                          label={<span className="text-xs font-semibold text-slate-700">Xác nhận mật khẩu mới</span>}
                          dependencies={["newPassword"]}
                          rules={[
                            { required: true, message: "Vui lòng xác nhận mật khẩu mới" },
                            ({ getFieldValue }) => ({
                              validator(_, value) {
                                if (!value || getFieldValue("newPassword") === value) {
                                  return Promise.resolve();
                                }
                                return Promise.reject(new Error("Mật khẩu xác nhận không khớp!"));
                              },
                            }),
                          ]}
                          className="!mb-2.5"
                        >
                          <Input.Password
                            prefix={<CheckCircleFilled className="text-slate-400" />}
                            placeholder="Nhập lại mật khẩu mới"
                            className="h-9"
                          />
                        </Form.Item>

                        <div className="pt-2 flex justify-end">
                          <Button
                            type="primary"
                            htmlType="submit"
                            loading={savingPassword}
                            icon={<SaveOutlined />}
                            className="h-9 px-5 font-medium"
                          >
                            Đổi mật khẩu
                          </Button>
                        </div>
                      </Form>
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
