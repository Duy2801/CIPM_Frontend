"use client";

import React from "react";
import { BankOutlined } from "@ant-design/icons";
import { Button, Card, Flex, Text, Title } from "@/components/ui";
import LoginForm from "./LoginForm";
import { useAuth } from "../hooks/useAuth";
import type { LoginCredentials } from "../types/auth.types";

export default function LoginView() {
  const { login, loading } = useAuth();

  const handleFormSubmit = async (values: LoginCredentials) => {
    await login(values);
  };

  return (
    <Flex
      vertical
      justify="space-between"
      className="h-screen w-screen overflow-hidden bg-[var(--cipm-surface-muted)] font-sans select-none"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(226, 232, 240, 0.4) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(226, 232, 240, 0.4) 1px, transparent 1px)
        `,
        backgroundSize: "28px 28px",
      }}
    >
      <header className="w-full bg-[var(--cipm-surface-panel)] border-b border-[color:var(--cipm-border-subtle)] px-6 sm:px-10 py-3 z-10">
        <Flex align="center" gap={12}>
          <Flex
            align="center"
            justify="center"
            className="h-9 w-9 rounded-xl bg-[var(--cipm-info-soft)] text-[var(--cipm-info)] border border-[color:var(--cipm-border-subtle)] text-lg shrink-0 shadow-sm"
          >
            <BankOutlined />
          </Flex>
          <Flex vertical gap={2}>
            <Text className="text-[10px] font-bold text-[var(--cipm-text-muted)] uppercase tracking-wider leading-none">
              UBND TP HÀ TIÊN
            </Text>
            <Text strong className="text-sm text-[var(--cipm-text-title)] tracking-tight leading-none">
              BQL DỰ ÁN ĐẦU TƯ XÂY DỰNG
            </Text>
          </Flex>
        </Flex>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-3 z-10">
        <Card
          surface="portal"
          padding="comfortable"
          rounded="lg"
          className="w-full max-w-[400px]"
        >
          <Flex vertical align="center" justify="center" className="w-full -mt-6 mb-8">
            <Flex
              align="center"
              justify="center"
              className="w-11 h-11 rounded-xl bg-[var(--cipm-info-soft)] text-[var(--cipm-info)] mb-2.5 shadow-xs shrink-0"
            >
              <BankOutlined className="text-lg" />
            </Flex>

            <Title
              level={3}
              className="!mt-0 !mb-2.5 text-center text-[20px] font-bold text-[var(--cipm-text-title)] tracking-tight leading-tight"
            >
              Đăng nhập
            </Title>
          </Flex>

          <LoginForm onSubmit={handleFormSubmit} loading={loading} />
        </Card>
      </main>

      <footer className="w-full bg-[var(--cipm-surface-panel)] border-t border-[color:var(--cipm-border-subtle)] px-6 sm:px-10 py-2.5 z-10">
        <Flex
          align="center"
          justify="space-between"
          className="flex-col sm:flex-row gap-2 text-xs text-[var(--cipm-text-muted)]"
        >
          <Text className="text-xs text-[var(--cipm-text-muted)]">
            © 2026 Ban Quản lý Dự án Đầu tư Xây dựng Hà Tiên · Tỉnh Kiên Giang
          </Text>
          <Flex align="center" gap={16}>
            <Button
              intent="link"
              scale="xs"
              onClick={() => alert("Tài liệu hướng dẫn sử dụng hệ thống CIPM đang được cập nhật.")}
            >
              Hướng dẫn sử dụng
            </Button>
            <Button
              intent="link"
              scale="xs"
              onClick={() => alert("Tổng đài hỗ trợ kỹ thuật BQL: 0297.xxx.xxxx (Tổ Hành chính - Tổng hợp)")}
            >
              Hỗ trợ kỹ thuật
            </Button>
            <Button
              intent="link"
              scale="xs"
              onClick={() => alert("Hệ thống tuân thủ Quy chuẩn An toàn thông tin mạng cấp độ 3.")}
            >
              Quy chế bảo mật
            </Button>
          </Flex>
        </Flex>
      </footer>
    </Flex>
  );
}
