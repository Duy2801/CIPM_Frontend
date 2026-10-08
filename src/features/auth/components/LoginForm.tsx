"use client";

import React from "react";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Checkbox, Flex, Form, Input, Text, useForm } from "@/components/ui";
import type { LoginCredentials } from "../types/auth.types";

interface LoginFormProps {
  onSubmit: (values: LoginCredentials) => void;
  loading?: boolean;
}

export default function LoginForm({
  onSubmit,
  loading = false,
}: LoginFormProps) {
  const [form] = useForm<LoginCredentials>();

  const onFinish = (values: LoginCredentials) => {
    onSubmit({
      username: values.username?.trim(),
      password: values.password,
      rememberMe: values.rememberMe ?? true,
    });
  };

  return (
    <Form<LoginCredentials>
      form={form}
      layout="vertical"
      initialValues={{ username: "", password: "", rememberMe: true }}
      onFinish={onFinish}
      requiredMark={false}
      layoutType="compact"
      className="w-full"
    >
      <Form.Item
        label={
          <Text strong variant="label" className="text-[11px] uppercase tracking-wider text-[var(--cipm-text-muted)]">
            TÊN ĐĂNG NHẬP
          </Text>
        }
        name="username"
        rules={[{ required: true, message: "Vui lòng nhập tên đăng nhập" }]}
        className="!mb-4"
      >
        <Input
          intent="clean"
          scale="md"
          rounded="default"
          prefix={<UserOutlined className="text-[var(--cipm-text-faint)] text-[15px] mr-2" />}
          placeholder="Nhập tên đăng nhập hoặc email"
        />
      </Form.Item>

      <Form.Item
        label={
          <Text strong variant="label" className="text-[11px] uppercase tracking-wider text-[var(--cipm-text-muted)]">
            MẬT KHẨU
          </Text>
        }
        name="password"
        rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
        className="!mb-4"
      >
        <Input.Password
          intent="clean"
          scale="md"
          rounded="default"
          prefix={<LockOutlined className="text-[var(--cipm-text-faint)] text-[15px] mr-2" />}
          placeholder="Nhập mật khẩu"
        />
      </Form.Item>

      <Flex align="center" justify="space-between" className="!mb-6">
        <Form.Item name="rememberMe" valuePropName="checked" noStyle>
          <Checkbox className="text-[13px] text-[var(--cipm-text-muted)] select-none">
            Ghi nhớ đăng nhập
          </Checkbox>
        </Form.Item>
        <Button
          intent="textLink"
          scale="inline"
          className="text-[13px]"
          onClick={() => {
            alert("Vui lòng liên hệ Văn phòng BQL để được cấp lại mật khẩu.");
          }}
        >
          Quên mật khẩu?
        </Button>
      </Flex>

      <Form.Item className="!mb-4">
        <Button
          intent="primary"
          scale="lg"
          fullWidth
          rounded="default"
          htmlType="submit"
          loading={loading}
        >
          {loading ? "Đang xác thực..." : "Đăng nhập"}
        </Button>
      </Form.Item>

    </Form>
  );
}
