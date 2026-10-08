import type { ActivityItem } from "../constants/dashboard-mock-data";

export const ACTIVITY_DETAIL_DRAWER_WIDTH = "min(680px, 100vw)";

export interface ActivityDetailFact {
  label: string;
  value: string;
}

export function buildActivityDetailFacts(activity: ActivityItem): ActivityDetailFact[] {
  const facts: ActivityDetailFact[] = [
    { label: "Mã nhật ký", value: activity.id },
    { label: "Thời gian ghi nhận", value: activity.time },
  ];

  if (activity.actionType) {
    facts.push({ label: "Loại thao tác", value: activity.actionType });
  }

  if (activity.status) {
    facts.push({ label: "Trạng thái", value: activity.status });
  }

  if (activity.detailData?.docNumber) {
    facts.push({ label: "Số văn bản / Căn cứ", value: activity.detailData.docNumber });
  }

  if (activity.detailData?.docDate) {
    facts.push({ label: "Ngày ban hành / lập", value: activity.detailData.docDate });
  }

  if (activity.detailData?.value) {
    facts.push({ label: "Giá trị liên quan", value: activity.detailData.value });
  }

  return facts;
}

