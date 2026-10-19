"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApartmentOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { Button, Card, Flex, Spin, Text, Title } from "@/components/ui";
import {
  ModuleTabLabel,
  ReasonModal,
} from "@/components/workspace";
import { PERSONNEL_TAB_LABELS } from "../constants/personnel-labels";
import { usePersonnelAssignment } from "../hooks/usePersonnelAssignment";
import type { PersonnelTabKey } from "../types/personnel.types";
import AccountsTab from "./AccountsTab";
import OrganizationTab from "./OrganizationTab";

export default function PersonnelAssignmentScreen() {
  const router = useRouter();
  const controller = usePersonnelAssignment();
  const { permissions } = controller;

  const [activeTab, setActiveTab] = useState<PersonnelTabKey | null>(null);
  const [lockTargetId, setLockTargetId] = useState<string>();

  const currentStaff = useMemo(() => {
    if (!controller.currentUser) return undefined;
    const name = (controller.currentUser.displayName || controller.currentUser.name || "").trim().toLowerCase();
    const email = (controller.currentUser.email || "").trim().toLowerCase();
    return controller.data.staff.find(
      (s) =>
        s.id === controller.currentUser?.id ||
        (email && s.email?.toLowerCase() === email) ||
        (name && s.name.toLowerCase() === name)
    );
  }, [controller.currentUser, controller.data.staff]);

  if (controller.loading) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center">
        <Spin size="large" description="Đang tải dữ liệu nhân sự..." />
      </section>
    );
  }

  // Chặn truy cập nếu không có quyền truy cập M5 (Ban Giám đốc hoặc Người có quyền chủ dự án)
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
                Không có quyền truy cập phân hệ Nhân sự & Phân công
              </Title>
              <Text type="secondary" className="text-sm">
                Theo quy định, phân hệ <strong>M5 – Nhân sự và Phân công</strong> dành cho <strong>Ban Giám đốc</strong> (phân công dự án) và <strong>Người có quyền chủ dự án</strong> (phân công nhiệm vụ nhân viên). Các vai trò khác không có quyền truy cập.
              </Text>
              <div className="mt-2 text-xs text-slate-500 bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200">
                Tài khoản hiện tại: <strong className="text-slate-800">{controller.currentUser?.displayName ?? controller.currentUser?.name}</strong> · Vai trò: <strong className="text-slate-800">{controller.currentUser?.roleName ?? controller.currentUser?.role ?? "Khách"}</strong>
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

  const lockTarget = controller.data.staff.find((person) => person.id === lockTargetId);

  const defaultTabKey: PersonnelTabKey = "organization";

  const currentTab = activeTab ?? defaultTabKey;

  const tabItems: Array<{
    key: PersonnelTabKey;
    label: React.ReactNode;
    children: React.ReactNode;
  }> = [
    {
      key: "organization" as const,
      label: (
        <ModuleTabLabel
          icon={<ApartmentOutlined />}
          text={PERSONNEL_TAB_LABELS.organization}
        />
      ),
      children: <OrganizationTab controller={controller} />,
    },
    ...(permissions.canManageAccounts
      ? [
          {
            key: "accounts" as const,
            label: (
              <ModuleTabLabel
                icon={<SafetyCertificateOutlined />}
                text={PERSONNEL_TAB_LABELS.accounts}
              />
            ),
            children: (
              <AccountsTab
                controller={controller}
                onLockAccount={(person) => setLockTargetId(person.id)}
              />
            ),
          },
        ]
      : []),
  ];

  const resolvedCurrentTab = tabItems.some((item) => item.key === currentTab)
    ? currentTab
    : tabItems[0]?.key || "organization";

  return (
    <div className="w-full max-w-[2560px] mx-auto flex flex-col gap-4">

      <section id="personnel-tabs" className="scroll-mt-4">
        <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-100/80 p-1.5 shadow-2xs">
            {tabItems.map((item) => {
              const isActive = resolvedCurrentTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveTab(item.key as PersonnelTabKey)}
                  className={`relative flex items-center gap-2.5 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer select-none ${
                    isActive
                      ? "bg-[#DC2626] text-white shadow-sm font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  <span className={`text-base leading-none transition-colors ${isActive ? "text-white" : "text-slate-500"}`}>
                    {item.key === "organization" ? (
                      <ApartmentOutlined />
                    ) : (
                      <SafetyCertificateOutlined />
                    )}
                  </span>
                  <span className="whitespace-nowrap tracking-wide">
                    {item.key === "organization"
                      ? PERSONNEL_TAB_LABELS.organization
                      : PERSONNEL_TAB_LABELS.accounts}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Nội dung tab đang hiển thị */}
        <div>
          {tabItems.find((item) => item.key === resolvedCurrentTab)?.children}
        </div>
      </section>

      {lockTarget && (
        <ReasonModal
          open
          title={`Khóa tài khoản của ${lockTarget.name}`}
          summary={
            <>
              {lockTarget.title} ·{" "}
              {controller.data.teams.find((team) => team.id === lockTarget.teamId)?.name}
            </>
          }
          label="Lý do khóa tài khoản"
          presetReasons={[
            "Nhân viên nghỉ việc / Chấm dứt hợp đồng lao động",
            "Chuyển công tác / Luân chuyển đơn vị",
            "Nghỉ phép dài hạn / Nghỉ chế độ thai sản",
            "Tạm đình chỉ công tác để phục vụ kiểm tra, xác minh",
            "Vi phạm quy chế làm việc / An toàn thông tin hệ thống",
          ]}
          placeholder="Nêu rõ lý do cụ thể cần khóa tài khoản..."
          confirmText="Khóa tài khoản"
          onClose={() => setLockTargetId(undefined)}
          onConfirm={(reason) => controller.lockAccount(lockTarget.id, reason)}
        />
      )}
    </div>
  );
}
