"use client";

import React from "react";
import {
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";
import { Avatar, Button, Flex, Tag, Text } from "@/components/ui";
import { MOCK_ROLES } from "../constants/mock-roles";
import type { MockRoleAccount } from "../types/auth.types";

interface QuickRoleSelectorProps {
  onSelectRole: (role: MockRoleAccount) => void;
  onInstantLogin: (username: string, password: string) => void;
  selectedUsername?: string;
  loading?: boolean;
}

export default function QuickRoleSelector({
  onSelectRole,
  onInstantLogin,
  selectedUsername,
  loading = false,
}: QuickRoleSelectorProps) {
  const [activeTab, setActiveTab] = React.useState<"ALL" | "LEAD" | "STAFF">("LEAD");

  const displayedRoles = React.useMemo(() => {
    if (activeTab === "LEAD") return MOCK_ROLES.filter((r) => r.isLead);
    if (activeTab === "STAFF") return MOCK_ROLES.filter((r) => !r.isLead);
    return MOCK_ROLES;
  }, [activeTab]);

  return (
    <Flex vertical gap={12}>
      <Flex align="center" justify="space-between" className="pb-2 border-b border-[color:var(--cipm-border-subtle)]">
        <Flex align="center" gap={8}>
          <SafetyCertificateOutlined className="text-[var(--cipm-info)] text-base" />
          <Text strong className="text-xs uppercase tracking-wider text-[var(--cipm-text-title)]">
            VAI TRÒ MẪU HỆ THỐNG
          </Text>
        </Flex>
        <Text className="text-xs text-[var(--cipm-text-muted)]">
          Mật khẩu chung: <strong className="font-mono text-[var(--cipm-info)]">123456</strong>
        </Text>
      </Flex>

      {/* Tabs lọc nhanh: Lead phòng ban / Tất cả */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("LEAD")}
          className={`flex-1 py-1 px-2 rounded-md font-semibold transition-all ${
            activeTab === "LEAD"
              ? "bg-white text-[#DC2626] shadow-2xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Lead phòng ban ({MOCK_ROLES.filter((r) => r.isLead).length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ALL")}
          className={`flex-1 py-1 px-2 rounded-md font-semibold transition-all ${
            activeTab === "ALL"
              ? "bg-white text-[#DC2626] shadow-2xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Tất cả ({MOCK_ROLES.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("STAFF")}
          className={`flex-1 py-1 px-2 rounded-md font-semibold transition-all ${
            activeTab === "STAFF"
              ? "bg-white text-[#DC2626] shadow-2xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Thành viên phòng ban ({MOCK_ROLES.filter((r) => !r.isLead).length})
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2.5 max-h-[380px] overflow-y-auto pr-1 select-none">
        {displayedRoles.map((role) => {
          const isSelected = selectedUsername === role.credentials.username;

          return (
            <div
              key={role.id}
              onClick={() => onSelectRole(role)}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${isSelected
                  ? "bg-[var(--cipm-info-soft)] border-[var(--cipm-info)] ring-1 ring-[var(--cipm-info)] shadow-xs"
                  : "bg-[var(--cipm-surface-panel)] border-[color:var(--cipm-border-subtle)] hover:border-[color:var(--cipm-border-default)] hover:bg-[var(--cipm-surface-muted)]"
                }`}
            >
              <Flex align="center" justify="space-between" gap={8}>
                <Flex align="center" gap={10} className="min-w-0 flex-1">
                  <Avatar
                    size={36}
                    shape="circle"
                    className={`shrink-0 font-bold text-xs ${isSelected
                        ? "!bg-[var(--cipm-info)] !text-white"
                        : "!bg-[var(--cipm-surface-muted)] !text-[var(--cipm-text-body)] border border-[color:var(--cipm-border-subtle)]"
                      }`}
                  >
                    {role.user.initials}
                  </Avatar>
                  <Flex vertical gap={1} className="min-w-0 flex-1">
                    <Flex align="center" gap={6} wrap="wrap">
                      <Text strong className="text-sm text-[var(--cipm-text-title)] truncate">
                        {role.user.displayName}
                      </Text>
                      {role.isLead && (
                        <span className="text-[9px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded shrink-0">
                          LEAD
                        </span>
                      )}
                      {isSelected && (
                        <CheckCircleFilled className="text-[var(--cipm-info)] text-xs" />
                      )}
                    </Flex>
                    <Text className="text-xs text-[var(--cipm-text-muted)] truncate">
                      <strong className="text-[var(--cipm-info)]">{role.roleName}</strong> · {role.department}
                    </Text>
                  </Flex>
                </Flex>

                <div className="shrink-0 flex items-center gap-2">
                  <Button
                    intent={isSelected ? "primary" : "outline"}
                    scale="compact"
                    loading={loading && isSelected}
                    onClick={(e) => {
                      e.stopPropagation();
                      onInstantLogin(role.credentials.username, role.credentials.password);
                    }}
                  >
                    <ThunderboltOutlined />
                    Vào ngay
                  </Button>
                </div>
              </Flex>

              {/* Tóm tắt quyền hạn */}
              <Flex align="center" justify="space-between" className="mt-2 pt-2 border-t border-[color:var(--cipm-border-subtle)] text-xs text-[var(--cipm-text-muted)]">
                <Flex align="center" gap={4} wrap="wrap">
                  {role.accessibleSummary.map((tag, tagIdx) => (
                    <Tag
                      key={tagIdx}
                      intent="subtle"
                      scale="sm"
                    >
                      {tag}
                    </Tag>
                  ))}
                </Flex>
                <Text className="font-mono text-[11px] text-[var(--cipm-text-muted)]">
                  user: <strong className="text-[var(--cipm-text-body)]">{role.credentials.username}</strong>
                  {role.aliases && role.aliases.length > 0 && (
                    <span className="text-[10px] text-slate-400 font-normal ml-1">
                      (hoặc {role.aliases[0]})
                    </span>
                  )}
                </Text>
              </Flex>
            </div>
          );
        })}
      </div>
    </Flex>
  );
}
