/**
 * DỮ LIỆU TEST (bản mock): giao toàn bộ bước + bước con của quy trình GPMB cho ông Huỳnh Thái Hải
 * — cả quy trình gốc trong thư viện lẫn bản đã áp dụng ở các dự án — để thử luồng "Việc cần xử lý".
 * Chạy một lần trên mỗi trình duyệt (đánh dấu bằng SEED_FLAG); xóa file này và lời gọi trong
 * procedure-library.ts khi không cần nữa.
 */
import { PERSONNEL_MOCK_DATA } from "../../personnel-assignment/constants/personnel-mock-data.ts";
import { DEPARTMENT_PROCEDURE_TEMPLATES } from "../constants/procedure-department-templates.ts";
import { getTemplateSteps, saveTemplateOverride } from "../constants/procedure-templates.ts";
import type { ProcedureStep, ProjectProcedureData } from "../types/procedure.types";
import { PROCEDURE_PROJECTS_STORAGE_KEY } from "./project-procedure-storage.ts";

const SEED_FLAG = "cipm_seed_gpmb_assignee_hai_v1";
const GPMB_TEMPLATE_ID = "template-gpmb";
const ASSIGNEE_NAME = "Huỳnh Thái Hải";

const isGpmbName = (name?: string) => /giải phóng mặt bằng|gpmb/i.test(name ?? "");

export function seedGpmbAssignee() {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(SEED_FLAG)) return;
    // Đánh dấu trước để các lần đọc thư viện lồng nhau bên dưới không chạy lại
    localStorage.setItem(SEED_FLAG, new Date().toISOString());

    const person = PERSONNEL_MOCK_DATA.staff.find((s) => s.name === ASSIGNEE_NAME);
    if (!person) return;
    const assign = (s: ProcedureStep): ProcedureStep => ({ ...s, assignedTo: person.name, assignedToId: person.id });

    // 1. Quy trình gốc trong thư viện
    const template = Object.values(DEPARTMENT_PROCEDURE_TEMPLATES).find((t) => t.id === GPMB_TEMPLATE_ID);
    if (template) saveTemplateOverride(template.id, getTemplateSteps(template).map(assign));

    // 2. Bản quy trình GPMB đã áp dụng ở các dự án (đọc / ghi thẳng dữ liệu lưu, bước đã hoàn thành giữ nguyên)
    const raw = localStorage.getItem(PROCEDURE_PROJECTS_STORAGE_KEY);
    const projects = raw ? (JSON.parse(raw) as ProjectProcedureData[]) : [];
    if (!Array.isArray(projects) || projects.length === 0) return;
    const updated = projects.map((p) => {
      const gpmbDepartments = new Set(
        Object.entries(p.departmentStatuses ?? {})
          .filter(([, st]) => st?.procedureId === GPMB_TEMPLATE_ID || isGpmbName(st?.procedureName))
          .map(([dept]) => dept),
      );
      if (gpmbDepartments.size === 0) return p;
      return {
        ...p,
        steps: (p.steps ?? []).map((s) =>
          s.department && gpmbDepartments.has(s.department) && s.status !== "COMPLETED" ? assign(s) : s,
        ),
      };
    });
    localStorage.setItem(PROCEDURE_PROJECTS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Không gán được người thực hiện quy trình GPMB", e);
  }
}
