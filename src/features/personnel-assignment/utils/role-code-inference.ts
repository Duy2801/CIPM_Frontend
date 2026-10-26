/** Chức danh mang tính lãnh đạo (tổ trưởng, chủ nhiệm, phụ trách, giám đốc...) */
export const isLeaderTitle = (title: string) => /trưởng|lead|chủ nhiệm|phụ trách|giám đốc/i.test(title);

/** Giám đốc (không tính Phó Giám đốc hay Thư ký Ban Giám đốc) */
export const isDirectorTitle = (title: string) => /giám đốc/i.test(title) && !/phó|thư ký/i.test(title);

/** Suy ra mã vai trò hệ thống từ phòng ban và tên chức danh */
export function inferRoleCode(teamId: string, title: string, isLeader: boolean): string {
  if (teamId === "BGD") return isDirectorTitle(title) ? "ADMIN" : "ADMINISTRATIVE_OFFICER";
  if (teamId === "PGD") return "DEPUTY_DIRECTOR";
  if (isLeader) {
    return teamId === "HCTH" ? "CHIEF_ACCOUNTANT" : teamId === "BT" ? "COMPENSATION_OFFICER" : "TECHNICAL_OFFICER";
  }
  if (/kế toán|tài chính/i.test(title)) return /trưởng/i.test(title) ? "CHIEF_ACCOUNTANT" : "ACCOUNTANT";
  if (/bồi thường|gpmb|giải tỏa|tái định cư/i.test(title)) return "COMPENSATION_OFFICER";
  if (/hành chính|văn thư|tổng hợp/i.test(title)) return "ADMINISTRATIVE_OFFICER";
  return "TECHNICAL_OFFICER";
}
