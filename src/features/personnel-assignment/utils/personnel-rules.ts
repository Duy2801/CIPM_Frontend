import { daysBetween } from "../../../utils/date.ts";
import { DUE_SOON_DAYS, OVERLOAD_THRESHOLD } from "../constants/personnel-labels.ts";
import type { Assignment, AssignmentFilter, AssignmentInput, Staff } from "../types/personnel.types";

export function isOverdue(assignment: Assignment, today: string): boolean {
  return assignment.status !== "DONE" && assignment.dueDate < today;
}

export function isDueSoon(assignment: Assignment, today: string): boolean {
  if (assignment.status === "DONE") return false;
  const days = daysBetween(today, assignment.dueDate);
  return days >= 0 && days <= DUE_SOON_DAYS;
}

/** Số việc chưa hoàn thành đang giao cho một cán bộ */
export function getWorkload(staffId: string, assignments: Assignment[]): number {
  return assignments.filter((item) => item.assigneeId === staffId && item.status !== "DONE").length;
}

export function isOverloaded(staffId: string, assignments: Assignment[]): boolean {
  return getWorkload(staffId, assignments) >= OVERLOAD_THRESHOLD;
}

export function validateAssignment(input: AssignmentInput, staff: Staff[], today: string): string | undefined {
  if (!input.title.trim()) return "Vui lòng nhập nội dung nhiệm vụ.";
  if (!input.projectId) return "Vui lòng chọn dự án.";
  const assignee = staff.find((item) => item.id === input.assigneeId);
  if (!assignee) return "Vui lòng chọn người thực hiện chính của giai đoạn.";
  if (!assignee.accountActive) return `Tài khoản của ${assignee.name} đang bị khóa, không thể giao việc.`;
  if (input.coAssigneeIds?.includes(input.assigneeId)) {
    return "Người thực hiện chính không được trùng với cán bộ phối hợp.";
  }
  if (input.dueDate && input.dueDate < today) return "Hạn hoàn thành phải từ hôm nay trở đi.";
  return undefined;
}

export function matchesAssignmentFilter(assignment: Assignment, filter: AssignmentFilter, today: string): boolean {
  switch (filter) {
    case "ALL":
      return true;
    case "OVERDUE":
      return isOverdue(assignment, today);
    case "DUE_SOON":
      return isDueSoon(assignment, today);
    case "PENDING_APPROVAL":
      return assignment.status === "PENDING_APPROVAL";
    case "UNASSIGNED":
      return !assignment.assigneeId && assignment.status !== "DONE";
    case "IN_PROGRESS":
      return assignment.status === "IN_PROGRESS";
    case "DONE":
      return assignment.status === "DONE";
  }
}
