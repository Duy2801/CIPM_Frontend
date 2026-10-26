"use client";

import { useQuery } from "@tanstack/react-query";
import * as personnelApi from "../services/personnel.api";

/** Khóa cache dữ liệu nhân sự; sau mỗi thao tác ghi chỉ cần làm mới `personnelKeys.all` */
export const personnelKeys = {
  all: ["personnel"] as const,
  teams: () => [...personnelKeys.all, "teams"] as const,
  staffList: () => [...personnelKeys.all, "staff"] as const,
  staff: (staffId: string) => [...personnelKeys.all, "staff", staffId] as const,
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

