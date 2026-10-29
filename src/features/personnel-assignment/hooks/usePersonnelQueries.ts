"use client";

import { useQuery } from "@tanstack/react-query";
import * as personnelApi from "../services/personnel.api";
import { useActivityLogVersion } from "./useActivityLogVersion";
import { roleMatrixKey } from "./useRoleMatrix";

/** Khóa cache dữ liệu nhân sự; sau mỗi thao tác ghi chỉ cần làm mới `personnelKeys.all` */
export const personnelKeys = {
  all: ["personnel"] as const,
  teams: () => [...personnelKeys.all, "teams"] as const,
  staffList: () => [...personnelKeys.all, "staff"] as const,
  staff: (staffId: string) => [...personnelKeys.all, "staff", staffId] as const,
  activity: (staffId: string) => [...personnelKeys.all, "activity", staffId] as const,
};

/** Danh sách phòng ban */
export function useTeams() {
  return useQuery({ queryKey: personnelKeys.teams(), queryFn: personnelApi.getTeams });
}

/** Danh sách cán bộ */
export function useStaffList() {
  return useQuery({ queryKey: personnelKeys.staffList(), queryFn: personnelApi.getStaffList });
}

/** Hồ sơ một cán bộ */
export function useStaff(staffId: string | null | undefined) {
  return useQuery({
    queryKey: personnelKeys.staff(staffId ?? ""),
    queryFn: () => personnelApi.getStaff(staffId!),
    enabled: Boolean(staffId),
  });
}


/** Lịch sử thay đổi hồ sơ cán bộ (bản mock: đọc lại khi nhật ký trình duyệt có dòng mới) */
export function useStaffActivity(staffId: string) {
  const logVersion = useActivityLogVersion();
  return useQuery({
    queryKey: [...personnelKeys.activity(staffId), logVersion],
    queryFn: () => personnelApi.getStaffActivity(staffId),
  });
}

/** Lịch sử thay đổi quyền; làm mới cùng ma trận phân quyền */
export function usePermissionHistory() {
  const logVersion = useActivityLogVersion();
  return useQuery({
    queryKey: [...roleMatrixKey, "history", logVersion],
    queryFn: personnelApi.getPermissionHistory,
  });
}
