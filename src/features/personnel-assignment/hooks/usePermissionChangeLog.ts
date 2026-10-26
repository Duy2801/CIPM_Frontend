"use client";

import { useAuthStore } from "@/stores/auth.store";
import { appendActivity, PERMISSION_LOG_MODULE, type ActivityChange } from "../utils/activity-log";

/** Ghi lịch sử thay đổi quyền: ai, lúc nào, chức danh nào, thay đổi gì (người thực hiện = tài khoản đang đăng nhập) */
export function usePermissionChangeLog() {
  const currentUser = useAuthStore((state) => state.user);

  return (role: { code: string; name: string }, action: string, changes?: ActivityChange[], note?: string) =>
    appendActivity({
      actorName: currentUser?.displayName || currentUser?.name || "Không rõ",
      actorRole: (currentUser as { roleName?: string } | null)?.roleName,
      module: PERMISSION_LOG_MODULE,
      action: `${action}: ${role.name}`,
      targetType: "role",
      targetId: role.code,
      targetName: role.name,
      changes,
      note,
    });
}
