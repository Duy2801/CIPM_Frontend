const PAGE_TITLES: ReadonlyArray<readonly [string, string]> = [
  ["/dashboard", "Bảng điều khiển"],
  ["/projects_works", "Dự án & Công trình"],
  ["/construction-procedures", "Hồ sơ thủ tục XDCB"],
  ["/finance-settlement", "Tài chính & Quyết toán"],
  ["/personnel-assignment", "Nhân sự & Phân công"],
  ["/site-clearance-resettlement", "GPMB - Bồi thường TĐC"],
  ["/bidding-management", "Quản lý Đấu thầu"],
  ["/warranty-maintenance", "Bảo hành & Bảo trì"],
  ["/profile", "Thông tin cá nhân & Tài khoản"],
  ["/legal-ai-library", "Thư viện Pháp lý + AI"],
];

export function getTopbarPageTitle(pathname: string): string {
  return PAGE_TITLES.find(([route]) =>
    pathname === route || pathname.startsWith(`${route}/`),
  )?.[1] ?? "Hệ thống Quản lý Dự án";
}
