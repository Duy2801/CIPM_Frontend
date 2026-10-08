/**
 * colors.ts — Bảng màu chuẩn: Hệ thống Quản lý Dự án BQL ĐTXD Hà Tiên v2.0
 *
 * NGUYÊN TẮC: Nhất quán ngữ nghĩa (Semantic Consistency).
 * Mỗi màu đóng vai trò như một tín hiệu định hướng tư duy tức thì
 * cho cán bộ kỹ thuật và lãnh đạo — không dùng để trang trí ngẫu nhiên.
 *
 * Single source of truth — mọi theme đều lấy từ đây.
 */

/* ═══════════════════════════════════════════════════════════
   1. CORE SEMANTIC COLORS — Bảng màu cốt lõi
   ═══════════════════════════════════════════════════════════ */
export const semantic = {
  /**
   * TEAL — Thương hiệu & Điểm nhấn tích cực
   * Dùng: dự án đang quản lý, nút hành động chính,
   *       trạng thái Active menu, thiết kế kỹ thuật
   */
  teal:           "#00C9A7",
  tealLight:      "#33D4B7",
  tealDark:       "#00A88C",
  tealBg:         "rgba(0, 201, 167, 0.1)",
  tealBorder:     "rgba(0, 201, 167, 0.3)",

  /**
   * GOLD / AMBER — Tài chính & Cảnh báo trung bình
   * Dùng: giải ngân vốn, tiền mặt, hạn mức tài chính,
   *       mốc sắp đến hạn, chức danh Kế toán trưởng
   */
  gold:           "#F5B93A",
  amber:          "#F59E0B",
  goldLight:      "#F7C85C",
  goldDark:       "#D4980F",
  goldBg:         "rgba(245, 185, 58, 0.1)",
  goldBorder:     "rgba(245, 185, 58, 0.3)",

  /**
   * RED — Khẩn cấp & Sự cố
   * Dùng: chậm tiến độ ≥25%, quá hạn pháp lý,
   *       khiếu nại gay gắt, nút Xóa, HSDT hết hạn
   */
  red:            "#FF5B5B",
  redLight:       "#FF7B7B",
  redDark:        "#E03A3A",
  redBg:          "rgba(255, 91, 91, 0.1)",
  redBorder:      "rgba(255, 91, 91, 0.3)",

  /**
   * GREEN — Thành công & Hoàn thành
   * Dùng: công trình nghiệm thu/quyết toán, bước XDCB đã duyệt,
   *       hộ dân đã nhận đủ tiền, gói thầu đã ký hợp đồng
   */
  green:          "#3ECF8E",
  greenLight:     "#65D9A5",
  greenDark:      "#2CAF74",
  greenBg:        "rgba(62, 207, 142, 0.1)",
  greenBorder:    "rgba(62, 207, 142, 0.3)",

  /**
   * BLUE — Đang triển khai & Thông tin
   * Dùng: giai đoạn thi công, bước GPMB đang tiến hành,
   *       văn bản quy chuẩn, quyền nhập + xem
   */
  blue:           "#60A5FA",
  blueLight:      "#93C5FD",
  blueDark:       "#3B82F6",
  blueBg:         "rgba(96, 165, 250, 0.1)",
  blueBorder:     "rgba(96, 165, 250, 0.3)",

  /**
   * CORAL — Xung đột nghiệp vụ
   * Dùng: hộ dân không hợp tác kiểm kê,
   *       điểm nghẽn bàn giao mặt bằng, cưỡng chế
   */
  coral:          "#FB7185",
  coralLight:     "#FCA5B1",
  coralDark:      "#F04563",
  coralBg:        "rgba(251, 113, 133, 0.1)",
  coralBorder:    "rgba(251, 113, 133, 0.3)",

  /**
   * PURPLE / LAVENDER — Pháp lý & AI
   * Dùng: bước điều kiện rẽ nhánh (chỉ định thầu, kiểm toán độc lập),
   *       tính năng AI xuất báo cáo, vốn hỗn hợp
   */
  purple:         "#A78BFA",
  purpleLight:    "#C4B0FD",
  purpleDark:     "#8B5CF6",
  purpleBg:       "rgba(167, 139, 250, 0.1)",
  purpleBorder:   "rgba(167, 139, 250, 0.3)",
} as const;

/* ═══════════════════════════════════════════════════════════
   2. DARK MODE SURFACE — Nền tối (giao diện chính của hệ thống)
   ═══════════════════════════════════════════════════════════ */
export const darkSurface = {
  /** Nền sâu nhất — body/layout */
  bg:         "#0A1628",
  /** Nền card, sidebar, topbar, modal */
  surface:    "#0F1E35",
  /** Nền secondary — bảng, panel phụ */
  surface2:   "#152340",
  /** Nền hover/active */
  surface3:   "#1A2B4A",
  /** Border mặc định */
  border:     "rgba(255, 255, 255, 0.08)",
  borderMid:  "rgba(255, 255, 255, 0.15)",
  /** Chữ chính */
  text:       "#E2E8F0",
  textMuted:  "#94A3B8",
  textFaint:  "#475569",
} as const;

/* ═══════════════════════════════════════════════════════════
   3. LIGHT MODE SURFACE — Nền trắng (in ấn, báo cáo, public)
   ═══════════════════════════════════════════════════════════ */
export const lightSurface = {
  bg:         "#FFFFFF",
  surface:    "#F8FAFC",
  surface2:   "#F1F5F9",
  surface3:   "#E2E8F0",
  border:     "#E5E7EB",
  borderMid:  "#D1D5DB",
  text:       "#0F172A",
  textMuted:  "#4B5563",
  textFaint:  "#9CA3AF",
} as const;

/* ═══════════════════════════════════════════════════════════
   4. PER-PAGE COLOR MAP — Màu theo từng trang/module
   ═══════════════════════════════════════════════════════════ */
export const pageColors = {
  /** Trang 0: Đăng nhập & Xác thực */
  auth: {
    primary:   semantic.teal,    // nút đăng nhập, logo cơ quan
    info:      semantic.blue,    // phân quyền công tác
    warning:   semantic.gold,    // cảnh báo audit trail thanh tra
  },

  /** Trang 1: Dashboard — Bảng điều khiển */
  dashboard: {
    kpiTotal:      semantic.teal,    // Tổng dự án đang quản lý
    kpiFinance:    semantic.gold,    // Giải ngân vốn 2026
    kpiLate:       semantic.red,     // Dự án chậm tiến độ
    kpiDone:       semantic.green,   // Công trình hoàn thành
    alertCritical: semantic.red,     // Chậm > 45 ngày
    alertWarning:  semantic.gold,    // Hạn nộp thầu
    alertLegal:    semantic.purple,  // Bảo hành sắp hết hạn
    alertConflict: semantic.coral,   // GPMB vướng dân
  },

  /** Trang 2: Dự án & Công trình */
  project: {
    /** Phase Badges — Huy hiệu giai đoạn */
    phaseDesign:      semantic.teal,    // Thiết kế
    phaseConstruct:   semantic.blue,    // Thi công / Đấu thầu
    phaseGPMB:        semantic.amber,   // Bồi thường GPMB
    phaseComplete:    semantic.green,   // Nghiệm thu / Hoàn thành

    /** Source Badges — Huy hiệu nguồn vốn */
    fundWard:         semantic.teal,    // Ngân sách Phường
    fundProvince:     semantic.gold,    // Ngân sách Tỉnh
    fundCentral:      semantic.blue,    // Vốn Trung ương
    fundMixed:        semantic.purple,  // Vốn Hỗn hợp

    /** Progress Bar */
    progressOk:       semantic.green,   // Đúng tiến độ
    progressWarning:  semantic.gold,    // Chậm nhẹ 10–25%
    progressCritical: semantic.red,     // Chậm nghiêm trọng > 25%
  },

  /** Trang 3: Hồ sơ Thủ tục XDCB (16 bước động) */
  procedure: {
    stepDone:         semantic.green,   // Bước đã phê duyệt
    stepActive:       semantic.teal,    // Bước đang thực hiện
    stepConditional:  semantic.purple,  // Bước điều kiện phân nhánh
    stepPending:      darkSurface.surface3, // Bước chưa đến hạn
  },

  /** Trang 4: Tài chính & Quyết toán */
  finance: {
    budget:           semantic.gold,    // Tổng vốn kế hoạch
    approved:         semantic.teal,    // Kế toán trưởng duyệt chi
    overdue:          semantic.red,     // Đề nghị thanh toán quá hạn
    pending:          semantic.amber,   // Tài khoản chờ tất toán
  },

  /** Trang 5: Nhân sự & Phân công */
  personnel: {
    /** Chức danh */
    director:         semantic.teal,    // Ban Giám đốc
    deputyDirector:   semantic.blue,    // Phó Giám đốc
    chiefAccountant:  semantic.gold,    // Kế toán trưởng / Tổ trưởng Kỹ thuật
    gpmb:             semantic.coral,   // Tổ trưởng GPMB
    /** Quyền hạn */
    permFull:         semantic.teal,    // Toàn quyền / Duyệt chi
    permEdit:         semantic.green,   // Nhập + Xem
    permInput:        semantic.blue,    // Chỉ nhập liệu
    permView:         "#64748B",        // Chỉ xem (Read-only / Slate)
  },

  /** Trang 6: GPMB — Bồi thường Tái định cư */
  gpmb: {
    cellDone:         semantic.green,   // ✓ Đã hoàn tất bước thu hồi đất
    cellActive:       semantic.blue,    // ▶ Đang tiếp xúc, đo đạc thực địa
    cellOverdue:      semantic.red,     // ! Quá hạn pháp lý
    cellConflict:     semantic.coral,   // ✗ Hộ dân chống đối, cần cưỡng chế
    cellPending:      darkSurface.surface3, // – Bước chưa đến lượt
  },

  /** Trang 7: Đấu thầu (KHLCNT) */
  bidding: {
    contracted:       semantic.green,   // Đã ký hợp đồng
    value:            semantic.teal,    // Giá trị gói thầu
    deadline:         semantic.amber,   // Hạn nộp HSDT còn ≤ 7 ngày
    expired:          semantic.red,     // Hết hạn / hủy thầu
  },

  /** Trang 8: Bảo hành & Bảo trì */
  warranty: {
    safe:             semantic.green,   // Còn > 90 ngày
    warning:          semantic.amber,   // Còn 30–90 ngày
    critical:         semantic.red,     // < 30 ngày hoặc hết hạn
  },

  /** Trang 9: Pháp lý & Trợ lý AI */
  legal: {
    ai:               semantic.purple,  // Tính năng AI / Nút xuất báo cáo
    valid:            semantic.green,   // Văn bản đang hiệu lực
    expired:          semantic.red,     // Văn bản hết hiệu lực / bãi bỏ
    download:         semantic.teal,    // Nút tải biểu mẫu chuẩn
  },
} as const;

/* ═══════════════════════════════════════════════════════════
   5. NAMED EXPORTS (convenience)
   ═══════════════════════════════════════════════════════════ */
export const colors = {
  ...semantic,
  dark: darkSurface,
  light: lightSurface,
  pages: pageColors,
} as const;

export type Colors = typeof colors;
