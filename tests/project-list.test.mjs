import test from "node:test";
import assert from "node:assert/strict";
import {
  applyProcedureSync,
  applyProjectUpdate,
  createProjectItem,
  filterAndSortProjects,
  nextProjectCode,
} from "../src/features/projects_works/utils/project-list.ts";

const base = (over) => ({
  id: "P1",
  code: "BQL-DA-2026-001",
  name: "Kè chống sạt lở",
  type: "Thủy lợi",
  fundingSource: "Ngân sách tỉnh",
  totalInvestment: 100,
  plan2026: 0,
  disbursedAmount: 0,
  managerName: "Phan Thanh Cường",
  supervisorName: "Huỳnh Thái Hải",
  startDate: "2026-01-01",
  endDatePlanned: "2026-12-31",
  currentStage: "PREPARATION",
  actualProgress: 10,
  plannedProgress: 20,
  status: "active",
  progressHistory: [],
  ...over,
});

const filters = (over) => ({ statusFilter: "ALL", selectedType: "ALL", searchTerm: "", sortBy: "latest", ...over });

test("lọc theo trạng thái, loại và từ khóa (không phân biệt hoa thường)", () => {
  const list = [
    base({ id: "A", name: "Trường THCS", type: "Dân dụng" }),
    base({ id: "B", status: "closed" }),
    base({ id: "C", managerName: "Lê Hoàng Sơn" }),
  ];
  assert.deepEqual(filterAndSortProjects(list, filters({ statusFilter: "closed" })).map((p) => p.id), ["B"]);
  assert.deepEqual(filterAndSortProjects(list, filters({ selectedType: "Dân dụng" })).map((p) => p.id), ["A"]);
  assert.deepEqual(filterAndSortProjects(list, filters({ searchTerm: "  hoàng SƠN " })).map((p) => p.id), ["C"]);
});

test("sắp xếp: latest giữ thứ tự, vốn giảm dần, tên tăng dần", () => {
  const list = [base({ id: "A", name: "B", totalInvestment: 5 }), base({ id: "B", name: "A", totalInvestment: 9 })];
  assert.deepEqual(filterAndSortProjects(list, filters()).map((p) => p.id), ["A", "B"]);
  assert.deepEqual(filterAndSortProjects(list, filters({ sortBy: "investment_desc" })).map((p) => p.id), ["B", "A"]);
  assert.deepEqual(filterAndSortProjects(list, filters({ sortBy: "name_asc" })).map((p) => p.id), ["B", "A"]);
});

test("mã dự án tự sinh: BQL-DA-<năm>-###", () => {
  assert.equal(nextProjectCode(0, 2026), "BQL-DA-2026-001");
  assert.equal(nextProjectCode(41, 2026), "BQL-DA-2026-042");
});

test("tạo dự án: giá trị mặc định và dòng lịch sử khởi tạo", () => {
  const p = createProjectItem({ name: "Mới", type: "Giao thông", startDate: "2026-01-01", endDatePlanned: "2026-06-01" }, "X-1", "Hải");
  assert.equal(p.code, "X-1");
  assert.equal(p.status, "active");
  assert.equal(p.nature, "new");
  assert.equal(p.fundingSource, "Ngân sách thành phố");
  assert.equal(p.progressHistory.length, 1);
  assert.equal(p.progressHistory[0].updatedBy, "Hải");
});

test("cập nhật dự án: đổi tiến độ thì thêm lịch sử, đạt 100% thì ghi ngày hoàn thành", () => {
  const p = base({ actualProgress: 50 });
  const same = applyProjectUpdate(p, { ...p }, "Hải");
  assert.equal(same.progressHistory.length, 0);
  const done = applyProjectUpdate(p, { ...p, actualProgress: 100 }, "Hải");
  assert.equal(done.progressHistory.length, 1);
  assert.equal(done.progressHistory[0].newProgress, 100);
  assert.equal(done.actualEndDate, p.endDatePlanned);
});

test("đồng bộ quy trình: không đổi gì thì giữ nguyên dự án", () => {
  const p = base({ departments: ["Tổ A"], actualProgress: 30 });
  assert.equal(applyProcedureSync(p, { departments: ["Tổ A"], actualProgress: 30 }, "Hải"), p);
  const next = applyProcedureSync(p, { departments: ["Tổ A"], actualProgress: 60 }, "Hải");
  assert.equal(next.actualProgress, 60);
  assert.equal(next.progressHistory[0].oldProgress, 30);
});
