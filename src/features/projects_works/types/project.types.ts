export type ProjectStage =
  | "PREPARATION"      // Chuẩn bị ĐT
  | "DESIGN"           // Thiết kế
  | "BIDDING"          // Đấu thầu
  | "CONSTRUCTION"     // Thi công
  | "COMPENSATION"     // Bồi thường (GPMB)
  | "INSPECTION"       // Nghiệm thu
  | "SETTLEMENT"       // Quyết toán
  | "COMPLETED";       // Hoàn thành

export type ProjectStatusFilter = "ALL" | ProjectStage;

export type ProjectHealthStatus = "normal" | "warning" | "danger" | "critical";

export type ProjectWorkType =
  | "Giao thông"
  | "Dân dụng"
  | "Thủy lợi"
  | "Hạ tầng kỹ thuật"
  | "Công nghiệp";

export type ProjectNature = "new" | "transitional"; // "new": Khởi công mới, "transitional": Chuyển tiếp (cũ)

export type FundingSourceType =
  | "Ngân sách thành phố"
  | "Ngân sách tỉnh"
  | "NS Tỉnh"
  | "Ngân sách Trung ương"
  | "Nguồn thu tiền sử dụng đất"
  | "Vốn ODA"
  | "Vốn xã hội hóa"
  | "Vốn vay thương mại";

export interface ProgressHistoryRecord {
  id: string;
  updatedAt: string;
  updatedBy: string;
  oldProgress: number;
  newProgress: number;
  note: string;
  actualEndDateRecorded?: string;
  stageRecorded?: ProjectStage;
}

export interface ProjectItem {
  id: string;
  code: string;                      // BQL-DA-[YYYY]-[###]
  name: string;                      // Tên công trình
  type: ProjectWorkType;             // Loại công trình
  location?: string;                 // Địa điểm xây dựng (Địa bàn): Phường Pháo Đài, Đông Hồ...
  scale?: string;                    // Mục tiêu / Quy mô tóm tắt
  
  // Vốn đầu tư (Tỷ đồng, 2 chữ số thập phân)
  fundingSource: FundingSourceType;
  totalInvestment: number;
  plan2026: number;
  disbursedAmount: number;           // Để kiểm tra quy tắc 5: Đã phát sinh tài chính thì không được xóa
  
  // Nhân sự (Chọn từ M5 sau khi Ban Giám đốc phân công)
  managerName: string;               // Người phụ trách chính ("Chưa phân công" nếu mới tạo)
  supervisorName: string;            // Người giám sát KT ("Chưa phân công" nếu mới tạo)
  
  // Thời gian
  startDate: string;                 // YYYY-MM-DD
  endDatePlanned: string;            // YYYY-MM-DD (phải sau startDate)
  actualEndDate?: string;            // Bắt buộc khi tiến độ đạt 100%
  
  // Tiến độ
  currentStage: ProjectStage;
  actualProgress: number;            // 0 - 100
  plannedProgress: number;           // 0 - 100
  
  // Lịch sử cập nhật tiến độ (Audit trail)
  progressHistory: ProgressHistoryRecord[];
  
  // Ghi chú
  note?: string;
  
  // Trạng thái vận hành
  status: "active" | "closed";
  nature?: ProjectNature;            // "new": Dự án mới (Khởi công mới) | "transitional": Dự án cũ (Chuyển tiếp)
}

export interface ProjectFormData {
  name: string;
  type: ProjectWorkType;
  location?: string;
  scale?: string;
  fundingSource: FundingSourceType;
  totalInvestment: number;
  plan2026?: number;
  managerName?: string;
  supervisorName?: string;
  startDate: string;
  endDatePlanned: string;
  nature?: ProjectNature;
  currentStage?: ProjectStage;
  actualProgress?: number;
  plannedProgress?: number;
  note?: string;
}
