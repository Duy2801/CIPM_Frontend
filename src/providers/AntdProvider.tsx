"use client";

/**
 * AntdProvider.tsx — Ant Design ConfigProvider + App wrapper
 *
 * Cung cấp theme tokens cho toàn bộ ứng dụng.
 * Dùng antdDarkTheme làm mặc định (giao diện tối Navy).
 */

import React from "react";
import { ConfigProvider, App } from "antd";
import viVN from "antd/locale/vi_VN";
import { antdLightTheme } from "@/components/theme";
import { ToastContainer } from "@/components/ui";

interface AntdProviderProps {
  children: React.ReactNode;
}

export default function AntdProvider({ children }: AntdProviderProps) {
  return (
    <ConfigProvider theme={antdLightTheme} locale={viVN}>
      <App>
        {children}
        <ToastContainer />
      </App>
    </ConfigProvider>
  );
}

