import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AntdProvider } from "@/providers";
import { DashboardShell } from "@/components/layout/shell";
import { themeClassNames, themeCssVariables } from "@/components/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BQL ĐTXD Hà Tiên",
  description: "Hệ thống quản lý dự án BQL ĐTXD Hà Tiên",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className={themeClassNames.app.body} style={themeCssVariables}>
        <AntdProvider>
          <DashboardShell>{children}</DashboardShell>
        </AntdProvider>
      </body>
    </html>
  );
}
