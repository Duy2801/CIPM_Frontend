import type { PersonnelDataset } from "../types/personnel.types";

/** Dữ liệu mẫu theo cơ cấu BQL ĐTXD Hà Tiên: Ban Giám đốc và 3 tổ chuyên môn (BRD mục 2.1) */
export const PERSONNEL_MOCK_DATA: PersonnelDataset = {
  teams: [
    { id: "BGD", name: "Ban Giám đốc", description: "Lãnh đạo & điều hành toàn diện BQL", leaderId: "ST-001" },
    { id: "GSKT", name: "Tổ Giám sát – Kỹ thuật", description: "Giám sát kỹ thuật, thi công & chất lượng công trình", leaderId: "ST-004" },
    { id: "KHKT", name: "Tổ Kế hoạch – Kỹ thuật", description: "Chuẩn bị dự án, lập chủ trương & thẩm định thiết kế", leaderId: "ST-007" },
    { id: "DT", name: "Tổ Quản lý Đấu thầu", description: "Lập HSMT, tổ chức đấu thầu và đánh giá E-HSDT", leaderId: "ST-017" },
    { id: "BT", name: "Tổ Bồi thường – GPMB – TĐC", description: "Công tác bồi thường, giải phóng mặt bằng & tái định cư", leaderId: "ST-014" },
    { id: "HCTH", name: "Tổ Hành chính – Tổng hợp", description: "Văn thư lưu trữ, tài chính - kế toán và tổng hợp báo cáo", leaderId: "ST-012" },
  ],
  staff: [
    { id: "ST-001", name: "Huỳnh Thái Hải", title: "Giám đốc", teamId: "BGD", roleCode: "ADMIN", employment: "Viên chức", phone: "0918.xxx.xxx", email: "hai.ht@hatien.gov.vn", accountActive: true },
    { id: "ST-002", name: "Trần Văn Nam", title: "Phó Giám đốc", teamId: "BGD", roleCode: "DEPUTY_DIRECTOR", employment: "Viên chức", phone: "0913.xxx.xxx", email: "nam.tv@hatien.gov.vn", accountActive: true },
    { id: "ST-003", name: "Nguyễn Thanh Tùng", title: "Phó Giám đốc", teamId: "BGD", roleCode: "DEPUTY_DIRECTOR", employment: "Viên chức", phone: "0939.xxx.xxx", email: "tung.nt@hatien.gov.vn", accountActive: true },
    { id: "ST-004", name: "Lê Hoàng Minh", title: "Tổ trưởng GSKT", teamId: "GSKT", roleCode: "TECHNICAL_OFFICER", employment: "Viên chức", phone: "0982.xxx.xxx", email: "minh.lh@hatien.gov.vn", accountActive: true, permissions: ["project.phase.assign", "project.progress.update", "project.report.export"] },
    { id: "ST-005", name: "Phan Văn Đức", title: "Kỹ sư giám sát", teamId: "GSKT", roleCode: "TECHNICAL_OFFICER", employment: "Viên chức", phone: "0907.xxx.xxx", email: "duc.pv@hatien.gov.vn", accountActive: true, permissions: ["project.phase.assign", "project.progress.update", "project.report.export"] },
    { id: "ST-006", name: "Trần Quốc Việt", title: "Kỹ sư giám sát", teamId: "GSKT", roleCode: "TECHNICAL_OFFICER", employment: "Viên chức", phone: "0976.xxx.xxx", email: "viet.tq@hatien.gov.vn", accountActive: true },
    { id: "ST-007", name: "Nguyễn Hữu Phước", title: "Tổ trưởng KHKT", teamId: "KHKT", roleCode: "TECHNICAL_OFFICER", employment: "Viên chức", phone: "0944.xxx.xxx", email: "phuoc.nh@hatien.gov.vn", accountActive: true, permissions: ["project.phase.assign", "project.progress.update", "project.report.export"] },
    { id: "ST-008", name: "Lâm Thị Diễm", title: "Kỹ sư dự toán", teamId: "KHKT", roleCode: "TECHNICAL_OFFICER", employment: "Viên chức", phone: "0916.xxx.xxx", email: "diem.lt@hatien.gov.vn", accountActive: true, permissions: ["project.progress.update"] },
    { id: "ST-009", name: "Đặng Thị Kim Ngân", title: "Kế toán trưởng", teamId: "HCTH", roleCode: "CHIEF_ACCOUNTANT", employment: "Viên chức", phone: "0908.xxx.xxx", email: "ngan.dtk@hatien.gov.vn", accountActive: true },
    { id: "ST-010", name: "Nguyễn Thị Thúy Hà", title: "Kế toán viên", teamId: "HCTH", roleCode: "ACCOUNTANT", employment: "Viên chức", phone: "0977.xxx.xxx", email: "ha.ntt@hatien.gov.vn", accountActive: true },
    { id: "ST-011", name: "Lê Thị Hồng", title: "Kế toán viên", teamId: "HCTH", roleCode: "ACCOUNTANT", employment: "Viên chức", phone: "0931.xxx.xxx", email: "hong.lt@hatien.gov.vn", accountActive: true },
    { id: "ST-012", name: "Võ Thị Mai Phương", title: "Tổ trưởng HCTH", teamId: "HCTH", roleCode: "ADMINISTRATIVE_OFFICER", employment: "Viên chức", phone: "0932.xxx.xxx", email: "phuong.vtm@hatien.gov.vn", accountActive: true },
    { id: "ST-013", name: "Châu Văn Lợi", title: "Nhân viên hành chính", teamId: "HCTH", roleCode: "ADMINISTRATIVE_OFFICER", employment: "Hợp đồng", phone: "0949.xxx.xxx", email: "loi.cv@hatien.gov.vn", accountActive: true },
    { id: "ST-014", name: "Phạm Quốc Bảo", title: "Tổ trưởng GPMB", teamId: "BT", roleCode: "COMPENSATION_OFFICER", employment: "Viên chức", phone: "0945.xxx.xxx", email: "bao.pq@hatien.gov.vn", accountActive: true },
    { id: "ST-015", name: "Huỳnh Văn Tài", title: "Chuyên viên bồi thường", teamId: "BT", roleCode: "COMPENSATION_OFFICER", employment: "Viên chức", phone: "0919.xxx.xxx", email: "tai.hv@hatien.gov.vn", accountActive: true },
    { id: "ST-016", name: "Đỗ Thị Thanh", title: "Chuyên viên bồi thường", teamId: "BT", roleCode: "COMPENSATION_OFFICER", employment: "Hợp đồng", phone: "0962.xxx.xxx", email: "thanh.dt@hatien.gov.vn", accountActive: true },
    { id: "ST-017", name: "Trần Văn Hùng", title: "Tổ trưởng Đấu thầu", teamId: "DT", roleCode: "TECHNICAL_OFFICER", employment: "Viên chức", phone: "0988.xxx.xxx", email: "hung.tv@hatien.gov.vn", accountActive: true, permissions: ["project.phase.assign", "project.progress.update", "project.report.export"] },
    { id: "ST-018", name: "Nguyễn Minh Quân", title: "Chuyên viên đấu thầu", teamId: "DT", roleCode: "TECHNICAL_OFFICER", employment: "Viên chức", phone: "0968.xxx.xxx", email: "quan.nm@hatien.gov.vn", accountActive: true, permissions: ["project.phase.assign", "project.progress.update"] },
  ],
  projects: [],
  assignments: [],
};
