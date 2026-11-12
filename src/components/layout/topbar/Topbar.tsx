"use client";

import {
  BellOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { usePathname } from "next/navigation";
import {
  Badge,
  Button,
  ConfigProvider,
  Divider,
  Header,
  Text,
  Tooltip,
  toast,
} from "@/components/ui";
import { antdLightTheme, themeClassNames } from "@/components/theme";
import { useAppRefreshStore } from "@/stores/app-refresh.store";
import { getTopbarPageTitle } from "./topbar-page-title";

interface TopbarProps {
  sidebarCollapsed: boolean;
}

export default function Topbar({ sidebarCollapsed }: TopbarProps) {
  const pathname = usePathname();
  const pageTitle = getTopbarPageTitle(pathname);
  const { isRefreshing, triggerRefresh, setRefreshing } = useAppRefreshStore();

  const handleRefresh = () => {
    triggerRefresh();
    setTimeout(() => {
      setRefreshing(false);
      toast.success("Làm mới dữ liệu", "Đã làm mới dữ liệu hệ thống thành công!");
    }, 700);
  };

  return (
    <ConfigProvider theme={antdLightTheme}>
      <Header
        intent="light"
        className={`${themeClassNames.topbar.header} !flex !items-center !justify-between !px-5 !h-[60px] !max-h-[60px] !leading-normal !overflow-hidden`}
        style={{
          left: sidebarCollapsed ? 72 : 260,
          position: "fixed",
          right: 0,
          top: 0,
          transition: "left 200ms ease",
          zIndex: 1050,
        }}
      >
        <div className="flex items-center justify-between w-full h-full min-w-0">
          {/* Left section: current page title */}
          <div className="flex items-center min-w-0 flex-1 pr-4">
            <Text className="truncate text-base font-bold text-[var(--cipm-text-title)]">
              {pageTitle}
            </Text>
          </div>

          {/* Right section: Fiscal Year, Reload button, Notifications, Divider */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Nút Load / Làm mới thay thế nút Xuất PDF (BRD 4.1.3: Tự làm mới mỗi 15 phút hoặc khi nhấn nút) */}
            <Tooltip title="Làm mới dữ liệu (Hệ thống tự động cập nhật mỗi 15 phút)">
              <Button
                className={`${themeClassNames.topbar.exportButton} flex items-center gap-1.5`}
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <ReloadOutlined className={isRefreshing ? "animate-spin text-red-600" : ""} />
                <span>Làm mới</span>
              </Button>
            </Tooltip>

            <Badge intent="danger" dot offset={[-2, 2]}>
              <Button
                type="text"
                icon={<BellOutlined className={themeClassNames.topbar.alertIcon} />}
                className={themeClassNames.topbar.alertButton}
                aria-label="Thông báo"
              />
            </Badge>

            <Divider orientation="vertical" className={themeClassNames.topbar.divider} />
          </div>
        </div>
      </Header>
    </ConfigProvider>
  );
}
