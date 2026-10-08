import { sortWorkspaceTasks } from "../../../components/workspace/workspace.types.ts";
import type { BidPackage, BiddingRolePermissions, BiddingTask, PackageFilter } from "../types/bidding.types";
import { getBidDeadlineStatus, getContractDeadlineStatus, matchesPackageFilter } from "./bidding-rules.ts";

export function buildBiddingTasks(
  permissions: BiddingRolePermissions,
  packages: BidPackage[],
  today: string,
): BiddingTask[] {
  const count = (filter: PackageFilter) =>
    packages.filter((pkg) => matchesPackageFilter(pkg, filter, today)).length;
  const urgentDeadline = packages.filter((pkg) => getBidDeadlineStatus(pkg, today).state === "DANGER").length;
  const contractLate = packages.filter((pkg) => {
    const state = getContractDeadlineStatus(pkg, today).state;
    return state === "DANGER" || state === "PASSED";
  }).length;

  const tasks: BiddingTask[] = [
    {
      key: "deadline-urgent",
      tone: "danger",
      title: "Hạn nộp hồ sơ dự thầu còn ≤ 3 ngày",
      description: "Chuẩn bị tiếp nhận hồ sơ và mở thầu",
      count: urgentDeadline,
      tab: "packages",
      filter: "DEADLINE",
    },
    {
      key: "deadline",
      tone: "warning",
      title: "Hạn nộp hồ sơ dự thầu còn ≤ 7 ngày",
      description: "Theo dõi số nhà thầu đã nộp hồ sơ",
      count: count("DEADLINE") - urgentDeadline,
      tab: "packages",
      filter: "DEADLINE",
    },
    {
      key: "contract",
      tone: contractLate ? "danger" : "warning",
      title: "Gói thầu cần ký hợp đồng",
      description: "Phải ký trong 30 ngày sau quyết định kết quả",
      count: count("CONTRACT_DUE"),
      tab: "packages",
      filter: "CONTRACT_DUE",
    },
  ];

  if (permissions.canApprove) {
    tasks.push({
      key: "approve",
      tone: "warning",
      title: "Gói thầu chờ bạn phê duyệt",
      description: "KHLCNT (bước 2) hoặc kết quả lựa chọn nhà thầu (bước 8)",
      count: count("PENDING_APPROVAL"),
      tab: "packages",
      filter: "PENDING_APPROVAL",
    });
  }

  if (permissions.canEdit) {
    tasks.push(
      {
        key: "rejected",
        tone: "danger",
        title: "Tờ trình bị trả lại",
        description: "Đọc lý do, chỉnh sửa hồ sơ rồi trình lại",
        count: count("REJECTED"),
        tab: "packages",
        filter: "REJECTED",
      },
      {
        key: "waiting",
        tone: "info",
        title: "Tờ trình đang chờ lãnh đạo duyệt",
        description: "Theo dõi, không cần thao tác",
        count: count("PENDING_APPROVAL"),
        tab: "packages",
        filter: "PENDING_APPROVAL",
      },
    );
  }

  return sortWorkspaceTasks(tasks);
}
