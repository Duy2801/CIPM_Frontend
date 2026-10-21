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
 * QUY TRÌNH THỦ TỤC ĐẦU TƯ XÂY DỰNG (Dự thảo)
 * A. Chuẩn bị đầu tư · B. Đấu thầu (5 hình thức) · C. Giám sát · D. Quy hoạch
 *
 * Mỗi nhóm của dự thảo (I, II, ...) là một BƯỚC CHÍNH (mã "I"), các dòng bên trong là BƯỚC CON (mã "I.1"),
 * bước con có thể có bước con tiếp (mã "I.1.1"...) — không giới hạn số cấp, đúng như đánh số trong dự thảo.
 * Bước ghi "(nếu có)" hoặc chỉ áp dụng theo trường hợp → bước Điều kiện (CONDITIONAL).
 * Dự thảo chưa quy định thời gian từng bước → để "Theo quy định", cấu hình số ngày khi áp dụng cho dự án.
 */

interface TemplateStepDef {
  name: string;
  /** Đơn vị xử lý theo dự thảo */
  unit: string;
  conditional?: boolean;
  /** Danh mục hồ sơ đi kèm / ghi chú của bước */
  notes?: string;
  /** Bước con của bước này (cấp tiếp theo); không ghi đơn vị thì lấy theo bước cha */
  children?: (Omit<TemplateStepDef, "unit"> & { unit?: string })[];
}

interface TemplateGroupDef {
  code: string;
  /** Tên bước chính */
  title: string;
  /** Đơn vị xử lý của bước chính (mặc định: tổng hợp đơn vị các bước con) */
  unit?: string;
  /** Ghi chú của bước chính (phạm vi áp dụng, căn cứ pháp lý...) */
  note?: string;
  /** Cả nhóm chỉ áp dụng theo trường hợp → mọi bước trong nhóm là bước Điều kiện */
  conditional?: boolean;
  /** Nhóm điều kiện mặc định đang tắt (VD: hình thức lựa chọn nhà thầu — bật hình thức áp dụng cho gói thầu) */
  disabledByDefault?: boolean;
  steps: TemplateStepDef[];
}

function buildTemplateSteps(prefix: string, department: string, groups: TemplateGroupDef[]): ProcedureStep[] {
  let order = 0;
  const makeStep = (
    code: string,
    group: TemplateGroupDef,
    name: string,
    unit: string,
    conditional: boolean,
    notes?: string,
    enabled = true
  ): ProcedureStep => {
    order += 1;
    return {
      id: `${prefix}-${order}`,
      order,
      code,
      groupCode: group.code,
      groupTitle: group.title,
      name,
      type: conditional ? "CONDITIONAL" : "MANDATORY",
      responsibleUnit: unit,
      department,
      durationMargin: "Theo quy định",
      durationDaysMin: null,
      durationDaysMax: null,
      isEnabled: enabled,
      status: enabled ? "NOT_STARTED" : "DISABLED",
      submissionStatus: "PENDING_SUBMISSION",
      attachments: [],
      notes: notes ?? "",
    };
  };

  // Bước con ở mọi cấp: mã = mã cha + ".n"; điều kiện / bật tắt kế thừa từ cha
  type StepNode = Omit<TemplateStepDef, "unit"> & { unit?: string };
  const buildChildren = (
    parentCode: string,
    group: TemplateGroupDef,
    nodes: StepNode[],
    inheritedUnit: string,
    inheritedConditional: boolean,
    enabled: boolean
  ): ProcedureStep[] =>
    nodes.flatMap((node, index) => {
      const code = `${parentCode}.${index + 1}`;
      const unit = node.unit ?? inheritedUnit;
      const conditional = inheritedConditional || Boolean(node.conditional);
      const self = makeStep(code, group, node.name, unit, conditional, node.notes, enabled);
      return [self, ...buildChildren(code, group, node.children ?? [], unit, conditional, enabled)];
    });

  return groups.flatMap((group) => {
    // Bước chính: đơn vị xử lý là tổng hợp các đơn vị của bước con
    const parentUnit = group.unit ?? Array.from(new Set(group.steps.map((s) => s.unit))).join(", ");
    const enabled = !group.disabledByDefault;
    const parent = makeStep(group.code, group, group.title, parentUnit, Boolean(group.conditional), group.note, enabled);
    return [parent, ...buildChildren(group.code, group, group.steps, parentUnit, Boolean(group.conditional), enabled)];
  });
}

const DEPT_KHKT = "Tổ Kế hoạch – Kỹ thuật";
const DEPT_DT = "Tổ Quản lý Đấu thầu";
const DEPT_GSKT = "Tổ Giám sát – Kỹ thuật";

// ─────────────────────────────────────────────────────────────────────────────
// A. QUY TRÌNH CHUẨN BỊ ĐẦU TƯ
// ─────────────────────────────────────────────────────────────────────────────
const CHUAN_BI_DAU_TU_GROUPS: TemplateGroupDef[] = [
  {
    code: "I",
    title: "Lập, thẩm định và phê duyệt chủ trương đầu tư",
    // Bước chính và các bước con đều bắt buộc
    note: "Thực hiện đối với dự án thuộc trường hợp phải quyết định chủ trương đầu tư theo pháp luật về đầu tư công và pháp luật có liên quan.",
    steps: [
      { name: "Báo cáo đề xuất chủ trương đầu tư", unit: "BQL" },
      { name: "Tờ trình thẩm định báo cáo đề xuất chủ trương đầu tư", unit: "BQL" },
      {
        name: "Thẩm định báo cáo đề xuất chủ trương đầu tư (bao gồm thẩm định nguồn vốn và khả năng cân đối vốn theo thẩm quyền)",
        unit: "Cơ quan chuyên môn",
      },
      { name: "Tờ trình phê duyệt báo cáo đề xuất chủ trương đầu tư", unit: "BQL" },
      { name: "Quyết định chủ trương đầu tư", unit: "Cấp QĐ chủ trương" },
    ],
  },
  {
    code: "II",
    title: "Tổ chức lập Báo cáo nghiên cứu khả thi / Báo cáo kinh tế – kỹ thuật",
    steps: [
      {
        name: "Hợp đồng ủy thác (đại diện chủ đầu tư, quản lý dự án, giám sát) (do đơn vị khác làm chủ đầu tư)",
        unit: "Chủ đầu tư – BQL",
      },
      { name: "Dự toán chuẩn bị đầu tư", unit: "Tư vấn" },
      { name: "Tờ trình phê duyệt dự toán chuẩn bị đầu tư", unit: "BQL" },
      { name: "Quyết định phê duyệt dự toán chuẩn bị đầu tư", unit: "Chủ đầu tư" },
      { name: "Tờ trình phê duyệt kế hoạch lựa chọn nhà thầu tư vấn giai đoạn chuẩn bị đầu tư", unit: "BQL" },
      {
        name: "Quyết định phê duyệt kế hoạch lựa chọn nhà thầu tư vấn giai đoạn chuẩn bị đầu tư",
        unit: "Chủ đầu tư",
        notes: "Đối với dự án có quy mô lớn, chi phí tư vấn khảo sát, lập BCNCKT > 3 tỷ đồng sẽ tổ chức đấu thầu tư vấn.",
      },
      {
        name: "Nhiệm vụ khảo sát, lập BCKTKT (hoặc BCNCKT)",
        unit: "Tư vấn",
        notes: "Đối với dự án có quy mô khảo sát phức tạp có lập thủy hải văn, mô hình toán sẽ thuê tư vấn thẩm tra nhiệm vụ.",
      },
      { name: "Tờ trình phê duyệt đề cương nhiệm vụ khảo sát, lập báo cáo kinh tế – kỹ thuật", unit: "BQL" },
      {
        name: "Quyết định phê duyệt đề cương nhiệm vụ khảo sát, lập báo cáo kinh tế – kỹ thuật",
        unit: "Chủ đầu tư",
        notes: "Đối với dự án có quy mô lớn, chi phí tư vấn > 3 tỷ đồng sẽ tổ chức đấu thầu tư vấn.",
      },
      { name: "Tờ trình chỉ định thầu tư vấn khảo sát địa chất (nếu có)", unit: "BQL" },
      {
        name: "Quyết định phê duyệt kết quả chỉ định thầu tư vấn khảo sát địa chất (nếu có)",
        unit: "Chủ đầu tư",
      },
      { name: "Tờ trình chỉ định thầu tư vấn khảo sát địa hình, lập báo cáo kinh tế – kỹ thuật", unit: "BQL" },
      {
        name: "Quyết định phê duyệt kết quả chỉ định thầu tư vấn khảo sát địa hình, lập báo cáo kinh tế – kỹ thuật",
        unit: "Chủ đầu tư",
      },
      { name: "Báo cáo kết quả khảo sát địa chất (nếu có khảo sát)", unit: "Tư vấn" },
      { name: "Tờ trình phê duyệt báo cáo kết quả khảo sát địa chất (nếu có khảo sát)", unit: "BQL" },
      {
        name: "Quyết định phê duyệt báo cáo kết quả khảo sát địa chất (nếu có khảo sát)",
        unit: "Chủ đầu tư",
      },
      { name: "Báo cáo kết quả khảo sát địa hình (nếu có khảo sát)", unit: "Tư vấn" },
      { name: "Tờ trình phê duyệt báo cáo kết quả khảo sát địa hình (nếu có khảo sát)", unit: "BQL" },
      {
        name: "Quyết định phê duyệt báo cáo kết quả khảo sát địa hình (nếu có khảo sát)",
        unit: "Chủ đầu tư",
      },
    ],
  },
  {
    code: "III",
    title: "Thẩm định giá (nếu có)",
    conditional: true,
    steps: [
      { name: "Tờ trình phê duyệt đề cương thẩm định giá", unit: "BQL" },
      { name: "Quyết định phê duyệt đề cương thẩm định giá", unit: "Chủ đầu tư" },
      { name: "Tờ trình chỉ định thầu tư vấn thẩm định giá", unit: "BQL" },
      { name: "Quyết định phê duyệt kết quả chỉ định thầu tư vấn thẩm định giá", unit: "Chủ đầu tư" },
    ],
  },
  {
    code: "IV",
    title: "Thẩm tra thiết kế – dự toán (nếu có)",
    conditional: true,
    steps: [
      { name: "Tờ trình phê duyệt đề cương thẩm tra thiết kế dự toán", unit: "BQL" },
      { name: "Quyết định phê duyệt đề cương thẩm tra thiết kế dự toán", unit: "Chủ đầu tư" },
      { name: "Lập thương thảo hợp đồng tư vấn thẩm tra thiết kế dự toán", unit: "Chủ đầu tư – Tư vấn" },
      { name: "Tờ trình chỉ định thầu tư vấn thẩm tra thiết kế dự toán", unit: "BQL" },
      { name: "Quyết định phê duyệt kết quả chỉ định thầu tư vấn thẩm tra thiết kế dự toán", unit: "Chủ đầu tư" },
      { name: "Báo cáo thẩm tra thiết kế – dự toán (của tư vấn thẩm tra)", unit: "Tư vấn" },
    ],
  },
  {
    code: "V",
    title: "Thẩm định Báo cáo nghiên cứu khả thi / Báo cáo kinh tế – kỹ thuật",
    steps: [
      { name: "Báo cáo kết quả thẩm định BCNCKT, BCKTKT", unit: "Chủ đầu tư" },
      { name: "Tờ trình thẩm định BCNCKT", unit: "Chủ đầu tư" },
      { name: "Văn bản trình thẩm định BCKTKT", unit: "Chủ đầu tư" },
      { name: "Thông báo thẩm định BCKTKT (hoặc BCNCKT) + Dự toán kết quả thẩm định", unit: "Cơ quan chuyên môn" },
      { name: "Tờ trình phê duyệt BCKTKT (hoặc BCNCKT)", unit: "Cơ quan chuyên môn" },
      { name: "Quyết định phê duyệt BCKTKT (hoặc BCNCKT)", unit: "Cấp QĐ đầu tư" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// B. QUY TRÌNH ĐẤU THẦU — bước 1, 2 (kế hoạch LCNT) + các hình thức lựa chọn nhà thầu (bật hình thức áp dụng)
// ─────────────────────────────────────────────────────────────────────────────
// Bước 1, 2 của dự thảo: đứng riêng ở đầu quy trình (không thuộc hình thức nào)
const KE_HOACH_LCNT_STEPS: TemplateGroupDef[] = [
  { code: "1", title: "Tờ trình phê duyệt kế hoạch lựa chọn nhà thầu (chủ đầu tư)", unit: "BQL", steps: [] },
  { code: "2", title: "Quyết định phê duyệt kế hoạch lựa chọn nhà thầu", unit: "Chủ đầu tư", steps: [] },
];

// Các bước chọn tư vấn đấu thầu, dùng chung cho đấu thầu rộng rãi
const TU_VAN_DAU_THAU_STEPS: TemplateStepDef[] = [
  { name: "Tờ trình chỉ định thầu rút gọn gói thầu tư vấn lập HSMT, đánh giá HSDT", unit: "BQL" },
  { name: "Quyết định chỉ định thầu rút gọn gói thầu tư vấn lập HSMT, đánh giá HSDT", unit: "Chủ đầu tư" },
  { name: "Tờ trình chỉ định thầu rút gọn gói thầu tư vấn thẩm định HSMT, thẩm định KQLCNT", unit: "BQL" },
  { name: "Quyết định chỉ định thầu rút gọn gói thầu tư vấn thẩm định HSMT, thẩm định KQLCNT", unit: "Chủ đầu tư" },
  { name: "Tư vấn lập HSMT, trình phê duyệt HSMT", unit: "Tư vấn đấu thầu" },
  { name: "Tư vấn thẩm định HSMT", unit: "Tư vấn đấu thầu" },
  { name: "Quyết định phê duyệt HSMT", unit: "Chủ đầu tư" },
  { name: "Đăng báo mời thầu qua mạng", unit: "Chủ đầu tư" },
];

const CHI_DINH_THAU_RUT_GON_GROUP: TemplateGroupDef = {
  code: "", // gán khi ghép vào DAU_THAU_GROUPS
  title: "Chỉ định thầu rút gọn",
  note:
    "Gói thầu thuộc dự toán mua sắm không hình thành dự án có giá gói thầu không quá 01 tỷ đồng; gói thầu dịch vụ tư vấn thuộc dự án có giá gói thầu không quá 03 tỷ đồng; gói thầu dịch vụ phi tư vấn, hàng hóa, xây lắp, hỗn hợp thuộc dự án có giá gói thầu không quá 05 tỷ đồng (khoản 5 Điều 4 – NĐ 349/2026/NĐ-CP).",
  steps: [
    { name: "Lập thương thảo hợp đồng", unit: "CĐT – TV" },
    { name: "Tờ trình chỉ định thầu rút gọn", unit: "BQL" },
    { name: "Quyết định phê duyệt kết quả chỉ định thầu rút gọn", unit: "Chủ đầu tư" },
    { name: "Ký kết hợp đồng", unit: "Chủ đầu tư – Nhà thầu" },
  ],
};

const CHI_DINH_THAU_THONG_THUONG_GROUP: TemplateGroupDef = {
  code: "", // gán khi ghép vào DAU_THAU_GROUPS
  title: "Chỉ định thầu thông thường",
  note: "Điều 78 – NĐ 214/2025/NĐ-CP.",
  steps: [
    { name: "Lập hồ sơ yêu cầu chỉ định thầu, trình phê duyệt HSYC", unit: "BQL" },
    { name: "Phê duyệt HSYC", unit: "Chủ đầu tư" },
    { name: "Phát hành HSYC trên Hệ thống đấu thầu cho nhà thầu dự kiến chỉ định", unit: "Chủ đầu tư" },
    { name: "Mở thầu", unit: "Chủ đầu tư" },
    { name: "Đánh giá kết quả lựa chọn nhà thầu", unit: "BQL" },
    { name: "Thương thảo hợp đồng", unit: "CĐT – Nhà thầu" },
    { name: "Tờ trình chỉ định thầu", unit: "BQL" },
    { name: "Quyết định phê duyệt kết quả chỉ định thầu", unit: "Chủ đầu tư" },
    { name: "Ký kết hợp đồng", unit: "Chủ đầu tư – Nhà thầu" },
  ],
};

const CHAO_HANG_CANH_TRANH_GROUP: TemplateGroupDef = {
  code: "", // gán khi ghép vào DAU_THAU_GROUPS
  title: "Chào hàng cạnh tranh",
  note: "Các gói thầu có giá gói thầu không quá 10 tỷ đồng, không bao gồm gói thầu tư vấn (Điều 81 – NĐ 214/2025/NĐ-CP).",
  steps: [
    { name: "Tờ trình chỉ định thầu rút gọn gói thầu tư vấn lập HSMT, đánh giá HSDT", unit: "BQL" },
    { name: "Quyết định chỉ định thầu rút gọn gói thầu tư vấn lập HSMT, đánh giá HSDT", unit: "Chủ đầu tư" },
    { name: "Tư vấn lập HSMT, trình phê duyệt HSMT", unit: "Tư vấn đấu thầu" },
    { name: "Quyết định phê duyệt HSMT", unit: "Chủ đầu tư" },
    { name: "Đăng báo mời thầu qua mạng", unit: "Chủ đầu tư" },
    { name: "Mở thầu", unit: "Chủ đầu tư" },
    { name: "Yêu cầu làm rõ hồ sơ dự thầu", unit: "Chủ đầu tư" },
    { name: "Làm rõ hồ sơ dự thầu", unit: "Nhà thầu" },
    { name: "Báo cáo đánh giá hồ sơ dự thầu", unit: "Tư vấn đấu thầu" },
    { name: "Thông báo mời đối chiếu tài liệu và thương thảo hợp đồng", unit: "Chủ đầu tư" },
    { name: "Đối chiếu tài liệu và thương thảo hợp đồng", unit: "Chủ đầu tư – Nhà thầu" },
    { name: "Tờ trình phê duyệt kết quả lựa chọn nhà thầu", unit: "BQL" },
    { name: "Quyết định phê duyệt kết quả lựa chọn nhà thầu", unit: "Chủ đầu tư" },
  ],
};

const DAU_THAU_RONG_RAI_GROUP: TemplateGroupDef = {
  code: "", // gán khi ghép vào DAU_THAU_GROUPS
  title: "Đấu thầu rộng rãi",
  steps: [
    {
      name: "Một giai đoạn một túi hồ sơ",
      unit: "BQL, Chủ đầu tư, Tư vấn đấu thầu, Nhà thầu",
      notes: "Các gói thầu có giá gói thầu > 10 tỷ đồng, không bao gồm gói thầu tư vấn (Điều 30 – Luật Đấu thầu).",
      children: [
        ...TU_VAN_DAU_THAU_STEPS,
        { name: "Mở thầu", unit: "Chủ đầu tư" },
        { name: "Yêu cầu làm rõ hồ sơ dự thầu", unit: "Chủ đầu tư" },
        { name: "Làm rõ hồ sơ dự thầu", unit: "Nhà thầu" },
        { name: "Báo cáo đánh giá hồ sơ dự thầu", unit: "Tư vấn đấu thầu" },
        { name: "Thông báo mời đối chiếu tài liệu và thương thảo hợp đồng", unit: "Chủ đầu tư" },
        { name: "Đối chiếu tài liệu và thương thảo hợp đồng", unit: "Chủ đầu tư – Nhà thầu" },
        { name: "Báo cáo thẩm định kết quả lựa chọn nhà thầu", unit: "Tư vấn đấu thầu" },
        { name: "Tờ trình phê duyệt kết quả lựa chọn nhà thầu", unit: "BQL" },
        { name: "Quyết định trúng thầu (chủ đầu tư)", unit: "Chủ đầu tư" },
        { name: "Ký kết hợp đồng xây dựng", unit: "CĐT – ĐVTC" },
      ],
    },
    {
      name: "Một giai đoạn hai túi hồ sơ",
      unit: "BQL, Chủ đầu tư, Tư vấn đấu thầu, Nhà thầu",
      notes: "Gói thầu tư vấn > 3 tỷ đồng (Điều 31 – Luật Đấu thầu).",
      children: [
        ...TU_VAN_DAU_THAU_STEPS,
        { name: "Mở thầu (hồ sơ kỹ thuật)", unit: "Chủ đầu tư" },
        { name: "Yêu cầu làm rõ hồ sơ dự thầu", unit: "Chủ đầu tư" },
        { name: "Làm rõ hồ sơ dự thầu", unit: "Nhà thầu" },
        { name: "Báo cáo đánh giá hồ sơ dự thầu (hồ sơ kỹ thuật)", unit: "Tư vấn đấu thầu" },
        { name: "Báo cáo thẩm định danh sách nhà thầu đáp ứng kỹ thuật", unit: "Tư vấn đấu thầu" },
        { name: "Tờ trình phê duyệt danh sách nhà thầu đáp ứng kỹ thuật", unit: "BQL" },
        { name: "Quyết định phê duyệt danh sách nhà thầu đáp ứng kỹ thuật", unit: "Chủ đầu tư" },
        { name: "Mở thầu (hồ sơ tài chính)", unit: "Chủ đầu tư" },
        { name: "Thông báo mời đối chiếu tài liệu và thương thảo hợp đồng", unit: "Chủ đầu tư" },
        { name: "Đối chiếu tài liệu và thương thảo hợp đồng", unit: "Chủ đầu tư – Nhà thầu" },
        { name: "Báo cáo thẩm định kết quả lựa chọn nhà thầu", unit: "Tư vấn đấu thầu" },
        { name: "Tờ trình phê duyệt kết quả lựa chọn nhà thầu", unit: "BQL" },
        { name: "Quyết định trúng thầu (chủ đầu tư)", unit: "Chủ đầu tư" },
        { name: "Ký kết hợp đồng xây dựng", unit: "CĐT – ĐVTC" },
      ],
    },
  ],
};

/** Các hình thức lựa chọn nhà thầu: bước Điều kiện, mặc định tắt — bật hình thức áp dụng cho gói thầu */
const asBiddingMethod = (group: TemplateGroupDef, code: string): TemplateGroupDef => ({
  ...group,
  code,
  conditional: true,
  disabledByDefault: true,
  note: [group.note, "Bật hình thức này nếu gói thầu áp dụng hình thức lựa chọn nhà thầu tương ứng."]
    .filter(Boolean)
    .join(" "),
});

// Đánh số theo dự thảo: 1, 2 → I rút gọn → II thông thường → III chào hàng cạnh tranh
// → IV đấu thầu rộng rãi (dự thảo ghi trùng "III"; mã bước không được trùng nên dùng IV, bên trong IV.1, IV.2)
const DAU_THAU_GROUPS: TemplateGroupDef[] = [
  ...KE_HOACH_LCNT_STEPS,
  asBiddingMethod(CHI_DINH_THAU_RUT_GON_GROUP, "I"),
  asBiddingMethod(CHI_DINH_THAU_THONG_THUONG_GROUP, "II"),
  asBiddingMethod(CHAO_HANG_CANH_TRANH_GROUP, "III"),
  asBiddingMethod(DAU_THAU_RONG_RAI_GROUP, "IV"),
];

// ─────────────────────────────────────────────────────────────────────────────
// C. QUY TRÌNH GIÁM SÁT
// ─────────────────────────────────────────────────────────────────────────────
const GIAM_SAT_GROUPS: TemplateGroupDef[] = [
  {
    code: "I",
    title: "Triển khai thi công",
    steps: [
      { name: "Hợp đồng xây dựng", unit: "A – B" },
      { name: "Thông báo khởi công", unit: "CĐT" },
      { name: "Bàn giao mặt bằng thi công", unit: "BQL – Hội đồng" },
      { name: "Lập báo cáo giám sát đánh giá trước khi thực hiện dự án", unit: "CĐT" },
    ],
  },
  {
    code: "II",
    title: "Hồ sơ nghiệm thu khối lượng hoàn thành giai đoạn",
    steps: [
      { name: "Biên bản nghiệm thu (giai đoạn thực hiện)", unit: "A – B – TVGS" },
      { name: "Bảng kê giá trị khối lượng hoàn thành (giai đoạn thực hiện)", unit: "A – B – TVGS" },
      { name: "Phụ lục thanh toán 03a/TT (theo hợp đồng + phát sinh (nếu có))", unit: "A – B", conditional: true },
      { name: "Bản vẽ hoàn công (giai đoạn thực hiện)", unit: "A – B – TVGS" },
      {
        name: "Hồ sơ KCS giai đoạn",
        unit: "A – B – TVGS",
        children: [
          { name: "Nhật ký, biên bản nghiệm thu hoàn thành hạng mục (hoặc khối lượng công việc)" },
          { name: "Kết quả thí nghiệm, kiểm tra, kiểm định vật liệu, cấu kiện, sản phẩm xây dựng, thử nghiệm, chạy thử" },
          { name: "Chủ trương chấp thuận UBND (nếu có)", conditional: true },
          { name: "Biên bản xử lý kỹ thuật (nếu có)", conditional: true },
          { name: "Quyết định phê duyệt tăng, giảm (nếu có)", conditional: true },
          { name: "Phụ lục hợp đồng (nếu có)", conditional: true },
        ],
      },
    ],
  },
  {
    code: "III",
    title: "Phê duyệt khối lượng phát sinh",
    steps: [
      { name: "Chủ trương chấp thuận phát sinh", unit: "Cấp QĐ đầu tư" },
      {
        name: "Biên bản xử lý kỹ thuật",
        unit: "Cơ quan chuyên môn – A – B – TVGS – TK",
        children: [
          {
            name: "Khối lượng phát sinh trong hợp đồng (không vượt tổng mức)",
            unit: "BQL – CĐT",
            // Trong hoặc ngoài hợp đồng là 2 trường hợp loại trừ nhau → điều kiện, bật trường hợp xảy ra
            conditional: true,
            notes:
              "Lập hồ sơ khối lượng phát sinh tăng, giảm; lập báo cáo và trình chủ đầu tư phê duyệt quyết định phát sinh tăng, giảm.",
          },
          {
            name: "Khối lượng phát sinh ngoài hợp đồng (hoặc vượt tổng mức đầu tư)",
            unit: "Tư vấn lập, BQL, Cơ quan chuyên môn, Cấp QĐ đầu tư, A – B",
            conditional: true,
            children: [
              { name: "Lập hồ sơ điều chỉnh", unit: "Tư vấn lập" },
              {
                name: "Lập hồ sơ trình phê duyệt điều chỉnh (hồ sơ thiết kế bổ sung (nếu có))",
                unit: "BQL",
                conditional: true,
              },
              { name: "Báo cáo kết quả thẩm định điều chỉnh", unit: "Cơ quan chuyên môn" },
              { name: "Quyết định phê duyệt điều chỉnh", unit: "Cấp QĐ đầu tư" },
              { name: "Lập phụ lục hợp đồng phát sinh", unit: "A – B" },
            ],
          },
        ],
      },
    ],
  },
  {
    code: "IV",
    title: "Nghiệm thu hoàn thành đưa vào sử dụng",
    steps: [
      {
        name: "Hồ sơ KCS",
        unit: "A – B – TVGS",
        children: [
          { name: "Hợp đồng xây dựng" },
          { name: "Biên bản bàn giao mặt bằng" },
          { name: "Biên bản nghiệm thu vật tư đưa vào công trình" },
          { name: "Biên bản nghiệm thu nội bộ của nhà thầu xây lắp" },
          { name: "Phiếu yêu cầu nghiệm thu" },
          { name: "Biên bản nghiệm thu công việc" },
          { name: "Biên bản xử lý kỹ thuật (nếu có)", conditional: true },
          { name: "Chủ trương phát sinh (nếu có)", conditional: true },
          { name: "Phụ lục gia hạn hợp đồng (nếu có)", conditional: true },
          { name: "Phụ lục phát sinh tăng, giảm (nếu có)", conditional: true },
          { name: "Các kết quả kiểm định, thí nghiệm vật liệu" },
          { name: "Chứng thư thẩm định giá (nếu có)", conditional: true },
          { name: "Báo cáo thực hiện dự án định kỳ, hàng tháng, hàng quý" },
          { name: "Báo cáo chất lượng hoàn thành công trình của tư vấn giám sát, thiết kế và nhà thầu" },
          { name: "Biên bản xác nhận khối lượng hoàn thành theo hợp đồng" },
          { name: "Biên bản xác nhận khối lượng tăng, giảm (nếu có)", conditional: true },
          { name: "Quyết định phê duyệt phát sinh (nếu có khối lượng phát sinh)", conditional: true },
          { name: "Biên bản nghiệm thu hoàn thành đưa vào sử dụng" },
          { name: "Nhật ký công trình" },
          { name: "Bản vẽ hoàn công (kèm theo danh mục; nếu bản vẽ thiết kế chưa có danh mục thì phải bổ sung danh mục theo quy định)" },
        ],
      },
      {
        name: "Bảng khối lượng quyết toán",
        unit: "A – B – TVGS",
        children: [
          { name: "Phụ lục 03a, phụ lục 03c quyết toán" },
          { name: "Bảng tổng hợp khối lượng quyết toán (bao gồm giá trị thực hiện, tăng, giảm)" },
          { name: "Bảng kê giá trị khối lượng hoàn thành theo hợp đồng" },
          { name: "Bảng kê giá trị khối lượng phát sinh tăng, giảm (nếu có)", conditional: true },
        ],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// D. QUY TRÌNH QUY HOẠCH
// ─────────────────────────────────────────────────────────────────────────────
const QUY_HOACH_GROUPS: TemplateGroupDef[] = [
  {
    code: "I",
    title: "Phê duyệt chủ trương quy hoạch",
    steps: [
      { name: "Tờ trình chấp thuận chủ trương lập quy hoạch", unit: "Cơ quan chuyên môn" },
      { name: "Tờ trình chấp thuận chủ trương lập quy hoạch", unit: "UBND phường" },
      { name: "Kết luận của BTV về chấp thuận chủ trương (nếu có)", unit: "BTV", conditional: true },
      {
        name: "Công văn chấp thuận chủ trương hoặc Quyết định chấp thuận chủ trương lập quy hoạch",
        unit: "UBND phường",
      },
    ],
  },
  {
    code: "II",
    title: "Lập nhiệm vụ quy hoạch",
    steps: [
      { name: "Đề cương nhiệm vụ lập quy hoạch (bao gồm khảo sát nếu có)", unit: "Tư vấn lập nhiệm vụ" },
      { name: "Tờ trình phê duyệt đề cương nhiệm vụ lập quy hoạch (bao gồm khảo sát nếu có)", unit: "BQL" },
      { name: "Quyết định phê duyệt đề cương nhiệm vụ lập quy hoạch (bao gồm khảo sát nếu có)", unit: "UBND phường" },
      { name: "Tờ trình phê duyệt kế hoạch lựa chọn nhà thầu tư vấn lập nhiệm vụ quy hoạch", unit: "BQL" },
      { name: "Quyết định phê duyệt kế hoạch lựa chọn nhà thầu tư vấn lập nhiệm vụ quy hoạch", unit: "UBND phường" },
      { name: "Lập thương thảo hợp đồng tư vấn", unit: "BQL – TV lập NV" },
      { name: "Tờ trình chỉ định thầu tư vấn lập nhiệm vụ quy hoạch", unit: "BQL" },
      { name: "Quyết định chỉ định thầu tư vấn lập nhiệm vụ quy hoạch", unit: "UBND phường" },
      { name: "Hợp đồng tư vấn lập nhiệm vụ", unit: "BQL – TV lập NV" },
      { name: "Nhiệm vụ lập quy hoạch", unit: "Tư vấn lập nhiệm vụ" },
    ],
  },
  {
    code: "III",
    title: "Phê duyệt nhiệm vụ quy hoạch",
    steps: [
      { name: "Thông báo lấy ý kiến cộng đồng khu dân cư về nhiệm vụ quy hoạch", unit: "UBND phường" },
      { name: "Lấy ý kiến cơ quan chuyên môn về xây dựng (nếu có)", unit: "Sở Xây dựng", conditional: true },
      {
        name: "Biên bản niêm yết công khai lấy ý kiến cộng đồng dân cư về nhiệm vụ (tối thiểu 20 ngày, tối đa 30 ngày)",
        unit: "UBND phường",
      },
      { name: "Biên bản kết thúc niêm yết lấy ý kiến cộng đồng dân cư về nhiệm vụ", unit: "UBND phường" },
      { name: "Tờ trình thẩm định phê duyệt nhiệm vụ quy hoạch", unit: "BQL" },
      { name: "Báo cáo kết quả thẩm định nhiệm vụ quy hoạch", unit: "P.KTHTĐT" },
      { name: "Tờ trình phê duyệt nhiệm vụ quy hoạch", unit: "P.KTHTĐT" },
      { name: "Quyết định phê duyệt nhiệm vụ quy hoạch", unit: "UBND phường" },
    ],
  },
  {
    code: "IV",
    title: "Lập đồ án quy hoạch",
    steps: [
      { name: "Tờ trình phê duyệt kế hoạch lựa chọn nhà thầu tư vấn lập đồ án quy hoạch", unit: "BQL" },
      { name: "Quyết định phê duyệt kế hoạch lựa chọn nhà thầu tư vấn lập đồ án quy hoạch", unit: "UBND phường" },
      { name: "Lập thương thảo hợp đồng tư vấn", unit: "BQL – TV lập NV" },
      { name: "Tờ trình chỉ định thầu tư vấn lập đồ án quy hoạch", unit: "BQL" },
      { name: "Quyết định chỉ định thầu tư vấn lập đồ án quy hoạch", unit: "UBND phường" },
      { name: "Hợp đồng tư vấn lập đồ án quy hoạch", unit: "BQL – TV lập NV" },
    ],
  },
  {
    code: "V",
    title: "Phê duyệt đồ án quy hoạch",
    steps: [
      { name: "Thông báo lấy ý kiến cộng đồng khu dân cư về đồ án quy hoạch", unit: "UBND phường" },
      { name: "Lấy ý kiến cơ quan chuyên môn về xây dựng (nếu có)", unit: "Sở Xây dựng", conditional: true },
      {
        name: "Biên bản niêm yết công khai lấy ý kiến cộng đồng dân cư về đồ án quy hoạch (tối thiểu 20 ngày, tối đa 30 ngày)",
        unit: "UBND phường",
      },
      { name: "Biên bản kết thúc niêm yết lấy ý kiến cộng đồng dân cư về đồ án quy hoạch", unit: "UBND phường" },
      { name: "Tờ trình thẩm định phê duyệt đồ án quy hoạch", unit: "BQL" },
      { name: "Báo cáo kết quả thẩm định đồ án quy hoạch", unit: "P.KTHTĐT" },
      { name: "Tờ trình phê duyệt đồ án quy hoạch", unit: "P.KTHTĐT" },
      { name: "Quyết định phê duyệt đồ án quy hoạch", unit: "UBND phường" },
    ],
  },
];

function defineTemplate(
  config: Omit<DepartmentTemplate, "badge" | "createSteps" | "shortName"> & {
    shortLabel: string;
    groups: TemplateGroupDef[];
  }
): DepartmentTemplate {
  const { shortLabel, groups, ...rest } = config;
  return {
    ...rest,
    shortName: shortLabel,
    // Không hiện nhãn số bước ở ô chọn quy trình
    badge: "",
    createSteps: () => buildTemplateSteps(rest.id, rest.department, groups),
  };
}

/**
 * Danh mục quy trình thủ tục ĐTXD theo dự thảo.
 * Khóa là tên phòng ban cho quy trình mặc định của phòng ban đó; các quy trình khác khóa theo id.
 */
export const DEPARTMENT_PROCEDURE_TEMPLATES: Record<string, DepartmentTemplate> = {
  [DEPT_KHKT]: defineTemplate({
    id: "template-khkt",
    department: DEPT_KHKT,
    name: "Quy trình chuẩn bị đầu tư",
    shortLabel: "Quy trình chuẩn bị đầu tư",
    description:
      "Chủ trương đầu tư; lập BCNCKT/BCKTKT (dự toán CBĐT, KHLCNT tư vấn, khảo sát); thẩm định giá, thẩm tra thiết kế – dự toán (nếu có); thẩm định và phê duyệt BCNCKT/BCKTKT.",
    tagColor: "blue",
    groups: CHUAN_BI_DAU_TU_GROUPS,
  }),
  [DEPT_DT]: defineTemplate({
    id: "template-dauthau",
    department: DEPT_DT,
    name: "Quy trình đấu thầu",
    shortLabel: "Quy trình đấu thầu",
    description:
      "Kế hoạch lựa chọn nhà thầu; chỉ định thầu rút gọn, chỉ định thầu thông thường, chào hàng cạnh tranh, đấu thầu rộng rãi một giai đoạn một túi / hai túi hồ sơ (bật hình thức áp dụng cho gói thầu).",
    tagColor: "purple",
    groups: DAU_THAU_GROUPS,
  }),
  [DEPT_GSKT]: defineTemplate({
    id: "template-gskt",
    department: DEPT_GSKT,
    name: "Quy trình giám sát",
    shortLabel: "Quy trình giám sát",
    description:
      "Triển khai thi công; hồ sơ nghiệm thu khối lượng hoàn thành giai đoạn; phê duyệt khối lượng phát sinh (nếu có); nghiệm thu hoàn thành đưa vào sử dụng.",
    tagColor: "teal",
    groups: GIAM_SAT_GROUPS,
  }),
  "template-quy-hoach": defineTemplate({
    id: "template-quy-hoach",
    department: DEPT_KHKT,
    name: "Quy trình quy hoạch",
    shortLabel: "Quy trình quy hoạch",
    description:
      "Phê duyệt chủ trương quy hoạch; lập và phê duyệt nhiệm vụ quy hoạch; lập và phê duyệt đồ án quy hoạch (lấy ý kiến cộng đồng dân cư).",
    tagColor: "amber",
    groups: QUY_HOACH_GROUPS,
  }),
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

