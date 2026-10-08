/**
 * procedure-templates.ts — Danh mục các Quy trình Thủ tục mẫu chuẩn hóa cho dự án
 *
 * Cung cấp các loại quy trình:
 * 1. Quy trình chuẩn ĐTXD (Nghị định 15/2021/NĐ-CP - 16 bước)
 * 2. Quy trình rút gọn - Công trình khẩn cấp / Xung yếu (8 bước)
 * 3. Quy trình Báo cáo Kinh tế - Kỹ thuật (< 15 tỷ VNĐ - 11 bước)
 * 4. Quy trình bảo trì, sửa chữa định kỳ (6 bước)
 * 5. Các quy trình tùy chỉnh do người dùng cấu hình
 */

import { MASTER_PROCEDURE_STEPS } from "./procedure-steps-master";
import type { ProcedureStep } from "../types/procedure.types";

export interface ProcedureProfile {
  id: string;
  name: string;
  shortName: string;
  description: string;
  stepCount: number;
  badge: string;
  tagColor: "teal" | "blue" | "amber" | "purple" | "slate";
  isSystem?: boolean;
  createSteps: () => ProcedureStep[];
}

export interface CustomProcedureProfile {
  id: string;
  name: string;
  createdAt: string;
  isSystem?: boolean;
  steps: ProcedureStep[];
}

export const PROCEDURE_STORAGE_KEY = "cipm_custom_procedure_profiles";

export const loadCustomProfiles = (): CustomProcedureProfile[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PROCEDURE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveCustomProfiles = (profiles: CustomProcedureProfile[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROCEDURE_STORAGE_KEY, JSON.stringify(profiles));
  } catch (e) {
    console.error("Failed to save procedure profiles", e);
  }
};

/**
 * 1. Quy trình chuẩn ĐTXD (NĐ 15/2021/NĐ-CP) - 16 bước
 */
function createStandard16Steps(): ProcedureStep[] {
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
    isEnabled: true,
    status: "NOT_STARTED",
    plannedDays: m.defaultDays,
    attachments: [],
    notes: "",
  }));
}

/**
 * 2. Quy trình rút gọn - Công trình khẩn cấp / Xung yếu (8 bước)
 */
function createEmergency8Steps(): ProcedureStep[] {
  return [
    {
      id: "emg-1",
      order: 1,
      code: "I",
      groupCode: "I",
      groupTitle: "Lệnh khẩn cấp & Giao nhiệm vụ",
      name: "Quyết định ban hành Lệnh khẩn cấp & Giao nhiệm vụ CĐT",
      type: "MANDATORY",
      responsibleUnit: "UBND TP Hà Tiên",
      durationMargin: "1–3 ngày",
      durationDaysMin: 1,
      durationDaysMax: 3,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 2,
      attachments: [],
      notes: "Căn cứ Điều 130 Luật Xây dựng về công trình khẩn cấp.",
    },
    {
      id: "emg-2",
      order: 2,
      code: "II",
      groupCode: "II",
      groupTitle: "Chỉ định thầu rút gọn",
      name: "Chỉ định thầu rút gọn đơn vị tư vấn & thi công xây dựng",
      type: "MANDATORY",
      responsibleUnit: "Chủ đầu tư + TV đấu thầu",
      durationMargin: "3–5 ngày",
      durationDaysMin: 3,
      durationDaysMax: 5,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 4,
      attachments: [],
      notes: "Áp dụng Điều 42 Luật Đấu thầu về chỉ định thầu rút gọn.",
    },
    {
      id: "emg-3",
      order: 3,
      code: "III",
      groupCode: "III",
      groupTitle: "Khảo sát & Thiết kế khẩn cấp",
      name: "Khảo sát hiện trường & Lập phương án thiết kế khẩn cấp",
      type: "MANDATORY",
      responsibleUnit: "Tư vấn lập",
      durationMargin: "5–7 ngày",
      durationDaysMin: 5,
      durationDaysMax: 7,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 6,
      attachments: [],
      notes: "Khảo sát địa chất, thủy văn tại vị trí kè sạt lở xung yếu.",
    },
    {
      id: "emg-4",
      order: 4,
      code: "IV",
      groupCode: "IV",
      groupTitle: "Phê duyệt thiết kế & Dự toán",
      name: "Phê duyệt Thiết kế bản vẽ thi công & Dự toán khẩn cấp",
      type: "MANDATORY",
      responsibleUnit: "Chủ đầu tư",
      durationMargin: "3–5 ngày",
      durationDaysMin: 3,
      durationDaysMax: 5,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 3,
      attachments: [],
      notes: "CĐT thẩm định và phê duyệt rút gọn theo quy định đặc thù.",
    },
    {
      id: "emg-5",
      order: 5,
      code: "V",
      groupCode: "V",
      groupTitle: "Mặt bằng khẩn cấp",
      name: "Bàn giao mặt bằng khẩn cấp & Di dời chướng ngại",
      type: "CONDITIONAL",
      responsibleUnit: "HĐ TĐ Phường",
      durationMargin: "3–7 ngày",
      durationDaysMin: 3,
      durationDaysMax: 7,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 5,
      attachments: [],
      notes: "Thực hiện biên bản bàn giao hiện trường ngay khi ban hành quyết định.",
    },
    {
      id: "emg-6",
      order: 6,
      code: "VI",
      groupCode: "VI",
      groupTitle: "Thi công & Giám sát",
      name: "Triển khai thi công xây lắp & Giám sát công trình 24/7",
      type: "MANDATORY",
      responsibleUnit: "Nhà thầu thi công",
      durationMargin: "Theo HĐ (30–60 ngày)",
      durationDaysMin: 30,
      durationDaysMax: 60,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 45,
      attachments: [],
      notes: "Thi công liên tục 3 ca, cập nhật nhật ký giám sát hàng ngày.",
    },
    {
      id: "emg-7",
      order: 7,
      code: "VII",
      groupCode: "VII",
      groupTitle: "Nghiệm thu khẩn cấp",
      name: "Nghiệm thu hoàn thành công trình đưa vào sử dụng",
      type: "MANDATORY",
      responsibleUnit: "Chủ đầu tư",
      durationMargin: "3–5 ngày",
      durationDaysMin: 3,
      durationDaysMax: 5,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 3,
      attachments: [],
      notes: "Nghiệm thu thực địa và bàn giao bảo vệ an toàn bờ biển.",
    },
    {
      id: "emg-8",
      order: 8,
      code: "VII.1",
      groupCode: "VII",
      groupTitle: "Hoàn công & Quyết toán",
      name: "Lập hồ sơ hoàn công & Quyết toán công trình hoàn thành",
      type: "MANDATORY",
      responsibleUnit: "Ban Quản lý dự án",
      durationMargin: "Theo HĐ (30 ngày)",
      durationDaysMin: 20,
      durationDaysMax: 45,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 30,
      attachments: [],
      notes: "Hoàn thiện hồ sơ pháp lý sau khi hoàn thành công trình khẩn cấp.",
    },
  ];
}

/**
 * 3. Quy trình Báo cáo Kinh tế - Kỹ thuật (< 15 tỷ VNĐ) - 11 bước
 */
function createBcktkt11Steps(): ProcedureStep[] {
  return [
    {
      id: "bckt-1",
      order: 1,
      code: "I",
      groupCode: "I",
      groupTitle: "Chuẩn bị đầu tư",
      name: "Phê duyệt chủ trương đầu tư dự án",
      type: "MANDATORY",
      responsibleUnit: "Chủ đầu tư + HĐ TĐ Phường",
      durationMargin: "5–10 ngày",
      durationDaysMin: 5,
      durationDaysMax: 10,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 7,
      attachments: [],
    },
    {
      id: "bckt-2",
      order: 2,
      code: "II",
      groupCode: "II",
      groupTitle: "Nhiệm vụ chuẩn bị",
      name: "Lập nhiệm vụ và dự toán chi phí lập Báo cáo KT-KT",
      type: "MANDATORY",
      responsibleUnit: "Chủ đầu tư + TV",
      durationMargin: "3–5 ngày",
      durationDaysMin: 3,
      durationDaysMax: 5,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 4,
      attachments: [],
    },
    {
      id: "bckt-3",
      order: 3,
      code: "III",
      groupCode: "III",
      groupTitle: "Lập Báo cáo KT-KT",
      name: "Khảo sát xây dựng & Lập Báo cáo Kinh tế - Kỹ thuật",
      type: "MANDATORY",
      responsibleUnit: "Tư vấn lập",
      durationMargin: "10–15 ngày",
      durationDaysMin: 10,
      durationDaysMax: 15,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 12,
      attachments: [],
    },
    {
      id: "bckt-4",
      order: 4,
      code: "IV",
      groupCode: "IV",
      groupTitle: "Thẩm định Báo cáo KT-KT",
      name: "Thẩm tra, thẩm định & Phê duyệt Báo cáo Kinh tế - Kỹ thuật",
      type: "MANDATORY",
      responsibleUnit: "Cơ quan chuyên môn",
      durationMargin: "7–10 ngày",
      durationDaysMin: 7,
      durationDaysMax: 10,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 8,
      attachments: [],
    },
    {
      id: "bckt-5",
      order: 5,
      code: "V",
      groupCode: "V",
      groupTitle: "Kế hoạch LCNT",
      name: "Phê duyệt Kế hoạch lựa chọn nhà thầu (KHLCNT)",
      type: "MANDATORY",
      responsibleUnit: "Chủ đầu tư",
      durationMargin: "5–7 ngày",
      durationDaysMin: 5,
      durationDaysMax: 7,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 5,
      attachments: [],
    },
    {
      id: "bckt-6",
      order: 6,
      code: "VI",
      groupCode: "VI",
      groupTitle: "Lựa chọn nhà thầu",
      name: "Lựa chọn nhà thầu thi công xây lắp (Đấu thầu qua mạng / Chào hàng)",
      type: "MANDATORY",
      responsibleUnit: "Chủ đầu tư + TV đấu thầu",
      durationMargin: "15–20 ngày",
      durationDaysMin: 15,
      durationDaysMax: 20,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 18,
      attachments: [],
    },
    {
      id: "bckt-7",
      order: 7,
      code: "VI.1",
      groupCode: "VI",
      groupTitle: "Hợp đồng xây lắp",
      name: "Ký kết hợp đồng xây lắp & nộp bảo lãnh thực hiện",
      type: "MANDATORY",
      responsibleUnit: "Chủ đầu tư",
      durationMargin: "3–5 ngày",
      durationDaysMin: 3,
      durationDaysMax: 5,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 4,
      attachments: [],
    },
    {
      id: "bckt-8",
      order: 8,
      code: "VI.2",
      groupCode: "VI",
      groupTitle: "Bàn giao mặt bằng",
      name: "Bàn giao mặt bằng thi công công trình",
      type: "MANDATORY",
      responsibleUnit: "Chủ đầu tư + HĐ TĐ Phường",
      durationMargin: "3–5 ngày",
      durationDaysMin: 3,
      durationDaysMax: 5,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 3,
      attachments: [],
    },
    {
      id: "bckt-9",
      order: 9,
      code: "VI.3",
      groupCode: "VI",
      groupTitle: "Thi công xây dựng",
      name: "Thi công xây lắp & Giám sát chất lượng công trình",
      type: "MANDATORY",
      responsibleUnit: "Nhà thầu thi công",
      durationMargin: "Theo HĐ (60–120 ngày)",
      durationDaysMin: 60,
      durationDaysMax: 120,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 90,
      attachments: [],
    },
    {
      id: "bckt-10",
      order: 10,
      code: "VII",
      groupCode: "VII",
      groupTitle: "Nghiệm thu bàn giao",
      name: "Nghiệm thu hoàn thành công trình đưa vào sử dụng",
      type: "MANDATORY",
      responsibleUnit: "Chủ đầu tư",
      durationMargin: "5–7 ngày",
      durationDaysMin: 5,
      durationDaysMax: 7,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 5,
      attachments: [],
    },
    {
      id: "bckt-11",
      order: 11,
      code: "VII.1",
      groupCode: "VII",
      groupTitle: "Quyết toán vốn",
      name: "Quyết toán vốn đầu tư dự án hoàn thành",
      type: "MANDATORY",
      responsibleUnit: "Ban Quản lý dự án",
      durationMargin: "30–45 ngày",
      durationDaysMin: 30,
      durationDaysMax: 45,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 35,
      attachments: [],
    },
  ];
}

/**
 * 4. Quy trình bảo trì, sửa chữa định kỳ (6 bước)
 */
function createMaintenance6Steps(): ProcedureStep[] {
  return [
    {
      id: "mnt-1",
      order: 1,
      code: "I",
      groupCode: "I",
      groupTitle: "Khảo sát hiện trạng",
      name: "Khảo sát hiện trạng hư hỏng & Lập phương án bảo trì",
      type: "MANDATORY",
      responsibleUnit: "Ban Quản lý dự án",
      durationMargin: "3–5 ngày",
      durationDaysMin: 3,
      durationDaysMax: 5,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 4,
      attachments: [],
    },
    {
      id: "mnt-2",
      order: 2,
      code: "II",
      groupCode: "II",
      groupTitle: "Dự toán chi phí",
      name: "Lập & Phê duyệt dự toán chi phí sửa chữa định kỳ",
      type: "MANDATORY",
      responsibleUnit: "Chủ đầu tư",
      durationMargin: "3–5 ngày",
      durationDaysMin: 3,
      durationDaysMax: 5,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 3,
      attachments: [],
    },
    {
      id: "mnt-3",
      order: 3,
      code: "III",
      groupCode: "III",
      groupTitle: "Lựa chọn đơn vị",
      name: "Lựa chọn đơn vị thực hiện sửa chữa (Chỉ định / Báo giá)",
      type: "MANDATORY",
      responsibleUnit: "Chủ đầu tư",
      durationMargin: "3–5 ngày",
      durationDaysMin: 3,
      durationDaysMax: 5,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 4,
      attachments: [],
    },
    {
      id: "mnt-4",
      order: 4,
      code: "IV",
      groupCode: "IV",
      groupTitle: "Triển khai sửa chữa",
      name: "Bàn giao hiện trường & Triển khai công tác sửa chữa",
      type: "MANDATORY",
      responsibleUnit: "Nhà thầu thi công",
      durationMargin: "Theo HĐ (15–30 ngày)",
      durationDaysMin: 15,
      durationDaysMax: 30,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 20,
      attachments: [],
    },
    {
      id: "mnt-5",
      order: 5,
      code: "V",
      groupCode: "V",
      groupTitle: "Nghiệm thu khối lượng",
      name: "Nghiệm thu khối lượng sửa chữa hoàn thành",
      type: "MANDATORY",
      responsibleUnit: "Ban Quản lý dự án",
      durationMargin: "2–3 ngày",
      durationDaysMin: 2,
      durationDaysMax: 3,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 2,
      attachments: [],
    },
    {
      id: "mnt-6",
      order: 6,
      code: "VI",
      groupCode: "VI",
      groupTitle: "Thanh quyết toán",
      name: "Thanh toán & Quyết toán chi phí bảo trì sửa chữa",
      type: "MANDATORY",
      responsibleUnit: "Chủ đầu tư",
      durationMargin: "5–7 ngày",
      durationDaysMin: 5,
      durationDaysMax: 7,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: 5,
      attachments: [],
    },
  ];
}

export const BUILTIN_PROCEDURE_TEMPLATES: ProcedureProfile[] = [
  {
    id: "standard-16",
    name: "Quy trình chuẩn ĐTXD (Nghị định 15/2021/NĐ-CP)",
    shortName: "Chuẩn ĐTXD (16 bước)",
    description: "Đầy đủ 16 bước theo Nghị định 15/2021/NĐ-CP (9 bước bắt buộc + 7 bước điều kiện).",
    stepCount: 16,
    badge: "16 bước",
    tagColor: "teal",
    isSystem: true,
    createSteps: createStandard16Steps,
  },
  {
    id: "emergency-8",
    name: "Quy trình rút gọn - Công trình khẩn cấp / Xung yếu",
    shortName: "Rút gọn khẩn cấp (8 bước)",
    description: "Thủ tục đặc thù cho công trình khắc phục sạt lở, xung yếu kè biển, chỉ định thầu rút gọn.",
    stepCount: 8,
    badge: "8 bước",
    tagColor: "amber",
    isSystem: true,
    createSteps: createEmergency8Steps,
  },
  {
    id: "bcktkt-11",
    name: "Quy trình Báo cáo Kinh tế - Kỹ thuật (< 15 tỷ VNĐ)",
    shortName: "Báo cáo KT-KT (11 bước)",
    description: "Thủ tục tinh gọn cho dự án quy mô dưới 15 tỷ VNĐ hoặc cải tạo, không lập BCNCKT riêng.",
    stepCount: 11,
    badge: "11 bước",
    tagColor: "blue",
    isSystem: true,
    createSteps: createBcktkt11Steps,
  },
  {
    id: "maintenance-6",
    name: "Quy trình bảo trì, sửa chữa định kỳ",
    shortName: "Duy tu, sửa chữa (6 bước)",
    description: "Thủ tục nhanh cho công tác sửa chữa, bảo dưỡng thường xuyên công trình công cộng.",
    stepCount: 6,
    badge: "6 bước",
    tagColor: "purple",
    isSystem: true,
    createSteps: createMaintenance6Steps,
  },
];
