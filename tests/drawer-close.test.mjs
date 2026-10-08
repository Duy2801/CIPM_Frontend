import test from "node:test";
import assert from "node:assert/strict";

import {
  DRAWER_CLOSE_BUTTON_LABEL,
  DRAWER_OVERLAY_Z_INDEX,
  getDrawerSize,
  getDrawerClosable,
  getDrawerZIndex,
} from "../src/components/ui/drawer-close.ts";

test("drawers preserve closable setting without forcing chevron", () => {
  assert.equal(getDrawerClosable(undefined), undefined);
  assert.equal(getDrawerClosable(false), false);
  assert.equal(getDrawerClosable({ placement: "end" }), "end");
  assert.equal(DRAWER_CLOSE_BUTTON_LABEL, "Đóng ngăn chi tiết");
});

test("drawer layers above the fixed application navigation", () => {
  assert.equal(DRAWER_OVERLAY_Z_INDEX, 1200);
  assert.equal(getDrawerZIndex(undefined), 1200);
  assert.equal(getDrawerZIndex(1500), 1500);
});

test("drawer maps legacy widths to the current size API", () => {
  assert.equal(getDrawerSize(undefined, 620), 620);
  assert.equal(getDrawerSize("large", 620), "large");
});
