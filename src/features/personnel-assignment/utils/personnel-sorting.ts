import type { Staff, Team } from "../types/personnel.types";

/**
 * Tính trọng số thứ bậc chức vụ trong cơ quan BQL ĐTXD:
 * Số càng nhỏ thì chức vụ càng cao, nằm ở trên trong danh sách:
 * 1. Giám đốc BQL (Trưởng ban)
 * 2. Phó Giám đốc
 * 3. Tổ trưởng / Trưởng phòng
 * 4. Kế toán trưởng
 * 5. Tổ phó (Tổ phó KT, Tổ phó GS, Tổ phó GPMB)
 * 6. Kế toán công trình - Thủ quỹ
 * 7. Kế toán viên
 * 8. Hành chính tổng hợp
 * 9. Văn thư, hỗ trợ hành chính
 * 10. Thành viên / Chuyên viên / Nhân viên khác
 */
export function getStaffRankWeight(staff: Staff, team?: Team): number {
  const title = (staff.title || "").toLowerCase();
  const roleCode = (staff.roleCode || "").toUpperCase();
  const isTeamLeader = team ? team.leaderId === staff.id : false;

  // 1. Giám đốc
  if (roleCode === "ADMIN" || title.includes("giám đốc") && !title.includes("phó")) {
    return 10;
  }

  // 2. Phó Giám đốc
  if (roleCode === "DEPUTY_DIRECTOR" || title.includes("phó giám đốc")) {
    return 20;
  }

  // 3. Tổ trưởng / Phụ trách tổ (nếu là leader của team hoặc tên chức danh là tổ trưởng)
  if (isTeamLeader && !title.includes("kế toán")) {
    return 30;
  }
  if (title.includes("tổ trưởng") || title.includes("trưởng phòng")) {
    return 30;
  }

  // 4. Kế toán trưởng
  if (roleCode === "CHIEF_ACCOUNTANT" || title.includes("kế toán trưởng")) {
    return 40;
  }

  // 5. Tổ phó (KT), Tổ phó (GS), Tổ phó GPMB
  if (title.includes("tổ phó") || title.includes("phó phòng")) {
    if (title.includes("kt") || title.includes("kỹ thuật")) return 51;
    if (title.includes("gs") || title.includes("giám sát")) return 52;
    return 53;
  }

  // 6. Kế toán Công trình - Thủ quỹ
  if (title.includes("thủ quỹ") || (title.includes("kế toán") && title.includes("công trình"))) {
    return 60;
  }

  // 7. Kế toán viên
  if (roleCode === "ACCOUNTANT" || title.includes("kế toán viên") || title.includes("kế toán")) {
    return 70;
  }

  // 8. Hành chính tổng hợp
  if (title.includes("hành chính tổng hợp") || (title.includes("hành chính") && !title.includes("văn thư"))) {
    return 80;
  }

  // 9. Văn thư
  if (title.includes("văn thư")) {
    return 90;
  }

  // 10. Thành viên, nhân viên thông thường
  return 100;
}

/**
 * Sắp xếp danh sách cán bộ theo thứ tự chức vụ từ trên xuống dưới
 */
export function sortStaffByRank<T extends Staff>(staffList: T[], team?: Team): T[] {
  return [...staffList].sort((a, b) => {
    const rankA = getStaffRankWeight(a, team);
    const rankB = getStaffRankWeight(b, team);
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    // Cùng cấp bậc chức vụ: sắp xếp theo ID (cán bộ tạo trước lên trước) hoặc tên tiếng Việt
    return a.id.localeCompare(b.id, undefined, { numeric: true });
  });
}
