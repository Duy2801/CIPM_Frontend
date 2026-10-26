"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui";
import { useAuthStore } from "@/stores/auth.store";
import * as personnelApi from "../services/personnel.api";
import type { TeamInput } from "../services/personnel.api";
import type { Staff, StaffInput, Team } from "../types/personnel.types";
import { appendActivity, type ActivityChange } from "../utils/activity-log";
import { personnelKeys } from "./usePersonnelQueries";

/** Câu báo thành công: bỏ trống = dùng câu mặc định, false = không báo */
type SuccessText = string | false | undefined;
type LogEntry = Omit<Parameters<typeof appendActivity>[0], "actorName" | "actorRole">;

/** Ghi nhật ký thao tác; người thực hiện lấy theo tài khoản đang đăng nhập */
function useActivityLogger() {
  const currentUser = useAuthStore((state) => state.user);
  return (entry: LogEntry) =>
    appendActivity({
      ...entry,
      actorName: currentUser?.displayName || currentUser?.name || "Không rõ",
      actorRole: (currentUser as { roleName?: string } | null)?.roleName,
    });
}

/**
 * Khung chung cho thao tác ghi: gọi API → làm mới dữ liệu nhân sự → báo thành công → ghi nhật ký.
 * `run` trả về kết quả khi thành công, null khi lỗi (đã báo lỗi bằng toast).
 */
function usePersonnelAction<TVars, TResult>(
  action: (vars: TVars) => Promise<TResult>,
  options: {
    successText: (vars: TVars, result: TResult) => SuccessText;
    log?: (vars: TVars, result: TResult) => LogEntry | null;
  },
) {
  const queryClient = useQueryClient();
  const logActivity = useActivityLogger();
  const mutation = useMutation({ mutationFn: action });

  const run = async (vars: TVars): Promise<TResult | null> => {
    try {
      const result = await mutation.mutateAsync(vars);
      await queryClient.invalidateQueries({ queryKey: personnelKeys.all });
      const text = options.successText(vars, result);
      if (text) toast.success(text);
      const entry = options.log?.(vars, result);
      if (entry) logActivity(entry);
      return result;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể hoàn tất thao tác, vui lòng thử lại.");
      return null;
    }
  };

  return { run, isPending: mutation.isPending, error: mutation.error };
}

const teamNameIn = (teams: Team[], id?: string) => teams.find((t) => t.id === id)?.name ?? id ?? "";

// ── Cán bộ ──

export function useCreateStaff() {
  return usePersonnelAction(
    async (input: StaffInput) => {
      const created = await personnelApi.createStaff(input);
      return { created, teams: await personnelApi.getTeams() };
    },
    {
      successText: (input) => `Đã thêm cán bộ ${input.name.trim()} vào hệ thống.`,
      log: (input, { created, teams }) => ({
        module: "Nhân sự",
        action: "Thêm cán bộ mới",
        targetType: "staff",
        targetId: created?.id,
        targetName: input.name.trim(),
        changes: [
          { label: "Chức danh", to: input.title || "Chưa có chức danh" },
          { label: "Phòng ban", to: teamNameIn(teams, input.teamId) },
          { label: "Email công vụ", to: input.email },
        ],
      }),
    },
  );
}

const STAFF_FIELD_LABELS: { key: keyof StaffInput; label: string; isTeam?: boolean; emptyText?: string }[] = [
  { key: "name", label: "Họ và tên" },
  { key: "title", label: "Chức danh", emptyText: "Chưa có chức danh" },
  { key: "teamId", label: "Phòng ban", isTeam: true },
  { key: "email", label: "Email công vụ" },
  { key: "phone", label: "Số điện thoại" },
  { key: "employment", label: "Hình thức tuyển dụng" },
  { key: "gender", label: "Giới tính" },
  { key: "dob", label: "Ngày sinh" },
  { key: "citizenId", label: "Số CCCD" },
];

/** So sánh hồ sơ trước / sau khi sửa → danh sách thay đổi để ghi nhật ký */
function diffStaff(before: Staff, input: Partial<StaffInput>, teams: Team[]): ActivityChange[] {
  const changes: ActivityChange[] = [];
  const text = (v: unknown) => (v === undefined || v === null ? "" : String(v).trim());
  STAFF_FIELD_LABELS.forEach(({ key, label, isTeam, emptyText }) => {
    if (!(key in input)) return;
    const from = text((before as unknown as Record<string, unknown>)[key]);
    const to = text(input[key]);
    if (from === to) return;
    const format = (v: string) => (isTeam ? teamNameIn(teams, v) : emptyText ? v || emptyText : v || "Trống");
    changes.push({ label, from: format(from), to: format(to) });
  });
  if ("permissions" in input || "revokedPermissions" in input) {
    const sameList = (a?: string[], b?: string[]) => [...(a ?? [])].sort().join() === [...(b ?? [])].sort().join();
    if (!sameList(before.permissions, input.permissions) || !sameList(before.revokedPermissions, input.revokedPermissions)) {
      changes.push({
        label: "Quyền hạn riêng",
        from: `cấp thêm ${before.permissions?.length ?? 0}, thu hồi ${before.revokedPermissions?.length ?? 0}`,
        to: `cấp thêm ${input.permissions?.length ?? 0}, thu hồi ${input.revokedPermissions?.length ?? 0}`,
      });
    }
  }
  if ("customFields" in input && JSON.stringify(before.customFields ?? {}) !== JSON.stringify(input.customFields ?? {})) {
    changes.push({ label: "Thông tin bổ sung", from: "Trước khi sửa", to: "Đã cập nhật" });
  }
  return changes;
}

export function useUpdateStaff() {
  return usePersonnelAction(
    async ({ staffId, input }: { staffId: string; input: Partial<StaffInput>; successText?: SuccessText }) => {
      // Lấy hồ sơ "trước" khi sửa để ghi nhật ký thay đổi
      const [before, teams] = await Promise.all([personnelApi.getStaff(staffId), personnelApi.getTeams()]);
      await personnelApi.updateStaff(staffId, input);
      return { before, teams };
    },
    {
      successText: ({ successText }, { before }) =>
        successText === false ? false : successText || `Đã cập nhật thông tin / chức danh của cán bộ ${before.name}.`,
      log: ({ staffId, input }, { before, teams }) => {
        const changes = diffStaff(before, input, teams);
        if (changes.length === 0) return null;
        const labels = new Set(changes.map((c) => c.label));
        const action = labels.has("Chức danh") || labels.has("Phòng ban")
          ? "Cập nhật chức danh / phòng ban"
          : labels.has("Quyền hạn riêng")
          ? "Cập nhật quyền hạn riêng"
          : "Cập nhật thông tin cá nhân";
        return { module: "Nhân sự", action, targetType: "staff", targetId: staffId, targetName: before.name, changes };
      },
    },
  );
}

// ── Tài khoản ──

export function useLockAccount() {
  return usePersonnelAction(
    async ({ staffId, reason }: { staffId: string; reason: string }) => {
      const before = await personnelApi.getStaff(staffId);
      await personnelApi.setAccountActive(staffId, false, reason);
      return before;
    },
    {
      successText: (_, staff) => `Đã khóa tài khoản của ${staff.name}.`,
      log: ({ staffId, reason }, staff) => ({
        module: "Nhân sự",
        action: "Khóa tài khoản",
        targetType: "staff",
        targetId: staffId,
        targetName: staff.name,
        changes: [{ label: "Tài khoản", from: "Đang hoạt động", to: "Đang khóa" }],
        note: reason ? `Lý do: ${reason}` : undefined,
      }),
    },
  );
}

export function useUnlockAccount() {
  return usePersonnelAction(
    async (staffId: string) => {
      const before = await personnelApi.getStaff(staffId);
      await personnelApi.setAccountActive(staffId, true);
      return before;
    },
    {
      successText: (_, staff) => `Đã mở lại tài khoản của ${staff.name}.`,
      log: (staffId, staff) => ({
        module: "Nhân sự",
        action: "Mở lại tài khoản",
        targetType: "staff",
        targetId: staffId,
        targetName: staff.name,
        changes: [{ label: "Tài khoản", from: "Đang khóa", to: "Đang hoạt động" }],
      }),
    },
  );
}

// ── Phòng ban ──

export function useCreateTeam() {
  return usePersonnelAction(
    ({ team }: { team: TeamInput & { name: string }; successText?: SuccessText }) => personnelApi.createTeam(team),
    {
      successText: ({ team, successText }) =>
        successText === false ? false : successText || `Đã thêm phòng ban / tổ chuyên môn "${team.name.trim()}".`,
    },
  );
}

export function useUpdateTeam() {
  return usePersonnelAction(
    async ({ teamId, input }: { teamId: string; input: TeamInput; successText?: SuccessText }) => {
      const beforeName = teamNameIn(await personnelApi.getTeams(), teamId);
      const updated = await personnelApi.updateTeam(teamId, input);
      return { updated, beforeName };
    },
    {
      successText: ({ teamId, input, successText }) =>
        successText === false
          ? false
          : successText || `Đã cập nhật thông tin phòng ban / tổ chuyên môn "${input.name?.trim() || teamId}".`,
      // Chỉ ghi nhật ký khi đổi tên phòng ban
      log: ({ teamId, input }, { beforeName }) => {
        const after = input.name?.trim();
        if (!after || after === beforeName) return null;
        return {
          module: "Nhân sự",
          action: "Cập nhật phòng ban",
          targetType: "team",
          targetId: teamId,
          targetName: after,
          changes: [{ label: "Tên phòng ban", from: beforeName, to: after }],
        };
      },
    },
  );
}
