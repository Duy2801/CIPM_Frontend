import { PERSONNEL_MOCK_DATA } from "@/features/personnel-assignment/constants/personnel-mock-data";
import { hasBackendSession } from "@/features/personnel-assignment/services/backend";
import {
  loadProcedureProjects,
  saveProjectProcedure,
} from "@/features/construction-procedures/utils/project-procedure-storage";
import type { ProcedureStep, ProjectProcedureData } from "@/features/construction-procedures/types/procedure.types";
import {
  loadCustomProfiles,
  saveCustomProfiles,
  type CustomProcedureProfile,
} from "@/features/construction-procedures/constants/procedure-templates";
import { PROCEDURE_CATEGORY } from "@/features/construction-procedures/constants/procedure-categories";
import { approveProcedure } from "@/features/construction-procedures/utils/procedure-library";
import type { ProjectItem } from "@/features/projects_works/types/project.types";
import { useProjectStore } from "@/stores/project.store";

/**
 * Dữ liệu demo (chỉ tài khoản thử nghiệm), nạp đồng bộ cho cả 3 phân hệ để xem tổng quan:
 * - "Quy trình dự án": 2 quy trình mẫu (tuần tự / song song), đã duyệt, đang áp dụng.
 * - "Dự án & Công trình": 2 dự án mẫu, mỗi dự án áp dụng một quy trình trên.
 * - "Việc cần xử lý": các bước giao cho chính người đang đăng nhập, mọi việc đều đang chờ tiếp nhận;
 *   có việc của người khác (cùng lượt, hiện mờ) và việc chưa tới lượt (chưa hiện).
 * Nạp lại khi đổi tài khoản, hoặc khi gọi `resetMyTasksDemo`.
 */

const DEMO_OWNER_KEY = "cipm_my_tasks_demo_owner_v5";
const DEPT = "Tổ Kế hoạch – Kỹ thuật";
const LEAD = "Phan Thanh Cường";
const DEMO_PROJECT_IDS = ["DEMO-VIEC-1", "DEMO-VIEC-2"];
const DEMO_PROCEDURES = [
  { id: "demo-quy-trinh-tuan-tu", name: "Quy trình chuẩn bị đầu tư" },
  { id: "demo-quy-trinh-song-song", name: "Quy trình khảo sát – thiết kế" },
];
const DEMO_PROJECTS = [
  { id: DEMO_PROJECT_IDS[0], code: "DEMO-01", name: "Trường THCS Thuận Yên", location: "Phường Tô Châu" },
  { id: DEMO_PROJECT_IDS[1], code: "DEMO-02", name: "Kè chống sạt lở Mũi Nai", location: "Phường Pháo Đài" },
];
const START_DATE = "2026-10-01";
const END_DATE = "2027-06-30";

type StepSeed = Partial<ProcedureStep> & { code: string; name: string };

function buildSteps(prefix: string, seeds: StepSeed[]): ProcedureStep[] {
  return seeds.map((seed, i) => {
    const root = seed.code.split(".")[0];
    const days = seed.plannedDays ?? 10;
    return {
      id: `${prefix}-${seed.code}`,
      order: i + 1,
      groupCode: root,
      groupTitle: seeds.find((s) => s.code === root)?.name ?? root,
      type: "MANDATORY",
      responsibleUnit: DEPT,
      durationMargin: `${days} ngày`,
      durationDaysMin: days,
      durationDaysMax: days,
      plannedDays: days,
      isEnabled: true,
      status: "IN_PROGRESS",
      department: DEPT,
      attachments: [],
      ...seed,
    };
  });
}

function buildProject(index: number, steps: ProcedureStep[]): ProjectProcedureData {
  const { id, code, name } = DEMO_PROJECTS[index];
  const procedure = DEMO_PROCEDURES[index];
  return {
    projectId: id,
    projectCode: code,
    projectName: name,
    projectType: "Dân dụng",
    totalInvestment: 15_000_000_000,
    managerName: LEAD,
    supervisorName: LEAD,
    startDate: START_DATE,
    expectedFinishDate: END_DATE,
    departments: [DEPT],
    departmentStatuses: {
      [DEPT]: { department: DEPT, procedureId: procedure.id, procedureName: procedure.name, isCompletedByLead: false },
    },
    steps,
    history: [],
  };
}

/** Các bước của 2 quy trình mẫu; `me` là người đang đăng nhập, `others` là cán bộ khác cùng tổ */
function buildDemoSteps(me: string): [ProcedureStep[], ProcedureStep[]] {
  const others = PERSONNEL_MOCK_DATA.staff.map((s) => s.name).filter((n) => n !== me && n !== LEAD);
  const [a, c] = [others[0] ?? "Huỳnh Phú Lợi", others[1] ?? "Trần Minh Ơn"];
  // Mọi việc đều mới giao, chưa ai tiếp nhận: demo từ đầu Tiếp nhận → Đang xử lý → Nộp → Chờ duyệt → Hoàn thành

  // Dự án 1 — làm TUẦN TỰ: lúc đầu chỉ I.1 tới lượt; I.1 được duyệt thì I.2 mới hiện, cứ thế tới I.4 (của mình),
  // I.5 (của người khác: hiện mờ, dự án dừng ở đó) → giai đoạn II
  const p1 = buildSteps("D1", [
    { code: "I", name: "Lập, thẩm định và phê duyệt chủ trương đầu tư" },
    { code: "I.1", name: "Khảo sát hiện trạng khu đất", assignedTo: me },
    { code: "I.2", name: "Lập báo cáo đề xuất chủ trương đầu tư", assignedTo: me },
    { code: "I.3", name: "Dự toán chi phí chuẩn bị đầu tư", assignedTo: me },
    { code: "I.4", name: "Tờ trình phê duyệt chủ trương đầu tư", assignedTo: me },
    { code: "I.5", name: "Lấy ý kiến các sở, ngành liên quan", assignedTo: a },
    { code: "II", name: "Lập báo cáo kinh tế – kỹ thuật" },
    { code: "II.1", name: "Lập nhiệm vụ khảo sát, thiết kế", assignedTo: me },
  ]);

  // Dự án 2 — làm SONG SONG: lượt 1 có 5 bước cùng tới lượt (3 của mình, 2 của người khác hiện mờ);
  // cả 5 bước xong thì giai đoạn II mới tới lượt
  const p2 = buildSteps("D2", [
    { code: "I", name: "Khảo sát, lập báo cáo kinh tế – kỹ thuật" },
    { code: "I.1", name: "Báo cáo khảo sát địa hình", flowStage: 1, assignedTo: me },
    { code: "I.2", name: "Hồ sơ thiết kế bản vẽ thi công", flowStage: 1, assignedTo: me },
    { code: "I.3", name: "Phê duyệt đề cương khảo sát địa chất", flowStage: 1, assignedTo: me },
    { code: "I.4", name: "Dự toán xây dựng công trình", flowStage: 1, assignedTo: c },
    { code: "I.5", name: "Thẩm tra thiết kế cơ sở", flowStage: 1, assignedTo: a },
    { code: "II", name: "Thẩm định, phê duyệt dự án" },
    { code: "II.1", name: "Tờ trình thẩm định báo cáo kinh tế – kỹ thuật", assignedTo: me },
  ]);

  return [p1, p2];
}

/** Dữ liệu quy trình của 2 dự án mẫu */
function buildMyTasksDemo(me: string): ProjectProcedureData[] {
  return buildDemoSteps(me).map((steps, i) => buildProject(i, steps));
}

/** 2 dự án mẫu trong "Dự án & Công trình" */
function buildDemoProjectItems(): ProjectItem[] {
  return DEMO_PROJECTS.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    type: "Dân dụng",
    location: p.location,
    scale: "Dự án mẫu để demo luồng giao việc theo quy trình",
    fundingSource: "Ngân sách thành phố",
    totalInvestment: 15,
    plan2026: 5,
    disbursedAmount: 0,
    managerName: LEAD,
    supervisorName: LEAD,
    departments: [DEPT],
    startDate: START_DATE,
    endDatePlanned: END_DATE,
    currentStage: "PREPARATION",
    actualProgress: 0,
    plannedProgress: 0,
    progressHistory: [],
    note: "Dữ liệu demo",
    status: "active",
    nature: "new",
  }));
}

/** 2 quy trình mẫu trong "Quy trình dự án" (bản gốc, chưa ai làm) */
function buildDemoProcedures(me: string): CustomProcedureProfile[] {
  return buildDemoSteps(me).map((steps, i) => ({
    id: DEMO_PROCEDURES[i].id,
    name: DEMO_PROCEDURES[i].name,
    createdAt: "2026-09-20",
    createdBy: LEAD,
    department: DEPT,
    category: PROCEDURE_CATEGORY.XDCB,
    steps: steps.map((s) => ({ ...s, id: `${DEMO_PROCEDURES[i].id}-${s.code}`, status: "NOT_STARTED" })),
  }));
}

/** Nạp dữ liệu demo cho tài khoản thử nghiệm (lần đầu hoặc khi đổi người đăng nhập); tài khoản thật không đụng tới */
export function ensureMyTasksDemo(me: string): void {
  if (typeof window === "undefined" || !me || hasBackendSession()) return;
  try {
    const hasDemo =
      loadProcedureProjects().some((p) => DEMO_PROJECT_IDS.includes(p.projectId)) &&
      useProjectStore.getState().projects.some((p) => DEMO_PROJECT_IDS.includes(p.id));
    if (hasDemo && localStorage.getItem(DEMO_OWNER_KEY) === me) return;
    resetMyTasksDemo(me);
  } catch (e) {
    console.error("Failed to seed my-tasks demo", e);
  }
}

/** Ghi lại dữ liệu demo từ đầu (bỏ mọi thao tác đã làm trên 2 dự án demo) */
function resetMyTasksDemo(me: string): void {
  // Quy trình mẫu: đã duyệt, đang áp dụng
  const procedureIds = DEMO_PROCEDURES.map((p) => p.id);
  saveCustomProfiles([
    ...loadCustomProfiles().filter((p) => !procedureIds.includes(p.id)),
    ...buildDemoProcedures(me),
  ]);
  procedureIds.forEach((id) => approveProcedure(id, LEAD));
  // Dự án mẫu (đưa lên đầu danh sách)
  useProjectStore
    .getState()
    .setProjects((prev) => [...buildDemoProjectItems(), ...prev.filter((p) => !DEMO_PROJECT_IDS.includes(p.id))]);
  // Quy trình áp dụng cho từng dự án mẫu
  buildMyTasksDemo(me).forEach(saveProjectProcedure);
  localStorage.setItem(DEMO_OWNER_KEY, me);
}
