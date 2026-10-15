"use client";

import {
  BellOutlined,
  CalendarOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { usePathname } from "next/navigation";
import {
  Badge,
  Button,
  ConfigProvider,
  Divider,
  Header,
  Select,
  Text,
  Tooltip,
  toast,
} from "@/components/ui";
import { antdLightTheme, themeClassNames } from "@/components/theme";
import { useAppRefreshStore } from "@/stores/app-refresh.store";
import { useFiscalYearStore } from "@/stores/fiscal-year.store";
import { getTopbarPageTitle } from "./topbar-page-title";

interface TopbarProps {
  sidebarCollapsed: boolean;
}

export default function Topbar({ sidebarCollapsed }: TopbarProps) {
  const pathname = usePathname();
  const pageTitle = getTopbarPageTitle(pathname);
  const { isRefreshing, triggerRefresh, setRefreshing } = useAppRefreshStore();
  const { selectedYear, setSelectedYear, availableYears } = useFiscalYearStore();

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
            <div className="flex items-center gap-1.5 h-8 rounded-lg border border-slate-200/90 bg-slate-50 pl-2.5 pr-1 shadow-2xs hover:border-red-400 transition-colors">
              <CalendarOutlined className="text-slate-500 text-xs" />
              <Text className="!text-[12px] !text-slate-700 font-semibold whitespace-nowrap">Niên độ:</Text>
              <Select
                value={selectedYear}
                onChange={setSelectedYear}
                intent="subtle"
                scale="compact"
                className="!w-[76px] [&_.ant-select-selector]:!px-1 [&_.ant-select-selection-item]:!text-[12px] [&_.ant-select-selection-item]:!font-bold [&_.ant-select-selection-item]:!text-slate-900"
                classNames={{
                  popup: {
                    root: "[&_.ant-select-item-option-selected]:!bg-red-50 [&_.ant-select-item-option-selected]:!text-red-700 [&_.ant-select-item-option-selected]:!font-bold [&_.ant-select-item]:!text-xs [&_.ant-select-item]:!rounded-md",
                  },
                }}
                options={availableYears.map((yr) => ({ value: yr, label: yr }))}
              />
            </div>

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
