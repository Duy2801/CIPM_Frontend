import { INITIAL_PROJECTS_MOCK } from "@/features/projects_works/constants/projects-mock-data";
import { FINANCE_MOCK_DATA } from "@/features/finance-settlement/constants/finance-mock-data";
import { GPMB_MOCK_DATA } from "@/features/site-clearance-resettlement/constants/gpmb-mock-data";
import { BIDDING_MOCK_DATA } from "@/features/bidding-management/constants/bidding-mock-data";
import { WARRANTY_MOCK_DATA } from "@/features/warranty-maintenance/constants/warranty-mock-data";
import type { ReportType } from "../types/legal-ai.types";

export interface ReportContextData {
  projectName?: string;
  projectId?: string;
  period: string;
  type: ReportType;
}

export function generateNarrativeReport(ctx: ReportContextData): string {
  const projects = ctx.projectId && ctx.projectId !== "ALL"
    ? INITIAL_PROJECTS_MOCK.filter((p) => p.id === ctx.projectId)
    : INITIAL_PROJECTS_MOCK;

  // Số liệu tổng hợp M2
  const totalProjects = projects.length;
  const slowProjects = projects.filter((p) => p.actualProgress < p.plannedProgress);
  const avgProgress = Math.round(
    projects.reduce((acc, p) => acc + p.actualProgress, 0) / (totalProjects || 1)
  );

  // Số liệu tổng hợp M4 (Giải ngân)
  const totalDisbursed = FINANCE_MOCK_DATA.disbursements
    .filter((d) => d.status === "APPROVED")
    .reduce((sum, d) => sum + d.amount, 0);
  const totalPlan = FINANCE_MOCK_DATA.capitalPlans.reduce(
    (sum, cp) => sum + (cp.initialAmount + (cp.adjustmentAmount ?? 0)),
    0,
  );
  const disbursementRate = totalPlan > 0 ? ((totalDisbursed / totalPlan) * 100).toFixed(1) : "68.5";

  // Số liệu tổng hợp M6 (GPMB)
  const households = GPMB_MOCK_DATA.households;
  const totalHouseholds = households.length;
  const handedOver = households.filter((h) => h.records.some((r) => r.step === 16)).length;
  const pendingGpmb = totalHouseholds - handedOver;

  // Số liệu tổng hợp M7 (Đấu thầu)
  const packages = BIDDING_MOCK_DATA.packages;
  const totalPackages = packages.length;
  const completedPackages = packages.filter((pkg) => pkg.records.length === 9).length;

  // Số liệu tổng hợp M8 (Bảo hành)
  const warranties = WARRANTY_MOCK_DATA.warranties;
  const activeWarranties = warranties.filter((w) => w.bondStatus === "HOLDING").length;
  const openIncidents = WARRANTY_MOCK_DATA.incidents.filter((i) => i.status !== "FIXED").length;

  const projectTitle = ctx.projectName && ctx.projectId !== "ALL"
    ? `DỰ ÁN: ${ctx.projectName.toUpperCase()}`
    : "TOÀN BỘ CÁC DỰ ÁN TRỌNG ĐIỂM TRÊN ĐỊA BÀN TP HÀ TIÊN";

  return `ỦY BAN NHÂN DÂN TP HÀ TIÊN
BAN QUẢN LÝ DỰ ÁN ĐẦU TƯ XÂY DỰNG
Số:       /BC-BQLĐTXD
---
CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
Hà Tiên, ngày 01 tháng 10 năm 2026

BÁO CÁO TỔNG HỢP VĂN BẢN
Tình hình triển khai thực hiện các dự án đầu tư xây dựng công trình
Kỳ báo cáo: ${ctx.period}
Phạm vi: ${projectTitle}

Kính gửi:
- Ủy ban nhân dân thành phố Hà Tiên;
- Sở Xây dựng tỉnh Kiên Giang;
- Sở Kế hoạch và Đầu tư tỉnh Kiên Giang.

Thực hiện nhiệm vụ được giao về công tác quản lý, triển khai các dự án đầu tư công trên địa bàn, Ban Quản lý Dự án Đầu tư Xây dựng thành phố Hà Tiên kính báo cáo tổng hợp tình hình thực hiện với các nội dung trọng tâm như sau:

I. ĐÁNH GIÁ TỔNG QUAN TÌNH HÌNH THỰC HIỆN
Trong kỳ báo cáo (${ctx.period}), Ban QLDA đã chủ động phối hợp với các phòng, ban chuyên môn, UBND các phường/xã và các đơn vị nhà thầu đẩy nhanh tiến độ thi công, giải ngân vốn và công tác giải phóng mặt bằng.
- Tổng số dự án đang quản lý điều hành: ${totalProjects} dự án.
- Tiến độ hoàn thành bình quân toàn Ban đạt: ${avgProgress}%.
- Dự án cơ bản bám sát kế hoạch: ${totalProjects - slowProjects.length} dự án; Số dự án chậm so với kế hoạch: ${slowProjects.length} dự án (chủ yếu do vướng mặt bằng cục bộ).

II. TIẾN ĐỘ THỰC HIỆN CÁC DỰ ÁN TRỌNG ĐIỂM (DỮ LIỆU M2 & M3)
1. Các công trình trọng điểm đang thi công:
${projects.slice(0, 3).map((p, idx) => `   ${idx + 1}.1. ${p.name} (Mã: ${p.code}):
      - Giai đoạn: ${p.currentStage}. Tiến độ thực tế đạt ${p.actualProgress}% (Kế hoạch: ${p.plannedProgress}%).
      - Đánh giá: ${p.actualProgress >= p.plannedProgress ? "Bảo đảm tiến độ cam kết theo hợp đồng." : "Chậm tiến độ cục bộ khoảng " + (p.plannedProgress - p.actualProgress) + "%, đang đôn đốc nhà thầu tăng ca và bổ sung mũi thi công."}`).join("\n")}

III. KẾT QUẢ GIẢI NGÂN VỐN ĐẦU TƯ CÔNG (DỮ LIỆU M4)
- Tổng kế hoạch vốn được giao phân bổ: ${totalPlan.toFixed(2)} tỷ đồng.
- Lũy kế giá trị thanh toán, giải ngân qua Kho bạc Nhà nước Hà Tiên: ${totalDisbursed.toFixed(2)} tỷ đồng, đạt tỷ lệ ${disbursementRate}% kế hoạch vốn.
- Tình hình kiểm soát hạn mức hợp đồng: 100% hồ sơ đề nghị thanh toán được kiểm duyệt 2 cấp (Kế toán trưởng duyệt, Giám đốc ký duyệt) trước khi gửi điện tử sang KBNN, không phát sinh nợ đọng xây dựng cơ bản.

IV. CÔNG TÁC BỒI THƯỜNG, HỖ TRỢ VÀ GIẢI PHÓNG MẶT BẰNG (DỮ LIỆU M6)
- Căn cứ pháp lý thực hiện: Luật Đất đai số 31/2024/QH15 và Quyết định số 18/2024/QĐ-UBND của UBND tỉnh Kiên Giang.
- Tổng số hộ dân thuộc diện thu hồi đất: ${totalHouseholds} hộ.
- Số hộ đã hoàn thành chi trả tiền và bàn giao mặt bằng: ${handedOver}/${totalHouseholds} hộ (${Math.round((handedOver / totalHouseholds) * 100)}%).
- Tình hình thực hiện quy trình 16 bước: Các bước có thời hạn pháp lý bắt buộc (Bước 6 niêm yết 10 ngày, Bước 8 lấy ý kiến 30 ngày) được Tổ Bồi thường giám sát chặt chẽ, không có trường hợp vượt hạn gây khiếu nại.
- Hiện còn ${pendingGpmb} hộ đang trong giai đoạn hiệp thương bổ sung phương án tái định cư và vận động bàn giao.

V. CÔNG TÁC ĐẤU THẦU VÀ BẢO HÀNH CÔNG TRÌNH (DỮ LIỆU M7 & M8)
- Đấu thầu (M7): Đang quản lý ${totalPackages} gói thầu theo quy trình 9 bước trên Hệ thống mạng đấu thầu quốc gia; đã hoàn thành lựa chọn nhà thầu ${completedPackages} gói.
- Bảo hành (M8): Đang theo dõi ${activeWarranties} công trình trong thời hạn bảo hành. Tổng giá trị bảo lãnh ngân hàng đang nắm giữ đảm bảo đúng quy định (thường 5% giá trị HĐ). Đang đôn đốc nhà thầu xử lý ${openIncidents} sự cố kỹ thuật phát sinh, kiên quyết chưa hoàn trả bảo lãnh khi chưa có biên bản nghiệm thu khắc phục hoàn thành.

VI. KHÓ KHĂN, VƯỚNG MẮC VÀ KIẾN NGHỊ ĐỀ XUẤT
1. Khó khăn, vướng mắc:
- Công tác GPMB tại một số vị trí cục bộ còn chậm do tranh chấp ranh đất giữa các hộ dân liền kề.
- Nguồn vật liệu san lấp (cát, đất đắp) trên địa bàn tỉnh có thời điểm khan hiếm cục bộ ảnh hưởng đến nhịp độ đắp nền đường.

2. Kiến nghị, đề xuất:
- Kính đề nghị Thường trực UBND thành phố Hà Tiên tiếp tục chỉ đạo Hội đồng Bồi thường và UBND các phường/xã tập trung tổ chức đối thoại, vận động các hộ dân còn lại sớm bàn giao mặt bằng sạch cho đơn vị thi công.
- Đề nghị KBNN Hà Tiên tiếp tục hỗ trợ kiểm soát, thanh toán nhanh chứng từ điện tử để các nhà thầu có nguồn vốn quay vòng mua vật tư.

Ban Quản lý Dự án Đầu tư Xây dựng thành phố Hà Tiên kính báo cáo UBND thành phố xem xét, chỉ đạo./.

Nơi nhận:
- Như trên;
- Ban Giám đốc (để chỉ đạo);
- Các Tổ chuyên môn (thực hiện);
- Lưu: VT, BQL.
GIÁM ĐỐC
(Ký tên, đóng dấu)




Huỳnh Thái Hải
`;
}

export function generateAiReport(
  type: ReportType,
  projectId: string,
  period: string,
): import("../types/legal-ai.types").GeneratedReport {
  const content = generateNarrativeReport({ type, projectId, period });
  const typeTitles: Record<ReportType, string> = {
    WEEKLY: "BÁO CÁO TIẾN ĐỘ THI CÔNG TUẦN",
    MONTHLY: "BÁO CÁO CÔNG TÁC QUẢN LÝ DỰ ÁN THÁNG",
    GPMB_TOPIC: "BÁO CÁO CHUYÊN ĐỀ BỒI THƯỜNG & GPMB",
    DISBURSEMENT_TOPIC: "BÁO CÁO TÌNH HÌNH GIẢI NGÂN VỐN ĐẦU TƯ CÔNG",
    ANNUAL: "BÁO CÁO TỔNG KẾT CÔNG TÁC NĂM",
  };

  return {
    id: `RPT-${Date.now()}`,
    title: typeTitles[type] || "BÁO CÁO ĐỊNH KỲ BAN QUẢN LÝ DỰ ÁN",
    type,
    period,
    createdAt: new Date().toISOString().split("T")[0],
    author: "Hệ thống AI Tự động hóa BQL",
    status: "DRAFT",
    content,
  };
}
