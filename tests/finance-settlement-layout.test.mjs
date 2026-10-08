import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const headerSource = readFileSync(
  new URL("../src/features/finance-settlement/components/FinanceHeader.tsx", import.meta.url),
  "utf8",
);

const disbursementSource = readFileSync(
  new URL("../src/features/finance-settlement/components/DisbursementTab.tsx", import.meta.url),
  "utf8",
);

test("finance header separates the primary action from a labelled filter toolbar", () => {
  assert.match(headerSource, /Bộ lọc dữ liệu/);
  assert.match(headerSource, /Lập đề nghị thanh toán/);
  assert.match(headerSource, /border-t border-slate-200/);
});

test("disbursement table keeps actions in the table flow and exposes the result count", () => {
  assert.doesNotMatch(disbursementSource, /fixed:\s*["']right["']/);
  assert.match(disbursementSource, /hồ sơ phù hợp/);
  assert.match(disbursementSource, /tableLayout="fixed"/);
});
