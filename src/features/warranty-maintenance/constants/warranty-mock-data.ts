import type { WarrantyDataset } from "../types/warranty.types";

export const WARRANTY_MOCK_DATA: WarrantyDataset = {
  projects: [
    { id: "PRJ-101", code: "BQL-DA-2023-004", name: "Kè bảo vệ bờ biển Mũi Nai (giai đoạn 1)" },
    { id: "PRJ-102", code: "BQL-DA-2024-002", name: "Nâng cấp đường Mạc Thiên Tích" },
    { id: "PRJ-103", code: "BQL-DA-2024-006", name: "Trường Mầm non Hoa Sen" },
    { id: "PRJ-104", code: "BQL-DA-2024-009", name: "Cầu dân sinh kênh T4" },
    { id: "PRJ-105", code: "BQL-DA-2023-001", name: "Trụ sở khu phố Pháo Đài" },
    { id: "PRJ-106", code: "BQL-DA-2024-011", name: "Khu sạp chợ Tô Châu" },
  ],
  warranties: [
    {
      id: "WR-001", projectId: "PRJ-101", workName: "Thân kè và lan can đoạn K0+000 – K0+450",
      contractCode: "08/2023/HĐ-XL", contractor: "Công ty CP Xây dựng Kiên Giang",
      acceptanceDate: "2024-10-10", months: 24, bondValue: 1.25, bank: "VietinBank – CN Kiên Giang", bondStatus: "HOLDING",
    },
    {
      id: "WR-002", projectId: "PRJ-102", workName: "Mặt đường, vỉa hè và hệ thống thoát nước dọc",
      contractCode: "14/2024/HĐ-XL", contractor: "Công ty TNHH Cầu đường 68",
      acceptanceDate: "2025-11-20", months: 12, bondValue: 0.48, bank: "BIDV – CN Hà Tiên", bondStatus: "HOLDING",
    },
    {
      id: "WR-003", projectId: "PRJ-103", workName: "Khối lớp học 2 tầng và sân chơi",
      contractCode: "21/2024/HĐ-XL", contractor: "Công ty TNHH Xây dựng Phú Quốc",
      acceptanceDate: "2025-03-05", months: 24, bondValue: 0.36, bank: "Agribank – CN Hà Tiên", bondStatus: "HOLDING",
    },
    {
      id: "WR-004", projectId: "PRJ-104", workName: "Cầu bê tông cốt thép và đường dẫn hai đầu",
      contractCode: "31/2024/HĐ-XL", contractor: "Công ty TNHH Cầu đường 68",
      acceptanceDate: "2025-08-15", months: 12, bondValue: 0.52, bank: "BIDV – CN Hà Tiên", bondStatus: "HOLDING",
    },
    {
      id: "WR-005", projectId: "PRJ-105", workName: "Nhà làm việc 1 tầng và cổng tường rào",
      contractCode: "03/2023/HĐ-XL", contractor: "Công ty CP Xây lắp Hà Tiên",
      acceptanceDate: "2024-06-01", months: 24, bondValue: 0.15, bank: "Vietcombank – CN Kiên Giang",
      bondStatus: "RETURNED", bondClosedAt: "2026-06-20",
    },
    {
      id: "WR-006", projectId: "PRJ-106", workName: "Mái che và khu sạp B",
      contractCode: "27/2024/HĐ-XL", contractor: "Công ty CP Xây lắp Hà Tiên",
      acceptanceDate: "2025-09-10", months: 12, bondValue: 0.21, bank: "Vietcombank – CN Kiên Giang", bondStatus: "HOLDING",
    },
    {
      id: "WR-007", projectId: "PRJ-101", workName: "Hệ thống thoát nước mặt và kè gia cố bổ sung",
      contractCode: "09/2023/HĐ-XL", contractor: "Công ty CP Xây dựng Kiên Giang",
      acceptanceDate: "2024-11-15", months: 24, bondValue: 0.85, bank: "VietinBank – CN Kiên Giang", bondStatus: "HOLDING",
    },
    {
      id: "WR-008", projectId: "PRJ-102", workName: "Hệ thống chiếu sáng công cộng tuyến Mạc Thiên Tích",
      contractCode: "18/2024/HĐ-XL", contractor: "Công ty CP Chiếu sáng Đô thị Kiên Giang",
      acceptanceDate: "2025-05-10", months: 12, bondValue: 0.18, bank: "BIDV – CN Hà Tiên", bondStatus: "HOLDING",
    },
    {
      id: "WR-009", projectId: "PRJ-103", workName: "Cổng, tường rào bảo vệ và nhà để xe giáo viên",
      contractCode: "23/2024/HĐ-XL", contractor: "Công ty TNHH Xây dựng Phú Quốc",
      acceptanceDate: "2025-04-12", months: 12, bondValue: 0.15, bank: "Agribank – CN Hà Tiên", bondStatus: "HOLDING",
    },
    {
      id: "WR-010", projectId: "PRJ-104", workName: "Hệ thống biển báo hiệu đường bộ và sơn kẻ đường",
      contractCode: "33/2024/HĐ-XL", contractor: "Công ty TNHH Cầu đường 68",
      acceptanceDate: "2025-09-01", months: 12, bondValue: 0.08, bank: "BIDV – CN Hà Tiên", bondStatus: "HOLDING",
    },
    {
      id: "WR-011", projectId: "PRJ-105", workName: "Cải tạo cảnh quan sân vườn và bãi đỗ xe trụ sở",
      contractCode: "05/2023/HĐ-XL", contractor: "Công ty CP Xây lắp Hà Tiên",
      acceptanceDate: "2024-08-20", months: 24, bondValue: 0.22, bank: "Vietcombank – CN Kiên Giang",
      bondStatus: "RETURNED", bondClosedAt: "2026-08-25",
    },
    {
      id: "WR-012", projectId: "PRJ-106", workName: "Hệ thống phòng cháy chữa cháy khu chợ Tô Châu",
      contractCode: "29/2024/HĐ-XL", contractor: "Công ty TNHH Cơ điện PCCC Miền Nam",
      acceptanceDate: "2025-10-05", months: 24, bondValue: 0.35, bank: "Agribank – CN Kiên Giang", bondStatus: "HOLDING",
    },
  ],
  incidents: [
    {
      id: "INC-001", code: "SC-2026-011", warrantyId: "WR-001", foundDate: "2026-09-02",
      description: "Nứt mạch vữa thân kè, có dấu hiệu xói chân kè", location: "Đoạn K0+120 phía biển",
      severity: "HIGH", requiredFixDate: "2026-09-16", status: "OPEN", reportedBy: "Lê Hoàng Minh",
      attachments: ["anh-hien-truong-k0-120.jpg", "bb-ghi-nhan-sc011.pdf"],
    },
    {
      id: "INC-002", code: "SC-2026-012", warrantyId: "WR-002", foundDate: "2026-09-10",
      description: "Lún cục bộ mặt đường khoảng 2 m²", location: "Nút giao Mạc Thiên Tích – Chi Lăng",
      severity: "NORMAL", requiredFixDate: "2026-09-30", status: "FIXING", reportedBy: "Lê Hoàng Minh",
      attachments: ["anh-lun-mat-duong.jpg"],
    },
    {
      id: "INC-003", code: "SC-2026-009", warrantyId: "WR-006", foundDate: "2026-08-28",
      description: "Thấm dột mái tôn khi mưa lớn", location: "Khu sạp B, dãy 3",
      severity: "NORMAL", requiredFixDate: "2026-09-12", status: "FIXING", reportedBy: "Lê Hoàng Minh",
      attachments: ["anh-tham-dot.jpg"],
    },
    {
      id: "INC-004", code: "SC-2026-004", warrantyId: "WR-003", foundDate: "2026-06-10",
      description: "Bong tróc sơn tường hành lang tầng 2", location: "Hành lang tầng 2, khối lớp học",
      severity: "NORMAL", requiredFixDate: "2026-06-30", status: "FIXED", reportedBy: "Lê Hoàng Minh",
      fixedDate: "2026-06-25", acceptanceDocument: "BB-NT-KP-012", attachments: ["bb-nt-kp-012.pdf"],
    },
    {
      id: "INC-005", code: "SC-2026-013", warrantyId: "WR-001", foundDate: "2026-09-15",
      description: "Hư hỏng 3 trụ lan can inox", location: "Đoạn K0+300",
      severity: "NORMAL", requiredFixDate: "2026-10-05", status: "OPEN", reportedBy: "Lê Hoàng Minh",
      attachments: ["anh-lan-can.jpg"],
    },
  ],
};
