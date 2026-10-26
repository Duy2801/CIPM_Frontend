"use client";

import { useMemo } from "react";
import { readStoredRoleItems } from "../services/custom-roles.storage";
import type { Staff, Team } from "../types/personnel.types";
import { buildStaffRoleOptions, toCustomPositions } from "../utils/staff-role-options";
import { useLockedTitles } from "./useLockedTitles";
import { useStaffList, useTeams } from "./usePersonnelQueries";

const EMPTY_TEAMS: Team[] = [];
const EMPTY_STAFF: Staff[] = [];

/** Các vị trí chọn được khi thêm nhân sự (bỏ chức danh đang tắt / đã xóa) */
export function useStaffRoleOptions() {
  const { data: teams = EMPTY_TEAMS } = useTeams();
  const { data: staff = EMPTY_STAFF } = useStaffList();
  const lockedTitles = useLockedTitles();
  return useMemo(
    () => buildStaffRoleOptions(teams, staff, toCustomPositions(readStoredRoleItems()), lockedTitles),
    [teams, staff, lockedTitles],
  );
}
