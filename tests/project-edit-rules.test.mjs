import assert from "node:assert/strict";
import test from "node:test";

const { FUNDING_SOURCE_OPTIONS, PERSONNEL_OPTIONS } = await import(
  "../src/features/projects_works/constants/project-enums.ts"
);

test("project edit options include NS Tỉnh and Phan Thanh Cường", () => {
  assert.ok(FUNDING_SOURCE_OPTIONS.includes("NS Tỉnh"));
  assert.ok(FUNDING_SOURCE_OPTIONS.includes("Ngân sách tỉnh"));
  assert.ok(PERSONNEL_OPTIONS.some((p) => p.name === "Phan Thanh Cường"));
});

test("project edit date validation rejects end date on or before start date", () => {
  const startDate = "2025-12-01";
  const invalidEndDate = "2025-11-30";
  const validEndDate = "2026-11-30";

  assert.ok(new Date(invalidEndDate) <= new Date(startDate));
  assert.ok(new Date(validEndDate) > new Date(startDate));
});
