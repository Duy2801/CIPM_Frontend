import type { ProcedureStep } from "../types/procedure.types";
import { PERSONNEL_MOCK_DATA } from "@/features/personnel-assignment/constants/personnel-mock-data";

export interface DepartmentTemplate {
  id: string;
  department: string;
  name: string;
  shortName: string;
  description: string;
  badge: string;
  tagColor: "teal" | "blue" | "amber" | "purple" | "red";
  createSteps: () => ProcedureStep[];
}

/**
 * 1. Quy trình Tổ Giám sát – Kỹ thuật (GSKT)
 */
export function createGsktSteps(): ProcedureStep[] {
  return [
    {
      id: "gskt-1",
      order: 1,
      code: "GS-01",
      groupCode: "GSKT",
      groupTitle: "Giám sát & Quản lý hiện trường",
      name: "Khảo sát hiện trường & Tiếp nhận bàn giao mặt bằng thi công",
      type: "MANDATORY",
      responsibleUnit: "Tổ Giám sát – Kỹ thuật",
      department: "Tổ Giám sát – Kỹ thuật",
      assignedTo: "Trần Quốc Việt",
      assignedToId: "ST-006",
      assignedBy: "Lê Hoàng Minh",
      assignedAt: "2026-03-01",
      submissionStatus: "APPROVED",
      submittedBy: "Trần Quốc Việt",
      submittedAt: "2026-03-05",
      approvedBy: "Lê Hoàng Minh",
      approvedAt: "2026-03-06",
      durationMargin: "3–5 ngày",
      durationDaysMin: 3,
      durationDaysMax: 5,
      isEnabled: true,
      status: "COMPLETED",
      plannedDays: 5,
      startDatePlanned: "2026-03-01",
      endDatePlanned: "2026-03-05",
      actualStartDate: "2026-03-01",
      actualEndDate: "2026-03-05",
      attachments: [
        {
          id: "DOC-GS-1",
          documentCode: "12/BB-BGMB",
          title: "Biên bản bàn giao mốc giới và mặt bằng thi công công trình",
          issuer: "BQL ĐTXD Hà Tiên",
          issueDate: "2026-03-05",
          fileName: "BB-12-BanGiaoMatBang.pdf",
          fileSize: "1.5 MB",
          uploadedAt: "2026-03-05 10:00",
          uploadedBy: "Trần Quốc Việt",
          fileType: "pdf",
        },
      ],
      notes: "Đã cắm mốc ranh giới và bàn giao nguyên trạng cho nhà thầu xây lắp.",
    },
    {
      id: "gskt-2",
      order: 2,
      code: "GS-02",
      groupCode: "GSKT",
      groupTitle: "Giám sát & Quản lý hiện trường",
      name: "Thẩm duyệt Biện pháp thi công, Kế hoạch quản lý chất lượng & ATLĐ",
      type: "MANDATORY",
      responsibleUnit: "Tổ Giám sát – Kỹ thuật",
      department: "Tổ Giám sát – Kỹ thuật",
      assignedTo: "Trần Quốc Việt",
      assignedToId: "ST-006",
      assignedBy: "Lê Hoàng Minh",
      assignedAt: "2026-03-06",
      submissionStatus: "SUBMITTED",
      submittedBy: "Trần Quốc Việt",
      submittedAt: "2026-03-12",
      submissionNote: "Đã rà soát biện pháp thi công của nhà thầu, đề nghị Tổ trưởng phê duyệt.",
      durationMargin: "5–7 ngày",
      durationDaysMin: 5,
      durationDaysMax: 7,
      isEnabled: true,
      status: "IN_PROGRESS",
      plannedDays: 7,
      startDatePlanned: "2026-03-06",
      endDatePlanned: "2026-03-15",
      actualStartDate: "2026-03-06",
      attachments: [
        {
          id: "DOC-GS-2",
          documentCode: "05/TTr-BPTC",
          title: "Tờ trình thẩm duyệt biện pháp thi công và biện pháp đảm bảo an toàn",
          issuer: "Nhà thầu xây lắp",
          issueDate: "2026-03-12",
          fileName: "TTr-05-BienPhapThiCong.pdf",
          fileSize: "3.2 MB",
          uploadedAt: "2026-03-12 15:30",
          uploadedBy: "Trần Quốc Việt",
          fileType: "pdf",
        },
      ],
      notes: "Nhà thầu đã bổ sung phương án thoát nước mùa mưa theo yêu cầu.",
    },
    {
      id: "gskt-3",
      order: 3,
      code: "GS-03",
      groupCode: "GSKT",
      groupTitle: "Giám sát & Quản lý hiện trường",
      name: "Giám sát thi công phần móng ngầm & Thí nghiệm nén tĩnh cọc",
      type: "MANDATORY",
      responsibleUnit: "Tổ Giám sát – Kỹ thuật",
      department: "Tổ Giám sát – Kỹ thuật",
      assignedTo: "Phan Văn Đức",
      assignedToId: "ST-005",
      assignedBy: "Lê Hoàng Minh",
      assignedAt: "2026-03-16",
      submissionStatus: "PENDING_SUBMISSION",
      durationMargin: "15–20 ngày",
      durationDaysMin: 15,
      durationDaysMax: 20,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 18,
      startDatePlanned: "2026-03-16",
      endDatePlanned: "2026-04-05",
      attachments: [],
      notes: "Cần lấy mẫu thí nghiệm nén tĩnh 3 cọc đại diện trước khi đúc dầm móng.",
    },
    {
      id: "gskt-4",
      order: 4,
      code: "GS-04",
      groupCode: "GSKT",
      groupTitle: "Giám sát & Quản lý hiện trường",
      name: "Giám sát kết cấu thân, hoàn thiện & Lắp đặt thiết bị công trình",
      type: "MANDATORY",
      responsibleUnit: "Tổ Giám sát – Kỹ thuật",
      department: "Tổ Giám sát – Kỹ thuật",
      assignedTo: "Lâm Thị Diễm",
      assignedToId: "ST-008",
      assignedBy: "Lê Hoàng Minh",
      assignedAt: "2026-04-06",
      submissionStatus: "PENDING_SUBMISSION",
      durationMargin: "45–60 ngày",
      durationDaysMin: 45,
      durationDaysMax: 60,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 60,
      startDatePlanned: "2026-04-06",
      endDatePlanned: "2026-06-15",
      attachments: [],
      notes: "",
    },
    {
      id: "gskt-5",
      order: 5,
      code: "GS-05",
      groupCode: "GSKT",
      groupTitle: "Giám sát & Quản lý hiện trường",
      name: "Tổ chức nghiệm thu chuyển bước thi công & Nghiệm thu giai đoạn",
      type: "CONDITIONAL",
      responsibleUnit: "Tổ Giám sát – Kỹ thuật",
      department: "Tổ Giám sát – Kỹ thuật",
      assignedTo: "Trần Quốc Việt",
      assignedToId: "ST-006",
      assignedBy: "Lê Hoàng Minh",
      assignedAt: "2026-06-16",
      submissionStatus: "PENDING_SUBMISSION",
      durationMargin: "5–10 ngày",
      durationDaysMin: 5,
      durationDaysMax: 10,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 7,
      startDatePlanned: "2026-06-16",
      endDatePlanned: "2026-06-25",
      attachments: [],
      notes: "",
    },
    {
      id: "gskt-6",
      order: 6,
      code: "GS-06",
      groupCode: "GSKT",
      groupTitle: "Giám sát & Quản lý hiện trường",
      name: "Nghiệm thu hoàn thành hạng mục công trình đưa vào khai thác sử dụng",
      type: "MANDATORY",
      responsibleUnit: "Tổ Giám sát – Kỹ thuật",
      department: "Tổ Giám sát – Kỹ thuật",
      assignedTo: "Lê Hoàng Minh",
      assignedToId: "ST-004",
      assignedBy: "Lê Hoàng Minh",
      assignedAt: "2026-06-26",
      submissionStatus: "PENDING_SUBMISSION",
      durationMargin: "10–15 ngày",
      durationDaysMin: 10,
      durationDaysMax: 15,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 10,
      startDatePlanned: "2026-06-26",
      endDatePlanned: "2026-07-10",
      attachments: [],
      notes: "",
    },
  ];
}

/**
 * 2. Quy trình Tổ Kế hoạch – Kỹ thuật (KHKT)
 */
export function createKhktSteps(): ProcedureStep[] {
  return [
    {
      id: "khkt-1",
      order: 1,
      code: "KH-01",
      groupCode: "KHKT",
      groupTitle: "Kế hoạch & Chuẩn bị đầu tư",
      name: "Lập & Trình thẩm định Báo cáo nghiên cứu khả thi / Báo cáo KT-KT",
      type: "MANDATORY",
      responsibleUnit: "Tổ Kế hoạch – Kỹ thuật",
      department: "Tổ Kế hoạch – Kỹ thuật",
      assignedTo: "Nguyễn Hữu Phước",
      assignedToId: "ST-007",
      assignedBy: "Nguyễn Hữu Phước",
      assignedAt: "2026-01-10",
      submissionStatus: "APPROVED",
      submittedBy: "Nguyễn Hữu Phước",
      submittedAt: "2026-01-25",
      approvedBy: "Nguyễn Hữu Phước",
      approvedAt: "2026-01-26",
      durationMargin: "15–20 ngày",
      durationDaysMin: 15,
      durationDaysMax: 20,
      isEnabled: true,
      status: "COMPLETED",
      plannedDays: 15,
      startDatePlanned: "2026-01-10",
      endDatePlanned: "2026-01-25",
      actualStartDate: "2026-01-10",
      actualEndDate: "2026-01-25",
      attachments: [
        {
          id: "DOC-KH-1",
          documentCode: "18/TTr-KHKT",
          title: "Tờ trình thẩm định Báo cáo nghiên cứu khả thi dự án",
          issuer: "BQL ĐTXD Hà Tiên",
          issueDate: "2026-01-25",
          fileName: "TTr-18-BaoCaoNghienCuuKhaThi.pdf",
          fileSize: "4.8 MB",
          uploadedAt: "2026-01-25 11:00",
          uploadedBy: "Nguyễn Hữu Phước",
          fileType: "pdf",
        },
      ],
      notes: "Sở Xây dựng Kiên Giang đã có văn bản thẩm định thông qua.",
    },
    {
      id: "khkt-2",
      order: 2,
      code: "KH-02",
      groupCode: "KHKT",
      groupTitle: "Kế hoạch & Chuẩn bị đầu tư",
      name: "Xin ý kiến thỏa thuận chuyên ngành (PCCC, ĐTM môi trường, kết nối hạ tầng)",
      type: "MANDATORY",
      responsibleUnit: "Tổ Kế hoạch – Kỹ thuật",
      department: "Tổ Kế hoạch – Kỹ thuật",
      assignedTo: "Nguyễn Hữu Phước",
      assignedToId: "ST-007",
      assignedBy: "Nguyễn Hữu Phước",
      assignedAt: "2026-01-26",
      submissionStatus: "SUBMITTED",
      submittedBy: "Nguyễn Hữu Phước",
      submittedAt: "2026-02-15",
      submissionNote: "Đã nhận văn bản thẩm duyệt PCCC và ĐTM, đề nghị Tổ trưởng duyệt hoàn thành bước.",
      durationMargin: "10–20 ngày",
      durationDaysMin: 10,
      durationDaysMax: 20,
      isEnabled: true,
      status: "IN_PROGRESS",
      plannedDays: 20,
      startDatePlanned: "2026-01-26",
      endDatePlanned: "2026-02-20",
      actualStartDate: "2026-01-26",
      attachments: [
        {
          id: "DOC-KH-2",
          documentCode: "102/PCCC-PC07",
          title: "Giấy chứng nhận thẩm duyệt thiết kế về phòng cháy và chữa cháy",
          issuer: "Công an tỉnh Kiên Giang",
          issueDate: "2026-02-15",
          fileName: "GCN-102-ThamDuyetPCCC.pdf",
          fileSize: "1.9 MB",
          uploadedAt: "2026-02-15 16:00",
          uploadedBy: "Nguyễn Hữu Phước",
          fileType: "pdf",
        },
      ],
      notes: "",
    },
    {
      id: "khkt-3",
      order: 3,
      code: "KH-03",
      groupCode: "KHKT",
      groupTitle: "Kế hoạch & Chuẩn bị đầu tư",
      name: "Thẩm định Thiết kế bản vẽ thi công & Dự toán xây dựng công trình",
      type: "MANDATORY",
      responsibleUnit: "Tổ Kế hoạch – Kỹ thuật",
      department: "Tổ Kế hoạch – Kỹ thuật",
      assignedTo: "Nguyễn Hữu Phước",
      assignedToId: "ST-007",
      assignedBy: "Nguyễn Hữu Phước",
      assignedAt: "2026-02-21",
      submissionStatus: "PENDING_SUBMISSION",
      durationMargin: "15–30 ngày",
      durationDaysMin: 15,
      durationDaysMax: 30,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 20,
      startDatePlanned: "2026-02-21",
      endDatePlanned: "2026-03-15",
      attachments: [],
      notes: "",
    },
    {
      id: "khkt-4",
      order: 4,
      code: "KH-04",
      groupCode: "KHKT",
      groupTitle: "Kế hoạch & Chuẩn bị đầu tư",
      name: "Phê duyệt Quyết định đầu tư dự án & Kế hoạch vốn hàng năm",
      type: "MANDATORY",
      responsibleUnit: "Tổ Kế hoạch – Kỹ thuật",
      department: "Tổ Kế hoạch – Kỹ thuật",
      assignedTo: "Nguyễn Hữu Phước",
      assignedToId: "ST-007",
      assignedBy: "Nguyễn Hữu Phước",
      assignedAt: "2026-03-16",
      submissionStatus: "PENDING_SUBMISSION",
      durationMargin: "7–10 ngày",
      durationDaysMin: 7,
      durationDaysMax: 10,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 7,
      startDatePlanned: "2026-03-16",
      endDatePlanned: "2026-03-25",
      attachments: [],
      notes: "",
    },
  ];
}

/**
 * 3. Quy trình Tổ Quản lý Đấu thầu (DT)
 */
export function createDauthauSteps(): ProcedureStep[] {
  return [
    {
      id: "dt-1",
      order: 1,
      code: "DT-01",
      groupCode: "DT",
      groupTitle: "Quản lý Đấu thầu & Lựa chọn nhà thầu",
      name: "Lập & Trình phê duyệt Kế hoạch lựa chọn nhà thầu (KHLCNT)",
      type: "MANDATORY",
      responsibleUnit: "Tổ Quản lý Đấu thầu",
      department: "Tổ Quản lý Đấu thầu",
      assignedTo: "Trần Văn Hùng",
      assignedToId: "ST-017",
      assignedBy: "Trần Văn Hùng",
      assignedAt: "2026-02-01",
      submissionStatus: "APPROVED",
      submittedBy: "Trần Văn Hùng",
      submittedAt: "2026-02-10",
      approvedBy: "Trần Văn Hùng",
      approvedAt: "2026-02-11",
      durationMargin: "5–10 ngày",
      durationDaysMin: 5,
      durationDaysMax: 10,
      isEnabled: true,
      status: "COMPLETED",
      plannedDays: 7,
      startDatePlanned: "2026-02-01",
      endDatePlanned: "2026-02-10",
      actualStartDate: "2026-02-01",
      actualEndDate: "2026-02-10",
      attachments: [
        {
          id: "DOC-DT-1",
          documentCode: "56/QĐ-UBND",
          title: "Quyết định phê duyệt Kế hoạch lựa chọn nhà thầu dự án",
          issuer: "UBND TP Hà Tiên",
          issueDate: "2026-02-10",
          fileName: "QD-56-PheDuyetKHLCNT.pdf",
          fileSize: "2.1 MB",
          uploadedAt: "2026-02-10 14:00",
          uploadedBy: "Trần Văn Hùng",
          fileType: "pdf",
        },
      ],
      notes: "Bao gồm 3 gói thầu: Xây lắp XL-01, Giám sát TV-01, Bảo hiểm BH-01.",
    },
    {
      id: "dt-2",
      order: 2,
      code: "DT-02",
      groupCode: "DT",
      groupTitle: "Quản lý Đấu thầu & Lựa chọn nhà thầu",
      name: "Lập & Thẩm định Hồ sơ mời thầu (E-HSMT) qua Hệ thống mạng ĐTQG",
      type: "MANDATORY",
      responsibleUnit: "Tổ Quản lý Đấu thầu",
      department: "Tổ Quản lý Đấu thầu",
      assignedTo: "Trần Văn Hùng",
      assignedToId: "ST-017",
      assignedBy: "Trần Văn Hùng",
      assignedAt: "2026-02-11",
      submissionStatus: "APPROVED",
      submittedBy: "Trần Văn Hùng",
      submittedAt: "2026-02-25",
      approvedBy: "Trần Văn Hùng",
      approvedAt: "2026-02-26",
      durationMargin: "10–15 ngày",
      durationDaysMin: 10,
      durationDaysMax: 15,
      isEnabled: true,
      status: "COMPLETED",
      plannedDays: 12,
      startDatePlanned: "2026-02-11",
      endDatePlanned: "2026-02-25",
      actualStartDate: "2026-02-11",
      actualEndDate: "2026-02-25",
      attachments: [
        {
          id: "DOC-DT-2",
          documentCode: "22/QĐ-BQL",
          title: "Quyết định phê duyệt E-HSMT gói thầu xây lắp",
          issuer: "BQL ĐTXD Hà Tiên",
          issueDate: "2026-02-25",
          fileName: "QD-22-PheDuyetEHSMT.pdf",
          fileSize: "3.5 MB",
          uploadedAt: "2026-02-25 15:00",
          uploadedBy: "Trần Văn Hùng",
          fileType: "pdf",
        },
      ],
      notes: "",
    },
    {
      id: "dt-3",
      order: 3,
      code: "DT-03",
      groupCode: "DT",
      groupTitle: "Quản lý Đấu thầu & Lựa chọn nhà thầu",
      name: "Phát hành E-HSMT, Mở thầu & Đánh giá Hồ sơ dự thầu (E-HSDT)",
      type: "MANDATORY",
      responsibleUnit: "Tổ Quản lý Đấu thầu",
      department: "Tổ Quản lý Đấu thầu",
      assignedTo: "Trần Văn Hùng",
      assignedToId: "ST-017",
      assignedBy: "Trần Văn Hùng",
      assignedAt: "2026-02-26",
      submissionStatus: "SUBMITTED",
      submittedBy: "Trần Văn Hùng",
      submittedAt: "2026-03-18",
      submissionNote: "Tổ chuyên gia đã hoàn thành Báo cáo đánh giá E-HSDT, đề nghị phê duyệt kết quả.",
      durationMargin: "18–25 ngày",
      durationDaysMin: 18,
      durationDaysMax: 25,
      isEnabled: true,
      status: "IN_PROGRESS",
      plannedDays: 20,
      startDatePlanned: "2026-02-26",
      endDatePlanned: "2026-03-20",
      actualStartDate: "2026-02-26",
      attachments: [
        {
          id: "DOC-DT-3",
          documentCode: "08/BC-TCG",
          title: "Báo cáo đánh giá E-HSDT gói thầu xây lắp chính",
          issuer: "Tổ chuyên gia Đấu thầu",
          issueDate: "2026-03-18",
          fileName: "BC-08-DanhGiaEHSDT.pdf",
          fileSize: "4.1 MB",
          uploadedAt: "2026-03-18 11:20",
          uploadedBy: "Trần Văn Hùng",
          fileType: "pdf",
        },
      ],
      notes: "Có 3 nhà thầu nộp E-HSDT hợp lệ qua mạng.",
    },
    {
      id: "dt-4",
      order: 4,
      code: "DT-04",
      groupCode: "DT",
      groupTitle: "Quản lý Đấu thầu & Lựa chọn nhà thầu",
      name: "Phê duyệt Kết quả lựa chọn nhà thầu & Đăng tải thông báo trúng thầu",
      type: "MANDATORY",
      responsibleUnit: "Tổ Quản lý Đấu thầu",
      department: "Tổ Quản lý Đấu thầu",
      assignedTo: "Trần Văn Hùng",
      assignedToId: "ST-017",
      assignedBy: "Trần Văn Hùng",
      assignedAt: "2026-03-21",
      submissionStatus: "PENDING_SUBMISSION",
      durationMargin: "5–7 ngày",
      durationDaysMin: 5,
      durationDaysMax: 7,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 5,
      startDatePlanned: "2026-03-21",
      endDatePlanned: "2026-03-28",
      attachments: [],
      notes: "",
    },
    {
      id: "dt-5",
      order: 5,
      code: "DT-05",
      groupCode: "DT",
      groupTitle: "Quản lý Đấu thầu & Lựa chọn nhà thầu",
      name: "Thương thảo, hoàn thiện & Ký kết hợp đồng thi công xây dựng",
      type: "MANDATORY",
      responsibleUnit: "Tổ Quản lý Đấu thầu",
      department: "Tổ Quản lý Đấu thầu",
      assignedTo: "Trần Văn Hùng",
      assignedToId: "ST-017",
      assignedBy: "Trần Văn Hùng",
      assignedAt: "2026-03-29",
      submissionStatus: "PENDING_SUBMISSION",
      durationMargin: "7–10 ngày",
      durationDaysMin: 7,
      durationDaysMax: 10,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 7,
      startDatePlanned: "2026-03-29",
      endDatePlanned: "2026-04-08",
      attachments: [],
      notes: "",
    },
  ];
}

/**
 * 4. Quy trình Tổ Bồi thường – GPMB – TĐC (BT)
 */
export function createGpmbSteps(): ProcedureStep[] {
  return [
    {
      id: "bt-1",
      order: 1,
      code: "BT-01",
      groupCode: "BT",
      groupTitle: "Bồi thường & Giải phóng mặt bằng",
      name: "Thông báo thu hồi đất & Ban hành Kế hoạch điều tra, khảo sát, đo đạc",
      type: "MANDATORY",
      responsibleUnit: "Tổ Bồi thường – GPMB – TĐC",
      department: "Tổ Bồi thường – GPMB – TĐC",
      assignedTo: "Phạm Quốc Bảo",
      assignedToId: "ST-014",
      assignedBy: "Phạm Quốc Bảo",
      assignedAt: "2026-01-05",
      submissionStatus: "APPROVED",
      submittedBy: "Phạm Quốc Bảo",
      submittedAt: "2026-01-15",
      approvedBy: "Phạm Quốc Bảo",
      approvedAt: "2026-01-16",
      durationMargin: "10–15 ngày",
      durationDaysMin: 10,
      durationDaysMax: 15,
      isEnabled: true,
      status: "COMPLETED",
      plannedDays: 10,
      startDatePlanned: "2026-01-05",
      endDatePlanned: "2026-01-15",
      actualStartDate: "2026-01-05",
      actualEndDate: "2026-01-15",
      attachments: [
        {
          id: "DOC-BT-1",
          documentCode: "08/TB-UBND",
          title: "Thông báo thu hồi đất để thực hiện dự án",
          issuer: "UBND TP Hà Tiên",
          issueDate: "2026-01-15",
          fileName: "TB-08-ThuHoiDat.pdf",
          fileSize: "1.7 MB",
          uploadedAt: "2026-01-15 09:30",
          uploadedBy: "Phạm Quốc Bảo",
          fileType: "pdf",
        },
      ],
      notes: "Đã niêm yết công khai tại UBND phường và trụ sở khu phố.",
    },
    {
      id: "bt-2",
      order: 2,
      code: "BT-02",
      groupCode: "BT",
      groupTitle: "Bồi thường & Giải phóng mặt bằng",
      name: "Điều tra, đo đạc, kiểm đếm hiện trạng nhà đất và tài sản gắn liền với đất",
      type: "MANDATORY",
      responsibleUnit: "Tổ Bồi thường – GPMB – TĐC",
      department: "Tổ Bồi thường – GPMB – TĐC",
      assignedTo: "Huỳnh Văn Tài",
      assignedToId: "ST-015",
      assignedBy: "Phạm Quốc Bảo",
      assignedAt: "2026-01-16",
      submissionStatus: "SUBMITTED",
      submittedBy: "Huỳnh Văn Tài",
      submittedAt: "2026-02-28",
      submissionNote: "Đã hoàn thành kiểm đếm 89/89 hộ dân trong phạm vi hướng tuyến dự án.",
      durationMargin: "30–45 ngày",
      durationDaysMin: 30,
      durationDaysMax: 45,
      isEnabled: true,
      status: "IN_PROGRESS",
      plannedDays: 40,
      startDatePlanned: "2026-01-16",
      endDatePlanned: "2026-03-01",
      actualStartDate: "2026-01-16",
      attachments: [
        {
          id: "DOC-BT-2",
          documentCode: "15/BB-KDHT",
          title: "Biên bản tổng hợp kết quả điều tra, đo đạc, kiểm đếm hiện trạng 89 hộ",
          issuer: "Tổ Bồi thường – GPMB",
          issueDate: "2026-02-28",
          fileName: "BB-15-TongHopKiemDem-89Ho.pdf",
          fileSize: "5.2 MB",
          uploadedAt: "2026-02-28 17:00",
          uploadedBy: "Huỳnh Văn Tài",
          fileType: "pdf",
        },
      ],
      notes: "89 hộ dân đã ký biên bản xác nhận khối lượng tài sản.",
    },
    {
      id: "bt-3",
      order: 3,
      code: "BT-03",
      groupCode: "BT",
      groupTitle: "Bồi thường & Giải phóng mặt bằng",
      name: "Lập, niêm yết công khai & lấy ý kiến nhân dân về Dự thảo phương án bồi thường",
      type: "MANDATORY",
      responsibleUnit: "Tổ Bồi thường – GPMB – TĐC",
      department: "Tổ Bồi thường – GPMB – TĐC",
      assignedTo: "Đỗ Thị Thanh",
      assignedToId: "ST-016",
      assignedBy: "Phạm Quốc Bảo",
      assignedAt: "2026-03-02",
      submissionStatus: "PENDING_SUBMISSION",
      durationMargin: "20–30 ngày",
      durationDaysMin: 20,
      durationDaysMax: 30,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 20,
      startDatePlanned: "2026-03-02",
      endDatePlanned: "2026-03-25",
      attachments: [],
      notes: "",
    },
    {
      id: "bt-4",
      order: 4,
      code: "BT-04",
      groupCode: "BT",
      groupTitle: "Bồi thường & Giải phóng mặt bằng",
      name: "Thẩm định & Trình phê duyệt Phương án bồi thường, hỗ trợ, tái định cư",
      type: "MANDATORY",
      responsibleUnit: "Tổ Bồi thường – GPMB – TĐC",
      department: "Tổ Bồi thường – GPMB – TĐC",
      assignedTo: "Phạm Quốc Bảo",
      assignedToId: "ST-014",
      assignedBy: "Phạm Quốc Bảo",
      assignedAt: "2026-03-26",
      submissionStatus: "PENDING_SUBMISSION",
      durationMargin: "15–20 ngày",
      durationDaysMin: 15,
      durationDaysMax: 20,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 15,
      startDatePlanned: "2026-03-26",
      endDatePlanned: "2026-04-15",
      attachments: [],
      notes: "",
    },
    {
      id: "bt-5",
      order: 5,
      code: "BT-05",
      groupCode: "BT",
      groupTitle: "Bồi thường & Giải phóng mặt bằng",
      name: "Chi trả tiền bồi thường, hỗ trợ & Bốc thăm giao đất tái định cư",
      type: "MANDATORY",
      responsibleUnit: "Tổ Bồi thường – GPMB – TĐC",
      department: "Tổ Bồi thường – GPMB – TĐC",
      assignedTo: "Huỳnh Văn Tài",
      assignedToId: "ST-015",
      assignedBy: "Phạm Quốc Bảo",
      assignedAt: "2026-04-16",
      submissionStatus: "PENDING_SUBMISSION",
      durationMargin: "20–30 ngày",
      durationDaysMin: 20,
      durationDaysMax: 30,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 20,
      startDatePlanned: "2026-04-16",
      endDatePlanned: "2026-05-10",
      attachments: [],
      notes: "",
    },
    {
      id: "bt-6",
      order: 6,
      code: "BT-06",
      groupCode: "BT",
      groupTitle: "Bồi thường & Giải phóng mặt bằng",
      name: "Nghiệm thu bàn giao mặt bằng sạch cho Đơn vị thi công",
      type: "MANDATORY",
      responsibleUnit: "Tổ Bồi thường – GPMB – TĐC",
      department: "Tổ Bồi thường – GPMB – TĐC",
      assignedTo: "Phạm Quốc Bảo",
      assignedToId: "ST-014",
      assignedBy: "Phạm Quốc Bảo",
      assignedAt: "2026-05-11",
      submissionStatus: "PENDING_SUBMISSION",
      durationMargin: "5–7 ngày",
      durationDaysMin: 5,
      durationDaysMax: 7,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 5,
      startDatePlanned: "2026-05-11",
      endDatePlanned: "2026-05-20",
      attachments: [],
      notes: "",
    },
  ];
}

/**
 * 5. Quy trình Tổ Hành chính – Tổng hợp (HCTH / Tài chính)
 */
export function createHcthSteps(): ProcedureStep[] {
  return [
    {
      id: "hcth-1",
      order: 1,
      code: "TC-01",
      groupCode: "HCTH",
      groupTitle: "Tài chính & Quyết toán dự án",
      name: "Mở tài khoản dự án & Đăng ký chữ ký kiểm soát tại Kho bạc Nhà nước",
      type: "MANDATORY",
      responsibleUnit: "Tổ Hành chính – Tổng hợp",
      department: "Tổ Hành chính – Tổng hợp",
      assignedTo: "Đặng Thị Kim Ngân",
      assignedToId: "ST-009",
      assignedBy: "Đặng Thị Kim Ngân",
      assignedAt: "2026-01-10",
      submissionStatus: "APPROVED",
      submittedBy: "Đặng Thị Kim Ngân",
      submittedAt: "2026-01-14",
      approvedBy: "Đặng Thị Kim Ngân",
      approvedAt: "2026-01-15",
      durationMargin: "3–5 ngày",
      durationDaysMin: 3,
      durationDaysMax: 5,
      isEnabled: true,
      status: "COMPLETED",
      plannedDays: 3,
      startDatePlanned: "2026-01-10",
      endDatePlanned: "2026-01-15",
      actualStartDate: "2026-01-10",
      actualEndDate: "2026-01-14",
      attachments: [
        {
          id: "DOC-TC-1",
          documentCode: "01/ĐK-KBNN",
          title: "Giấy đăng ký thông tin mở tài khoản vốn đầu tư công tại KBNN Hà Tiên",
          issuer: "Kho bạc Nhà nước Hà Tiên",
          issueDate: "2026-01-14",
          fileName: "DK-01-MoTaiKhoanKBNN.pdf",
          fileSize: "1.2 MB",
          uploadedAt: "2026-01-14 11:00",
          uploadedBy: "Đặng Thị Kim Ngân",
          fileType: "pdf",
        },
      ],
      notes: "",
    },
    {
      id: "hcth-2",
      order: 2,
      code: "TC-02",
      groupCode: "HCTH",
      groupTitle: "Tài chính & Quyết toán dự án",
      name: "Kiểm soát hồ sơ tạm ứng và thanh toán khối lượng xây lắp hoàn thành",
      type: "MANDATORY",
      responsibleUnit: "Tổ Hành chính – Tổng hợp",
      department: "Tổ Hành chính – Tổng hợp",
      assignedTo: "Nguyễn Thị Thúy Hà",
      assignedToId: "ST-010",
      assignedBy: "Đặng Thị Kim Ngân",
      assignedAt: "2026-01-16",
      submissionStatus: "SUBMITTED",
      submittedBy: "Nguyễn Thị Thúy Hà",
      submittedAt: "2026-03-10",
      submissionNote: "Đã hoàn thành kiểm soát hồ sơ tạm ứng đợt 1 gửi KBNN.",
      durationMargin: "Theo tiến độ HĐ",
      durationDaysMin: 5,
      durationDaysMax: 10,
      isEnabled: true,
      status: "IN_PROGRESS",
      plannedDays: 10,
      startDatePlanned: "2026-01-16",
      endDatePlanned: "2026-03-15",
      actualStartDate: "2026-01-16",
      attachments: [
        {
          id: "DOC-TC-2",
          documentCode: "04a/TT-KBNN",
          title: "Giấy đề nghị thanh toán vốn đầu tư công đợt 1",
          issuer: "BQL ĐTXD Hà Tiên",
          issueDate: "2026-03-10",
          fileName: "DeNghiThanhToan-Dot1.pdf",
          fileSize: "2.3 MB",
          uploadedAt: "2026-03-10 14:00",
          uploadedBy: "Nguyễn Thị Thúy Hà",
          fileType: "pdf",
        },
      ],
      notes: "",
    },
    {
      id: "hcth-3",
      order: 3,
      code: "TC-03",
      groupCode: "HCTH",
      groupTitle: "Tài chính & Quyết toán dự án",
      name: "Lập Báo cáo quyết toán vốn đầu tư dự án hoàn thành theo Thông tư 96/2021/TT-BTC",
      type: "MANDATORY",
      responsibleUnit: "Tổ Hành chính – Tổng hợp",
      department: "Tổ Hành chính – Tổng hợp",
      assignedTo: "Lê Thị Hồng",
      assignedToId: "ST-011",
      assignedBy: "Đặng Thị Kim Ngân",
      assignedAt: "2026-07-01",
      submissionStatus: "PENDING_SUBMISSION",
      durationMargin: "30–60 ngày",
      durationDaysMin: 30,
      durationDaysMax: 60,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 45,
      startDatePlanned: "2026-07-01",
      endDatePlanned: "2026-08-15",
      attachments: [],
      notes: "",
    },
    {
      id: "hcth-4",
      order: 4,
      code: "TC-04",
      groupCode: "HCTH",
      groupTitle: "Tài chính & Quyết toán dự án",
      name: "Thuê Kiểm toán độc lập kiểm toán Báo cáo quyết toán vốn đầu tư",
      type: "MANDATORY",
      responsibleUnit: "Tổ Hành chính – Tổng hợp",
      department: "Tổ Hành chính – Tổng hợp",
      assignedTo: "Đặng Thị Kim Ngân",
      assignedToId: "ST-009",
      assignedBy: "Đặng Thị Kim Ngân",
      assignedAt: "2026-08-16",
      submissionStatus: "PENDING_SUBMISSION",
      durationMargin: "20–30 ngày",
      durationDaysMin: 20,
      durationDaysMax: 30,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 20,
      startDatePlanned: "2026-08-16",
      endDatePlanned: "2026-09-10",
      attachments: [],
      notes: "",
    },
    {
      id: "hcth-5",
      order: 5,
      code: "TC-05",
      groupCode: "HCTH",
      groupTitle: "Tài chính & Quyết toán dự án",
      name: "Trình Sở Tài chính phê duyệt quyết toán vốn & Tất toán tài khoản KBNN",
      type: "MANDATORY",
      responsibleUnit: "Tổ Hành chính – Tổng hợp",
      department: "Tổ Hành chính – Tổng hợp",
      assignedTo: "Đặng Thị Kim Ngân",
      assignedToId: "ST-009",
      assignedBy: "Đặng Thị Kim Ngân",
      assignedAt: "2026-09-11",
      submissionStatus: "PENDING_SUBMISSION",
      durationMargin: "15–30 ngày",
      durationDaysMin: 15,
      durationDaysMax: 30,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 20,
      startDatePlanned: "2026-09-11",
      endDatePlanned: "2026-10-05",
      attachments: [],
      notes: "",
    },
  ];
}

/**
 * Danh mục quy trình mẫu chuẩn theo từng phòng ban
 */
export const DEPARTMENT_PROCEDURE_TEMPLATES: Record<string, DepartmentTemplate> = {
  "Tổ Giám sát – Kỹ thuật": {
    id: "template-gskt",
    department: "Tổ Giám sát – Kỹ thuật",
    name: "Quy trình Giám sát thi công & Nghiệm thu công trình",
    shortName: "Quy trình GSKT (6 bước)",
    description: "Thủ tục bàn giao mặt bằng, kiểm tra biện pháp thi công, giám sát ngầm/thân và nghiệm thu hoàn thành đưa vào sử dụng.",
    badge: "6 bước",
    tagColor: "teal",
    createSteps: createGsktSteps,
  },
  "Tổ Kế hoạch – Kỹ thuật": {
    id: "template-khkt",
    department: "Tổ Kế hoạch – Kỹ thuật",
    name: "Quy trình Chuẩn bị đầu tư & Thẩm định thiết kế",
    shortName: "Quy trình KHKT (4 bước)",
    description: "Lập BCNCKT, thỏa thuận PCCC - Môi trường, thẩm định bản vẽ thi công và phê duyệt dự án.",
    badge: "4 bước",
    tagColor: "blue",
    createSteps: createKhktSteps,
  },
  "Tổ Quản lý Đấu thầu": {
    id: "template-dauthau",
    department: "Tổ Quản lý Đấu thầu",
    name: "Quy trình Quản lý Đấu thầu & Lựa chọn nhà thầu qua mạng",
    shortName: "Quy trình Đấu thầu (5 bước)",
    description: "Kế hoạch LCNT, lập E-HSMT, mở thầu & đánh giá E-HSDT, ký kết hợp đồng.",
    badge: "5 bước",
    tagColor: "purple",
    createSteps: createDauthauSteps,
  },
  "Tổ Bồi thường – GPMB – TĐC": {
    id: "template-gpmb",
    department: "Tổ Bồi thường – GPMB – TĐC",
    name: "Quy trình Bồi thường, Hỗ trợ & Giải phóng mặt bằng",
    shortName: "Quy trình GPMB (6 bước)",
    description: "Thông báo thu hồi đất, kiểm đếm hiện trạng 89 hộ, phê duyệt phương án bồi thường, chi trả và bàn giao mặt bằng sạch.",
    badge: "6 bước",
    tagColor: "red",
    createSteps: createGpmbSteps,
  },
  "Tổ Hành chính – Tổng hợp": {
    id: "template-hcth",
    department: "Tổ Hành chính – Tổng hợp",
    name: "Quy trình Kiểm soát Tài chính & Quyết toán dự án KBNN",
    shortName: "Quy trình Tài chính (5 bước)",
    description: "Mở tài khoản KBNN, kiểm soát tạm ứng/giải ngân A-B, kiểm toán độc lập và tất toán dự án hoàn thành.",
    badge: "5 bước",
    tagColor: "amber",
    createSteps: createHcthSteps,
  },
};

/**
 * Lấy danh sách thành viên thuộc phòng ban
 */
export function getDepartmentStaff(deptName?: string) {
  let allStaff = PERSONNEL_MOCK_DATA.staff;
  let allTeams = PERSONNEL_MOCK_DATA.teams;
  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem("cipm_personnel_test_flow_v9") || window.localStorage.getItem("cipm_personnel_test_flow_v8");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.staff) && parsed.staff.length > 0) {
          allStaff = parsed.staff;
        }
        if (Array.isArray(parsed.teams) && parsed.teams.length > 0) {
          allTeams = parsed.teams;
        }
      }
    } catch {}
  }
  if (!deptName) return allStaff;
  const target = deptName.toLowerCase();

  // Tìm teamId tương ứng
  const team = allTeams.find(
    (t) =>
      t.name.toLowerCase() === target ||
      t.id.toLowerCase() === target ||
      t.name.toLowerCase().includes(target) ||
      target.includes(t.name.toLowerCase()) ||
      (target.includes("giám sát") && t.id === "GSKT") ||
      (target.includes("kế hoạch") && t.id === "KHKT") ||
      (target.includes("đấu thầu") && t.id === "DT") ||
      (target.includes("bồi thường") && t.id === "BT") ||
      (target.includes("gpmb") && t.id === "BT") ||
      (target.includes("hành chính") && t.id === "HCTH")
  );

  if (team) {
    return allStaff.filter((s) => s.teamId === team.id);
  }

  // Fallback match theo teamId nếu deptName là code
  return allStaff.filter(
    (s) => s.teamId.toLowerCase() === target || s.title.toLowerCase().includes(target)
  );
}

/**
 * Chuẩn hóa mã phòng ban để đối sánh chính xác:
 * - GSKT: Tổ Giám sát – Kỹ thuật
 * - KHKT: Tổ Kế hoạch – Kỹ thuật
 * - BT: Tổ Bồi thường – GPMB – TĐC
 * - DT: Tổ Quản lý Đấu thầu
 * - HCTH: Tổ Hành chính – Tổng hợp
 */
export function getDepartmentCode(dept?: string): string {
  if (!dept) return "";
  const d = dept.trim().toLowerCase();
  if (d === "gskt" || d.includes("giám sát")) return "GSKT";
  if (d === "khkt" || d.includes("kế hoạch")) return "KHKT";
  if (d === "bt" || d.includes("bồi thường") || d.includes("gpmb") || d.includes("tđc")) return "BT";
  if (d === "dt" || d.includes("đấu thầu")) return "DT";
  if (d === "hcth" || d.includes("hành chính") || d.includes("tổng hợp")) return "HCTH";
  return d;
}

/**
 * Kiểm tra xem 2 chuỗi tên phòng ban có đại diện cho cùng một phòng ban hay không.
 * Đảm bảo "Tổ Giám sát – Kỹ thuật" và "Tổ Kế hoạch – Kỹ thuật" luôn được phân biệt độc lập (KHÔNG bị trùng lặp vì chữ "kỹ thuật").
 */
export function isSameDepartment(deptA?: string, deptB?: string): boolean {
  if (!deptA || !deptB) return false;
  if (deptA === deptB) return true;
  const a = deptA.trim().toLowerCase();
  const b = deptB.trim().toLowerCase();
  if (a === b) return true;
  const codeA = getDepartmentCode(deptA);
  const codeB = getDepartmentCode(deptB);
  if (codeA && codeB && codeA === codeB) return true;
  return false;
}

/**
 * Kiểm tra xem user có phải là Lead của phòng ban chỉ định không
 */
export function isLeadOfDepartment(user: any, deptName?: string): boolean {
  if (!user) return false;
  // Ban Giám đốc không phải là Lead phòng ban
  if (user.roleCode === "ADMIN" || user.roleCode === "DEPUTY_DIRECTOR") return false;

  const uName = (user.displayName || user.name || "").trim().toLowerCase();
  const uRole = (user.roleCode || "").toUpperCase();

  // Kiểm tra cờ isLead hoặc tên/chức danh
  const isLeadUser =
    Boolean(user.isLead) ||
    uRole.includes("LEAD") ||
    uName.includes("minh") ||
    uName.includes("phước") ||
    uName.includes("hùng") ||
    uName.includes("bảo") ||
    uName.includes("phương") ||
    uName.includes("ngân");

  if (!isLeadUser) return false;

  if (!deptName) return true;

  return isSameDepartment(user.department, deptName);
}

/**
 * Kiểm tra xem user có phải là Ban Giám đốc (Giám đốc / Phó Giám đốc)
 */
export function isDirectorUser(user: any): boolean {
  if (!user) return false;
  const role = (user.roleCode || user.role || "").toUpperCase();
  const dept = (user.department || "").toLowerCase();
  return role === "ADMIN" || role === "DEPUTY_DIRECTOR" || dept.includes("giám đốc");
}

