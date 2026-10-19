"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Button,
  Drawer,
  Switch,
  Tag,
  toast,
} from "@/components/ui";
import { cn } from "@/utils/cn";
import { getInitials } from "@/utils/initials";
import type { PersonnelDataset, Staff, StaffInput } from "../types/personnel.types";

interface RevokeRoleDrawerProps {
  open: boolean;
  staff: Staff | null;
  data: PersonnelDataset;
  onClose: () => void;
  /** Hiển thị ngay trong drawer chi tiết cán bộ thay vì mở drawer riêng */
  embedded?: boolean;
  onConfirm: (
    staffId: string,
    updateInput: Partial<StaffInput>,
    revokedActingProjectIds?: string[],
    customMessage?: string | false
  ) => Promise<boolean>;
}

interface StaffHoldRole {
  id: string;
  name: string;
  type: "title_role" | "acting_project" | "team_lead";
  label: string;
  badge?: string;
  projectId?: string;
  /** Vai trò đã tắt từ trước (lưu ở staff.revokedRoles) */
  revoked?: boolean;
}

export default function RevokeRoleDrawer({
  open,
  staff,
  data,
  onClose,
  embedded = false,
  onConfirm,
}: RevokeRoleDrawerProps) {
  const [activeRoleIds, setActiveRoleIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const team = useMemo(() => {
    if (!staff) return null;
    return data.teams.find((t) => t.id === staff.teamId);
  }, [staff, data.teams]);

  // Bóc tách danh sách các vai trò / chức danh cán bộ đang nắm giữ
  const currentRoles = useMemo<StaffHoldRole[]>(() => {
    if (!staff) return [];
    const roles: StaffHoldRole[] = [];

    // 1. Tách các vai trò từ chức danh hiện tại (staff.title)
    const rawTitle = (staff.title || "").trim();
    if (rawTitle) {
      const parts = rawTitle
        .split(/\s*·\s*|\s*,\s*|\s*;\s*/)
        .map((p) => p.trim())
        .filter(Boolean);

      parts.forEach((p, idx) => {
        roles.push({
          id: `title_${idx}_${p}`,
          name: p,
          type: "title_role",
          label: `Chức danh phân công tại ${team?.name || "đơn vị"}`,
          badge: team?.name || "Đơn vị",
        });
      });
    }

    // 1b. Vai trò đã tắt trước đó: vẫn hiện trong danh sách ở trạng thái "Đã tắt" để bật lại được
    const activeNames = new Set(roles.map((r) => r.name.toLowerCase()));
    (staff.revokedRoles || [])
      .filter((name) => name.trim() && !activeNames.has(name.trim().toLowerCase()))
      .forEach((name) => {
        roles.push({
          id: `revoked_${name}`,
          name: name.trim(),
          type: "title_role",
          label: "Đã tắt — không tính vào chức danh và quyền hạn",
          badge: team?.name || "Đơn vị",
          revoked: true,
        });
      });

    // 2. Vai trò Quyền Chủ nhiệm dự án (nếu có dự án đang phụ trách)
    const actingProjects = data.projects.filter((p) => p.actingDirectorId === staff.id);
    actingProjects.forEach((proj) => {
      roles.push({
        id: `acting_${proj.id}`,
        name: `Quyền Chủ nhiệm dự án (${proj.code})`,
        type: "acting_project",
        label: `Quyền CNDA tại dự án: ${proj.name}`,
        badge: "Dự án phụ trách",
        projectId: proj.id,
      });
    });

    // 3. Nếu là Lãnh đạo tổ / phòng ban nhưng title chưa phản ánh
    if (team?.leaderId === staff.id) {
      const hasLeadInTitle = roles.some((r) =>
        /trưởng|lead|chủ nhiệm|giám đốc/i.test(r.name)
      );
      if (!hasLeadInTitle) {
        roles.push({
          id: `lead_${team.id}`,
          name: `Tổ trưởng / Trưởng đơn vị (${team.name})`,
          type: "team_lead",
          label: `Phụ trách lãnh đạo đơn vị ${team.name}`,
          badge: "Lãnh đạo đơn vị",
        });
      }
    }

    return roles;
  }, [staff, team, data.projects]);

  // Mở lên: vai trò đang giữ ở trạng thái bật, vai trò đã tắt trước đó giữ trạng thái tắt
  useEffect(() => {
    if (open && staff) {
      setActiveRoleIds(currentRoles.filter((r) => !r.revoked).map((r) => r.id));
    }
  }, [open, staff?.id, currentRoles]);

  const handleToggleActive = (roleId: string, checked: boolean) => {
    setActiveRoleIds((prev) =>
      checked ? [...prev, roleId] : prev.filter((id) => id !== roleId)
    );
  };

  const handleSave = async () => {
    if (!staff) return;

    setSubmitting(true);
    try {
      const activeRoles = currentRoles.filter((r) => activeRoleIds.includes(r.id));
      const inactiveRoles = currentRoles.filter((r) => !activeRoleIds.includes(r.id));

      const remainingTitleParts = activeRoles
        .filter((r) => r.type === "title_role")
        .map((r) => r.name);
      // Vai trò tắt được lưu lại (hiện "Đã tắt" khi mở lại), không tính vào chức danh
      const revokedRoleNames = inactiveRoles
        .filter((r) => r.type === "title_role")
        .map((r) => r.name);

      // Tắt hết vai trò → cán bộ không còn chức danh nào (không tự gán lại vai trò mặc định)
      const finalTitle = remainingTitleParts.join(" · ");

      const revokedActingProjectIds = inactiveRoles
        .filter((r) => r.type === "acting_project" && r.projectId)
        .map((r) => r.projectId as string);

      // Tính toán roleCode hệ thống
      let finalRoleCode = "TECHNICAL_OFFICER";
      const titleLower = finalTitle.toLowerCase();
      if (/giám đốc/i.test(titleLower) && !/phó|thư ký/i.test(titleLower)) {
        finalRoleCode = "ADMIN";
      } else if (/phó giám đốc/i.test(titleLower)) {
        finalRoleCode = "DEPUTY_DIRECTOR";
      } else if (/kế toán trưởng/i.test(titleLower)) {
        finalRoleCode = "CHIEF_ACCOUNTANT";
      } else if (/kế toán viên/i.test(titleLower)) {
        finalRoleCode = "ACCOUNTANT";
      } else if (
        activeRoles.length > 0 &&
        staff.roleCode &&
        staff.roleCode !== "ADMIN" &&
        staff.roleCode !== "DEPUTY_DIRECTOR"
      ) {
        finalRoleCode = staff.roleCode;
      } else {
        if (staff.teamId === "BT") finalRoleCode = "COMPENSATION_OFFICER";
        else if (staff.teamId === "HCTH") finalRoleCode = "ADMINISTRATIVE_OFFICER";
      }

      const isLeader = activeRoles.some((r) => /trưởng|lead|giám đốc/i.test(r.name));

      const ok = await onConfirm(
        staff.id,
        {
          title: finalTitle,
          roleCode: finalRoleCode,
          isLeader,
          accountActive: true,
          revokedRoles: revokedRoleNames,
        },
        revokedActingProjectIds,
        `Đã cập nhật trạng thái vai trò của cán bộ ${staff.name} thành công!`
      );

      if (ok) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!staff) return null;

  const footerContent = (
    <div className="flex items-center justify-start gap-2.5 w-full px-2 py-1">
      <Button
        intent="primary"
        scale="compact"
        onClick={handleSave}
        loading={submitting}
        disabled={currentRoles.length === 0}
        className="text-xs font-semibold px-5 shadow-xs !bg-[#DC2626] hover:!bg-[#B91C1C] !border-[#DC2626] !text-white disabled:!bg-slate-300 disabled:!border-slate-300"
      >
        Lưu thay đổi
      </Button>
      <Button
        intent="outline"
        scale="compact"
        onClick={onClose}
        disabled={submitting}
        className="text-xs font-semibold px-4"
      >
        Đóng
      </Button>
    </div>
  );

  const bodyContent = (
    <div className="space-y-4 pt-1">
      {/* Card hồ sơ cán bộ */}
      {!embedded && (
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar variant="brand" shape="circle" size={44} className="font-bold text-xs shrink-0">
              {getInitials(staff.name)}
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">{staff.name}</span>
                <Tag scale="sm" intent="subtle" className="font-medium">
                  {staff.employment}
                </Tag>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {team?.name} · {staff.email}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Danh sách vai trò với công tắc Bật / Tắt */}
      <div className="space-y-2.5">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Danh sách vai trò & chức danh ({currentRoles.length})
        </div>

        {currentRoles.length === 0 && (
          <p className="m-0 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-3 py-6 text-center text-xs text-slate-400">
            Cán bộ hiện không giữ vai trò nào. Dùng mục &quot;Cấp vai trò&quot; để cấp vai trò.
          </p>
        )}

        <div className="space-y-2">
          {currentRoles.map((role) => {
            const isActive = activeRoleIds.includes(role.id);
            return (
              <div
                key={role.id}
                className={cn(
                  "flex items-center justify-between p-3.5 rounded-xl border transition-all select-none",
                  isActive
                    ? "border-amber-300/80 bg-amber-50/20 shadow-2xs"
                    : "border-slate-200 bg-slate-50/50 opacity-75"
                )}
              >
                <div className="flex items-center gap-3 pr-2 min-w-0">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          "text-xs font-bold transition-colors",
                          isActive ? "text-slate-900" : "text-slate-400 line-through"
                        )}
                      >
                        {role.name}
                      </span>
                      {role.badge && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                          {role.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {role.label}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span
                    className={cn(
                      "text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-colors",
                      isActive
                        ? "bg-amber-50 text-amber-800 border-amber-300"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    )}
                  >
                    {isActive ? "Đang bật" : "Đã tắt"}
                  </span>
                  <Switch
                    checked={isActive}
                    onChange={(checked) => handleToggleActive(role.id, checked)}
                    className={isActive ? "!bg-amber-500 hover:!bg-amber-600" : "!bg-slate-300"}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div className="space-y-3">
        {bodyContent}
        {footerContent}
      </div>
    );
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="min(680px, 100vw)"
      footer={footerContent}
      title={
        <div>
          <h3 className="text-base font-bold text-slate-900 leading-snug">
            Quản lý vai trò cán bộ
          </h3>
          <p className="text-xs text-slate-500 font-normal">
            Bật hoặc tắt các vai trò, chức danh phân công của cán bộ
          </p>
        </div>
      }
    >
      {bodyContent}
    </Drawer>
  );
}
