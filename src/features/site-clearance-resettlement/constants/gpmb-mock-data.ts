import type { GpmbDataset, Household, StepRecord } from "../types/gpmb.types";
import { GPMB_STEPS } from "./gpmb-steps.ts";

const OFFICER = "Phạm Quốc Bảo";

/** Ngày hoàn thành mẫu của từng bước, dùng chung cho dữ liệu minh họa */
const STEP_DATES: Record<number, string> = {
  1: "2026-02-02", 2: "2026-02-16", 3: "2026-03-02", 4: "2026-03-30", 5: "2026-04-20",
  6: "2026-05-04", 7: "2026-06-01", 8: "2026-06-29", 9: "2026-07-13", 10: "2026-07-24",
  11: "2026-08-03", 12: "2026-08-17", 13: "2026-08-28", 14: "2026-08-20", 15: "2026-09-10", 16: "2026-09-15",
};

function buildRecords(steps: number[], prefix: string): StepRecord[] {
  return steps.map((step) => {
    const definition = GPMB_STEPS.find((item) => item.number === step);
    return {
      step,
      completedAt: STEP_DATES[step],
      documentNo: `${String(step).padStart(2, "0")}/${prefix}-BT`,
      fileName: definition?.forms ? `buoc-${step}-${prefix.toLowerCase()}.pdf` : undefined,
      by: OFFICER,
      approvedBy: definition?.requiresApproval ? "Huỳnh Thái Hải" : undefined,
    };
  });
}

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, index) => from + index);

const households: Household[] = [
  {
    id: "HH-001", code: "DA-003-HD-001", projectId: "PRJ-003", ownerName: "Nguyễn Văn Tám",
    idNumber: "091****4521", address: "Tổ 3, KP Pháo Đài", areaM2: 185.5, landType: "ONT", compensation: 1.245,
    specialStatus: "NORMAL", records: buildRecords(range(1, 11), "HD001"), currentStepStartedAt: "2026-09-10",
  },
  {
    id: "HH-002", code: "DA-003-HD-002", projectId: "PRJ-003", ownerName: "Trần Thị Lan",
    idNumber: "091****7710", address: "Tổ 3, KP Pháo Đài", areaM2: 142.2, landType: "ONT", compensation: 0.968,
    specialStatus: "NORMAL", records: buildRecords(range(1, 13), "HD002"), currentStepStartedAt: "2026-09-12",
  },
  {
    id: "HH-003", code: "DA-003-HD-003", projectId: "PRJ-003", ownerName: "Lê Văn Hùng",
    idNumber: "091****2284", address: "Tổ 4, KP Pháo Đài", areaM2: 320, landType: "CLN", compensation: 0.742,
    specialStatus: "NORMAL", records: buildRecords(range(1, 5), "HD003"), currentStepStartedAt: "2026-09-04",
  },
  {
    id: "HH-004", code: "DA-003-HD-004", projectId: "PRJ-003", ownerName: "Phạm Thị Hoa",
    idNumber: "091****9032", address: "Tổ 4, KP Pháo Đài", areaM2: 96.8, landType: "ONT", compensation: 0.655,
    specialStatus: "NORMAL", records: buildRecords(range(1, 8), "HD004"), currentStepStartedAt: "2026-09-08",
    proposal: {
      step: 9, proposedBy: OFFICER, proposedAt: "2026-09-17", documentNo: "1542/QĐ-UBND",
      fileName: "mau-05-qd-phe-duyet-hd004.pdf", note: "Phương án đã được Hội đồng thẩm định thông qua.",
    },
  },
  {
    id: "HH-005", code: "DA-003-HD-005", projectId: "PRJ-003", ownerName: "Võ Văn Cường",
    idNumber: "091****6657", address: "Tổ 5, KP Pháo Đài", areaM2: 410.3, landType: "Hỗn hợp", compensation: 1.86,
    specialStatus: "UNCOOPERATIVE", records: buildRecords(range(1, 13), "HD005"), currentStepStartedAt: "2026-09-02",
  },
  {
    id: "HH-006", code: "DA-003-HD-006", projectId: "PRJ-003", ownerName: "Huỳnh Thị Mai",
    idNumber: "091****1109", address: "Tổ 5, KP Pháo Đài", areaM2: 128, landType: "ONT", compensation: 0.812,
    specialStatus: "NORMAL", records: buildRecords(range(1, 7), "HD006"), currentStepStartedAt: "2026-09-01",
  },
  {
    id: "HH-007", code: "DA-003-HD-007", projectId: "PRJ-003", ownerName: "Đặng Văn Lộc",
    idNumber: "091****3348", address: "Tổ 6, KP Pháo Đài", areaM2: 265.7, landType: "HNK", compensation: 0.593,
    specialStatus: "ENFORCEMENT", records: buildRecords([...range(1, 13), 14], "HD007"), currentStepStartedAt: "2026-08-20",
  },
  {
    id: "HH-008", code: "DA-003-HD-008", projectId: "PRJ-003", ownerName: "Bùi Thị Ngọc",
    idNumber: "091****5576", address: "Tổ 6, KP Pháo Đài", areaM2: 110.4, landType: "ONT", compensation: 0.731,
    specialStatus: "NORMAL", records: buildRecords([...range(1, 13), 16], "HD008"), currentStepStartedAt: "2026-09-15",
  },
  {
    id: "HH-009", code: "DA-002-HD-001", projectId: "PRJ-002", ownerName: "Ngô Văn Phúc",
    idNumber: "091****8820", address: "KP 1, đường ven biển", areaM2: 540, landType: "RSX", compensation: 0.482,
    specialStatus: "NORMAL", records: buildRecords(range(1, 3), "HD009"), currentStepStartedAt: "2026-08-25",
  },
  {
    id: "HH-010", code: "DA-002-HD-002", projectId: "PRJ-002", ownerName: "Dương Thị Thu",
    idNumber: "091****4417", address: "KP 1, đường ven biển", areaM2: 205.6, landType: "CLN", compensation: 0.566,
    specialStatus: "NORMAL", records: buildRecords(range(1, 8), "HD010"), currentStepStartedAt: "2026-09-03",
    rejection: {
      step: 9, by: "Trần Văn Nam", at: "2026-09-16",
      reason: "Thiếu biên bản thẩm định có đủ chữ ký thành viên Hội đồng; bổ sung trước khi đề xuất lại.",
    },
  },
  {
    id: "HH-011", code: "DA-002-HD-003", projectId: "PRJ-002", ownerName: "Lý Văn Sang",
    idNumber: "091****2093", address: "KP 2, đường ven biển", areaM2: 176.9, landType: "ONT", compensation: 1.034,
    specialStatus: "COMPLAINT", records: buildRecords(range(1, 6), "HD011"), currentStepStartedAt: "2026-08-10",
  },
  {
    id: "HH-012", code: "DA-002-HD-004", projectId: "PRJ-002", ownerName: "Mai Thị Kim",
    idNumber: "091****7785", address: "KP 2, đường ven biển", areaM2: 88.5, landType: "ONT", compensation: 0.618,
    specialStatus: "NORMAL", records: buildRecords(range(1, 12), "HD012"), currentStepStartedAt: "2026-09-14",
    proposal: {
      step: 13, proposedBy: OFFICER, proposedAt: "2026-09-18", documentNo: "1603/QĐ-UBND",
      fileName: "mau-08-qd-thu-hoi-hd012.pdf",
    },
  },
  {
    id: "HH-013", code: "DA-002-HD-005", projectId: "PRJ-002", ownerName: "Trương Văn Bình",
    idNumber: "091****6632", address: "KP 3, đường ven biển", areaM2: 232, landType: "CLN", compensation: 0.707,
    specialStatus: "NORMAL", records: buildRecords(range(1, 11), "HD013"), currentStepStartedAt: "2026-09-15",
  },
  {
    id: "HH-014", code: "DA-002-HD-006", projectId: "PRJ-002", ownerName: "Phan Thị Yến",
    idNumber: "091****0541", address: "KP 3, đường ven biển", areaM2: 64.3, landType: "ONT", compensation: 0.389,
    specialStatus: "NORMAL", records: buildRecords(range(1, 2), "HD014"), currentStepStartedAt: "2026-09-11",
  },
];

export const GPMB_MOCK_DATA: GpmbDataset = {
  projects: [
    { id: "PRJ-003", code: "BQL-DA-2026-003", name: "Khu dân cư & Tái định cư phường Pháo Đài" },
    { id: "PRJ-002", code: "BQL-DA-2026-002", name: "Tuyến đường ven biển phường Pháo Đài (Gói XL-02)" },
  ],
  households,
};
