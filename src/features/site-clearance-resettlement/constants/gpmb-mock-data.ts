import { addDays, todayIso } from "../../../utils/date.ts";
import type {
  CompensationItem,
  GpmbDataset,
  GpmbProject,
  Household,
  SpecialStatus,
  StepProposal,
  StepRecord,
  StepRejection,
} from "../types/gpmb.types";
import { landCodeFromName, summarizeCompensation } from "../utils/gpmb-compensation.ts";
import { GPMB_STEPS } from "./gpmb-steps.ts";
import { priceOf } from "./gpmb-compensation-catalog.ts";

/**
 * Dữ liệu mẫu GPMB, dựng theo quy tắc nghiệp vụ BRD 4.6.4:
 * - (22) Mỗi hộ đi 16 bước độc lập: cùng một dự án có hộ ở bước 3, hộ ở bước 9, hộ ở bước 12…
 * - (23) Bước 12 (Chi trả) chỉ có khi bước 9 (Phê duyệt phương án) đã hoàn thành — hộ đang chờ duyệt / bị trả lại
 *   ở bước 9 thì chưa chi trả.
 * - (24) Bước 14 chỉ có ở hộ "Không hợp tác" / "Cưỡng chế", bước 15 chỉ có ở hộ "Cưỡng chế";
 *   hộ bình thường hoàn tất thì bỏ qua 14, 15.
 * - (25) Bước có biểu mẫu (Mẫu 01–09) luôn có tệp đính kèm khi đã hoàn thành; bước quan trọng (9, 13, 15) có người duyệt.
 * Ngày tính lùi từ hôm nay để cảnh báo thời hạn pháp lý (quá hạn / sắp hết hạn) luôn hiện đúng khi demo.
 * Hộ dân gắn với 2 dự án demo (hiện ở tab GPMB của dự án và phân hệ GPMB).
 */

const OFFICERS = ["Trần Lê Huynh", "Huỳnh Công Lý", "Lê Hoàng Sơn"];
const DIRECTOR = "Huỳnh Thái Hải";
const DEPUTY = "Trần Trung Tín";

const PROJECTS = [
  { id: "DEMO-VIEC-2", code: "DEMO-02", name: "Kè chống sạt lở Mũi Nai" },
  { id: "DEMO-VIEC-1", code: "DEMO-01", name: "Trường THCS Thuận Yên" },
];

/** Tên tệp biểu mẫu theo bước (bước không có biểu mẫu: chỉ một số bước kèm hồ sơ minh họa) */
const STEP_FILES: Record<number, string> = {
  1: "ke-hoach-thu-hoi-dat",
  2: "mau-01-bien-ban-hop-dan",
  3: "mau-02-thong-bao-thu-hoi-dat",
  4: "mau-03-bien-ban-kiem-dem",
  6: "mau-04-bien-ban-niem-yet-phuong-an",
  7: "bien-ban-lay-y-kien-doi-thoai",
  8: "bien-ban-tham-dinh-phuong-an",
  9: "mau-05-qd-phe-duyet-phuong-an",
  10: "mau-06-bien-ban-niem-yet-qd",
  11: "mau-07-bien-ban-giao-qd",
  12: "bien-ban-chi-tra",
  13: "mau-08-qd-thu-hoi-dat",
  14: "mau-08-bien-ban-van-dong",
  15: "mau-09-qd-cuong-che",
  16: "bien-ban-ban-giao-mat-bang",
};

const DOC_SUFFIX: Record<number, string> = {
  1: "KH-UBND", 2: "BB-HĐBT", 3: "TB-UBND", 4: "BB-KK", 5: "PA-HĐBT", 6: "BB-NY", 7: "BB-LYK", 8: "BB-TĐ",
  9: "QĐ-UBND", 10: "BB-NY", 11: "BB-GQĐ", 12: "BB-CT", 13: "QĐ-UBND", 14: "BB-VĐ", 15: "QĐ-CC", 16: "BB-BG",
};

/** Khoảng cách (ngày) giữa hai bước liên tiếp: bước có thời hạn pháp lý lấy gần đủ hạn, còn lại ~1 tuần */
const gapOf = (step: number) => {
  const legal = GPMB_STEPS.find((s) => s.number === step)?.legalDays;
  return legal ? legal - 2 : 7;
};

// ── Bảng kê bồi thường: tên và đơn giá lấy đúng theo bảng giá của phương án mẫu (gpmb-price-tables.ts) ──

/** Loại đất của hộ mẫu → loại đất trong bảng giá (đất nông nghiệp "-CĐN" có hỗ trợ chuyển đổi nghề) */
const LAND_NAMES = {
  ONT: "Đất ở đô thị-VT1 - đường số 06",
  CLN: "Đất trồng cây lâu năm -VT1 - đường số 06-CĐN",
  HNK: "Đất trồng cây lâu năm - VT1 - đường Rạch Ụ-CĐN",
  RSX: "Đất trồng cây lâu năm -VT1 - đường Mạc Thiên Tích (đoạn Mạc Tử Hoàng đến Rạch Ụ)-CĐN",
} as const;
/** Đất không đủ điều kiện bồi thường (đất công, kênh rạch lấn chiếm): ghi diện tích, đơn giá 0 */
const PUBLIC_LAND = "Đất kênh (SON)";

const CROP_NAMES = {
  dua: "Dừa A (Từ 4 năm trở lên có trái ổn định)",
  xoai: "Xoài A (Từ 4 năm trở lên có trái ổn định)",
  mai: "Mai vàng C (đk 15-20)",
  chuoi: "Chuối A (Cây đang cho trái)",
  tram: "Tràm úc C (đk 5-11)",
  bang: "Bàng E (đk 10-20)",
  mau: "Rau màu các loại A",
} as const;

const STRUCTURE_NAMES = {
  nhaC4: "Nhà C4.05 (Mái tôn sóng vuông, nền gạch men, vách tường xây, móng xây gạch,cột xây gạch)",
  nhaTam: "Nhà tiền chế NTC.01 (có vách)",
  nhaKienCo: "Nhà C2.01 (Mái BTCT, nền gạch men, vách tường xây)",
  san: "Sân nền SN.01 (nền bê tông đá 4x6, mác 100)",
  hangRao: "Hàng rào HR.20 (Trụ đá, sắt hình + lưới B40)",
  maiChe: "Mái che MCT.01 (Khung cột gỗ, mái tôn các loại hoặc Fibro xi măng)",
  gieng: "Bể nươc ngầm BNN.02 (Bể nước ngầm bê tông cốt thép toàn khối) (móng không cừ tràm)",
  beNuoc: "Bể nươc ngầm BNN.02 (Bể nước ngầm bê tông cốt thép toàn khối) (móng không cừ tràm)",
  keDa: "Hàng rào HR.17 (Hàng rào tường gạch dày 10cm, có trát vữa 2 mặt)",
} as const;
const HOUSES = new Set<keyof typeof STRUCTURE_NAMES>(["nhaC4", "nhaTam", "nhaKienCo"]);

type SeedLandType = keyof typeof LAND_NAMES;

interface CompensationSeed {
  /** Phần diện tích theo loại đất (hộ "Hỗn hợp" có nhiều thửa) */
  land: [SeedLandType, number][];
  /** false = đất công / lấn chiếm: không bồi thường về đất, chỉ bồi thường tài sản và hỗ trợ */
  landEligible?: boolean;
  /** Số nhân khẩu */
  persons: number;
  crops?: [keyof typeof CROP_NAMES, number][];
  /** [hạng mục, khối lượng, (bỏ qua — tỷ lệ đã nằm trong hạng mục của bảng giá)] */
  structures?: [keyof typeof STRUCTURE_NAMES, number, number?][];
  poor?: boolean;
}

function catalogItem(group: CompensationItem["group"], name: string, quantity: number): CompensationItem {
  const e = priceOf(group, name);
  return { group, name, quantity, unit: e.unit || "cây", unitPrice: e.price };
}

function buildCompensationItems(seed: CompensationSeed, no: number): CompensationItem[] {
  const eligible = seed.landEligible ?? true;
  const items: CompensationItem[] = [];
  seed.land.forEach(([type, area], i) => {
    const land = priceOf("LAND", eligible ? LAND_NAMES[type] : PUBLIC_LAND);
    items.push({
      group: "LAND",
      name: land.name,
      quantity: area,
      unit: "m²",
      unitPrice: land.price,
      supportPrice: land.supportPrice,
      mapSheet: "97",
      parcel: String(100 + no * 3 + i),
    });
  });
  for (const [key, qty] of seed.crops ?? []) items.push(catalogItem("CROPS", CROP_NAMES[key], qty));
  for (const [key, qty] of seed.structures ?? []) items.push(catalogItem("STRUCTURES", STRUCTURE_NAMES[key], qty));

  // Chính sách hỗ trợ theo bảng mức hỗ trợ (NĐ 88/2024)
  const houseArea = (seed.structures ?? []).filter(([key]) => HOUSES.has(key)).reduce((sum, [, qty]) => sum + qty, 0);
  if (houseArea > 0) {
    const move =
      houseArea < 50
        ? "Di chuyển trong phạm vi cấp xã <50m²"
        : houseArea <= 100
          ? "Di chuyển trong phạm vi cấp xã 50m²-100m²"
          : "Di chuyển trong phạm vi cấp xã >100m²";
    items.push(catalogItem("POLICY", move, 1));
    if (eligible && seed.land.some(([t]) => t === "ONT")) items.push(catalogItem("POLICY", "Bố trí suất tái định cư", 1));
  }
  if (eligible && seed.land.some(([t]) => t !== "ONT")) items.push(catalogItem("POLICY", "HT OĐĐS 06 tháng", seed.persons));
  if (seed.poor) items.push(catalogItem("POLICY", "Hộ nghèo", 1));
  return items;
}

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

/** Các bước đã xong khi hộ đang ở `current` (bỏ 14, 15 nếu không áp dụng với trạng thái hộ) */
function completedBefore(current: number, status: SpecialStatus): number[] {
  return range(1, current - 1).filter(
    (s) =>
      (s !== 14 || status === "UNCOOPERATIVE" || status === "ENFORCEMENT") && (s !== 15 || status === "ENFORCEMENT"),
  );
}

interface Seed {
  no: number;
  project: 0 | 1;
  ownerName: string;
  idNumber: string;
  address: string;
  comp: CompensationSeed;
  status?: SpecialStatus;
  /** Bước đang làm; 17 = đã xong cả quy trình */
  current: number;
  /** Bước hiện tại bắt đầu cách đây bao nhiêu ngày */
  startedDaysAgo: number;
  proposal?: { daysAgo: number; note: string };
  rejection?: { daysAgo: number; reason: string };
  notes?: Record<number, string>;
}

function buildHousehold(seed: Seed, today: string, project: GpmbProject = PROJECTS[seed.project]): Household {
  const status = seed.status ?? "NORMAL";
  const tag = `${project.code}-HD-${String(seed.no).padStart(3, "0")}`;
  const officer = OFFICERS[seed.no % OFFICERS.length];
  const currentStepStartedAt = addDays(today, -seed.startedDaysAgo);
  const steps = completedBefore(seed.current, status);

  // Ngày hoàn thành tính lùi từ ngày bắt đầu bước hiện tại
  let cursor = currentStepStartedAt;
  const dates = new Map<number, string>();
  for (const step of [...steps].reverse()) {
    dates.set(step, cursor);
    cursor = addDays(cursor, -gapOf(step));
  }

  const records: StepRecord[] = steps.map((step) => {
    const def = GPMB_STEPS.find((s) => s.number === step)!;
    const file = STEP_FILES[step];
    return {
      step,
      completedAt: dates.get(step)!,
      documentNo: `${100 + seed.no * 7 + step}/${DOC_SUFFIX[step]}`,
      // Quy tắc 25: bước có biểu mẫu bắt buộc có tệp
      fileName: def.forms || file ? `${file ?? `buoc-${step}`}-${tag.toLowerCase()}.pdf` : undefined,
      note: seed.notes?.[step],
      by: officer,
      approvedBy: def.requiresApproval ? (step === 9 ? DIRECTOR : DEPUTY) : undefined,
    };
  });

  const proposal: StepProposal | undefined = seed.proposal && {
    step: seed.current,
    proposedBy: officer,
    proposedAt: addDays(today, -seed.proposal.daysAgo),
    documentNo: `${200 + seed.no}/${DOC_SUFFIX[seed.current]}`,
    fileName: `${STEP_FILES[seed.current]}-${tag.toLowerCase()}.pdf`,
    note: seed.proposal.note,
  };
  const rejection: StepRejection | undefined = seed.rejection && {
    step: seed.current,
    reason: seed.rejection.reason,
    by: DIRECTOR,
    at: addDays(today, -seed.rejection.daysAgo),
  };

  const compensationItems = buildCompensationItems(seed.comp, seed.no);
  const landTypes = [...new Set(compensationItems.filter((i) => i.group === "LAND").map((i) => landCodeFromName(i.name)))];

  return {
    id: `HH-${tag}`,
    code: tag,
    projectId: project.id,
    ownerName: seed.ownerName,
    idNumber: seed.idNumber,
    address: seed.address,
    // Diện tích thu hồi theo biên bản đo đạc, 2 chữ số thập phân
    areaM2: Number(seed.comp.land.reduce((sum, [, area]) => sum + area, 0).toFixed(2)),
    landType: landTypes.length > 1 ? "Hỗn hợp" : landTypes[0],
    compensation: summarizeCompensation({ compensation: 0, compensationItems }).total,
    compensationItems,
    persons: seed.comp.persons,
    specialStatus: status,
    records,
    currentStepStartedAt,
    proposal,
    rejection,
  };
}

const SEEDS: Seed[] = [
  // ── Dự án Kè chống sạt lở Mũi Nai: các hộ ở nhiều bước khác nhau (quy tắc 22)
  {
    no: 1, project: 0, ownerName: "Nguyễn Văn Tám", idNumber: "091062114521", address: "Tổ 3, KP Pháo Đài",
    comp: { land: [["ONT", 185.5]], persons: 4, structures: [["nhaC4", 62.4], ["san", 38], ["hangRao", 24.5, 80]], crops: [["dua", 4]] },
    current: 17, startedDaysAgo: 4,
  },
  {
    no: 2, project: 0, ownerName: "Trần Thị Lan", idNumber: "091168487710", address: "Tổ 3, KP Pháo Đài",
    comp: { land: [["ONT", 142.2]], persons: 3, structures: [["nhaC4", 54], ["maiChe", 18, 70], ["gieng", 1, 60]] },
    current: 12, startedDaysAgo: 3,
  },
  {
    no: 3, project: 0, ownerName: "Phạm Thị Hoa", idNumber: "091171859032", address: "Tổ 4, KP Pháo Đài",
    comp: { land: [["ONT", 96.8]], landEligible: false, persons: 5, poor: true, structures: [["nhaTam", 42], ["san", 20]], crops: [["dua", 2], ["chuoi", 6]] },
    current: 9, startedDaysAgo: 6,
    // Quy tắc 23: chờ duyệt bước 9 → chưa được chi trả
    proposal: { daysAgo: 1, note: "Phương án đã được Hội đồng thẩm định thông qua, đề nghị phê duyệt." },
  },
  {
    no: 4, project: 0, ownerName: "Lê Văn Hùng", idNumber: "091075222284", address: "Tổ 4, KP Pháo Đài",
    comp: { land: [["CLN", 320]], persons: 4, structures: [["hangRao", 60, 80], ["gieng", 1, 70]], crops: [["xoai", 12], ["dua", 8], ["chuoi", 15]] },
    current: 9, startedDaysAgo: 12,
    rejection: { daysAgo: 2, reason: "Đơn giá cây lâu năm chưa đúng bảng giá 2026, đề nghị tính lại trước khi trình." },
  },
  {
    no: 5, project: 0, ownerName: "Võ Văn Cường", idNumber: "091058596657", address: "Tổ 5, KP Pháo Đài",
    comp: { land: [["ONT", 120], ["CLN", 290.3]], persons: 6, structures: [["nhaKienCo", 96], ["san", 45], ["hangRao", 38, 80]], crops: [["dua", 10], ["xoai", 6]] },
    status: "UNCOOPERATIVE",
    current: 14, startedDaysAgo: 12,
    // Quy tắc 24: không đồng ý phương án → kích hoạt bước 14
    notes: { 12: "Hộ chưa nhận tiền, đã chuyển tiền bồi thường vào tài khoản tạm giữ tại Kho bạc." },
  },
  {
    no: 6, project: 0, ownerName: "Đặng Văn Lộc", idNumber: "091080963348", address: "Tổ 6, KP Pháo Đài",
    comp: { land: [["HNK", 265.7]], persons: 3, structures: [["maiChe", 24, 70], ["beNuoc", 6, 70]], crops: [["mau", 180], ["chuoi", 10]] },
    status: "ENFORCEMENT",
    current: 15, startedDaysAgo: 24,
    // Quy tắc 24: không bàn giao đất → kích hoạt bước 14 và 15 (bước 15 đang quá hạn 20 ngày)
    notes: {
      12: "Hộ từ chối nhận tiền, đã chuyển vào tài khoản tạm giữ tại Kho bạc.",
      14: "Đã vận động 3 lần, hộ vẫn không bàn giao mặt bằng.",
    },
  },
  {
    no: 7, project: 0, ownerName: "Bùi Thị Ngọc", idNumber: "091166335576", address: "Tổ 6, KP Pháo Đài",
    comp: { land: [["ONT", 110.4]], landEligible: false, persons: 4, structures: [["nhaTam", 36.5], ["keDa", 14, 80]], crops: [["bang", 3]] },
    status: "COMPLAINT",
    current: 8, startedDaysAgo: 10,
  },
  {
    no: 8, project: 0, ownerName: "Huỳnh Thị Mai", idNumber: "091173701109", address: "Tổ 5, KP Pháo Đài",
    comp: { land: [["ONT", 128]], landEligible: false, persons: 4, structures: [["nhaC4", 48], ["san", 25]], crops: [["dua", 3]] },
    current: 6, startedDaysAgo: 8,
  },
  {
    no: 9, project: 0, ownerName: "Ngô Văn Phúc", idNumber: "091064078820", address: "KP 1, đường ven biển",
    comp: { land: [["RSX", 540]], persons: 5, structures: [["hangRao", 80, 60]], crops: [["tram", 650]] },
    current: 4, startedDaysAgo: 33,
  },
  {
    no: 10, project: 0, ownerName: "Lâm Thị Kiều", idNumber: "091177444402", address: "Tổ 7, KP Pháo Đài",
    comp: { land: [["ONT", 88.6]], landEligible: false, persons: 2, poor: true, structures: [["nhaTam", 30], ["maiChe", 12, 70]] },
    status: "ENFORCEMENT",
    current: 17, startedDaysAgo: 2,
    notes: { 15: "Đã tổ chức cưỡng chế, bàn giao mặt bằng ngày thực hiện." },
  },
  {
    no: 11, project: 0, ownerName: "Trương Văn Bé", idNumber: "091069817135", address: "Tổ 7, KP Pháo Đài",
    comp: { land: [["CLN", 152.9]], persons: 3, crops: [["xoai", 5], ["mai", 14], ["dua", 4]] },
    current: 13, startedDaysAgo: 2,
    proposal: { daysAgo: 0, note: "Hộ đã nhận đủ tiền bồi thường, đề nghị ban hành quyết định thu hồi đất." },
  },
  // ── Dự án Trường THCS Thuận Yên
  {
    no: 1, project: 1, ownerName: "Phan Văn Sáu", idNumber: "091061182671", address: "Tổ 2, KP Thuận Yên",
    comp: { land: [["HNK", 215]], persons: 4, crops: [["mau", 215]] },
    current: 2, startedDaysAgo: 5,
  },
  {
    no: 2, project: 1, ownerName: "Đỗ Thị Hạnh", idNumber: "091172558094", address: "Tổ 2, KP Thuận Yên",
    comp: { land: [["ONT", 176.4]], persons: 5, structures: [["nhaC4", 70.5], ["san", 40], ["hangRao", 30, 80], ["gieng", 1, 70]], crops: [["mai", 6]] },
    current: 3, startedDaysAgo: 4,
  },
  {
    no: 3, project: 1, ownerName: "Mai Văn Tư", idNumber: "091059923517", address: "Tổ 3, KP Thuận Yên",
    comp: { land: [["ONT", 80], ["HNK", 222.8]], persons: 4, structures: [["nhaTam", 40]], crops: [["mau", 200], ["chuoi", 12]] },
    current: 5, startedDaysAgo: 9,
  },
  {
    no: 4, project: 1, ownerName: "Châu Thị Bích", idNumber: "091179296280", address: "Tổ 3, KP Thuận Yên",
    comp: { land: [["ONT", 134.1]], persons: 3, structures: [["nhaKienCo", 82], ["san", 30]] },
    current: 7, startedDaysAgo: 15,
  },
  {
    no: 5, project: 1, ownerName: "Tạ Văn Nghĩa", idNumber: "091070669946", address: "Tổ 4, KP Thuận Yên",
    comp: { land: [["ONT", 98.3]], persons: 2, structures: [["nhaC4", 44], ["maiChe", 15, 70]], crops: [["dua", 2]] },
    current: 11, startedDaysAgo: 3,
  },
  // ── Hộ bổ sung (thêm sau): đặt cuối danh sách để dữ liệu đã lưu chỉ cần nối thêm, không đánh lại mã hộ cũ
  {
    no: 12, project: 0, ownerName: "Nguyễn Thị Thu", idNumber: "091174320815", address: "Tổ 8, KP Pháo Đài",
    comp: { land: [["ONT", 105.6]], persons: 4, structures: [["nhaC4", 52], ["san", 22]], crops: [["dua", 3]] },
    current: 10, startedDaysAgo: 5,
  },
  {
    no: 13, project: 0, ownerName: "Lý Văn Đức", idNumber: "091066154390", address: "Tổ 8, KP Pháo Đài",
    comp: { land: [["CLN", 238.4]], persons: 3, structures: [["hangRao", 42, 80]], crops: [["xoai", 8], ["mai", 10]] },
    current: 5, startedDaysAgo: 7,
  },
  {
    no: 6, project: 1, ownerName: "Hồ Thị Yến", idNumber: "091178602251", address: "Tổ 5, KP Thuận Yên",
    comp: { land: [["HNK", 186.2]], persons: 5, poor: true, structures: [["maiChe", 16, 70]], crops: [["mau", 160], ["chuoi", 8]] },
    current: 3, startedDaysAgo: 6,
  },
  {
    no: 7, project: 1, ownerName: "Kiều Văn Thành", idNumber: "091063847706", address: "Tổ 5, KP Thuận Yên",
    comp: { land: [["ONT", 152.7]], persons: 4, structures: [["nhaKienCo", 88], ["san", 34], ["gieng", 1, 70]], crops: [["mai", 4]] },
    current: 12, startedDaysAgo: 2,
  },
];

const today = todayIso();

export const GPMB_MOCK_DATA: GpmbDataset = {
  projects: PROJECTS,
  households: SEEDS.map((seed) => buildHousehold(seed, today)),
};

/**
 * Bộ hộ dân mẫu cho một dự án vừa áp dụng quy trình GPMB mà chưa có hộ nào (bản mock):
 * dùng lại toàn bộ hộ mẫu, đánh lại mã theo dự án (DA-xxx-HD-001…).
 */
export function buildSampleHouseholds(project: GpmbProject): Household[] {
  return SEEDS.map((seed, i) => buildHousehold({ ...seed, no: i + 1 }, todayIso(), project));
}

/**
 * Hộ mẫu còn thiếu của một dự án đã có `existingCount` hộ mẫu (dữ liệu lưu từ bản trước, khi danh sách mẫu ít hơn).
 * Mã hộ đánh tiếp từ `nextNo` để không trùng với hộ đã có (kể cả hộ người dùng tự thêm).
 */
export function buildMissingSampleHouseholds(project: GpmbProject, existingCount: number, nextNo: number): Household[] {
  const demoIndex = PROJECTS.findIndex((p) => p.id === project.id);
  const seeds = demoIndex >= 0 ? SEEDS.filter((s) => s.project === demoIndex) : SEEDS;
  const base = demoIndex >= 0 ? PROJECTS[demoIndex] : project;
  return seeds.slice(existingCount).map((seed, i) => buildHousehold({ ...seed, no: nextNo + i }, todayIso(), base));
}

/** CCCD đầy đủ của hộ mẫu theo tên (sửa dữ liệu đã lưu trong trình duyệt từ bản cũ còn che số) */
export const SAMPLE_ID_NUMBERS: Record<string, string> = Object.fromEntries(
  SEEDS.map((seed) => [seed.ownerName, seed.idNumber]),
);
