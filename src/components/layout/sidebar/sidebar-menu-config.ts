import React from "react";
import {
  AppstoreOutlined,
  AuditOutlined,
  BookOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  FileProtectOutlined,
  ProjectOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { canAccessPath } from "@/access-control";
import type { AuthUser } from "@/types/auth";

type MenuItem = NonNullable<MenuProps["items"]>[number];

export const sidebarMenuItems: MenuItem[] = [
  {
    key: "/dashboard",
    label: "Bảng điều khiển",
    icon: React.createElement(AppstoreOutlined),
  },
  {
    key: "/projects_works",
    label: "Dự án & Công trình",
    icon: React.createElement(ProjectOutlined),
  },
  {
    key: "/construction-procedures",
    label: "Hồ sơ thủ tục XDCB",
    icon: React.createElement(FileProtectOutlined),
  },
  {
    key: "/finance-settlement",
    label: "Tài chính & Quyết toán",
    icon: React.createElement(DollarOutlined),
  },
  {
    key: "/personnel-assignment",
    label: "Nhân sự & Phân công",
    icon: React.createElement(TeamOutlined),
  },
  {
    key: "/site-clearance-resettlement",
    label: "GPMB - Bồi thường TĐC",
    icon: React.createElement(EnvironmentOutlined),
  },
  {
    key: "/bidding-management",
    label: "Quản lý Đấu thầu",
    icon: React.createElement(AuditOutlined),
  },
  {
    key: "/warranty-maintenance",
    label: "Bảo hành & Bảo trì",
    icon: React.createElement(SafetyCertificateOutlined),
  },
  {
    key: "/legal-ai-library",
    label: "Thư viện Pháp lý",
    icon: React.createElement(BookOutlined),
  },
];

import { getUserEffectivePermissions } from "@/access-control";

export function getSidebarMenuItemsForUser(user: AuthUser | null): MenuItem[] {
  const permissions = getUserEffectivePermissions(user);

  return sidebarMenuItems.filter((item) => {
    if (!item || !("key" in item) || typeof item.key !== "string") {
      return true;
    }
    return canAccessPath(permissions, item.key);
  });
}
