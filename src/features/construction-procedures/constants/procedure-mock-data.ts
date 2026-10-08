/**
 * procedure-mock-data.ts — Dữ liệu mẫu quy trình thủ tục XDCB cho các dự án
 *
 * Tích hợp chặt chẽ với danh mục dự án thực tế BQL ĐTXD Hà Tiên
 */

import { MASTER_PROCEDURE_STEPS } from "./procedure-steps-master";
import type {
  ProcedureHistoryLog,
  ProcedureStep,
  ProjectProcedureData,
} from "../types/procedure.types";

/**
 * Hàm tiện ích sinh cấu trúc 16 bước mặc định từ MASTER_PROCEDURE_STEPS
 */
function createBaseSteps(): ProcedureStep[] {
  return MASTER_PROCEDURE_STEPS.map((m) => ({
    id: m.id,
    order: m.order,
    code: m.code,
    groupCode: m.groupCode,
    groupTitle: m.groupTitle,
    name: m.name,
    type: m.type,
    responsibleUnit: m.responsibleUnit,
    durationMargin: m.durationMargin,
    durationDaysMin: m.durationDaysMin,
    durationDaysMax: m.durationDaysMax,
    isContractBased: m.isContractBased,
    isSpecialRequest: m.isSpecialRequest,
    isEnabled: true, // Mặc định bật, sau đó tùy dự án tinh chỉnh
    status: "NOT_STARTED",
    plannedDays: m.defaultDays,
    attachments: [],
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// DỰ ÁN 1: Kè bảo vệ bờ biển phường Pháo Đài (Đoạn xung yếu)
// ─────────────────────────────────────────────────────────────────────────────
const PRJ_001_STEPS: ProcedureStep[] = createBaseSteps();

// Cấu hình trạng thái Dự án 1
// Bước I: Hoàn thành
PRJ_001_STEPS[0] = {
  ...PRJ_001_STEPS[0],
  status: "COMPLETED",
  startDatePlanned: "2025-08-01",
  endDatePlanned: "2025-08-10",
  actualStartDate: "2025-08-01",
  actualEndDate: "2025-08-09",
  attachments: [
    {
      id: "DOC-001-1",
      documentCode: "182/QĐ-UBND",
      title: "Quyết định phê duyệt chủ trương đầu tư dự án Kè bảo vệ bờ biển phường Pháo Đài",
      issuer: "UBND TP Hà Tiên",
      issueDate: "2025-08-09",
      fileName: "QD-182-PheDuyetChuTruong-KeBien.pdf",
      fileSize: "2.4 MB",
      uploadedAt: "2025-08-09 14:30",
      uploadedBy: "Lê Hoàng Minh",
      fileType: "pdf",
    },
  ],
};

// Bước II: Hoàn thành
PRJ_001_STEPS[1] = {
  ...PRJ_001_STEPS[1],
  status: "COMPLETED",
  startDatePlanned: "2025-08-11",
  endDatePlanned: "2025-08-18",
  actualStartDate: "2025-08-11",
  actualEndDate: "2025-08-17",
  attachments: [
    {
      id: "DOC-001-2",
      documentCode: "45/QĐ-BQL",
      title: "Quyết định phê duyệt nhiệm vụ và dự toán chi phí khảo sát, lập BCNCKT",
      issuer: "BQL ĐTXD Hà Tiên",
      issueDate: "2025-08-17",
      fileName: "QD-45-NhiemVuKhaoSat-BCNCKT.pdf",
      fileSize: "1.8 MB",
      uploadedAt: "2025-08-17 16:15",
      uploadedBy: "Lê Hoàng Minh",
      fileType: "pdf",
    },
  ],
};

// Bước II.1 (Điều kiện): Hoàn thành
PRJ_001_STEPS[2] = {
  ...PRJ_001_STEPS[2],
  status: "COMPLETED",
  startDatePlanned: "2025-08-18",
  endDatePlanned: "2025-08-25",
  actualStartDate: "2025-08-18",
  actualEndDate: "2025-08-24",
  attachments: [
    {
      id: "DOC-001-3",
      documentCode: "89/QĐ-BQL",
      title: "Quyết định chỉ định thầu đơn vị tư vấn lập BCNCKT",
      issuer: "BQL ĐTXD Hà Tiên",
      issueDate: "2025-08-24",
      fileName: "QD-89-ChiDinhThau-TVLap.pdf",
      fileSize: "1.2 MB",
      uploadedAt: "2025-08-24 10:00",
      uploadedBy: "Lê Hoàng Minh",
      fileType: "pdf",
    },
  ],
};

// Bước III (Điều kiện): Bỏ qua theo Quy tắc 7 (Có văn bản giải trình)
PRJ_001_STEPS[3] = {
  ...PRJ_001_STEPS[3],
  status: "SKIPPED",
  skipReason:
    "Gói thầu tư vấn lập BCNCKT có giá trị 380 triệu đồng (<500 triệu), đủ điều kiện chỉ định thầu theo quy định của Luật Đấu thầu và văn bản hướng dẫn của Sở Kế hoạch & Đầu tư.",
  skipDocumentCode: "105/SKHĐT-ĐKKD",
  skipIssuer: "Sở Kế hoạch và Đầu tư tỉnh Kiên Giang",
  attachments: [
    {
      id: "DOC-001-4",
      documentCode: "105/SKHĐT-ĐKKD",
      title: "Văn bản hướng dẫn áp dụng hạn mức chỉ định thầu tư vấn dưới 500 triệu",
      issuer: "Sở Kế hoạch và Đầu tư Kiên Giang",
      issueDate: "2025-08-20",
      fileName: "VB-105-HuongDanDauThauTV.pdf",
      fileSize: "850 KB",
      uploadedAt: "2025-08-25 09:20",
      uploadedBy: "Lê Hoàng Minh",
      fileType: "pdf",
    },
  ],
};

// Bước IV: Hoàn thành
PRJ_001_STEPS[4] = {
  ...PRJ_001_STEPS[4],
  status: "COMPLETED",
  startDatePlanned: "2025-08-26",
  endDatePlanned: "2025-09-30",
  actualStartDate: "2025-08-26",
  actualEndDate: "2025-09-28",
  attachments: [
    {
      id: "DOC-001-5",
      documentCode: "12/BC-TVXD",
      title: "Hồ sơ Báo cáo nghiên cứu khả thi dự án Kè bảo vệ bờ biển Pháo Đài",
      issuer: "Công ty CP Tư vấn Xây dựng Kiên Giang",
      issueDate: "2025-09-28",
      fileName: "HoSo-BCNCKT-KeBien-PhaoDai.pdf",
      fileSize: "14.6 MB",
      uploadedAt: "2025-09-28 17:00",
      uploadedBy: "Lê Hoàng Minh",
      fileType: "pdf",
    },
  ],
};

// Bước IV.1: Hoàn thành
PRJ_001_STEPS[5] = {
  ...PRJ_001_STEPS[5],
  status: "COMPLETED",
  startDatePlanned: "2025-10-01",
  endDatePlanned: "2025-10-18",
  actualStartDate: "2025-10-01",
  actualEndDate: "2025-10-15",
  attachments: [
    {
      id: "DOC-001-6",
      documentCode: "77/BC-TTXD",
      title: "Báo cáo kết quả thẩm tra thiết kế cơ sở và dự toán xây dựng công trình kè",
      issuer: "Viện Khoa học Công nghệ Xây dựng",
      issueDate: "2025-10-15",
      fileName: "BaoCaoThamTra-ThietKeDuToan.pdf",
      fileSize: "3.8 MB",
      uploadedAt: "2025-10-15 15:30",
      uploadedBy: "Nguyễn Văn An",
      fileType: "pdf",
    },
  ],
};

// Bước IV.2 (Điều kiện): Vô hiệu hóa (Tắt) vì không thuộc trường hợp thẩm định giá tài sản riêng
PRJ_001_STEPS[6] = {
  ...PRJ_001_STEPS[6],
  isEnabled: false,
  status: "DISABLED",
  notes: "Dự án công trình thủy lợi kè biển, không có hạng mục mua sắm thiết bị công nghệ phải thẩm định giá độc lập.",
};

// Bước IV.3 (Điều kiện): Hoàn thành
PRJ_001_STEPS[7] = {
  ...PRJ_001_STEPS[7],
  status: "COMPLETED",
  startDatePlanned: "2025-10-16",
  endDatePlanned: "2025-11-02",
  actualStartDate: "2025-10-16",
  actualEndDate: "2025-10-30",
  attachments: [
    {
      id: "DOC-001-7",
      documentCode: "88/GĐT-STNMT",
      title: "Quyết định phê duyệt kết quả thẩm định Báo cáo đánh giá tác động môi trường (ĐTM)",
      issuer: "Sở Tài nguyên và Môi trường Kiên Giang",
      issueDate: "2025-10-30",
      fileName: "PheDuyet-DTM-KeBien.pdf",
      fileSize: "4.2 MB",
      uploadedAt: "2025-10-30 11:20",
      uploadedBy: "Nguyễn Văn An",
      fileType: "pdf",
    },
  ],
};

// Bước V: Hoàn thành
PRJ_001_STEPS[8] = {
  ...PRJ_001_STEPS[8],
  status: "COMPLETED",
  startDatePlanned: "2025-11-03",
  endDatePlanned: "2025-11-25",
  actualStartDate: "2025-11-03",
  actualEndDate: "2025-11-22",
  attachments: [
    {
      id: "DOC-001-8",
      documentCode: "415/QĐ-UBND",
      title: "Quyết định phê duyệt Dự án đầu tư xây dựng công trình Kè bờ biển Pháo Đài",
      issuer: "UBND TP Hà Tiên",
      issueDate: "2025-11-22",
      fileName: "QD-415-PheDuyetDuAnDauTu.pdf",
      fileSize: "5.1 MB",
      uploadedAt: "2025-11-22 14:00",
      uploadedBy: "Lê Hoàng Minh",
      fileType: "pdf",
    },
  ],
};

// Bước V.1 (Điều kiện): Hoàn thành
PRJ_001_STEPS[9] = {
  ...PRJ_001_STEPS[9],
  status: "COMPLETED",
  startDatePlanned: "2025-11-26",
  endDatePlanned: "2025-12-18",
  actualStartDate: "2025-11-26",
  actualEndDate: "2025-12-16",
  attachments: [
    {
      id: "DOC-001-9",
      documentCode: "312/TB-SXD",
      title: "Thông báo kết quả thẩm định thiết kế bản vẽ thi công và dự toán xây dựng",
      issuer: "Sở Xây dựng tỉnh Kiên Giang",
      issueDate: "2025-12-16",
      fileName: "TB-312-KetQuaThamDinh-TKBVTC.pdf",
      fileSize: "2.9 MB",
      uploadedAt: "2025-12-16 16:45",
      uploadedBy: "Lê Hoàng Minh",
      fileType: "pdf",
    },
  ],
};

// Bước V.2 (Điều kiện): Vô hiệu hóa (Tắt) vì thực hiện Đấu thầu rộng rãi
PRJ_001_STEPS[10] = {
  ...PRJ_001_STEPS[10],
  isEnabled: false,
  status: "DISABLED",
  notes: "Gói thầu xây lắp quy mô 125,5 tỷ, bắt buộc tổ chức đấu thầu rộng rãi qua mạng.",
};

// Bước VI: Hoàn thành
PRJ_001_STEPS[11] = {
  ...PRJ_001_STEPS[11],
  status: "COMPLETED",
  startDatePlanned: "2026-01-05",
  endDatePlanned: "2026-02-20",
  actualStartDate: "2026-01-05",
  actualEndDate: "2026-02-18",
  attachments: [
    {
      id: "DOC-001-10",
      documentCode: "52/QĐ-BQL",
      title: "Quyết định phê duyệt kết quả lựa chọn nhà thầu gói thầu xây lắp kè số 01",
      issuer: "BQL ĐTXD Hà Tiên",
      issueDate: "2026-02-18",
      fileName: "QD-52-PheDuyet-KQLNT-XayLap.pdf",
      fileSize: "3.5 MB",
      uploadedAt: "2026-02-18 11:00",
      uploadedBy: "Lê Hoàng Minh",
      fileType: "pdf",
    },
  ],
};

// Bước VI.1: ĐANG THỰC HIỆN - SẮP ĐẾN HẠN (Quy tắc 8: Cảnh báo vàng ≤ 7 ngày)
// Ngày hiện tại mô phỏng: 2026-09-16. Hạn: 2026-09-22 -> Còn 6 ngày -> Cảnh báo vàng!
PRJ_001_STEPS[12] = {
  ...PRJ_001_STEPS[12],
  status: "IN_PROGRESS",
  startDatePlanned: "2026-02-25",
  endDatePlanned: "2026-09-22",
  actualStartDate: "2026-02-28",
  attachments: [
    {
      id: "DOC-001-11",
      documentCode: "18/HĐ-XL",
      title: "Hợp đồng thi công xây dựng công trình và thỏa thuận liên danh",
      issuer: "BQL ĐTXD Hà Tiên & Liên danh Nhà thầu Kiên Giang",
      issueDate: "2026-02-25",
      fileName: "HopDongThiCong-XL01.pdf",
      fileSize: "6.7 MB",
      uploadedAt: "2026-02-26 09:00",
      uploadedBy: "Nguyễn Văn An",
      fileType: "pdf",
    },
    {
      id: "DOC-001-12",
      documentCode: "02/NK-TVGS",
      title: "Nhật ký giám sát thi công phần đắp đê bao và ép cọc bê tông dự ứng lực",
      issuer: "Tư vấn Giám sát An Thịnh",
      issueDate: "2026-09-10",
      fileName: "NhatKy-GiamSat-Thang9-2026.pdf",
      fileSize: "2.1 MB",
      uploadedAt: "2026-09-10 17:30",
      uploadedBy: "Nguyễn Văn An",
      fileType: "pdf",
    },
  ],
  notes: "Tiến độ hiện trường đạt 62%. Thời hạn giai đoạn 1 sắp đến hạn (còn 6 ngày).",
};

// Bước VI.2: Chưa thực hiện
PRJ_001_STEPS[13] = {
  ...PRJ_001_STEPS[13],
  status: "NOT_STARTED",
  startDatePlanned: "2026-09-23",
  endDatePlanned: "2026-10-15",
};

// Bước VI.3 (Điều kiện): Bật, chưa thực hiện
PRJ_001_STEPS[14] = {
  ...PRJ_001_STEPS[14],
  isEnabled: true,
  status: "NOT_STARTED",
  startDatePlanned: "2026-10-16",
  endDatePlanned: "2026-11-15",
};

// Bước VII: Chưa thực hiện
PRJ_001_STEPS[15] = {
  ...PRJ_001_STEPS[15],
  status: "NOT_STARTED",
  startDatePlanned: "2026-11-16",
  endDatePlanned: "2027-01-15",
};

// Nhật ký kiểm toán / lịch sử PRJ-001 (Quy tắc 11: Không thể xóa)
const PRJ_001_HISTORY: ProcedureHistoryLog[] = [
  {
    id: "LOG-001-1",
    stepId: "step-1",
    stepCode: "I",
    stepName: "Phê duyệt chủ trương đầu tư",
    timestamp: "2025-08-01 08:30",
    performedBy: "Lê Hoàng Minh",
    role: "Giám đốc Quản lý Dự án",
    action: "START_STEP",
    actionLabel: "Khởi động bước",
    newStatus: "IN_PROGRESS",
    details: "Bắt đầu thủ tục lập và trình duyệt chủ trương đầu tư theo kế hoạch trung hạn.",
  },
  {
    id: "LOG-001-2",
    stepId: "step-1",
    stepCode: "I",
    stepName: "Phê duyệt chủ trương đầu tư",
    timestamp: "2025-08-09 14:35",
    performedBy: "Lê Hoàng Minh",
    role: "Giám đốc Quản lý Dự án",
    action: "COMPLETE_STEP",
    actionLabel: "Hoàn thành bước",
    previousStatus: "IN_PROGRESS",
    newStatus: "COMPLETED",
    documentReference: "182/QĐ-UBND",
    details: "Hoàn thành bước sau khi đính kèm Quyết định số 182/QĐ-UBND phê duyệt chủ trương đầu tư.",
  },
  {
    id: "LOG-001-3",
    stepId: "step-3",
    stepCode: "III",
    stepName: "Đấu thầu TV (chi phí >500 triệu)",
    timestamp: "2025-08-25 09:30",
    performedBy: "Lê Hoàng Minh",
    role: "Giám đốc Quản lý Dự án",
    action: "SKIP_STEP",
    actionLabel: "Đánh dấu Bỏ qua (Quy tắc 7)",
    previousStatus: "NOT_STARTED",
    newStatus: "SKIPPED",
    reason: "Gói thầu TV lập BCNCKT 380 triệu thuộc trường hợp chỉ định thầu theo hướng dẫn của Sở KH&ĐT.",
    skipDocumentCode: "105/SKHĐT-ĐKKD",
    details: "Bỏ qua bước Đấu thầu TV chi phí >500 triệu theo Văn bản căn cứ số 105/SKHĐT-ĐKKD.",
  },
  {
    id: "LOG-001-4",
    stepId: "step-4-2",
    stepCode: "IV.2",
    stepName: "Thẩm định giá",
    timestamp: "2025-08-26 10:00",
    performedBy: "Lê Hoàng Minh",
    role: "Giám đốc Quản lý Dự án",
    action: "TOGGLE_STEP",
    actionLabel: "Tắt bước điều kiện",
    details: "Vô hiệu hóa bước Thẩm định giá do dự án không có trang thiết bị chuyên ngành cần định giá độc lập.",
  },
  {
    id: "LOG-001-5",
    stepId: "step-6-1",
    stepCode: "VI.1",
    stepName: "Thi công – Giám sát kỹ thuật",
    timestamp: "2026-02-28 08:00",
    performedBy: "Nguyễn Văn An",
    role: "Phụ trách Giám sát Kỹ thuật",
    action: "START_STEP",
    actionLabel: "Khởi động bước",
    newStatus: "IN_PROGRESS",
    details: "Phát lệnh khởi công và bàn giao mặt bằng cho nhà thầu thi công xây lắp.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// DỰ ÁN 2: Tuyến đường ven biển phường Pháo Đài (Gói XL-02)
// Dự án này có bước bị QUÁ HẠN (Quy tắc 9: Cảnh báo đỏ)
// ─────────────────────────────────────────────────────────────────────────────
const PRJ_002_STEPS: ProcedureStep[] = createBaseSteps();

// Bước I: Hoàn thành
PRJ_002_STEPS[0] = {
  ...PRJ_002_STEPS[0],
  status: "COMPLETED",
  startDatePlanned: "2026-01-10",
  endDatePlanned: "2026-01-20",
  attachments: [
    {
      id: "DOC-002-1",
      documentCode: "28/QĐ-UBND",
      title: "Quyết định phê duyệt chủ trương xây dựng tuyến đường ven biển Pháo Đài",
      issuer: "UBND TP Hà Tiên",
      issueDate: "2026-01-19",
      fileName: "QD-28-ChuTruong-DuongVenBien.pdf",
      fileSize: "2.1 MB",
      uploadedAt: "2026-01-19 15:00",
      uploadedBy: "Nguyễn Văn An",
    },
  ],
};

// Bước II: Hoàn thành
PRJ_002_STEPS[1] = {
  ...PRJ_002_STEPS[1],
  status: "COMPLETED",
  startDatePlanned: "2026-01-22",
  endDatePlanned: "2026-01-30",
  attachments: [
    {
      id: "DOC-002-2",
      documentCode: "12/QĐ-BQL",
      title: "Quyết định phê duyệt nhiệm vụ khảo sát lập BCKTKT",
      issuer: "BQL ĐTXD Hà Tiên",
      issueDate: "2026-01-29",
      fileName: "QD-12-NhiemVuKhaoSat.pdf",
      fileSize: "1.4 MB",
      uploadedAt: "2026-01-29 11:20",
      uploadedBy: "Nguyễn Văn An",
    },
  ],
};

// Bước II.1 (Điều kiện): Hoàn thành
PRJ_002_STEPS[2] = {
  ...PRJ_002_STEPS[2],
  status: "COMPLETED",
  startDatePlanned: "2026-02-01",
  endDatePlanned: "2026-02-08",
  attachments: [
    {
      id: "DOC-002-3",
      documentCode: "19/QĐ-BQL",
      title: "Quyết định chỉ định thầu tư vấn khảo sát thiết kế",
      issuer: "BQL ĐTXD Hà Tiên",
      issueDate: "2026-02-07",
      fileName: "QD-19-ChiDinhThauTV.pdf",
      fileSize: "950 KB",
      uploadedAt: "2026-02-07 14:00",
      uploadedBy: "Nguyễn Văn An",
    },
  ],
};

// Bước III (Điều kiện): Tắt
PRJ_002_STEPS[3] = {
  ...PRJ_002_STEPS[3],
  isEnabled: false,
  status: "DISABLED",
};

// Bước IV: ĐANG THỰC HIỆN - BỊ QUÁ HẠN (Quy tắc 9: Cảnh báo đỏ)
// Hạn kế hoạch: 2026-09-08 (Hiện tại 2026-09-16 -> Quá hạn 8 ngày!)
PRJ_002_STEPS[4] = {
  ...PRJ_002_STEPS[4],
  status: "IN_PROGRESS",
  startDatePlanned: "2026-07-15",
  endDatePlanned: "2026-09-08",
  actualStartDate: "2026-07-20",
  attachments: [
    {
      id: "DOC-002-4",
      documentCode: "05/DTh-TV",
      title: "Dự thảo Báo cáo kinh tế kỹ thuật và bình đồ tuyến đường",
      issuer: "Trung tâm Tư vấn Thiết kế Hà Tiên",
      issueDate: "2026-08-28",
      fileName: "DuThao-BCKTKT-DuongVenBien.pdf",
      fileSize: "18.2 MB",
      uploadedAt: "2026-08-28 16:30",
      uploadedBy: "Nguyễn Văn An",
    },
  ],
  notes: "Đơn vị tư vấn chậm hoàn thiện phương án đấu nối hạ tầng thoát nước với khu dân cư hiện hữu. Quá hạn 8 ngày.",
};

const PRJ_002_HISTORY: ProcedureHistoryLog[] = [
  {
    id: "LOG-002-1",
    stepId: "step-1",
    stepCode: "I",
    stepName: "Phê duyệt chủ trương đầu tư",
    timestamp: "2026-01-10 08:30",
    performedBy: "Nguyễn Văn An",
    role: "Trưởng phòng Kỹ thuật",
    action: "START_STEP",
    actionLabel: "Khởi động bước",
    newStatus: "IN_PROGRESS",
    details: "Khởi tạo hồ sơ đề xuất chủ trương đầu tư dự án Tuyến đường ven biển.",
  },
  {
    id: "LOG-002-2",
    stepId: "step-1",
    stepCode: "I",
    stepName: "Phê duyệt chủ trương đầu tư",
    timestamp: "2026-01-19 15:30",
    performedBy: "Nguyễn Văn An",
    role: "Trưởng phòng Kỹ thuật",
    action: "COMPLETE_STEP",
    actionLabel: "Hoàn thành bước",
    previousStatus: "IN_PROGRESS",
    newStatus: "COMPLETED",
    documentReference: "28/QĐ-UBND",
    details: "Đính kèm Quyết định 28/QĐ-UBND và hoàn tất bước phê duyệt chủ trương.",
  },
  {
    id: "LOG-002-3",
    stepId: "step-4",
    stepCode: "IV",
    stepName: "TV lập hồ sơ BCNCKT/BCKTKT",
    timestamp: "2026-07-20 09:00",
    performedBy: "Nguyễn Văn An",
    role: "Trưởng phòng Kỹ thuật",
    action: "START_STEP",
    actionLabel: "Khởi động bước",
    newStatus: "IN_PROGRESS",
    details: "Giao nhiệm vụ cho Tư vấn lập hồ sơ thiết kế bản vẽ và dự toán.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// DỰ ÁN 3: Trường Mầm non Pháo Đài (Điểm trường số 2)
// Dự án ở giai đoạn ban đầu (Bước I đã xong, Bước II đang bắt đầu)
// ─────────────────────────────────────────────────────────────────────────────
const PRJ_003_STEPS: ProcedureStep[] = createBaseSteps();

PRJ_003_STEPS[0] = {
  ...PRJ_003_STEPS[0],
  status: "COMPLETED",
  startDatePlanned: "2026-08-01",
  endDatePlanned: "2026-08-15",
  actualStartDate: "2026-08-01",
  actualEndDate: "2026-08-12",
  attachments: [
    {
      id: "DOC-003-1",
      documentCode: "94/QĐ-UBND",
      title: "Quyết định phê duyệt chủ trương xây dựng Trường Mầm non Pháo Đài",
      issuer: "UBND TP Hà Tiên",
      issueDate: "2026-08-12",
      fileName: "QD-94-ChuTruong-MamNon.pdf",
      fileSize: "1.9 MB",
      uploadedAt: "2026-08-12 14:00",
      uploadedBy: "Lê Hoàng Minh",
    },
  ],
};

PRJ_003_STEPS[1] = {
  ...PRJ_003_STEPS[1],
  status: "IN_PROGRESS",
  startDatePlanned: "2026-09-12",
  endDatePlanned: "2026-09-25", // Còn 9 ngày -> NORMAL
  actualStartDate: "2026-09-12",
  attachments: [],
};

const PRJ_003_HISTORY: ProcedureHistoryLog[] = [
  {
    id: "LOG-003-1",
    stepId: "step-1",
    stepCode: "I",
    stepName: "Phê duyệt chủ trương đầu tư",
    timestamp: "2026-08-01 09:00",
    performedBy: "Lê Hoàng Minh",
    role: "Giám đốc Quản lý Dự án",
    action: "START_STEP",
    actionLabel: "Khởi động bước",
    newStatus: "IN_PROGRESS",
    details: "Đệ trình chủ trương đầu tư xây mới phòng học điểm 2 Trường Mầm non Pháo Đài.",
  },
  {
    id: "LOG-003-2",
    stepId: "step-1",
    stepCode: "I",
    stepName: "Phê duyệt chủ trương đầu tư",
    timestamp: "2026-08-12 14:15",
    performedBy: "Lê Hoàng Minh",
    role: "Giám đốc Quản lý Dự án",
    action: "COMPLETE_STEP",
    actionLabel: "Hoàn thành bước",
    previousStatus: "IN_PROGRESS",
    newStatus: "COMPLETED",
    documentReference: "94/QĐ-UBND",
    details: "UBND Thành phố ban hành QĐ số 94 phê duyệt chủ trương đầu tư dự án.",
  },
  {
    id: "LOG-003-3",
    stepId: "step-2",
    stepCode: "II",
    stepName: "Lập nhiệm vụ KS, BCNCKT/BCKTKT",
    timestamp: "2026-09-12 08:30",
    performedBy: "Lê Hoàng Minh",
    role: "Giám đốc Quản lý Dự án",
    action: "START_STEP",
    actionLabel: "Khởi động bước",
    newStatus: "IN_PROGRESS",
    details: "Bắt đầu lập đề cương khảo sát địa chất và lập BCKTKT.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// DANH SÁCH DỮ LIỆU TỔNG HỢP CHO CÁC DỰ ÁN
// ─────────────────────────────────────────────────────────────────────────────
export const INITIAL_PROCEDURE_PROJECTS: ProjectProcedureData[] = [
  {
    projectId: "PRJ-001",
    projectCode: "BQL-DA-2026-001",
    projectName: "Kè bảo vệ bờ biển phường Pháo Đài (Đoạn xung yếu)",
    projectType: "Thủy lợi",
    totalInvestment: 125.5,
    managerName: "Lê Hoàng Minh",
    supervisorName: "Nguyễn Văn An",
    startDate: "2025-08-15",
    expectedFinishDate: "2026-11-30",
    steps: PRJ_001_STEPS,
    history: PRJ_001_HISTORY,
  },
  {
    projectId: "PRJ-002",
    projectCode: "BQL-DA-2026-002",
    projectName: "Tuyến đường ven biển phường Pháo Đài (Gói XL-02)",
    projectType: "Giao thông",
    totalInvestment: 185.0,
    managerName: "Nguyễn Văn An",
    supervisorName: "Lê Hoàng Minh",
    startDate: "2025-03-01",
    expectedFinishDate: "2026-12-25",
    steps: PRJ_002_STEPS,
    history: PRJ_002_HISTORY,
  },
  {
    projectId: "PRJ-003",
    projectCode: "BQL-DA-2026-003",
    projectName: "Trường Mầm non Pháo Đài (Điểm trường số 2)",
    projectType: "Dân dụng",
    totalInvestment: 18.5,
    managerName: "Lê Hoàng Minh",
    supervisorName: "Trần Văn Bình",
    startDate: "2026-08-01",
    expectedFinishDate: "2027-05-30",
    steps: PRJ_003_STEPS,
    history: PRJ_003_HISTORY,
  },
];
