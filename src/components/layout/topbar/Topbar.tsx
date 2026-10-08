"use client";

import {
  BellOutlined,
  CalendarOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { usePathname } from "next/navigation";
import { message } from "antd";
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
            <div className={`${themeClassNames.topbar.fiscalFilter} flex items-center gap-1.5`}>
              <CalendarOutlined className={themeClassNames.topbar.fiscalIcon} />
              <Text className={themeClassNames.topbar.fiscalLabel}>Niên độ:</Text>
              <select
                defaultValue="2026"
                aria-label="Chọn niên độ"
                className="bg-transparent border-0 text-[12px] font-semibold text-slate-800 dark:text-slate-100 cursor-pointer focus:outline-none appearance-none pr-4 pl-0 py-0 leading-normal"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right center",
                  backgroundSize: "11px",
                }}
              >
                <option value="2025" className="text-slate-800 bg-white">2025</option>
                <option value="2026" className="text-slate-800 bg-white">2026</option>
                <option value="2027" className="text-slate-800 bg-white">2027</option>
              </select>
            </div>

            {/* Nút Load / Làm mới thay thế nút Xuất PDF (BRD 4.1.3: Tự làm mới mỗi 15 phút hoặc khi nhấn nút) */}
            <Tooltip title="Làm mới dữ liệu (Hệ thống tự động cập nhật mỗi 15 phút)">
              <Button
                className={`${themeClassNames.topbar.exportButton} flex items-center gap-1.5`}
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <ReloadOutlined className={isRefreshing ? "animate-spin text-[#007A78]" : ""} />
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
