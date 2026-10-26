import { PERSONNEL_MOCK_DATA } from "../constants/personnel-mock-data";

/**
 * activity-log.ts — Nhật ký thao tác cho hồ sơ cán bộ
 *
 * 1. Sổ nhật ký của phân hệ Nhân sự (lưu trình duyệt): mỗi lần thêm / sửa hồ sơ, khóa / mở tài khoản... ghi ngày giờ,
 *    người thực hiện, đối tượng và từng thay đổi "cũ → mới".
 * 2. Mỗi màn hình chỉ xem lịch sử của chính nó: hồ sơ cán bộ lọc theo hồ sơ, Phân quyền / Thư viện pháp lý lọc theo phân hệ.
 */

export interface ActivityChange {
  label: string;
  from?: string;
  to?: string;
}

export interface ActivityEntry {
  id: string;
  /** Thời điểm (ISO) */
  at: string;
  actorName: string;
  actorRole?: string;
  /** Phân hệ: Nhân sự, Tài chính, Thủ tục XDCB... */
  module: string;
  /** Mô tả ngắn thao tác, VD: "Cập nhật hồ sơ cán bộ" */
  action: string;
  targetType?: "staff" | "team" | "role" | "disbursement" | "procedure";
  targetId?: string;
  targetName?: string;
  changes?: ActivityChange[];
  note?: string;
}

export const ACTIVITY_LOG_STORAGE_KEY = "cipm_personnel_activity_log_v1";
export const ACTIVITY_LOG_EVENT = "cipm-activity-log-updated";
/** Giữ tối đa số dòng nhật ký gần nhất */
const MAX_ENTRIES = 1000;


function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Phân hệ của các thay đổi chức danh / quyền ở màn Quản lý chức danh */
export const PERMISSION_LOG_MODULE = "Phân quyền";

export const DEFAULT_ACTIVITIES: ActivityEntry[] = [
  {
    id: "ACT-LEG-001",
    at: "2026-10-26T10:45:00+07:00",
    actorName: "Nguyễn Thị Mai",
    actorRole: "Chuyên viên Pháp chế",
    module: "Thư viện pháp lý",
    action: "Cập nhật văn bản: 88/2024/NĐ-CP",
    targetId: "88/2024/NĐ-CP",
    targetName: "Nghị định quy định về bồi thường, hỗ trợ, tái định cư khi Nhà nước thu hồi đất",
    changes: [
      { label: "Số công báo", from: "Chưa có", to: "625&626/2024" },
      { label: "Ngày đăng công báo", from: "Chưa có", to: "05/08/2024" },
      {
        label: "Từ khóa tra cứu",
        from: "Bồi thường, Tái định cư",
        to: "Bồi thường, Tái định cư, Thu hồi đất, Khung giá đất",
      },
    ],
  },
  {
    id: "ACT-LEG-002",
    at: "2026-10-26T08:15:00+07:00",
    actorName: "Lê Hoàng Sơn",
    actorRole: "Trưởng phòng Kỹ thuật",
    module: "Thư viện pháp lý",
    action: "Thêm văn bản mới: BM-01/CIPM",
    targetId: "BM-01/CIPM",
    targetName: "Mẫu Biên bản nghiệm thu công việc xây dựng và hoàn thành giai đoạn thi công",
    changes: [
      { label: "Số hiệu", to: "BM-01/CIPM" },
      { label: "Phân loại", to: "Biểu mẫu chuẩn" },
      { label: "Cơ quan ban hành", to: "Ban QLDA Đầu tư Xây dựng" },
      { label: "Tình trạng", to: "Đang áp dụng" },
      { label: "Tệp đính kèm", to: "BM-01_Bien_ban_nghiem_thu.docx (1.2 MB)" },
    ],
  },
  {
    id: "ACT-LEG-003",
    at: "2026-10-25T16:20:00+07:00",
    actorName: "Huỳnh Thái Hải",
    actorRole: "Chuyên viên QLDA",
    module: "Thư viện pháp lý",
    action: "Cập nhật văn bản: 24/2024/NĐ-CP",
    targetId: "24/2024/NĐ-CP",
    targetName: "Nghị định quy định chi tiết một số điều và biện pháp thi hành Luật Đấu thầu về lựa chọn nhà thầu",
    changes: [
      { label: "Người ký", from: "Chưa có", to: "Phạm Minh Chính" },
      { label: "Lĩnh vực", from: "Chưa có", to: "Đấu thầu - Đầu tư công" },
      { label: "Phạm vi áp dụng", from: "M1 – Chuẩn bị dự án", to: "M2 – Lựa chọn nhà thầu & M3 – Thi công" },
    ],
  },
  {
    id: "ACT-LEG-004",
    at: "2026-10-25T09:30:00+07:00",
    actorName: "Phạm Đức Thắng",
    actorRole: "Chuyên viên Đấu thầu",
    module: "Thư viện pháp lý",
    action: "Cập nhật văn bản: 22/2023/QH15",
    targetId: "22/2023/QH15",
    targetName: "Luật Đấu thầu năm 2023",
    changes: [
      { label: "Tình trạng", from: "Chưa áp dụng", to: "Đang áp dụng" },
      { label: "Ngày có hiệu lực", from: "01/01/2024", to: "01/01/2024" },
      {
        label: "Trích yếu",
        to: "Luật Đấu thầu quy định quản lý nhà nước về đấu thầu, trách nhiệm của các bên và hoạt động lựa chọn nhà thầu, nhà đầu tư",
      },
    ],
  },
  {
    id: "ACT-LEG-005",
    at: "2026-10-24T14:10:00+07:00",
    actorName: "Nguyễn Thị Mai",
    actorRole: "Chuyên viên Pháp chế",
    module: "Thư viện pháp lý",
    action: "Cập nhật văn bản: 31/2024/QH15",
    targetId: "31/2024/QH15",
    targetName: "Luật Đất đai năm 2024",
    changes: [
      { label: "Ngày áp dụng", from: "01/01/2025", to: "01/08/2024" },
      { label: "Tệp đính kèm", from: "Luat-Dat-dai-2024-Duthao.pdf", to: "31_2024_QH15_Luat_Dat_dai.pdf" },
      { label: "Ghi chú", to: "Hiệu lực sớm theo Nghị quyết số 107/2024/QH15 của Quốc hội" },
    ],
  },
  {
    id: "ACT-LEG-006",
    at: "2026-10-23T15:45:00+07:00",
    actorName: "Trần Văn Nam",
    actorRole: "Phó Giám đốc Ban",
    module: "Thư viện pháp lý",
    action: "Cập nhật tình trạng văn bản: 43/2013/QH13",
    targetId: "43/2013/QH13",
    targetName: "Luật Đất đai năm 2013",
    changes: [
      { label: "Tình trạng", from: "Đang áp dụng", to: "Hết hiệu lực" },
      { label: "Ngày hết hiệu lực", from: "Đang cập nhật", to: "01/08/2024" },
      { label: "Lý do thay thế", to: "Được thay thế hoàn toàn bởi Luật Đất đai số 31/2024/QH15" },
    ],
  },
  {
    id: "ACT-LEG-007",
    at: "2026-10-22T11:05:00+07:00",
    actorName: "Đỗ Quốc Bảo",
    actorRole: "Chuyên viên Kế hoạch",
    module: "Thư viện pháp lý",
    action: "Thêm văn bản mới: 12/2021/TT-BXD",
    targetId: "12/2021/TT-BXD",
    targetName: "Thông tư ban hành định mức xây dựng và định mức chi phí quản lý dự án",
    changes: [
      { label: "Số hiệu", to: "12/2021/TT-BXD" },
      { label: "Phân loại", to: "Thông tư" },
      { label: "Cơ quan ban hành", to: "Bộ Xây dựng" },
      { label: "Người ký", to: "Thứ trưởng Lê Quang Hùng" },
      { label: "Tình trạng", to: "Đang áp dụng" },
    ],
  },
  {
    id: "ACT-LEG-008",
    at: "2026-10-20T08:50:00+07:00",
    actorName: "Lê Hoàng Sơn",
    actorRole: "Trưởng phòng Kỹ thuật",
    module: "Thư viện pháp lý",
    action: "Cập nhật văn bản: 10/2021/NĐ-CP",
    targetId: "10/2021/NĐ-CP",
    targetName: "Nghị định về quản lý chất lượng, thi công xây dựng và bảo trì công trình xây dựng",
    changes: [
      {
        label: "Phạm vi quy trình",
        from: "M3 – Thi công xây dựng",
        to: "M3 – Thi công xây dựng & M5 – Nghiệm thu bàn giao",
      },
      { label: "Từ khóa tra cứu", to: "Nghiệm thu, Giám sát, Nhật ký công trình, Quản lý chất lượng" },
    ],
  },
  {
    id: "ACT-LEG-009",
    at: "2026-10-18T16:30:00+07:00",
    actorName: "Huỳnh Thái Hải",
    actorRole: "Chuyên viên QLDA",
    module: "Thư viện pháp lý",
    action: "Thêm văn bản mới: BM-02/CIPM",
    targetId: "BM-02/CIPM",
    targetName: "Mẫu Tờ trình thẩm định Báo cáo nghiên cứu khả thi đầu tư xây dựng công trình",
    changes: [
      { label: "Số hiệu", to: "BM-02/CIPM" },
      { label: "Phân loại", to: "Biểu mẫu chuẩn" },
      { label: "Cơ quan ban hành", to: "Ban QLDA Đầu tư Xây dựng" },
      { label: "Tình trạng", to: "Đang áp dụng" },
    ],
  },
  {
    id: "ACT-LEG-010",
    at: "2026-10-15T14:20:00+07:00",
    actorName: "Nguyễn Thị Mai",
    actorRole: "Chuyên viên Pháp chế",
    module: "Thư viện pháp lý",
    action: "Cập nhật văn bản: 15/2021/NĐ-CP",
    targetId: "15/2021/NĐ-CP",
    targetName: "Nghị định quy định chi tiết một số nội dung về quản lý dự án đầu tư xây dựng",
    changes: [
      { label: "Tình trạng", from: "Đang áp dụng", to: "Còn hiệu lực một phần" },
      { label: "Ghi chú điều chỉnh", to: "Một số điều đã được sửa đổi bổ sung tại Nghị định 35/2023/NĐ-CP" },
    ],
  },
  {
    id: "ACT-LEG-011",
    at: "2026-10-10T10:15:00+07:00",
    actorName: "Phạm Đức Thắng",
    actorRole: "Chuyên viên Đấu thầu",
    module: "Thư viện pháp lý",
    action: "Cập nhật tình trạng văn bản: 63/2014/NĐ-CP",
    targetId: "63/2014/NĐ-CP",
    targetName: "Nghị định hướng dẫn thi hành Luật Đấu thầu về lựa chọn nhà thầu",
    changes: [
      { label: "Tình trạng", from: "Đang áp dụng", to: "Hết hiệu lực" },
      { label: "Ngày hết hiệu lực", from: "Đang cập nhật", to: "27/02/2024" },
      { label: "Lý do thay thế", to: "Được thay thế bởi Nghị định 24/2024/NĐ-CP" },
    ],
  },
  {
    id: "ACT-LEG-012",
    at: "2026-10-05T09:00:00+07:00",
    actorName: "Trần Văn Nam",
    actorRole: "Phó Giám đốc Ban",
    module: "Thư viện pháp lý",
    action: "Cập nhật văn bản: 50/2014/QH13",
    targetId: "50/2014/QH13",
    targetName: "Luật Xây dựng năm 2014, được sửa đổi, bổ sung một số điều theo Luật số 62/2020/QH14",
    changes: [
      {
        label: "Tên văn bản",
        from: "Luật Xây dựng năm 2014",
        to: "Luật Xây dựng năm 2014, được sửa đổi, bổ sung một số điều theo Luật số 62/2020/QH14 về hoạt động đầu tư xây dựng",
      },
      { label: "Người ký", from: "Chưa có", to: "Nguyễn Sinh Hùng" },
    ],
  },
  // --- Lịch sử phân quyền (PERMISSION_LOG_MODULE) ---
  {
    id: "ACT-PERM-001",
    at: "2026-10-26T11:15:00+07:00",
    actorName: "Nguyễn Văn An",
    actorRole: "Giám đốc Ban",
    module: PERMISSION_LOG_MODULE,
    action: "Cập nhật phân quyền: Chuyên viên Quản lý Dự án",
    targetType: "role",
    targetId: "role_pm",
    targetName: "Chuyên viên Quản lý Dự án",
    changes: [
      {
        label: "Thêm quyền",
        to: "Thẩm định hồ sơ thiết kế, Ký duyệt biên bản nghiệm thu hiện trường",
      },
      {
        label: "Ghi chú điều chỉnh",
        to: "Cập nhật theo phân công nhiệm vụ mới của quý IV/2026",
      },
    ],
  },
  {
    id: "ACT-PERM-002",
    at: "2026-10-26T09:20:00+07:00",
    actorName: "Huỳnh Thái Hải",
    actorRole: "Quản trị hệ thống",
    module: PERMISSION_LOG_MODULE,
    action: "Bật lại chức danh: Chuyên viên Thẩm định Dự án",
    targetType: "role",
    targetId: "role_appraisal",
    targetName: "Chuyên viên Thẩm định Dự án",
    changes: [{ label: "Trạng thái", from: "Đang tắt", to: "Đang bật" }],
    note: "Kích hoạt lại chức danh sau khi hoàn tất đợt tái cơ cấu phòng Kỹ thuật.",
  },
  {
    id: "ACT-PERM-003",
    at: "2026-10-25T15:40:00+07:00",
    actorName: "Nguyễn Văn An",
    actorRole: "Giám đốc Ban",
    module: PERMISSION_LOG_MODULE,
    action: "Tạo chức danh mới: Tổ trưởng Bồi thường & GPMB",
    targetType: "role",
    targetId: "role_gpmb_lead",
    targetName: "Tổ trưởng Bồi thường & GPMB",
    changes: [
      { label: "Mã chức danh", to: "ROLE_GPMB_LEAD" },
      { label: "Phòng ban", to: "Tổ Bồi thường & GPMB" },
      {
        label: "Quyền hạn",
        to: "Quản lý 16 bước quy trình GPMB, Phê duyệt phương án bồi thường, Xuất báo cáo tiến độ chi trả",
      },
      { label: "Trạng thái", to: "Đang bật" },
    ],
  },
  {
    id: "ACT-PERM-004",
    at: "2026-10-25T10:10:00+07:00",
    actorName: "Trần Văn Nam",
    actorRole: "Phó Giám đốc Ban",
    module: PERMISSION_LOG_MODULE,
    action: "Cập nhật phân quyền: Kế toán trưởng",
    targetType: "role",
    targetId: "role_chief_accountant",
    targetName: "Kế toán trưởng",
    changes: [
      {
        label: "Thêm quyền",
        to: "Duyệt hồ sơ giải ngân vốn đầu tư công, Kiểm tra hạn mức thanh toán KBNN",
      },
      {
        label: "Giới hạn phê duyệt",
        from: "Dưới 5 tỷ đồng",
        to: "Toàn bộ hạn mức dự án theo phân quyền Ban",
      },
    ],
  },
  {
    id: "ACT-PERM-005",
    at: "2026-10-24T16:05:00+07:00",
    actorName: "Huỳnh Thái Hải",
    actorRole: "Quản trị hệ thống",
    module: PERMISSION_LOG_MODULE,
    action: "Tắt chức danh: Chuyên viên Khảo sát địa chất tạm thời",
    targetType: "role",
    targetId: "role_geological_surveyor",
    targetName: "Chuyên viên Khảo sát địa chất tạm thời",
    changes: [{ label: "Trạng thái", from: "Đang bật", to: "Đang tắt" }],
    note: "Tạm khóa chức danh do kết thúc hợp đồng tư vấn khảo sát giai đoạn 1.",
  },
  {
    id: "ACT-PERM-006",
    at: "2026-10-24T11:30:00+07:00",
    actorName: "Nguyễn Văn An",
    actorRole: "Giám đốc Ban",
    module: PERMISSION_LOG_MODULE,
    action: "Cập nhật phân quyền: Trưởng phòng Kỹ thuật - Thẩm định",
    targetType: "role",
    targetId: "role_tech_lead",
    targetName: "Trưởng phòng Kỹ thuật - Thẩm định",
    changes: [
      {
        label: "Thêm quyền",
        to: "Phê duyệt kế hoạch lựa chọn nhà thầu tư vấn, Thẩm định báo cáo KT-KT",
      },
      {
        label: "Bỏ quyền",
        to: "Xóa hồ sơ dự án đã phê duyệt",
      },
    ],
  },
  {
    id: "ACT-PERM-007",
    at: "2026-10-22T14:25:00+07:00",
    actorName: "Nguyễn Văn An",
    actorRole: "Giám đốc Ban",
    module: PERMISSION_LOG_MODULE,
    action: "Tạo chức danh mới: Chuyên viên Giám sát Môi trường",
    targetType: "role",
    targetId: "role_env_officer",
    targetName: "Chuyên viên Giám sát Môi trường",
    changes: [
      { label: "Mã chức danh", to: "ROLE_ENV_OFFICER" },
      { label: "Phòng ban", to: "Phòng Kỹ thuật - Thẩm định" },
      {
        label: "Quyền hạn",
        to: "Theo dõi đánh giá tác động môi trường (ĐTM), Cập nhật báo cáo giám sát định kỳ",
      },
      { label: "Trạng thái", to: "Đang bật" },
    ],
  },
  {
    id: "ACT-PERM-008",
    at: "2026-10-20T08:45:00+07:00",
    actorName: "Nguyễn Văn An",
    actorRole: "Giám đốc Ban",
    module: PERMISSION_LOG_MODULE,
    action: "Cập nhật phân quyền: Phó Giám đốc Ban",
    targetType: "role",
    targetId: "role_deputy",
    targetName: "Phó Giám đốc Ban",
    changes: [
      {
        label: "Ủy quyền ký",
        to: "Ký quyết định phê duyệt HSMT và kết quả lựa chọn nhà thầu các gói xây lắp nhóm B, C",
      },
    ],
  },
  {
    id: "ACT-PERM-009",
    at: "2026-10-18T16:15:00+07:00",
    actorName: "Huỳnh Thái Hải",
    actorRole: "Quản trị hệ thống",
    module: PERMISSION_LOG_MODULE,
    action: "Đổi tên chức danh: Cán bộ Giám sát hiện trường",
    targetType: "role",
    targetId: "role_site_inspector",
    targetName: "Cán bộ Giám sát hiện trường",
    changes: [
      {
        label: "Tên chức danh",
        from: "Giám sát viên",
        to: "Cán bộ Giám sát hiện trường",
      },
      {
        label: "Tên viết tắt",
        from: "GSV",
        to: "CB.GSHT",
      },
    ],
  },
  {
    id: "ACT-PERM-010",
    at: "2026-10-15T10:30:00+07:00",
    actorName: "Lê Hoàng Sơn",
    actorRole: "Trưởng phòng Kỹ thuật",
    module: PERMISSION_LOG_MODULE,
    action: "Cập nhật phân quyền: Chuyên viên Đấu thầu",
    targetType: "role",
    targetId: "role_bidding_specialist",
    targetName: "Chuyên viên Đấu thầu",
    changes: [
      {
        label: "Thêm quyền",
        to: "Đăng tải thông tin đấu thầu lên Hệ thống Mạng Đấu thầu Quốc gia, Lập báo cáo đánh giá E-HSDT",
      },
    ],
  },
  {
    id: "ACT-PERM-011",
    at: "2026-10-12T15:10:00+07:00",
    actorName: "Nguyễn Văn An",
    actorRole: "Giám đốc Ban",
    module: PERMISSION_LOG_MODULE,
    action: "Tạo chức danh mới: Chuyên viên Pháp chế - Kiểm soát nội bộ",
    targetType: "role",
    targetId: "role_legal_officer",
    targetName: "Chuyên viên Pháp chế - Kiểm soát nội bộ",
    changes: [
      { label: "Mã chức danh", to: "ROLE_LEGAL_OFFICER" },
      { label: "Phòng ban", to: "Văn phòng Ban" },
      {
        label: "Quyền hạn",
        to: "Rà soát tính hợp hiến/hợp pháp của văn bản, Tham mưu giải quyết kiến nghị đấu thầu",
      },
      { label: "Trạng thái", to: "Đang bật" },
    ],
  },
  {
    id: "ACT-PERM-012",
    at: "2026-10-08T09:20:00+07:00",
    actorName: "Trần Văn Nam",
    actorRole: "Phó Giám đốc Ban",
    module: PERMISSION_LOG_MODULE,
    action: "Cập nhật phân quyền: Trưởng phòng Kế hoạch - Tài chính",
    targetType: "role",
    targetId: "role_finance_lead",
    targetName: "Trưởng phòng Kế hoạch - Tài chính",
    changes: [
      {
        label: "Thêm quyền",
        to: "Điều chỉnh kế hoạch vốn trung hạn và hàng năm, Tổng hợp báo cáo tài chính dự án",
      },
    ],
  },
];

export function getPersonnelActivities(): ActivityEntry[] {
  const stored = readJson<ActivityEntry[]>(ACTIVITY_LOG_STORAGE_KEY, []);
  const storedList = Array.isArray(stored) ? stored : [];

  const storedIds = new Set(storedList.map((e) => e.id));
  const missingDefaults = DEFAULT_ACTIVITIES.filter((d) => !storedIds.has(d.id));

  return [...storedList, ...missingDefaults].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  );
}

/** Ghi một dòng nhật ký (dòng mới nhất lên đầu) */
export function appendActivity(entry: Omit<ActivityEntry, "id" | "at"> & { at?: string }) {
  if (typeof window === "undefined") return;
  const next: ActivityEntry = {
    ...entry,
    id: `ACT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: entry.at ?? new Date().toISOString(),
  };
  try {
    const list = [next, ...getPersonnelActivities()].slice(0, MAX_ENTRIES);
    window.localStorage.setItem(ACTIVITY_LOG_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(ACTIVITY_LOG_EVENT));
  } catch (err) {
    console.error("Lỗi khi ghi nhật ký thao tác:", err);
  }
}

/** Lịch sử thay đổi quyền (tạo / cập nhật / bật / tắt chức danh) — ai mở màn Quản lý chức danh cũng xem được */
export function getPermissionChangeHistory(): ActivityEntry[] {
  return getPersonnelActivities().filter((e) => e.module === PERMISSION_LOG_MODULE);
}

/** Tạo danh sách lịch sử mẫu thực tế cho một hồ sơ cán bộ (12 mốc thay đổi theo thời gian) */
export function getMockStaffActivities(staffId: string): ActivityEntry[] {
  const staff = PERSONNEL_MOCK_DATA.staff.find((s) => s.id === staffId);
  const staffName = staff?.name ?? `Cán bộ ${staffId}`;
  const team = PERSONNEL_MOCK_DATA.teams.find((t) => t.id === staff?.teamId);
  const teamName = team?.name ?? "Tổ Giám sát – Kỹ thuật";
  const title = staff?.title ?? "Chuyên viên";
  const email = staff?.email ?? `${staffId.toLowerCase()}@hatien.gov.vn`;
  const phone = staff?.phone ?? "0918.765.432";
  const citizenId = staff?.citizenId ?? "091089007890";
  const employment = staff?.employment ?? "Viên chức";

  return [
    {
      id: `ACT-${staffId}-01`,
      at: "2026-10-26T10:15:00+07:00",
      actorName: "Lê Hoàng Sơn",
      actorRole: "Quản trị hệ thống",
      module: "Nhân sự",
      action: "Cập nhật hồ sơ cán bộ",
      targetType: "staff",
      targetId: staffId,
      targetName: staffName,
      changes: [
        { label: "Số điện thoại", from: "0912.333.444", to: phone },
        { label: "Email công vụ", from: "canbo.cu@kiengiang.gov.vn", to: email },
      ],
    },
    {
      id: `ACT-${staffId}-02`,
      at: "2026-10-26T08:45:00+07:00",
      actorName: "Nguyễn Thị Mai",
      actorRole: "Quản trị viên",
      module: "Nhân sự",
      action: "Cập nhật quyền hạn riêng",
      targetType: "staff",
      targetId: staffId,
      targetName: staffName,
      changes: [
        { label: "Quyền hạn riêng", from: "cấp thêm 1, thu hồi 0", to: "cấp thêm 3, thu hồi 0" },
      ],
      note: "Cấp quyền truy cập phân hệ Quản lý tiến độ dự án theo phiếu phân công số 18/PC-BQL",
    },
    {
      id: `ACT-${staffId}-03`,
      at: "2026-10-25T16:20:00+07:00",
      actorName: "Huỳnh Thái Hải",
      actorRole: "Giám đốc Ban",
      module: "Nhân sự",
      action: "Bổ nhiệm & phân công nhiệm vụ",
      targetType: "staff",
      targetId: staffId,
      targetName: staffName,
      changes: [
        { label: "Chức danh", from: "Chuyên viên QLDA", to: title },
        { label: "Phòng ban", from: "Tổ Hành chính – Tổng hợp", to: teamName },
      ],
      note: "Theo Quyết định số 56/QĐ-BQL ngày 25/10/2026 của Giám đốc Ban QLDA",
    },
    {
      id: `ACT-${staffId}-04`,
      at: "2026-10-24T14:10:00+07:00",
      actorName: "Nguyễn Thị Mai",
      actorRole: "Quản trị viên",
      module: "Nhân sự",
      action: "Cập nhật thông tin nhân sự",
      targetType: "staff",
      targetId: staffId,
      targetName: staffName,
      changes: [
        { label: "Số CCCD", from: "091085002134", to: citizenId },
        { label: "Ngày cấp", from: "15/06/2015", to: "20/08/2022" },
        { label: "Nơi cấp", from: "Công an tỉnh Kiên Giang", to: "Cục Cảnh sát QLHC về TTXH" },
      ],
    },
    {
      id: `ACT-${staffId}-05`,
      at: "2026-10-20T09:30:00+07:00",
      actorName: "Lê Hoàng Sơn",
      actorRole: "Quản trị hệ thống",
      module: "Nhân sự",
      action: "Mở khóa tài khoản",
      targetType: "staff",
      targetId: staffId,
      targetName: staffName,
      changes: [{ label: "Tài khoản", from: "Đang khóa", to: "Đang hoạt động" }],
      note: "Kích hoạt lại tài khoản sau khi hoàn thành khóa bồi dưỡng nghiệp vụ quản lý dự án.",
    },
    {
      id: `ACT-${staffId}-06`,
      at: "2026-10-15T15:00:00+07:00",
      actorName: "Lê Hoàng Sơn",
      actorRole: "Quản trị hệ thống",
      module: "Nhân sự",
      action: "Khóa tài khoản",
      targetType: "staff",
      targetId: staffId,
      targetName: staffName,
      changes: [{ label: "Tài khoản", from: "Đang hoạt động", to: "Đang khóa" }],
      note: "Tạm khóa theo đơn xin nghỉ phép tham gia đào tạo tập trung ngạch chuyên viên chính.",
    },
    {
      id: `ACT-${staffId}-07`,
      at: "2026-10-10T11:20:00+07:00",
      actorName: "Nguyễn Thị Mai",
      actorRole: "Chuyên viên Nhân sự",
      module: "Nhân sự",
      action: "Cập nhật chứng chỉ chuyên môn",
      targetType: "staff",
      targetId: staffId,
      targetName: staffName,
      changes: [
        { label: "Chứng chỉ hành nghề", from: "Giám sát thi công hạng II", to: "Giám sát thi công hạng I" },
        { label: "Số hiệu chứng chỉ", from: "BXD-002194", to: "BXD-004812" },
        { label: "Thời hạn", from: "10/10/2026", to: "10/10/2031" },
      ],
    },
    {
      id: `ACT-${staffId}-08`,
      at: "2026-09-28T14:30:00+07:00",
      actorName: "Lê Hoàng Sơn",
      actorRole: "Tổ trưởng HCTH",
      module: "Nhân sự",
      action: "Cập nhật thông tin đãi ngộ",
      targetType: "staff",
      targetId: staffId,
      targetName: staffName,
      changes: [
        { label: "Hệ số lương", from: "3.66", to: "3.99" },
        { label: "Bậc lương", from: "Bậc 4", to: "Bậc 5" },
      ],
      note: "Nâng bậc lương thường xuyên theo Quyết định số 88/QĐ-UBND thị xã Hà Tiên",
    },
    {
      id: `ACT-${staffId}-09`,
      at: "2026-09-15T09:15:00+07:00",
      actorName: "Huỳnh Thái Hải",
      actorRole: "Giám đốc Ban",
      module: "Nhân sự",
      action: "Phân công nhiệm vụ chuyên môn",
      targetType: "staff",
      targetId: staffId,
      targetName: staffName,
      changes: [
        { label: "Dự án phụ trách", from: "Chưa phân công", to: "Nâng cấp mở rộng đường trục chính khu đô thị Hà Tiên" },
        { label: "Nhiệm vụ", from: "Trống", to: "Phụ trách kiểm tra hồ sơ thiết kế bản vẽ thi công và dự toán" },
      ],
    },
    {
      id: `ACT-${staffId}-10`,
      at: "2026-08-25T16:00:00+07:00",
      actorName: "Nguyễn Thị Mai",
      actorRole: "Chuyên viên Nhân sự",
      module: "Nhân sự",
      action: "Gia hạn hợp đồng làm việc",
      targetType: "staff",
      targetId: staffId,
      targetName: staffName,
      changes: [
        { label: "Loại hợp đồng", from: "Hợp đồng có thời hạn (12 tháng)", to: "Hợp đồng không xác định thời hạn" },
        { label: "Số hợp đồng", from: "HĐ-15/2023/BQL", to: "HĐ-08/2026/BQL" },
      ],
    },
    {
      id: `ACT-${staffId}-11`,
      at: "2026-07-10T10:40:00+07:00",
      actorName: "Nguyễn Thị Mai",
      actorRole: "Chuyên viên Nhân sự",
      module: "Nhân sự",
      action: "Cập nhật hồ sơ cán bộ",
      targetType: "staff",
      targetId: staffId,
      targetName: staffName,
      changes: [
        { label: "Trình độ chuyên môn", from: "Kỹ sư Xây dựng", to: "Thạc sĩ Quản lý Xây dựng" },
        { label: "Lý luận chính trị", from: "Sơ cấp", to: "Trung cấp LLCT" },
      ],
    },
    {
      id: `ACT-${staffId}-12`,
      at: "2026-06-01T08:00:00+07:00",
      actorName: "Lê Hoàng Sơn",
      actorRole: "Quản trị hệ thống",
      module: "Nhân sự",
      action: "Thêm cán bộ mới",
      targetType: "staff",
      targetId: staffId,
      targetName: staffName,
      changes: [
        { label: "Chức danh", to: title },
        { label: "Phòng ban", to: teamName },
        { label: "Hình thức tuyển dụng", to: employment },
        { label: "Email công vụ", to: email },
      ],
      note: "Tiếp nhận nhân sự theo Quyết định số 24/QĐ-UBND thị xã Hà Tiên.",
    },
  ];
}

/** Thay đổi trên hồ sơ của một cán bộ */
export function getStaffProfileHistory(staffId: string): ActivityEntry[] {
  const stored = getPersonnelActivities().filter((e) => e.targetType === "staff" && e.targetId === staffId);
  const mockActivities = getMockStaffActivities(staffId);
  const storedIds = new Set(stored.map((e) => e.id));
  const missingMocks = mockActivities.filter((m) => !storedIds.has(m.id));

  return [...stored, ...missingMocks].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  );
}

/** "20/10/2026 10:57" */
export function formatActivityTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime()) || d.getTime() === 0) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
