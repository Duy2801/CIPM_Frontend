"use client";

import { LockOutlined } from "@ant-design/icons";
import type React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  canAccessPath,
  getFirstAllowedRoute,
  getRoutePermission,
} from "@/access-control";
import { AppLoadingScreen, Button, Card, Flex, Text, Title } from "@/components/ui";
import { useAuthStore } from "@/stores/auth.store";
import type { Permission } from "@/types/auth";

interface AccessControlGateProps {
  children: React.ReactNode;
}

const EMPTY_PERMISSIONS: Permission[] = [];

export function AccessControlGate({ children }: AccessControlGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  // Khi hệ thống đang tải phiên làm việc và quyền người dùng (tránh chớp màn hình cấm quyền):
  if (!isInitialized) {
    return <AppLoadingScreen message="Đang tải dữ liệu hệ thống..." />;
  }

  const permissions = user?.permissions ?? EMPTY_PERMISSIONS;
  const hasAccess = canAccessPath(permissions, pathname);

  if (hasAccess) return <>{children}</>;

  const routePermission = getRoutePermission(pathname);
  const fallbackRoute = getFirstAllowedRoute(permissions);

  return (
    <Flex layout="center" className="min-h-[calc(100vh-120px)] px-4">
      <Card surface="workspace" className="w-full max-w-[560px] text-center">
        <Flex vertical align="center" gap={14}>
          <Flex
            align="center"
            justify="center"
            className="h-12 w-12 rounded-full bg-[var(--cipm-danger-soft)] text-[var(--cipm-danger)]"
          >
            <LockOutlined />
          </Flex>
          <Flex vertical align="center" gap={6}>
            <Title level={4} className="!m-0">
              Ban khong co quyen truy cap man hinh nay
            </Title>
            <Text type="secondary">
              {routePermission?.label ?? pathname} chua duoc cap quyen cho phien lam viec hien tai.
            </Text>
          </Flex>
          <Button intent="primary" onClick={() => router.push(fallbackRoute)}>
            Ve man hinh duoc phep
          </Button>
        </Flex>
      </Card>
    </Flex>
  );
}
