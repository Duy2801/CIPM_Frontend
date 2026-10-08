import assert from "node:assert/strict";
import test from "node:test";

const { getDestroyOnHidden } =
  await import("../src/components/ui/modal-props.ts");

test("modal maps the legacy close cleanup option to the current hidden option", () => {
  assert.equal(getDestroyOnHidden(undefined, true), true);
  assert.equal(getDestroyOnHidden(false, true), false);
});
