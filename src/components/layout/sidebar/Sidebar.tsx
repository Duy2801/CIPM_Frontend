"use client";

import React, { useState } from "react";
import {
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RightOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { usePathname, useRouter } from "next/navigation";
import { ROUTE_KEYS } from "@/access-control";
import {
  Avatar,
  Divider,
  Flex,
  Menu,
  Popover,
  Sider,
  Text,
  Tooltip,
} from "@/components/ui";
import { themeClassNames } from "@/components/theme";
import { logout } from "@/features/auth";
import { useAuthStore } from "@/stores/auth.store";
import { getSidebarMenuItemsForUser } from "./sidebar-menu-config";

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

export default function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [popoverOpen, setPopoverOpen] = useState(false);

  const menuItems = React.useMemo(
    () => getSidebarMenuItemsForUser(user),
    [user],
  );

  const selectedKeys = React.useMemo(() => {
    if (pathname === "/") return ["/dashboard"];
    const matchedKey = ROUTE_KEYS.find((key) => pathname.startsWith(key));
    return matchedKey ? [matchedKey] : ["/dashboard"];
  }, [pathname]);

  // Khi thanh menu thu gọn: biến đổi danh sách thành 1 hàng phẳng chỉ icon
  const displayMenuItems = React.useMemo(() => {
    if (!collapsed) return menuItems;

    const flattened: typeof menuItems = [];
    menuItems.forEach((item) => {
      if (item && typeof item === "object" && "children" in item && Array.isArray(item.children)) {
        item.children.forEach((child) => {
          if (child) {
            flattened.push(child);
          }
        });
      } else if (item) {
        flattened.push(item);
      }
    });
    return flattened;
  }, [collapsed, menuItems]);

  const handleNavigateToProfile = () => {
    setPopoverOpen(false);
    router.push("/profile");
  };

  const handleLogout = () => {
    setPopoverOpen(false);
    logout();
  };

  // Nội dung popover menu hiện ra bên phải
  const profilePopoverContent = (
    <div className="w-64 py-1">
      {/* Thẻ tóm tắt thông tin người dùng */}
      <div className="px-3 py-2.5 mb-1.5 rounded-lg bg-slate-50 border border-slate-150">
        <Flex align="center" gap={10}>
          <Avatar variant="brand" shape="circle" size={40} className="shrink-0 font-semibold shadow-sm">
            {user?.initials ?? "HT"}
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-slate-800 text-sm truncate">
              {user?.displayName ?? user?.name ?? "Người dùng"}
            </div>
            <div className="text-xs text-slate-500 truncate">
              {user?.roleName ?? user?.role ?? "Cán bộ ban QLDA"}
            </div>
          </div>
        </Flex>
      </div>

      <Divider className="!my-1.5" />

      {/* Danh sách hành động */}
      <div className="space-y-0.5">
        <button
          type="button"
          onClick={handleNavigateToProfile}
          className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer text-left group"
        >
          <div className="flex items-center gap-2.5">
            <UserOutlined className="text-base text-slate-500 group-hover:text-emerald-600 transition-colors" />
            <span className="font-medium">Thông tin cá nhân</span>
          </div>
          <RightOutlined className="text-xs text-slate-400 group-hover:text-emerald-600 transition-colors" />
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer text-left"
        >
          <LogoutOutlined className="text-base text-red-500" />
          <span className="font-medium flex-1">Đăng xuất</span>
        </button>
      </div>
    </div>
  );

  return (
    <Sider
      width={260}
      collapsedWidth={72}
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      theme="dark"
      trigger={null}
      className={themeClassNames.sidebar.surface}
      style={{
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 1100,
        transition: "all 0.2s cubic-bezier(0.2, 0, 0, 1)",
      }}
    >
      <Flex vertical justify="space-between" className="h-full">
        {/* Header: Thương hiệu & Nút thu gọn / mở rộng menu */}
        <div
          className={`${themeClassNames.sidebar.dividerBottom} flex items-center h-[60px] ${
            collapsed ? "justify-center px-2" : "justify-between px-4"
          }`}
        >
          {!collapsed ? (
            <>
              <Flex vertical gap={1} className="min-w-0 pr-2">
                <Text strong className={themeClassNames.sidebar.brand}>
                  BQL ĐTXD HÀ TIÊN
                </Text>
                <span className="block text-[11px] uppercase tracking-wider text-slate-200 font-semibold leading-tight">
                  Hệ thống quản lý dự án
                </span>
              </Flex>
              <Tooltip title="Thu gọn thanh menu" placement="right">
                <button
                  type="button"
                  onClick={() => onCollapse(true)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-200 hover:text-white hover:bg-white/15 transition-colors cursor-pointer shrink-0"
                  aria-label="Thu gọn thanh menu"
                >
                  <MenuFoldOutlined className="text-base" />
                </button>
              </Tooltip>
            </>
          ) : (
            <Tooltip title="Mở rộng thanh menu" placement="right">
              <button
                type="button"
                onClick={() => onCollapse(false)}
                className="flex items-center justify-center w-10 h-10 rounded-lg text-white hover:bg-white/20 bg-white/10 transition-all cursor-pointer"
                aria-label="Mở rộng thanh menu"
              >
                <MenuUnfoldOutlined className="text-lg" />
              </button>
            </Tooltip>
          )}
        </div>

        {/* Danh sách Menu các tính năng */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto py-1">
          <Menu
            mode="inline"
            theme="dark"
            selectedKeys={selectedKeys}
            items={displayMenuItems}
            onClick={({ key }) => router.push(key)}
            className={themeClassNames.sidebar.menu}
            style={{ borderInlineEnd: "none" }}
          />
        </div>

        {/* Footer: Thông tin người dùng với Popover menu bên phải */}
        <div
          className={`${themeClassNames.sidebar.dividerTop} ${
            collapsed ? "py-3 px-2" : "py-3 px-3"
          }`}
        >
          <Popover
            content={profilePopoverContent}
            trigger="click"
            placement="rightBottom"
            open={popoverOpen}
            onOpenChange={setPopoverOpen}
          >
            {collapsed ? (
              <div
                className="flex justify-center items-center w-full py-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label="Tùy chọn người dùng"
              >
                <Tooltip
                  title={
                    !popoverOpen && user
                      ? `${user.displayName ?? user.name} (${user.roleName ?? user.role})`
                      : undefined
                  }
                  placement="right"
                >
                  <Avatar
                    variant="brand"
                    shape="circle"
                    size={38}
                    className="font-semibold shadow-sm ring-2 ring-white/10 hover:ring-[var(--cipm-brand)] transition-all"
                  >
                    {user?.initials ?? "HT"}
                  </Avatar>
                </Tooltip>
              </div>
            ) : (
              <div
                className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group"
                role="button"
                tabIndex={0}
                aria-label="Tùy chọn người dùng"
              >
                <Avatar
                  variant="brand"
                  shape="circle"
                  size={36}
                  className="shrink-0 font-semibold ring-2 ring-white/10 group-hover:ring-[var(--cipm-brand)] transition-all"
                >
                  {user?.initials ?? "HT"}
                </Avatar>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <Text strong ellipsis className="block !text-white text-sm leading-tight">
                    {user?.displayName ?? user?.name ?? "Người dùng"}
                  </Text>
                  <Text ellipsis className="block !text-slate-400 text-xs mt-0.5 leading-tight">
                    {user?.roleName ?? user?.role ?? "Cán bộ ban"}
                  </Text>
                </div>
              </div>
            )}
          </Popover>
        </div>
      </Flex>
    </Sider>
  );
}
