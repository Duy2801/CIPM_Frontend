"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileTextOutlined, HistoryOutlined, LockOutlined } from "@ant-design/icons";
import { Button, Card, Flex, Text, Title } from "@/components/ui";
import { useLegalPermissions } from "../hooks/useLegalAccess";
import LegalDocumentsTab from "./LegalDocumentsTab";
import LegalHistoryTab from "./LegalHistoryTab";

type ScreenTab = "documents" | "history";

const TAB_ITEMS = [
  { key: "documents", icon: <FileTextOutlined />, label: "Danh sách văn bản" },
  { key: "history", icon: <HistoryOutlined />, label: "Lịch sử thay đổi" },
] as const;

export default function LegalAiLibraryScreen() {
  const router = useRouter();
  const { permissions, currentUser } = useLegalPermissions();
  const [activeTab, setActiveTab] = useState<ScreenTab>("documents");

  // Chặn truy cập nếu không có quyền theo Ma trận phân quyền BRD Mục 5
  if (!permissions.canAccessModule) {
    return (
      <Flex layout="center" className="min-h-[calc(100vh-140px)] px-4">
        <Card surface="workspace" className="w-full max-w-[560px] text-center border-rose-200 shadow-md">
          <Flex vertical align="center" gap={14}>
            <Flex
              align="center"
              justify="center"
              className="h-14 w-14 rounded-full bg-rose-50 text-rose-600 text-2xl"
            >
              <LockOutlined />
            </Flex>
            <Flex vertical align="center" gap={8}>
              <Title level={4} className="!m-0 text-slate-800">
                Không có quyền truy cập Thư viện Pháp lý + AI
              </Title>
              <Text type="secondary" className="text-sm">
                Tài khoản của bạn không được cấp quyền truy cập phân hệ <strong>M9 – Thư viện Pháp lý + AI</strong> theo Ma trận phân quyền BRD Mục 5.
              </Text>
              <div className="mt-2 text-xs text-slate-500 bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200">
                Tài khoản hiện tại: <strong className="text-slate-800">{currentUser?.displayName ?? currentUser?.name ?? "Chưa đăng nhập"}</strong> · Chức danh: <strong className="text-slate-800">{currentUser?.roleName ?? currentUser?.role ?? "Khách"}</strong>
              </div>
            </Flex>
            <Button intent="primary" onClick={() => router.push("/dashboard")}>
              Quay về Bảng điều khiển
            </Button>
          </Flex>
        </Card>
      </Flex>
    );
  }

  return (
    <div className="w-full max-w-[2560px] mx-auto flex flex-col gap-4">
      {/* 2 tab trên cùng: danh sách văn bản / lịch sử thao tác */}
      <div role="tablist" className="inline-flex gap-1 self-start rounded-lg border border-slate-200 bg-slate-100/70 p-0.5">
        {TAB_ITEMS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors ${
                active ? "bg-white font-semibold text-slate-900 shadow-xs" : "font-medium text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className={active ? "text-[#DC2626]" : "text-slate-400"}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Giữ cả hai tab trong cây để chuyển qua lại không mất bộ lọc, trang đang xem */}
      <div className={activeTab === "documents" ? "flex flex-col gap-4" : "hidden"}>
        <LegalDocumentsTab />
      </div>
      <div className={activeTab === "history" ? undefined : "hidden"}>
        <LegalHistoryTab />
      </div>
    </div>
  );
}
