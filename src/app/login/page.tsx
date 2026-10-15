import type { Metadata } from "next";
import { LoginView } from "@/features/auth";

export const metadata: Metadata = {
  title: "Đăng nhập · BQL ĐTXD Hà Tiên",
  description: "Cổng đăng nhập Hệ thống Quản lý Dự án Đầu tư Xây dựng BQL ĐTXD Hà Tiên",
};

export default function LoginPage() {
  return <LoginView />;
}
