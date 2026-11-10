import React from "react";
import {
  AppstoreOutlined,
  BarChartOutlined,
  BookOutlined,
  CheckSquareOutlined,
  FileProtectOutlined,
  ProjectOutlined,
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
    // Mọi cán bộ đều có: việc được giao, nộp / duyệt / từ chối kết quả
    key: "/my-tasks",
    label: "Việc cần xử lý",
    icon: React.createElement(CheckSquareOutlined),
  },
  {
    key: "/projects_works",
    label: "Dự án & Công trình",
    icon: React.createElement(ProjectOutlined),
  },
  {
    key: "/construction-procedures",
    label: "Quy trình dự án",
    icon: React.createElement(FileProtectOutlined),
  },
  {
    key: "/personnel-assignment",
    label: "Nhân sự & Phân công",
    icon: React.createElement(TeamOutlined),
  },
  {
    // Nhập / xuất tệp Excel báo cáo, xem trực tiếp trên trình duyệt
    key: "/reports",
    label: "Báo cáo",
    icon: React.createElement(BarChartOutlined),
  },
  {
    key: "/legal-ai-library",
    label: "Thư viện Pháp lý",
    icon: React.createElement(BookOutlined),
  },
];

import { getUserEffectivePermissions } from "@/access-control";

export function getSidebarMenuItemsForUser(user: AuthUser | null): MenuItem[] {
  // Chưa tải xong phiên đăng nhập: chưa hiện mục nào, để các mục (kể cả mục không cần quyền) hiện cùng lúc
  if (!user) return [];
  const permissions = getUserEffectivePermissions(user);

  return sidebarMenuItems.filter((item) => {
    if (!item || !("key" in item) || typeof item.key !== "string") {
      return true;
    }
    return canAccessPath(permissions, item.key);
  });
}
