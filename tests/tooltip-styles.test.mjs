import assert from "node:assert/strict";
import test from "node:test";

const { getTooltipStyles } =
  await import("../src/components/ui/tooltip-styles.ts");

test("tooltip container defaults to white text without overriding caller styles", () => {
  assert.deepEqual(getTooltipStyles(), { container: { color: "#FFFFFF" } });
  assert.deepEqual(
    getTooltipStyles({ container: { color: "#102A43", padding: 8 } }),
    {
      container: { color: "#102A43", padding: 8 },
    },
  );
});
