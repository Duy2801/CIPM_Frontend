"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AccessControlGate } from "@/components/AccessControlGate";
import { Content, Layout } from "@/components/ui";
import Sidebar from "@/components/layout/sidebar/Sidebar";
import Topbar from "@/components/layout/topbar/Topbar";
import { themeClassNames } from "@/components/theme";
import {
  MOCK_ROLES,
  USE_MOCK_AUTH,
  getStoredAccessToken,
  getStoredUser,
  normalizeAuthResponse,
  persistAuthSession,
  toAuthUser,
} from "@/features/auth";
import { useAppRefreshStore } from "@/stores/app-refresh.store";
import { useAuthStore } from "@/stores/auth.store";

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const isRefreshing = useAppRefreshStore((state) => state.isRefreshing);
  const sidebarWidth = sidebarCollapsed ? 72 : 260;

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("cipm_sidebar_collapsed");
      if (saved !== null) {
        setSidebarCollapsed(saved === "true");
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, []);

  const handleCollapse = React.useCallback((collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    try {
      localStorage.setItem("cipm_sidebar_collapsed", String(collapsed));
    } catch {
      // Ignore storage errors
    }
  }, []);

  React.useEffect(() => {
    document.documentElement.style.setProperty("--cipm-sidebar-width", `${sidebarWidth}px`);
  }, [sidebarWidth]);

  React.useEffect(() => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      const stored = getStoredUser();
      const token = getStoredAccessToken();
      if (stored && token) {
        useAuthStore.getState().setAuth(stored, token);
      } else if (USE_MOCK_AUTH && MOCK_ROLES.length > 0) {
        const defaultRole = MOCK_ROLES[0];
        const authData = normalizeAuthResponse({
          user: defaultRole.user,
          tokens: {
            accessToken: `mock_default_token_${Date.now()}`,
            refreshToken: `mock_default_refresh_${Date.now()}`,
          },
          permissions: defaultRole.permissions,
        });
        persistAuthSession(authData, true);
        useAuthStore.getState().setAuth(
          toAuthUser(authData.user, authData.user.permissions ?? []),
          authData.tokens.accessToken
        );
      } else {
        useAuthStore.getState().setInitialized(true);
      }
    } else {
      useAuthStore.getState().setInitialized(true);
    }
  }, []);

  const isAuthRoute = pathname.startsWith("/auth") || pathname === "/login";

  if (isAuthRoute) {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  return (
    <Layout className={themeClassNames.app.shell}>
      {/* Thanh chạy tiến trình mỏng phía trên cùng khi làm mới dữ liệu */}
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#007A78] via-[#00B4D8] to-[#007A78] z-[9999] animate-loading-bar pointer-events-none" />
      )}

      {/* Hiệu ứng loading mượt mà làm mờ nhẹ nền khi nhấn nút Làm mới */}
      {isRefreshing && (
        <div className="fixed inset-0 z-[1200] flex flex-col items-center justify-center bg-slate-900/15 backdrop-blur-[2px] transition-all duration-300 pointer-events-none">
          <div className="flex flex-col items-center gap-3 bg-white/95 dark:bg-slate-800/95 px-7 py-5 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700/80 pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="relative flex items-center justify-center w-12 h-12">
              <div className="absolute inset-0 rounded-full border-2 border-teal-500/20" />
              <div className="absolute inset-0 rounded-full border-2 border-[#007A78] border-t-transparent animate-spin" />
              <span className="text-[11px] font-bold text-[#007A78]">HT</span>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Đang làm mới dữ liệu...
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Đang đồng bộ lại toàn bộ dữ liệu mới nhất
              </div>
            </div>
          </div>
        </div>
      )}

      <Sidebar collapsed={sidebarCollapsed} onCollapse={handleCollapse} />
      <Topbar sidebarCollapsed={sidebarCollapsed} />
      <Content
        surface="white"
        className={themeClassNames.app.content}
        style={{
          marginLeft: sidebarWidth,
          paddingTop: 60,
        }}
      >
        <main className={themeClassNames.app.main}>
          <AccessControlGate>{children}</AccessControlGate>
        </main>
      </Content>
    </Layout>
  );
}
