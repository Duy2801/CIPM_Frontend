import test from "node:test";
import assert from "node:assert/strict";

import { getTopbarPageTitle } from "../src/components/layout/topbar/topbar-page-title.ts";

test("returns the finance page title for the M4 route", () => {
  assert.equal(getTopbarPageTitle("/finance-settlement"), "Tài chính & Quyết toán");
});

test("matches nested routes to their parent page title", () => {
  assert.equal(getTopbarPageTitle("/projects_works/PRJ-001"), "Dự án & Công trình");
});

test("returns the application title for an unknown route", () => {
  assert.equal(getTopbarPageTitle("/unknown"), "Hệ thống Quản lý Dự án");
});

