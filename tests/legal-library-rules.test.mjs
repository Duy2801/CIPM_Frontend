import test from "node:test";
import assert from "node:assert/strict";

import { describeLegalChanges } from "../src/features/legal-ai-library/utils/document-changes.ts";
import {
  DEFAULT_LEGAL_FILTERS,
  filterLegalDocuments,
  getCategoryKeys,
} from "../src/features/legal-ai-library/utils/legal-document-filters.ts";
import {
  buildLegalDocument,
  createEmptyLegalForm,
  validateLegalForm,
} from "../src/features/legal-ai-library/utils/legal-document-form.ts";
import { getDocumentHistory } from "../src/features/legal-ai-library/utils/legal-history.ts";

const doc = (overrides) => ({
  id: "D-1",
  code: "1/2024/QH15",
  title: "Luật mẫu",
  category: "LAW",
  issuer: "Quốc hội",
  issueDate: "2024-01-01",
  effectiveDate: "2024-07-01",
  status: "EFFECTIVE",
  scope: "",
  summary: "",
  fileType: "PDF",
  fileSize: "1 MB",
  downloads: 0,
  tags: [],
  updatedAt: "2026-01-01",
  ...overrides,
});

test("filterLegalDocuments matches keywords without accents", () => {
  const docs = [doc({ id: "a", title: "Luật Đất đai" }), doc({ id: "b", title: "Luật Đấu thầu" })];
  const result = filterLegalDocuments(docs, { ...DEFAULT_LEGAL_FILTERS, search: "dat dai" });
  assert.deepEqual(result.map((d) => d.id), ["a"]);
});

test("filterLegalDocuments puts recently added first, then legal rank, then newest update", () => {
  const docs = [
    doc({ id: "decree", category: "DECREE", updatedAt: "2026-05-01" }),
    doc({ id: "law-old", category: "LAW", updatedAt: "2025-01-01" }),
    doc({ id: "law-new", category: "LAW", updatedAt: "2026-01-01" }),
    doc({ id: "added", category: "CIRCULAR" }),
  ];
  const result = filterLegalDocuments(docs, DEFAULT_LEGAL_FILTERS, ["added"]);
  assert.deepEqual(result.map((d) => d.id), ["added", "law-new", "law-old", "decree"]);
});

test("getCategoryKeys appends custom categories after built-in ones", () => {
  const keys = getCategoryKeys([doc({ category: "Công văn" }), doc({ category: "LAW" })]);
  assert.equal(keys.at(-1), "Công văn");
  assert.equal(keys.filter((k) => k === "LAW").length, 1);
});

test("validateLegalForm rejects effective date before issue date", () => {
  const values = { ...createEmptyLegalForm(), code: "1/2024", issueDate: "2024-05-01", effectiveDate: "2024-04-01" };
  assert.match(validateLegalForm(values), /Ngày áp dụng/);
  assert.equal(validateLegalForm({ ...values, effectiveDate: "2024-06-01" }), null);
});

test("buildLegalDocument fills a default title and parses tags", () => {
  const built = buildLegalDocument(
    { ...createEmptyLegalForm(), code: " 5/2024/NĐ-CP ", tags: "Đấu thầu; GPMB,  " },
    [],
  );
  assert.equal(built.code, "5/2024/NĐ-CP");
  assert.equal(built.title, "Nghị định số 5/2024/NĐ-CP");
  assert.deepEqual(built.tags, ["Đấu thầu", "GPMB"]);
});

test("describeLegalChanges shows readable old → new values", () => {
  const [change] = describeLegalChanges(doc(), { status: "EXPIRED" });
  assert.deepEqual(change, { field: "status", label: "Tình trạng hiệu lực", from: "Còn hiệu lực", to: "Hết hiệu lực" });
});

test("getDocumentHistory adds an intake entry only when no creation is logged", () => {
  const document = doc();
  assert.equal(getDocumentHistory([], document)[0].id, "INIT-D-1");

  const logged = [
    { id: "x", at: "2026-02-01T08:00:00Z", actorName: "A", module: "Thư viện pháp lý", action: "Thêm văn bản: 1/2024/QH15", targetId: "D-1" },
  ];
  assert.deepEqual(getDocumentHistory(logged, document).map((e) => e.id), ["x"]);
});
