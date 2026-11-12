import test from "node:test";
import assert from "node:assert/strict";
import {
  createInitialForm,
  toProjectFormData,
  validateCreateForm,
} from "../src/features/projects_works/utils/create-project-form.ts";
import {
  formFromProject,
  toEditProjectFormData,
  validateEditForm,
} from "../src/features/projects_works/utils/edit-project-form.ts";
import { validateProgressUpdate } from "../src/features/projects_works/utils/project-progress.ts";

const filledCreate = (over) => ({
  ...createInitialForm("2026-01-01"),
  name: "Đường số 6",
  procedures: { "Tổ Kế hoạch – Kỹ thuật": "template-khkt" },
  endDatePlanned: "2026-06-30",
  ...over,
});

test("thêm dự án: kiểm tra bắt buộc tên, quy trình, ngày kết thúc sau ngày bắt đầu", () => {
  assert.equal(validateCreateForm(filledCreate()), "");
  assert.match(validateCreateForm(filledCreate({ name: "  " })), /tên công trình/);
  assert.match(validateCreateForm(filledCreate({ procedures: {} })), /quy trình/);
  assert.match(validateCreateForm(filledCreate({ endDatePlanned: "2025-12-31" })), /phải sau ngày bắt đầu/);
});

test("thêm dự án: phòng ban lấy theo quy trình đã tích, số tiền trống = 0", () => {
  const data = toProjectFormData(filledCreate({ totalInvestment: "", location: "  " }));
  assert.deepEqual(data.departments, ["Tổ Kế hoạch – Kỹ thuật"]);
  assert.equal(data.totalInvestment, 0);
  assert.equal(data.location, undefined);
  assert.equal(data.currentStage, "PREPARATION");
});

const project = {
  id: "P1",
  code: "BQL-DA-2026-001",
  name: "Kè",
  type: "Thủy lợi",
  fundingSource: "Ngân sách tỉnh",
  totalInvestment: 500,
  plan2026: 0,
  disbursedAmount: 0,
  managerName: "",
  supervisorName: "Lê Hoàng Sơn",
  departments: [],
  startDate: "2026-01-01",
  endDatePlanned: "2026-12-31",
  currentStage: "BIDDING",
  actualProgress: 40,
  plannedProgress: 50,
  status: "active",
};

test("sửa dự án: form từ dự án dùng giá trị mặc định khi thiếu", () => {
  const form = formFromProject(project);
  assert.equal(form.managerName, "Huỳnh Thái Hải");
  assert.deepEqual(form.departments, ["Tổ Giám sát – Kỹ thuật"]);
  assert.equal(form.nature, "transitional");
});

test("sửa dự án: dự án đã đóng không sửa được; dự án mới thì tiến độ thực tế = 0", () => {
  assert.match(validateEditForm(formFromProject(project), { ...project, status: "closed" }), /đã đóng/);
  const data = toEditProjectFormData({ ...formFromProject(project), nature: "new" }, project);
  assert.equal(data.actualProgress, 0);
  assert.equal(data.supervisorName, "Lê Hoàng Sơn");
});

test("cập nhật tiến độ: quyền (Quy tắc 4), 100% phải có ngày hoàn thành (Quy tắc 6), bắt buộc ghi chú", () => {
  const ok = { permission: { allowed: true }, progress: 60, note: "Đổ bê tông", actualEndDate: "" };
  assert.equal(validateProgressUpdate(ok), "");
  assert.match(validateProgressUpdate({ ...ok, permission: { allowed: false, reason: "Không phụ trách" } }), /Không phụ trách/);
  assert.match(validateProgressUpdate({ ...ok, progress: 100 }), /Quy tắc 6/);
  assert.match(validateProgressUpdate({ ...ok, note: " " }), /ghi chú/);
});
