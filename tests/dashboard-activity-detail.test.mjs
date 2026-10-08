import test from "node:test";
import assert from "node:assert/strict";

import {
  ACTIVITY_DETAIL_DRAWER_WIDTH,
  buildActivityDetailFacts,
} from "../src/features/dashboard/utils/activity-detail.ts";

const activity = {
  id: "ACT-02",
  time: "13:48 hôm nay",
  actor: "Trần Thị Mỹ Linh",
  content: "Trình ký hồ sơ tạm ứng hợp đồng đợt 2.",
  detailData: {
    docNumber: "TTr-TU-42/BQL",
    value: "8.2 tỷ VNĐ",
    note: "Hồ sơ bảo lãnh tạm ứng đã được thẩm tra hợp lệ.",
  },
};

test("activity detail follows the finance settlement drawer width", () => {
  assert.equal(ACTIVITY_DETAIL_DRAWER_WIDTH, 620);
});

test("activity detail exposes labelled facts for the drawer", () => {
  assert.deepEqual(buildActivityDetailFacts(activity), [
    { label: "Thời gian", value: "13:48 hôm nay" },
    { label: "Người thực hiện", value: "Trần Thị Mỹ Linh" },
    { label: "Số văn bản", value: "TTr-TU-42/BQL" },
    { label: "Giá trị liên quan", value: "8.2 tỷ VNĐ" },
  ]);
});

test("activity detail omits optional facts that have no value", () => {
  assert.deepEqual(
    buildActivityDetailFacts({
      id: "ACT-01",
      time: "14:15 hôm nay",
      actor: "Lê Hồng Đức",
      content: "Cập nhật khối lượng thi công.",
    }),
    [
      { label: "Thời gian", value: "14:15 hôm nay" },
      { label: "Người thực hiện", value: "Lê Hồng Đức" },
    ],
  );
});
