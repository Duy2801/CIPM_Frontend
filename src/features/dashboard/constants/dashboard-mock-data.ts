export interface KpiCardData {
  totalProjects: number;
  ongoingProjects: number;
  newProjects: number;

  disbursedAmount: number;
  plannedAmount: number;
  disbursementRate: number;

  delayedProjects: number;
  criticalDelayed: number;
  delayedNote: string;

  completedProjects: number;
  warrantyProjects: number;

  gpmbRate: number;
  gpmbRemainingHouseholds: number;
  gpmbHandedOver: number;
  gpmbTotal: number;
  gpmbDialogNeeded: number;
}

export interface QuarterlyData {
  quarter: string;
  plan: number;
  actual: number;
  isCurrent?: boolean;
}

export interface UrgentTask {
  id: string;
  title: string;
  badge: string;
  badgeColor: "danger" | "warning" | "info" | "success";
  description: string;
  department: string;
  actionText: string;
  actionColor: "danger" | "warning" | "info" | "brand";
  targetUrl: string;
}

export interface ActivityItem {
  id: string;
  time: string;
  actor: string;
  actorTitle?: string;
  actorDepartment?: string;
  actorRoleInProject?: string;
  actorPhone?: string;
  actorEmail?: string;
  projectId?: string;
  projectCode?: string;
  projectName?: string;
  projectStage?: string;
  projectLocation?: string;
  packageItem?: string;
  actionType?: string;
  status?: string;
  content: string;
  detailUrl?: string;
  detailData?: {
    docNumber?: string;
    docDate?: string;
    value?: string;
    note?: string;
    nextStep?: string;
  };
}

export const mockKpiData: KpiCardData = {
  totalProjects: 48,
  ongoingProjects: 32,
  newProjects: 16,

  disbursedAmount: 418.5,
  plannedAmount: 650.0,
  disbursementRate: 64.4,

  delayedProjects: 5,
  criticalDelayed: 2,
  delayedNote: "Cần xử lý bù tiến độ ngay trong tháng 6",

  completedProjects: 12,
  warrantyProjects: 5,

  gpmbRate: 100,
  gpmbRemainingHouseholds: 57,
  gpmbHandedOver: 685,
  gpmbTotal: 742,
  gpmbDialogNeeded: 12,
};

export const mockQuarterlyData: QuarterlyData[] = [
  { quarter: "Quý 1", plan: 145, actual: 158 },
  { quarter: "Quý 2 (HT)", plan: 180, actual: 175, isCurrent: true },
  { quarter: "Quý 3", plan: 190, actual: 76.5 },
  { quarter: "Quý 4", plan: 150, actual: 0 },
];

export const mockUrgentTasks: UrgentTask[] = [
  {
    id: "TSK-01",
    title: "Kè bảo vệ bờ biển phường Pháo Đài",
    badge: "Chậm 42 ngày",
    badgeColor: "danger",
    description: "Nhà thầu thiếu hụt nguồn đá hộc san lấp tại mỏ Kiên Lương. Ảnh hưởng đoạn kè K0+800.",
    department: "Tổ Kỹ thuật & Giám sát",
    actionText: "Xử lý ngay",
    actionColor: "danger",
    targetUrl: "/projects_works",
  },
  {
    id: "TSK-02",
    title: "Gói thầu XL-02 Đường ven biển",
    badge: "Quá hạn 14 ngày",
    badgeColor: "warning",
    description: "Hồ sơ nghiệm thu đợt 2 chưa giải ngân thanh toán với số tiền 18.4 tỷ đồng tại Kho bạc.",
    department: "Phòng Kế hoạch - Tài chính",
    actionText: "Xử lý ngay",
    actionColor: "warning",
    targetUrl: "/finance-settlement",
  },
  {
    id: "TSK-03",
    title: "GPMB Khu dân cư phường Pháo Đài",
    badge: "Hạn chót 28/06",
    badgeColor: "info",
    description: "Còn 02 hộ dân chưa đồng thuận nhận tiền bồi thường đợt cuối, cần tổ chức đối thoại trực tiếp.",
    department: "Tổ Công tác GPMB",
    actionText: "Xử lý ngay",
    actionColor: "info",
    targetUrl: "/site-clearance-resettlement",
  },
  {
    id: "TSK-04",
    title: "Cầu Tô Châu (Nhánh nâng cấp)",
    badge: "Còn 28 ngày",
    badgeColor: "success",
    description: "Sắp hết thời hạn bảo hành công trình, cần tổ chức đoàn kiểm tra hiện trường để hoàn tất hồ sơ quyết toán.",
    department: "Tổ Kỹ thuật & Nghiệm thu",
    actionText: "Xử lý ngay",
    actionColor: "brand",
    targetUrl: "/warranty-maintenance",
  },
  {
    id: "TSK-05",
    title: "Khu tái định cư Bình San",
    badge: "Hạn chót 05/07",
    badgeColor: "info",
    description: "Tổ chức bốc thăm phân lô và nhận bàn giao nền đất đợt 1 cho 18 hộ dân.",
    department: "Tổ Công tác GPMB",
    actionText: "Xử lý ngay",
    actionColor: "info",
    targetUrl: "/site-clearance-resettlement",
  },
  {
    id: "TSK-06",
    title: "Trường Mầm non Pháo Đài",
    badge: "Chậm 7 ngày",
    badgeColor: "danger",
    description: "Nhà thầu chưa nộp kết quả thí nghiệm nén mẫu bê tông dầm sàn tầng 2.",
    department: "Tổ Kỹ thuật & Giám sát",
    actionText: "Xử lý ngay",
    actionColor: "danger",
    targetUrl: "/projects_works",
  },
];

const rawMockActivities: ActivityItem[] = [
  {
    id: "ACT-01",
    time: "14:15 hôm nay",
    actor: "Lê Hồng Đức",
    actorTitle: "Kỹ sư giám sát kỹ thuật",
    actorDepartment: "Tổ Giám sát – Kỹ thuật (GSKT)",
    actorRoleInProject: "Kỹ sư giám sát hiện trường",
    actorPhone: "0907.345.xxx",
    actorEmail: "duc.lh@hatien.gov.vn",
    projectId: "PRJ-001",
    projectCode: "BQL-DA-2026-001",
    projectName: "Kè bảo vệ bờ biển phường Pháo Đài (Đoạn xung yếu)",
    projectStage: "Đang thi công",
    projectLocation: "Phường Pháo Đài, TP. Hà Tiên",
    packageItem: "Gói thầu XL-01 · Hạng mục Cọc khoan nhồi kè phía Nam",
    actionType: "Cập nhật tiến độ & Nghiệm thu",
    status: "Đã hoàn thành",
    content: "Cập nhật khối lượng thi công cọc kè Pháo Đài đạt 92% khối lượng hợp đồng.",
    detailData: {
      docNumber: "NKGS-2026/08",
      docDate: "06/10/2026",
      value: "Đạt 92% hợp đồng",
      note: "Đã hoàn thành 184/200 cọc khoan nhồi, chuẩn bị đổ bê tông dầm mũ.",
      nextStep: "Kiểm tra cao độ cốt thép dầm mũ phân đoạn K0+500 trước 16:00 ngày mai.",
    },
  },
  {
    id: "ACT-02",
    time: "13:48 hôm nay",
    actor: "Trần Thị Mỹ Linh",
    actorTitle: "Kế toán viên",
    actorDepartment: "Phòng Kế hoạch – Tài chính (HCTH)",
    actorRoleInProject: "Cán bộ thẩm tra hồ sơ thanh toán",
    actorPhone: "0977.123.xxx",
    actorEmail: "linh.ttm@hatien.gov.vn",
    projectId: "PRJ-002",
    projectCode: "BQL-DA-2026-002",
    projectName: "Tuyến đường ven biển phường Pháo Đài (Gói XL-02)",
    projectStage: "Đang thi công",
    projectLocation: "Phường Pháo Đài, TP. Hà Tiên",
    packageItem: "Gói thầu XL-02 · Cầu & Đường dẫn ven biển",
    actionType: "Thẩm định tạm ứng",
    status: "Chờ phê duyệt",
    content: "Trình ký hồ sơ tạm ứng hợp đồng đợt 2 dự án Tuyến đường ven biển Pháo Đài (Số tiền: 8.2 tỷ VNĐ).",
    detailData: {
      docNumber: "TTr-TU-42/BQL",
      docDate: "06/10/2026",
      value: "8.2 tỷ VNĐ",
      note: "Hồ sơ bảo lãnh tạm ứng của Ngân hàng BIDV Kiên Giang đã được thẩm tra hợp lệ.",
      nextStep: "Trình Lãnh đạo Ban ký duyệt Lệnh chi tiền gửi Kho bạc Nhà nước.",
    },
  },
  {
    id: "ACT-03",
    time: "11:20 hôm nay",
    actor: "Phạm Quốc Tuấn",
    actorTitle: "Chuyên viên bồi thường GPMB",
    actorDepartment: "Tổ Bồi thường – GPMB – TĐC",
    actorRoleInProject: "Cán bộ chủ trì chi trả bồi thường",
    actorPhone: "0945.678.xxx",
    actorEmail: "tuan.pq@hatien.gov.vn",
    projectId: "PRJ-003",
    projectCode: "BQL-DA-2026-003",
    projectName: "Khu dân cư và tuyến tránh phường Đông Hồ",
    projectStage: "Giai đoạn GPMB",
    projectLocation: "Phường Đông Hồ, TP. Hà Tiên",
    packageItem: "Tiểu dự án GPMB & Hỗ trợ tái định cư",
    actionType: "Bồi thường GPMB",
    status: "Đã hoàn thành",
    content: "Hoàn tất biên bản chi trả tiền bồi thường đợt 4 cho 15 hộ dân phường Đông Hồ (12.6 tỷ VNĐ).",
    detailData: {
      docNumber: "BB-CT-15/GPMB",
      docDate: "06/10/2026",
      value: "12.6 tỷ VNĐ (15 hộ dân)",
      note: "15/15 hộ dân đã ký biên bản bàn giao mặt bằng sạch đoạn Km2+100.",
      nextStep: "Bàn giao cọc mốc mặt bằng sạch cho đơn vị thi công trước ngày 15/10/2026.",
    },
  },
  {
    id: "ACT-04",
    time: "10:05 hôm nay",
    actor: "Nguyễn Văn An",
    actorTitle: "Phó Giám đốc Ban QLDA",
    actorDepartment: "Ban Giám đốc (BGD)",
    actorRoleInProject: "Lãnh đạo phụ trách phê duyệt dự án",
    actorPhone: "0913.888.xxx",
    actorEmail: "an.nv@hatien.gov.vn",
    projectId: "PRJ-004",
    projectCode: "BQL-DA-2026-004",
    projectName: "Hạ tầng kỹ thuật du lịch TP. Hà Tiên",
    projectStage: "Lựa chọn nhà thầu",
    projectLocation: "Khu du lịch Mũi Nai, TP. Hà Tiên",
    packageItem: "Gói thầu TVGS-01 · Tư vấn giám sát thi công",
    actionType: "Phê duyệt KHLCNT",
    status: "Đã phê duyệt",
    content: "Ký số điện tử phê duyệt KHLCNT gói TVGS dự án Hạ tầng kỹ thuật du lịch Hà Tiên.",
    detailData: {
      docNumber: "QĐ-188/QĐ-BQL",
      docDate: "06/10/2026",
      value: "1.45 tỷ VNĐ",
      note: "Hình thức đấu thầu rộng rãi qua mạng theo Luật Đấu thầu 2023.",
      nextStep: "Phát hành E-HSMT trên Hệ thống Mạng đấu thầu Quốc gia trong vòng 24h.",
    },
  },
  {
    id: "ACT-05",
    time: "08:30 hôm nay",
    actor: "Hoàng Minh Trí",
    content: "Kiểm tra hiện trường xử lý sạt lở tạm tuyến đường ven biển đoạn K3+200.",
    detailData: {
      docNumber: "BB-HT-03/KT",
      note: "Nhà thầu đã rào chắn cảnh báo và huy động máy xúc gia cố cọc cừ.",
    },
  },
  {
    id: "ACT-06",
    time: "16:45 hôm qua",
    actor: "Lê Hồng Đức",
    content: "Phát hành văn bản đôn đốc tiến độ thi công đối với Liên danh nhà thầu gói XL-01.",
    detailData: {
      docNumber: "CV-204/BQL-DA",
      note: "Yêu cầu tăng ca thi công ban đêm để bù đắp khối lượng chậm 12 ngày.",
    },
  },
  {
    id: "ACT-07",
    time: "15:20 hôm qua",
    actor: "Trần Thị Mỹ Linh",
    content: "Hoàn tất đối chiếu số liệu giải ngân tháng 5 với Kho bạc Nhà nước Hà Tiên.",
    detailData: {
      docNumber: "BK-ĐC-05/KB",
      value: "48.2 tỷ VNĐ",
      note: "Khớp 100% chứng từ chi đầu tư công theo niên độ 2026.",
    },
  },
  {
    id: "ACT-08",
    time: "09:10 hôm qua",
    actor: "Phạm Quốc Tuấn",
    content: "Tổ chức họp lấy ý kiến cộng đồng dân cư về phương án bồi thường dự án mở rộng Tỉnh lộ 28.",
    detailData: {
      docNumber: "BB-HDC-08/GPMB",
      note: "42/45 hộ dân tham dự đồng thuận với khung giá đề xuất của UBND TP Hà Tiên.",
    },
  },
  {
    id: "ACT-09",
    time: "17:30 2 ngày trước",
    actor: "Đặng Quốc Bảo",
    content: "Phê duyệt điều chỉnh biện pháp tổ chức thi công đợt lũ tiểu mãn gói kè Đông Hồ.",
    detailData: {
      docNumber: "QĐ-192/QĐ-BQL",
      note: "Đảm bảo cao trình đê quây an toàn trước mực nước biển dâng.",
    },
  },
  {
    id: "ACT-10",
    time: "15:40 2 ngày trước",
    actor: "Vũ Thị Bích Ngọc",
    content: "Mở thầu qua mạng gói thầu Mua sắm thiết bị quan trắc môi trường biển.",
    detailData: {
      docNumber: "BBMT-09/ĐT",
      value: "3.8 tỷ VNĐ",
      note: "Có 03 nhà thầu nộp E-HSDT hợp lệ, đang tiến hành đánh giá E-HSDT.",
    },
  },
  {
    id: "ACT-11",
    time: "11:15 2 ngày trước",
    actor: "Nguyễn Hữu Tài",
    content: "Kiểm tra chất lượng mác bê tông đài mố cầu Tô Châu đạt yêu cầu thiết kế R28.",
    detailData: {
      docNumber: "KN-TN-88/LAS",
      note: "Mẫu nén đạt mác M350 theo quy chuẩn TCVN.",
    },
  },
  {
    id: "ACT-12",
    time: "08:20 2 ngày trước",
    actor: "Lê Hồng Đức",
    content: "Nghiệm thu công việc lắp đặt cốt thép dầm sàn tầng 2 Trường THPT Chu Văn An.",
    detailData: {
      docNumber: "BB-NT-31/KT",
      note: "Cho phép nhà thầu tiến hành đổ bê tông từ 14:00 cùng ngày.",
    },
  },
  {
    id: "ACT-13",
    time: "16:10 3 ngày trước",
    actor: "Trần Thị Mỹ Linh",
    content: "Lập phiếu đề nghị thanh toán khối lượng hoàn thành đợt 3 gói thầu XL-03.",
    detailData: {
      docNumber: "PĐN-TT-55/TC",
      value: "15.4 tỷ VNĐ",
      note: "Đã trừ khấu trừ tạm ứng theo đúng điều khoản hợp đồng.",
    },
  },
  {
    id: "ACT-14",
    time: "14:00 3 ngày trước",
    actor: "Phạm Quốc Tuấn",
    content: "Bàn giao 1.2km mặt bằng tuyến đường trục chính kết nối khu du lịch Mũi Nai.",
    detailData: {
      docNumber: "BB-BG-12/GPMB",
      note: "Toàn bộ đất nông nghiệp đã được dọn dẹp cây trồng và hoa màu.",
    },
  },
  {
    id: "ACT-15",
    time: "10:30 3 ngày trước",
    actor: "Hoàng Minh Trí",
    content: "Phát hiện vết nứt cục bộ bề mặt bê tông nhựa gói thầu đường ĐT.928.",
    detailData: {
      docNumber: "BB-KT-44/GS",
      note: "Yêu cầu nhà thầu cào bóc và thảm lại lớp bê tông nhựa C12.5 trong 48h.",
    },
  },
  {
    id: "ACT-16",
    time: "09:00 3 ngày trước",
    actor: "Nguyễn Văn An",
    content: "Chủ trì cuộc họp giao ban tuần Ban QLDA đánh giá tình hình giải ngân tháng 6.",
    detailData: {
      docNumber: "TB-KL-28/TB-BQL",
      note: "Yêu cầu tập trung tháo gỡ vướng mắc GPMB dự án kè Pháo Đài.",
    },
  },
  {
    id: "ACT-17",
    time: "16:50 4 ngày trước",
    actor: "Vũ Thị Bích Ngọc",
    content: "Phát hành hồ sơ mời thầu điện tử (E-HSMT) gói thầu Xây lắp Trạm y tế Tô Châu.",
    detailData: {
      docNumber: "TBMT-2026/045",
      value: "11.2 tỷ VNĐ",
      note: "Thời gian đóng thầu vào 09:00 ngày 15/07/2026.",
    },
  },
  {
    id: "ACT-18",
    time: "14:20 4 ngày trước",
    actor: "Lê Hồng Đức",
    content: "Kiểm tra cao độ móng cống hộp phân lưu thoát nước đường Mạc Cửu.",
    detailData: {
      docNumber: "NK-GS-102",
      note: "Sai số cao độ nằm trong giới hạn cho phép ±5mm.",
    },
  },
  {
    id: "ACT-19",
    time: "10:45 4 ngày trước",
    actor: "Trần Thị Mỹ Linh",
    content: "Đối chiếu công nợ nhà thầu thi công hạ tầng khu dân cư Bình San.",
    detailData: {
      docNumber: "BB-ĐC-19/KT",
      value: "6.7 tỷ VNĐ",
      note: "Xác nhận số dư tạm ứng còn lại 2.1 tỷ VNĐ.",
    },
  },
  {
    id: "ACT-20",
    time: "08:15 4 ngày trước",
    actor: "Đặng Quốc Bảo",
    content: "Ký lệnh khởi công công trình Nâng cấp hệ thống chiếu sáng đô thị Hà Tiên.",
    detailData: {
      docNumber: "LKC-07/BQL",
      value: "5.6 tỷ VNĐ",
      note: "Thời gian thi công 90 ngày kể từ ngày ký lệnh khởi công.",
    },
  },
  {
    id: "ACT-21",
    time: "15:30 5 ngày trước",
    actor: "Phạm Quốc Tuấn",
    content: "Giải quyết khiếu nại phương án bồi thường đất ở của hộ ông Nguyễn Văn B (P. Mỹ Đức).",
    detailData: {
      docNumber: "BB-GQ-04/TTr",
      note: "Đã giải thích căn cứ bảng giá đất 2026 của UBND tỉnh Kiên Giang, hộ dân đã đồng thuận.",
    },
  },
  {
    id: "ACT-22",
    time: "13:10 5 ngày trước",
    actor: "Nguyễn Hữu Tài",
    content: "Giám sát công tác ép cọc thử tải tĩnh dự án Nhà văn hóa thiếu nhi TP Hà Tiên.",
    detailData: {
      docNumber: "BB-TT-02/TN",
      note: "Sức chịu tải cọc đạt 120 tấn, đủ điều kiện ép cọc đại trà.",
    },
  },
  {
    id: "ACT-23",
    time: "11:00 5 ngày trước",
    actor: "Hoàng Minh Trí",
    content: "Lập biên bản vi phạm an toàn lao động tại công trường kè biển Pháo Đài.",
    detailData: {
      docNumber: "BB-VPHC-06/AT",
      note: "Nhà thầu không trang bị đầy đủ áo phao cứu sinh cho công nhân làm việc trên sàn nổi.",
    },
  },
  {
    id: "ACT-24",
    time: "09:20 5 ngày trước",
    actor: "Nguyễn Văn An",
    content: "Làm việc với Sở Giao thông Vận tải Kiên Giang về phương án đấu nối nút giao Tỉnh lộ 28.",
    detailData: {
      docNumber: "BB-LV-16/SGTVT",
      note: "Thống nhất thiết kế nút giao dạng đảo xuyến có bán kính R=25m.",
    },
  },
  {
    id: "ACT-25",
    time: "16:30 6 ngày trước",
    actor: "Lê Hồng Đức",
    content: "Nghiệm thu hoàn thành giai đoạn đào đắp nền đường K95 gói thầu XL-01.",
    detailData: {
      docNumber: "BB-NTGD-08",
      note: "Độ chặt lu lèn K đạt ≥ 0.95 trên toàn bộ chiều dài 800m.",
    },
  },
  {
    id: "ACT-26",
    time: "14:15 6 ngày trước",
    actor: "Trần Thị Mỹ Linh",
    content: "Báo cáo tổng hợp số liệu kế hoạch vốn trung hạn 2026-2030 trình UBND thành phố.",
    detailData: {
      docNumber: "BC-KH-112/BQL",
      value: "1,250 tỷ VNĐ",
      note: "Ưu tiên bố trí danh mục dự án trọng điểm động lực kinh tế biển.",
    },
  },
  {
    id: "ACT-27",
    time: "10:00 6 ngày trước",
    actor: "Vũ Thị Bích Ngọc",
    content: "Thẩm định kết quả lựa chọn nhà thầu gói thầu Tư vấn khảo sát địa chất công trình kè đảo Tiên Hải.",
    detailData: {
      docNumber: "BC-TĐ-33/ĐT",
      value: "850 triệu VNĐ",
      note: "Đơn vị trúng thầu: Viện Khoa học Công nghệ Xây dựng Miền Nam.",
    },
  },
  {
    id: "ACT-28",
    time: "08:45 6 ngày trước",
    actor: "Phạm Quốc Tuấn",
    content: "Chi trả tiền hỗ trợ di dời mồ mả phục vụ GPMB dự án đường tránh QL80.",
    detailData: {
      docNumber: "DS-CT-09/MB",
      value: "820 triệu VNĐ",
      note: "Hoàn tất di dời 36/36 ngôi mộ về nghĩa trang tập trung.",
    },
  },
  {
    id: "ACT-29",
    time: "15:50 1 tuần trước",
    actor: "Hoàng Minh Trí",
    content: "Kiểm tra công tác bảo dưỡng bê tông bản mặt cầu Pháo Đài.",
    detailData: {
      docNumber: "NK-KT-51",
      note: "Bảo dưỡng phủ bao tải ướt đảm bảo độ ẩm liên tục 7 ngày.",
    },
  },
  {
    id: "ACT-30",
    time: "13:40 1 tuần trước",
    actor: "Đặng Quốc Bảo",
    content: "Phê duyệt dự toán chi phí chuẩn bị đầu tư dự án Nạo vét luồng Ba Hòn - Hà Tiên.",
    detailData: {
      docNumber: "QĐ-175/QĐ-BQL",
      value: "2.1 tỷ VNĐ",
      note: "Nguồn vốn ngân sách tỉnh Kiên Giang bố trí đợt 1 năm 2026.",
    },
  },
  {
    id: "ACT-31",
    time: "10:20 1 tuần trước",
    actor: "Nguyễn Hữu Tài",
    content: "Kiểm định chất lượng thép xây dựng CB400 lô hàng 50 tấn tại công trường.",
    detailData: {
      docNumber: "CO-CQ-TH-12",
      note: "Cường độ chảy và giới hạn bền kéo đạt tiêu chuẩn quy định.",
    },
  },
  {
    id: "ACT-32",
    time: "08:30 1 tuần trước",
    actor: "Lê Hồng Đức",
    content: "Kiểm tra tiến độ đổ đất đắp bao đê kè sinh thái đầm Đông Hồ.",
    detailData: {
      docNumber: "BB-TD-18/KT",
      note: "Khối lượng đạt 78% kế hoạch tuần, bù tiến độ 2 ngày so với mốc cam kết.",
    },
  },
  {
    id: "ACT-33",
    time: "16:15 8 ngày trước",
    actor: "Trần Thị Mỹ Linh",
    content: "Thực hiện thủ tục thanh toán bảo lãnh thực hiện hợp đồng cho nhà thầu gói XL-04.",
    detailData: {
      docNumber: "CV-BL-40/NH",
      value: "3.2 tỷ VNĐ",
      note: "Bảo lãnh của Ngân hàng Agribank chi nhánh Hà Tiên.",
    },
  },
  {
    id: "ACT-34",
    time: "14:00 8 ngày trước",
    actor: "Nguyễn Văn An",
    content: "Ký biên bản nghiệm thu đưa vào sử dụng hạng mục san nền khu tái định cư Bình San.",
    detailData: {
      docNumber: "BB-NT-SD-05",
      note: "Bàn giao cho Trung tâm Phát triển Quỹ đất để tổ chức bốc thăm chia lô.",
    },
  },
  {
    id: "ACT-35",
    time: "11:10 8 ngày trước",
    actor: "Phạm Quốc Tuấn",
    content: "Tổ chức đo đạc trích lục địa chính bổ sung 08 thửa đất tuyến tránh đường ven biển.",
    detailData: {
      docNumber: "TL-ĐC-22/VPĐK",
      note: "Phối hợp với Văn phòng Đăng ký đất đai chi nhánh Hà Tiên.",
    },
  },
  {
    id: "ACT-36",
    time: "09:00 8 ngày trước",
    actor: "Vũ Thị Bích Ngọc",
    content: "Phê duyệt E-HSMT gói thầu Rà phá bom mìn vật nổ dự án Hồ chứa nước ngọt Tiên Hải.",
    detailData: {
      docNumber: "QĐ-168/QĐ-BQL",
      value: "1.8 tỷ VNĐ",
      note: "Chỉ định thầu theo quy định quốc phòng an ninh.",
    },
  },
  {
    id: "ACT-37",
    time: "15:45 9 ngày trước",
    actor: "Hoàng Minh Trí",
    content: "Kiểm tra vật tư ống cống bê tông D1200 trước khi hạ đặt tuyến cống đường Kim Dự.",
    detailData: {
      docNumber: "BB-NT-VT-14",
      note: "120 đốt cống kiểm tra không nứt vỡ, mác bê tông M300 đạt chuẩn.",
    },
  },
  {
    id: "ACT-38",
    time: "13:30 9 ngày trước",
    actor: "Đặng Quốc Bảo",
    content: "Họp rà soát giải quyết vướng mắc di dời đường dây trung thế 22kV dự án Tỉnh lộ 28.",
    detailData: {
      docNumber: "BB-LV-09/ĐL",
      note: "Thống nhất với Điện lực Hà Tiên lịch cắt điện thi công vào chủ nhật.",
    },
  },
  {
    id: "ACT-39",
    time: "10:15 9 ngày trước",
    actor: "Nguyễn Hữu Tài",
    content: "Lấy mẫu thí nghiệm độ ẩm và hệ số đầm chặt lu lèn lớp cấp phối đá dăm loại 1.",
    detailData: {
      docNumber: "KQ-TN-115/CP",
      note: "Đạt độ chặt K98 theo thiết kế mặt đường tải trọng nặng.",
    },
  },
  {
    id: "ACT-40",
    time: "08:10 9 ngày trước",
    actor: "Lê Hồng Đức",
    content: "Chỉ đạo xử lý hiện trường sự cố đứt cáp viễn thông ngầm trong quá trình đào hào kỹ thuật.",
    detailData: {
      docNumber: "BB-SC-01/VT",
      note: "Phối hợp VNPT khắc phục thông tuyến cáp trong 4 giờ.",
    },
  },
  {
    id: "ACT-41",
    time: "16:40 10 ngày trước",
    actor: "Trần Thị Mỹ Linh",
    content: "Giải ngân kinh phí bồi thường đợt 3 cho dự án Đường ven biển (Số tiền: 9.8 tỷ VNĐ).",
    detailData: {
      docNumber: "UNC-KB-882",
      value: "9.8 tỷ VNĐ",
      note: "Chuyển khoản trực tiếp vào tài khoản ngân hàng của 22 hộ dân.",
    },
  },
  {
    id: "ACT-42",
    time: "14:25 10 ngày trước",
    actor: "Phạm Quốc Tuấn",
    content: "Niêm yết công khai phương án dự thảo bồi thường tại trụ sở UBND phường Pháo Đài.",
    detailData: {
      docNumber: "TB-NY-03/GPMB",
      note: "Thời gian niêm yết 30 ngày theo quy định của Luật Đất đai.",
    },
  },
  {
    id: "ACT-43",
    time: "10:50 10 ngày trước",
    actor: "Vũ Thị Bích Ngọc",
    content: "Báo cáo thẩm định hồ sơ đề xuất kỹ thuật gói thầu Tư vấn thiết kế BVTC dự án Kè Mũi Nai.",
    detailData: {
      docNumber: "TTr-TĐ-82/BQL",
      value: "2.4 tỷ VNĐ",
      note: "Nhà thầu tư vấn đáp ứng đầy đủ năng lực và nhân sự chủ chốt.",
    },
  },
  {
    id: "ACT-44",
    time: "08:35 10 ngày trước",
    actor: "Nguyễn Văn An",
    content: "Ký quyết định thành lập Tổ kiểm tra nghiệm thu cơ sở các công trình chào mừng kỷ niệm thành lập thị xã.",
    detailData: {
      docNumber: "QĐ-155/QĐ-BQL",
      note: "Gồm 07 thành viên do Phó Giám đốc Đặng Quốc Bảo làm Tổ trưởng.",
    },
  },
  {
    id: "ACT-45",
    time: "15:20 11 ngày trước",
    actor: "Hoàng Minh Trí",
    content: "Kiểm tra công tác xử lý chống thấm mặt cầu bản bê tông dự án Cầu Pháo Đài.",
    detailData: {
      docNumber: "NK-GS-98",
      note: "Sử dụng vật liệu chống thấm dạng phun đàn hồi cao 2 thành phần.",
    },
  },
  {
    id: "ACT-46",
    time: "13:00 11 ngày trước",
    actor: "Lê Hồng Đức",
    content: "Nghiệm thu móng cấp phối đá dăm K98 đoạn Km1+500 đến Km2+300 Tỉnh lộ 28.",
    detailData: {
      docNumber: "BB-NT-CP-06",
      note: "Đủ điều kiện tưới nhựa dính bám chuẩn bị thảm bê tông nhựa hạt trung.",
    },
  },
  {
    id: "ACT-47",
    time: "09:40 11 ngày trước",
    actor: "Đặng Quốc Bảo",
    content: "Kiểm tra hiện trường các điểm nguy cơ ngập úng mùa mưa bão khu vực chợ Hà Tiên.",
    detailData: {
      docNumber: "BB-KT-CT-25",
      note: "Yêu cầu đơn vị thi công nạo vét khơi thông dòng chảy hố ga tạm.",
    },
  },
  {
    id: "ACT-48",
    time: "08:00 11 ngày trước",
    actor: "Trần Thị Mỹ Linh",
    content: "Hoàn thành báo cáo quyết toán vốn đầu tư dự án hoàn thành: Trụ sở làm việc BQL DA.",
    detailData: {
      docNumber: "BC-QT-01/TC",
      value: "18.5 tỷ VNĐ",
      note: "Hồ sơ gửi Sở Tài chính Kiên Giang thẩm tra theo Thông tư 96/2021/TT-BTC.",
    },
  },
];

interface ActorMeta {
  title: string;
  department: string;
  roleInProject: string;
  phone: string;
  email: string;
}

const ACTOR_PROFILES: Record<string, ActorMeta> = {
  "Lê Hồng Đức": {
    title: "Kỹ sư Giám sát hiện trường",
    department: "Tổ Giám sát – Kỹ thuật (GSKT)",
    roleInProject: "Giám sát trưởng gói thầu xây lắp",
    phone: "0907.345.891",
    email: "duc.lh@hatien.gov.vn",
  },
  "Trần Thị Mỹ Linh": {
    title: "Chuyên viên Kế toán – Tài chính",
    department: "Phòng Kế hoạch – Tài chính (HCTH)",
    roleInProject: "Phụ trách thẩm định hồ sơ giải ngân & thanh quyết toán",
    phone: "0977.123.456",
    email: "linh.ttm@hatien.gov.vn",
  },
  "Phạm Quốc Tuấn": {
    title: "Chuyên viên Giải phóng mặt bằng",
    department: "Tổ Bồi thường – GPMB – Tái định cư",
    roleInProject: "Phụ trách kiểm đếm & chi trả bồi thường GPMB",
    phone: "0945.678.902",
    email: "tuan.pq@hatien.gov.vn",
  },
  "Đặng Quốc Bảo": {
    title: "Phó Giám đốc Ban QLDA",
    department: "Ban Giám đốc BQL DA Đầu tư Xây dựng",
    roleInProject: "Lãnh đạo phụ trách khối Kỹ thuật, Thi công & Chất lượng",
    phone: "0918.234.567",
    email: "bao.dq@hatien.gov.vn",
  },
  "Nguyễn Văn An": {
    title: "Giám đốc Ban QLDA",
    department: "Ban Giám đốc BQL DA Đầu tư Xây dựng",
    roleInProject: "Chủ đầu tư / Thủ trưởng đơn vị điều hành chung",
    phone: "0913.987.654",
    email: "an.nv@hatien.gov.vn",
  },
  "Hoàng Minh Trí": {
    title: "Kỹ sư Cầu đường & Kết cấu",
    department: "Tổ Giám sát – Kỹ thuật (GSKT)",
    roleInProject: "Kỹ sư giám sát chất lượng thi công kết cấu",
    phone: "0932.889.911",
    email: "tri.hm@hatien.gov.vn",
  },
  "Võ Thành Đạt": {
    title: "Chuyên viên Kế hoạch – Đấu thầu",
    department: "Phòng Kế hoạch – Tổng hợp",
    roleInProject: "Phụ trách lập hồ sơ mời thầu & quản lý hợp đồng",
    phone: "0909.112.233",
    email: "dat.vt@hatien.gov.vn",
  },
};

function enrichActivityItem(item: ActivityItem): ActivityItem {
  const profile = ACTOR_PROFILES[item.actor] || {
    title: "Cán bộ chuyên môn",
    department: "Ban Quản lý Dự án Đầu tư Xây dựng",
    roleInProject: "Cán bộ phụ trách dự án",
    phone: "0297.385.2xxx",
    email: "bql.hatien@kiengiang.gov.vn",
  };

  const actorTitle = item.actorTitle || profile.title;
  const actorDepartment = item.actorDepartment || profile.department;
  const actorRoleInProject = item.actorRoleInProject || profile.roleInProject;
  const actorPhone = item.actorPhone || profile.phone;
  const actorEmail = item.actorEmail || profile.email;

  if (item.projectName && item.projectCode) {
    return {
      ...item,
      actorTitle,
      actorDepartment,
      actorRoleInProject,
      actorPhone,
      actorEmail,
    };
  }

  const content = item.content;
  let projectId = "PRJ-001";
  let projectCode = "BQL-DA-2026-001";
  let projectName = "Kè bảo vệ bờ biển phường Pháo Đài";
  let projectStage = "Đang thi công";
  let projectLocation = "Phường Pháo Đài, TP. Hà Tiên";
  let packageItem = "Gói thầu XL-01 · Xây lắp kè bảo vệ bờ";
  let actionType = "Kiểm tra & Giám sát hiện trường";
  let status = "Đã hoàn thành";
  let docDate = "05/10/2026";
  let nextStep = "Tiếp tục đôn đốc nhà thầu duy trì ca kíp và báo cáo nhật ký định kỳ.";

  if (content.includes("Đông Hồ") || content.includes("đầm Đông Hồ")) {
    projectId = "PRJ-003";
    projectCode = "BQL-DA-2026-003";
    projectName = "Kè chống sạt lở kết hợp đường dạo ven đầm Đông Hồ";
    projectStage = "Đang thi công";
    projectLocation = "Phường Đông Hồ, TP. Hà Tiên";
    packageItem = "Gói thầu XL-03 · Thi công tường kè & nạo vét";
  } else if (content.includes("Tô Châu") || content.includes("Cầu Tô Châu")) {
    projectId = "PRJ-004";
    projectCode = "BQL-DA-2025-018";
    projectName = "Nâng cấp, sửa chữa Cầu Tô Châu và đường hai đầu cầu";
    projectStage = "Bảo hành & Vận hành";
    projectLocation = "Phường Tô Châu, TP. Hà Tiên";
    packageItem = "Gói thầu XL-01 · Sửa chữa khe co giãn & mặt cầu";
  } else if (content.includes("Tỉnh lộ 28") || content.includes("TL28") || content.includes("đường ven biển")) {
    projectId = "PRJ-002";
    projectCode = "BQL-DA-2026-002";
    projectName = "Nâng cấp, mở rộng Tỉnh lộ 28 (Tuyến kết nối ven biển)";
    projectStage = "Đang thi công";
    projectLocation = "Xã Thuận Yên & Phường Pháo Đài, TP. Hà Tiên";
    packageItem = "Gói thầu XL-02 · Nền mặt đường và thoát nước dọc";
  } else if (content.includes("Bình San") || content.includes("Tái định cư")) {
    projectId = "PRJ-005";
    projectCode = "BQL-DA-2026-005";
    projectName = "Khu tái định cư Bình San phục vụ các dự án trọng điểm";
    projectStage = "Giải phóng mặt bằng & Hạ tầng";
    projectLocation = "Phường Bình San, TP. Hà Tiên";
    packageItem = "Hạng mục Hạ tầng kỹ thuật & San nền phân lô";
  } else if (content.includes("Trường Mầm non") || content.includes("Trường THCS")) {
    projectId = "PRJ-006";
    projectCode = "BQL-DA-2026-007";
    projectName = "Xây mới Trường Mầm non Pháo Đài đạt chuẩn quốc gia";
    projectStage = "Đang thi công hoàn thiện";
    projectLocation = "Khu phố 1, Phường Pháo Đài, TP. Hà Tiên";
    packageItem = "Gói thầu XL-01 · Xây lắp khối phòng học và hiệu bộ";
  } else if (content.includes("Mũi Nai") || content.includes("chiếu sáng")) {
    projectId = "PRJ-007";
    projectCode = "BQL-DA-2026-009";
    projectName = "Cải tạo cảnh quan và hệ thống chiếu sáng đô thị bãi tắm Mũi Nai";
    projectStage = "Đang thi công";
    projectLocation = "Khu du lịch Mũi Nai, Phường Pháo Đài, TP. Hà Tiên";
    packageItem = "Gói thầu TB-01 · Cung cấp & lắp đặt chiếu sáng cảnh quan";
  } else if (content.includes("Trụ sở làm việc") || content.includes("quyết toán")) {
    projectId = "PRJ-008";
    projectCode = "BQL-DA-2024-012";
    projectName = "Xây dựng Trụ sở làm việc Ban QLDA ĐTXD TP. Hà Tiên";
    projectStage = "Hoàn thành - Quyết toán";
    projectLocation = "Trung tâm Hành chính TP. Hà Tiên";
    packageItem = "Toàn bộ dự án hoàn thành";
  }

  // Phân loại actionType & trạng thái
  if (content.includes("Nghiệm thu") || content.includes("nghiệm thu")) {
    actionType = "Nghiệm thu kỹ thuật";
    nextStep = "Hoàn tất ký biên bản nghiệm thu và lưu hồ sơ quản lý chất lượng.";
  } else if (content.includes("tạm ứng") || content.includes("thanh toán") || content.includes("giải ngân")) {
    actionType = "Tài chính & Thanh toán";
    nextStep = "Chuyển hồ sơ kế toán kiểm soát qua hệ thống Dịch vụ công Kho bạc.";
  } else if (content.includes("bồi thường") || content.includes("GPMB") || content.includes("phương án")) {
    actionType = "Bồi thường & GPMB";
    nextStep = "Phối hợp UBND phường tổ chức chi trả hoặc niêm yết công khai phương án.";
  } else if (content.includes("Chỉ đạo") || content.includes("Giao nhiệm vụ") || content.includes("Ký quyết định")) {
    actionType = "Chỉ đạo điều hành";
    nextStep = "Giao Tổ Kỹ thuật theo dõi đôn đốc các mốc tiến độ theo quyết định.";
  } else if (content.includes("Kiểm tra") || content.includes("rà soát")) {
    actionType = "Kiểm tra hiện trường";
    nextStep = "Lập thông báo kết luận kiểm tra gửi nhà thầu thi công và tư vấn giám sát.";
  }

  if (content.includes("Chờ") || content.includes("chờ") || content.includes("Trình ký")) {
    status = "Đang xử lý";
  } else {
    status = "Đã hoàn thành";
  }

  return {
    ...item,
    actorTitle,
    actorDepartment,
    actorRoleInProject,
    actorPhone,
    actorEmail,
    projectId,
    projectCode,
    projectName,
    projectStage,
    projectLocation,
    packageItem,
    actionType,
    status,
    detailData: {
      ...item.detailData,
      docDate: item.detailData?.docDate || docDate,
      nextStep: item.detailData?.nextStep || nextStep,
    },
  };
}

export const mockActivities: ActivityItem[] = rawMockActivities.map(enrichActivityItem);

