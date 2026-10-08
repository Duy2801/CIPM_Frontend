import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../src/features/dashboard/components/ActivityLogSection.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("activity log keeps its pagination in a compact header", () => {
  assert.match(source, /min-h-14 border-b border-slate-100 py-2/);
  assert.match(source, /Pagination/);
});
