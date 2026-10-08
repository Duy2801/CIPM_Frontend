import type { BidStepRecord, BiddingDataset } from "../types/bidding.types";
import { BID_STEPS } from "./bidding-steps.ts";

const ENGINEER = "Lê Hoàng Minh";
const DIRECTOR = "Huỳnh Thái Hải";

function buildRecords(dates: string[], prefix: string): BidStepRecord[] {
  return dates.map((completedAt, index) => {
    const step = index + 1;
    return {
      step,
      completedAt,
      documentNo: `${String(step).padStart(2, "0")}/${prefix}`,
      by: ENGINEER,
      approvedBy: BID_STEPS[index].requiresApproval ? DIRECTOR : undefined,
    };
  });
}

export const BIDDING_MOCK_DATA: BiddingDataset = {
  projects: [
    { id: "PRJ-001", code: "BQL-DA-2026-001", name: "Kè bảo vệ bờ biển phường Pháo Đài" },
    { id: "PRJ-004", code: "BQL-DA-2026-004", name: "Cầu Tô Châu (nâng cấp tải trọng & lối đi bộ)" },
    { id: "PRJ-005", code: "BQL-DA-2026-005", name: "Cải tạo, nâng cấp Chợ Trung tâm Hà Tiên" },
    { id: "PRJ-006", code: "BQL-DA-2026-006", name: "Thoát nước & xử lý nước thải khu Đông Hồ" },
    { id: "PRJ-007", code: "BQL-DA-2026-007", name: "Trường Tiểu học & THCS Tô Châu" },
  ],
  packages: [
    {
      id: "PKG-001", code: "DA-004-GT-001", name: "Thi công xây lắp cầu Tô Châu", projectId: "PRJ-004",
      type: "Xây lắp", method: "Đấu thầu rộng rãi", estimatedPrice: 48.5, bidDeadline: "2026-09-21",
      records: buildRecords(["2026-07-06", "2026-07-17", "2026-08-05", "2026-08-28"], "GT001"),
      currentStepStartedAt: "2026-08-28",
    },
    {
      id: "PKG-002", code: "DA-004-GT-002", name: "Tư vấn giám sát thi công cầu Tô Châu", projectId: "PRJ-004",
      type: "Tư vấn giám sát", method: "Chỉ định thầu", estimatedPrice: 1.25,
      winner: "Công ty TNHH Tư vấn Xây dựng Miền Tây", winningPrice: 1.18,
      records: buildRecords(
        ["2026-06-22", "2026-06-30", "2026-07-08", "2026-07-10", "2026-07-24", "2026-07-25", "2026-08-14", "2026-08-25"],
        "GT002",
      ),
      currentStepStartedAt: "2026-08-25",
    },
    {
      id: "PKG-003", code: "DA-005-GT-001", name: "Thi công cải tạo Chợ Trung tâm", projectId: "PRJ-005",
      type: "Xây lắp", method: "Đấu thầu rộng rãi", estimatedPrice: 36.2,
      records: buildRecords(
        ["2026-05-11", "2026-05-22", "2026-06-10", "2026-06-15", "2026-07-15", "2026-07-16", "2026-08-31"],
        "GT003",
      ),
      currentStepStartedAt: "2026-08-31",
      submission: {
        step: 8, submittedBy: ENGINEER, submittedAt: "2026-09-16", documentNo: "215/TTr-BQL",
        winner: "Công ty CP Xây dựng Kiên Giang", winningPrice: 35.08,
      },
    },
    {
      id: "PKG-004", code: "DA-005-GT-002", name: "Mua sắm thiết bị phòng cháy chữa cháy chợ", projectId: "PRJ-005",
      type: "Mua sắm thiết bị", method: "Mua sắm trực tiếp", estimatedPrice: 2.4,
      records: buildRecords(["2026-09-08"], "GT004"),
      currentStepStartedAt: "2026-09-08",
      submission: { step: 2, submittedBy: ENGINEER, submittedAt: "2026-09-15", documentNo: "208/TTr-BQL" },
    },
    {
      id: "PKG-005", code: "DA-006-GT-001", name: "Thi công hệ thống thoát nước khu Đông Hồ", projectId: "PRJ-006",
      type: "Xây lắp", method: "Đấu thầu rộng rãi", estimatedPrice: 62,
      records: buildRecords(["2026-08-24"], "GT005"),
      currentStepStartedAt: "2026-08-24",
      rejection: {
        step: 2, by: "Trần Văn Nam", at: "2026-09-12",
        reason: "Cần tách phần mua sắm máy bơm thành gói thiết bị riêng theo Điều 39 Luật Đấu thầu.",
      },
    },
    {
      id: "PKG-006", code: "DA-006-GT-002", name: "Tư vấn thiết kế hệ thống thoát nước", projectId: "PRJ-006",
      type: "Tư vấn thiết kế", method: "Chỉ định thầu", estimatedPrice: 2.85,
      winner: "Viện Quy hoạch Xây dựng Kiên Giang", winningPrice: 2.7,
      records: buildRecords(
        ["2026-02-02", "2026-02-10", "2026-02-20", "2026-02-23", "2026-03-06", "2026-03-06", "2026-03-20", "2026-03-30", "2026-04-15"],
        "GT006",
      ),
      currentStepStartedAt: "2026-04-15",
    },
    {
      id: "PKG-007", code: "DA-007-GT-001", name: "Thi công khối phòng học bộ môn", projectId: "PRJ-007",
      type: "Xây lắp", method: "Đấu thầu hạn chế", estimatedPrice: 18.6, bidDeadline: "2026-09-25",
      records: buildRecords(["2026-07-20", "2026-07-31", "2026-08-19", "2026-09-04"], "GT007"),
      currentStepStartedAt: "2026-09-04",
    },
    {
      id: "PKG-008", code: "DA-001-GT-003", name: "Tư vấn thẩm tra thiết kế kè bảo vệ bờ biển", projectId: "PRJ-001",
      type: "Tư vấn thẩm tra", method: "Chỉ định thầu", estimatedPrice: 0.65,
      winner: "Công ty CP Tư vấn Thiết kế Cảng – Kỹ thuật biển", winningPrice: 0.62,
      records: buildRecords(
        ["2026-01-12", "2026-01-19", "2026-01-26", "2026-01-28", "2026-02-06", "2026-02-06", "2026-02-13", "2026-02-24", "2026-03-05"],
        "GT008",
      ),
      currentStepStartedAt: "2026-03-05",
    },
    {
      id: "PKG-009", code: "DA-007-GT-002", name: "Tư vấn giám sát khối phòng học bộ môn", projectId: "PRJ-007",
      type: "Tư vấn giám sát", method: "Đấu thầu rộng rãi", estimatedPrice: 0.58,
      records: buildRecords(
        ["2026-07-20", "2026-07-31", "2026-08-07", "2026-08-10", "2026-08-31", "2026-09-01"],
        "GT009",
      ),
      currentStepStartedAt: "2026-09-01",
    },
    {
      id: "PKG-010", code: "DA-001-GT-004", name: "Thi công xây lắp đoạn kè km0+500 – km1+200", projectId: "PRJ-001",
      type: "Xây lắp", method: "Đấu thầu rộng rãi", estimatedPrice: 28.5,
      records: buildRecords(["2026-06-15", "2026-06-28", "2026-07-10"], "GT010"),
      currentStepStartedAt: "2026-07-10",
    },
    {
      id: "PKG-011", code: "DA-005-GT-003", name: "Tư vấn lập HSMT và đánh giá HSDT cải tạo chợ", projectId: "PRJ-005",
      type: "Tư vấn thiết kế", method: "Chỉ định thầu", estimatedPrice: 0.35,
      winner: "Công ty TNHH Tư vấn Đấu thầu Miền Nam", winningPrice: 0.33,
      records: buildRecords(["2026-04-05", "2026-04-12", "2026-04-20", "2026-04-25", "2026-05-02"], "GT011"),
      currentStepStartedAt: "2026-05-02",
    },
    {
      id: "PKG-012", code: "DA-006-GT-002", name: "Mua sắm máy bơm và thiết bị xử lý nước thải", projectId: "PRJ-006",
      type: "Mua sắm thiết bị", method: "Đấu thầu rộng rãi", estimatedPrice: 15.8,
      records: buildRecords(["2026-03-10", "2026-03-22"], "GT012"),
      currentStepStartedAt: "2026-03-22",
    },
  ],
};
