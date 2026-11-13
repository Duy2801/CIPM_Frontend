import { getRoleEffectivePermissions } from "@/access-control";
import { MATRIX_PERMISSIONS } from "../constants/role-matrix-data";
import type { Staff, Team } from "../types/personnel.types";

export interface RbacPermissionItem {
  code: string;
  name: string;
  description: string;
  module?: string;
}

const PERMISSION_CATALOG: RbacPermissionItem[] = MATRIX_PERMISSIONS.map((p) => ({
  code: p.code,
  name: p.name,
  description: p.description,
  module: p.moduleName,
}));

const LEGACY_ROLE_CODES = new Set([
  "ADMIN",
  "DEPUTY_DIRECTOR",
  "TECHNICAL_OFFICER",
  "COMPENSATION_OFFICER",
  "CHIEF_ACCOUNTANT",
  "ACCOUNTANT",
  "ADMINISTRATIVE_OFFICER",
]);

function teamLevelRole(title: string, isLeader: boolean, prefix: "gskt" | "bt"): string {
  const lower = title.toLowerCase();
  if (isLeader || lower.includes("tổ trưởng")) return `role_lead_${prefix}`;
  if (lower.includes("phó")) {
    if (prefix === "bt") return "role_deputy_bt";
    return lower.includes("(gs)") ? "role_deputy_gskt_gs" : "role_deputy_gskt_kt";
  }
  return `role_member_${prefix}`;
}

export function matrixRoleOfStaff(staff: Pick<Staff, "id" | "roleCode" | "title">, team?: Team): string {
  const roleCode = (staff.roleCode || "").trim();
  const title = staff.title || "";
  const lower = title.toLowerCase();
  const isLeader = team?.leaderId === staff.id;

  if (roleCode && !LEGACY_ROLE_CODES.has(roleCode)) return roleCode;
  if (roleCode === "ADMIN") return "role_admin";
  if (roleCode === "DEPUTY_DIRECTOR") return "role_deputy";
  if (roleCode === "CHIEF_ACCOUNTANT") return "role_chief_accountant";
  if (roleCode === "ACCOUNTANT") return /thủ quỹ|công trình/.test(lower) ? "role_accountant_treasurer" : "role_accountant";
  if (roleCode === "ADMINISTRATIVE_OFFICER") return lower.includes("văn thư") ? "role_clerk" : "role_admin_officer";
  if (roleCode === "COMPENSATION_OFFICER") return teamLevelRole(title, isLeader, "bt");
  return teamLevelRole(title, isLeader, "gskt");
}

export function resolveStaffBasePermissions(staff: Staff, team?: Team, titleLocked = false): RbacPermissionItem[] {
  const hasNoTitle = titleLocked || (!(staff.title || "").trim() && !(staff.roleCode || "").trim());
  if (hasNoTitle) return [];
  const granted = new Set<string>(getRoleEffectivePermissions(matrixRoleOfStaff(staff, team)));
  return PERMISSION_CATALOG.filter((p) => granted.has(p.code));
}

export function getAllRbacPermissions(): RbacPermissionItem[] {
  return PERMISSION_CATALOG;
}

export function getStaffEffectivePermissions(
  staff: Pick<Staff, "permissions" | "revokedPermissions">,
  basePermissions: RbacPermissionItem[],
): RbacPermissionItem[] {
  const revoked = new Set(staff.revokedPermissions ?? []);
  const result = basePermissions.filter((p) => !revoked.has(p.code));
  const seen = new Set(result.map((p) => p.code));
  for (const code of staff.permissions ?? []) {
    const perm = PERMISSION_CATALOG.find((p) => p.code === code);
    if (perm && !seen.has(code)) {
      seen.add(code);
      result.push(perm);
    }
  }
  return result;
}
