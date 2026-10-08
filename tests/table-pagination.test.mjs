import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_LIST_PAGE_SIZE,
  getTablePagination,
} from "../src/components/ui/table-pagination.ts";

test("table pagination defaults to ten rows at the top right", () => {
  assert.equal(DEFAULT_LIST_PAGE_SIZE, 10);
  assert.deepEqual(getTablePagination(undefined), {
    pageSize: 10,
    placement: ["topEnd"],
    showSizeChanger: false,
    hideOnSinglePage: true,
  });
});

test("table pagination keeps an explicit opt-out and caller options", () => {
  assert.equal(getTablePagination(false), false);
  const showTotal = () => "20";
  const pagination = getTablePagination({ pageSize: 20, showTotal });
  assert.equal(pagination.pageSize, 20);
  assert.deepEqual(pagination.placement, ["topEnd"]);
  assert.equal(pagination.showSizeChanger, false);
  assert.equal(pagination.hideOnSinglePage, true);
  assert.equal(pagination.showTotal, showTotal);
});
