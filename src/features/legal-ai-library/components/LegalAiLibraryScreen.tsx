"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  HistoryOutlined,
  LockOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import { Button, Card, Flex, Text, Title } from "@/components/ui";
import AiLegalAssistantDrawer from "./AiLegalAssistantDrawer";
import LegalDocumentViewer from "./LegalDocumentViewer";
import { LEGAL_LOG_MODULE } from "../constants/legal-mock-data";
import ActivityDateFilter, { toLocalDate } from "@/features/personnel-assignment/components/ActivityDateFilter";
import ActivityTimeline from "@/features/personnel-assignment/components/ActivityTimeline";
import { useActivityLogVersion } from "@/features/personnel-assignment/hooks/useActivityLogVersion";
import { getPersonnelActivities } from "@/features/personnel-assignment/utils/activity-log";
import { getLegalAiPermissions } from "../utils/legal-ai-permissions";
import { useAuthStore } from "@/stores/auth.store";

export default function LegalAiLibraryScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const permissions = useMemo(() => getLegalAiPermissions(user), [user]);

  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantPrompt, setAssistantPrompt] = useState<string>("");
  const [screenTab, setScreenTab] = useState<"viewer" | "history">("viewer");
  // Lọc lịch sử theo một ngày (yyyy-mm-dd), rỗng = tất cả
  const [historyDate, setHistoryDate] = useState("");
  const logVersion = useActivityLogVersion();

  // Lịch sử thao tác trên thư viện (nhật ký dùng chung, lọc theo phân hệ), mới nhất lên đầu
  const libraryHistory = useMemo(() => {
    const all = getPersonnelActivities().filter((e) => e.module === LEGAL_LOG_MODULE);
    return historyDate ? all.filter((e) => toLocalDate(e.at) === historyDate) : all;
    // đọc lại khi nhật ký có dòng mới
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyDate, logVersion]);

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
                Tài khoản hiện tại: <strong className="text-slate-800">{user?.displayName ?? user?.name ?? "Chưa đăng nhập"}</strong> · Chức danh: <strong className="text-slate-800">{user?.roleName ?? user?.role ?? "Khách"}</strong>
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
      {/* 2 tab trên cùng: tra cứu chi tiết (mẫu Thư Viện Pháp Luật) / lịch sử thao tác */}
      <div role="tablist" className="inline-flex gap-1 self-start rounded-lg border border-slate-200 bg-slate-100/70 p-0.5">
        {(
          [
            { key: "viewer", icon: <ReadOutlined />, label: "Tra cứu Thư viện Pháp lý" },
            { key: "history", icon: <HistoryOutlined />, label: "Lịch sử thay đổi" },
          ] as const
        ).map((tab) => {
          const active = screenTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setScreenTab(tab.key)}
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

      {screenTab === "viewer" ? (
        <LegalDocumentViewer
          onOpenAssistantWithPrompt={(prompt) => {
            setAssistantPrompt(prompt);
            setIsAssistantOpen(true);
          }}
        />
      ) : (
        <Card
          surface="flat"
          padding="none"
          rounded="lg"
          className="overflow-hidden border border-slate-200 shadow-xs bg-white"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-4 py-3.5">
            <div className="min-w-0">
              <h2 className="m-0 text-base font-bold text-slate-900">Lịch sử thay đổi</h2>
              <p className="m-0 mt-0.5 text-xs text-slate-500">
                Ai đã thao tác trên thư viện, vào lúc nào · {libraryHistory.length} thao tác
              </p>
            </div>
            <ActivityDateFilter value={historyDate} onChange={setHistoryDate} />
          </div>
          <div className="p-4">
            <ActivityTimeline
              key={historyDate}
              entries={libraryHistory}
              pageSize={20}
              emptyText={
                historyDate
                  ? "Không có thao tác nào trong ngày đã chọn."
                  : "Chưa có thao tác nào trên thư viện được ghi nhận."
              }
            />
          </div>
        </Card>
      )}

      {/* Drawer Trợ lý AI pháp lý (closable=false) */}
      <AiLegalAssistantDrawer
        open={isAssistantOpen}
        initialPrompt={assistantPrompt}
        onClose={() => {
          setIsAssistantOpen(false);
          setAssistantPrompt("");
        }}
      />
    </div>
  );
}
