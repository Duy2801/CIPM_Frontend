"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CrownOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Drawer,
  Select,
  Tag,
} from "@/components/ui";
import { cn } from "@/utils/cn";
import { getInitials } from "@/utils/initials";
import { useRoleMatrix } from "../hooks/useRoleMatrix";
import type {
  PersonnelDataset,
  Staff,
  StaffInput,
  Team,
  TeamId,
} from "../types/personnel.types";

interface ChangeRoleDrawerProps {
  open: boolean;
  staff: Staff | null;
  data: PersonnelDataset;
  onClose: () => void;
  onConfirm: (
    staffId: string,
    updateInput: Partial<StaffInput>,
    customMessage?: string | false
  ) => Promise<boolean>;
  onRevokeActingDirector?: (projectId: string, customMessage?: string | false) => Promise<boolean>;
}

export interface CurrentRoleItem {
  id: string;
  title: string;
  source: "title_part" | "acting_project" | "team_lead";
  badge: string;
  departmentName?: string;
  projectId?: string;
  index?: number;
}

export interface AvailableRoleOption {
  id: string;
  title: string;
  roleCode: string;
  label: string;
  isLeader?: boolean;
  teamId?: TeamId | "INDEPENDENT";
  teamName?: string;
  isCustom?: boolean;
}

function getLocalStorageCustomRoles(): AvailableRoleOption[] {
  if (typeof window === "undefined") return [];
  const results: AvailableRoleOption[] = [];
  const seen = new Set<string>();

  const storageKeys = [
    "cipm_custom_roles_matrix_v3",
    "cipm_custom_roles_matrix_v2",
    "cipm_custom_roles_matrix",
    "cipm_custom_roles",
  ];

  for (const k of storageKeys) {
    try {
      const raw = window.localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: any) => {
            if (item && item.isCustom) {
              const name = item.name || item.title || item.label;
              if (name && typeof name === "string") {
                const trimmed = name.trim();
                if (trimmed && !seen.has(trimmed.toLowerCase())) {
                  seen.add(trimmed.toLowerCase());
                  results.push({
                    id: item.code || item.id || `ROLE_STORED_${trimmed}`,
                    roleCode: item.code || "TECHNICAL_OFFICER",
                    title: trimmed,
                    label: trimmed,
                    teamId: item.department ? (item.department as any) : "INDEPENDENT",
                    teamName: item.department || "Vai trò tùy chỉnh / Toàn đơn vị",
                    isLeader: item.group === "lead" || Boolean(item.isLeader),
                    isCustom: true,
                  });
                }
              }
            }
          });
        }
      }
    } catch {
      // ignore
    }
  }
  return results;
}

function getDepartmentRoles(team: Team): AvailableRoleOption[] {
  if (team.id === "BGD") {
    const rolesList =
      team.roles && team.roles.length > 0
        ? team.roles
        : ["Giám đốc", "Thư ký Ban Giám đốc"];
    return rolesList.map((r, idx) => {
      const isAdmin = /giám đốc/i.test(r) && !/phó|thư ký/i.test(r);
      return {
        id: `ROLE_BGD_${idx}`,
        roleCode: isAdmin ? "ADMIN" : "ADMINISTRATIVE_OFFICER",
        title: r,
        isLeader: isAdmin,
        label: r + (isAdmin ? " (Trưởng ban)" : ""),
        teamId: team.id,
        teamName: team.name,
      };
    });
  }

  if (team.id === "PGD") {
    const rolesList =
      team.roles && team.roles.length > 0
        ? team.roles
        : ["Phó Giám đốc", "Thư ký Phó Giám đốc"];
    return rolesList.map((r, idx) => ({
      id: `ROLE_PGD_${idx}`,
      roleCode: "DEPUTY_DIRECTOR",
      title: r,
      isLeader: false,
      label: `${r} BQL`,
      teamId: team.id,
      teamName: team.name,
    }));
  }

  if (team.roles && team.roles.length > 0) {
    const inactiveSet = new Set(
      (team.inactiveRoles || []).map((r) => r.trim().toLowerCase())
    );
    return team.roles
      .filter((r) => {
        const trimmed = r.trim();
        return trimmed && !inactiveSet.has(trimmed.toLowerCase());
      })
      .map((r, idx) => {
        const isLead = idx === 0 || /trưởng|lead|chủ nhiệm|phụ trách/i.test(r);
        let roleCode = "TECHNICAL_OFFICER";
        if (isLead) {
          roleCode =
            team.id === "HCTH"
              ? "CHIEF_ACCOUNTANT"
              : team.id === "BT"
              ? "COMPENSATION_OFFICER"
              : "TECHNICAL_OFFICER";
        } else if (/kế toán|tài chính/i.test(r)) {
          roleCode = /trưởng/i.test(r) ? "CHIEF_ACCOUNTANT" : "ACCOUNTANT";
        } else if (/bồi thường|gpmb|giải tỏa|tái định cư/i.test(r)) {
          roleCode = "COMPENSATION_OFFICER";
        } else if (/hành chính|văn thư|tổng hợp/i.test(r)) {
          roleCode = "ADMINISTRATIVE_OFFICER";
        }

        return {
          id: `ROLE_${team.id}_${idx}`,
          roleCode,
          title: r,
          isLeader: isLead,
          label:
            r +
            (isLead &&
            !r.toLowerCase().includes("lead") &&
            !r.toLowerCase().includes("trưởng")
              ? " (Lead)"
              : ""),
          teamId: team.id,
          teamName: team.name,
        };
      });
  }

  if (team.id === "BT") {
    return [
      {
        id: "ROLE_BT_LEAD",
        roleCode: "COMPENSATION_OFFICER",
        title: "Tổ trưởng Bồi thường – GPMB",
        isLeader: true,
        label: "Tổ trưởng Bồi thường – GPMB (Lead)",
        teamId: team.id,
        teamName: team.name,
      },
      {
        id: "ROLE_BT_DEPUTY",
        roleCode: "COMPENSATION_OFFICER",
        title: "Tổ phó Bồi thường – GPMB",
        isLeader: false,
        label: "Tổ phó Bồi thường – GPMB",
        teamId: team.id,
        teamName: team.name,
      },
      {
        id: "ROLE_BT_MEMBER",
        roleCode: "COMPENSATION_OFFICER",
        title: "Chuyên viên Bồi thường – GPMB",
        isLeader: false,
        label: "Chuyên viên Bồi thường – GPMB",
        teamId: team.id,
        teamName: team.name,
      },
      {
        id: "ROLE_BT_COUNT",
        roleCode: "COMPENSATION_OFFICER",
        title: "Chuyên viên kiểm đếm GPMB",
        isLeader: false,
        label: "Chuyên viên kiểm đếm GPMB",
        teamId: team.id,
        teamName: team.name,
      },
    ];
  }

  if (team.id === "HCTH") {
    return [
      {
        id: "ROLE_HCTH_LEAD",
        roleCode: "CHIEF_ACCOUNTANT",
        title: "Tổ trưởng Hành chính – Tổng hợp",
        isLeader: true,
        label: "Tổ trưởng Hành chính – Tổng hợp (Lead)",
        teamId: team.id,
        teamName: team.name,
      },
      {
        id: "ROLE_HCTH_CHIEF_ACC",
        roleCode: "CHIEF_ACCOUNTANT",
        title: "Kế toán trưởng",
        isLeader: false,
        label: "Kế toán trưởng",
        teamId: team.id,
        teamName: team.name,
      },
      {
        id: "ROLE_HCTH_ACC",
        roleCode: "ACCOUNTANT",
        title: "Kế toán viên (Tài chính)",
        isLeader: false,
        label: "Kế toán viên (Tài chính)",
        teamId: team.id,
        teamName: team.name,
      },
      {
        id: "ROLE_HCTH_ADMIN",
        roleCode: "ADMINISTRATIVE_OFFICER",
        title: "Chuyên viên Hành chính – Tổng hợp",
        isLeader: false,
        label: "Chuyên viên Hành chính – Tổng hợp",
        teamId: team.id,
        teamName: team.name,
      },
    ];
  }

  return [
    {
      id: "ROLE_GSKT_LEAD",
      roleCode: "TECHNICAL_OFFICER",
      title: "Tổ trưởng Giám sát",
      isLeader: true,
      label: "Tổ trưởng Giám sát (Lead)",
      teamId: team.id,
      teamName: team.name,
    },
    {
      id: "ROLE_GSKT_DEP_KT",
      roleCode: "TECHNICAL_OFFICER",
      title: "Tổ phó (Kỹ thuật)",
      isLeader: false,
      label: "Tổ phó (Kỹ thuật)",
      teamId: team.id,
      teamName: team.name,
    },
    {
      id: "ROLE_GSKT_DEP_GS",
      roleCode: "TECHNICAL_OFFICER",
      title: "Tổ phó (Giám sát)",
      isLeader: false,
      label: "Tổ phó (Giám sát)",
      teamId: team.id,
      teamName: team.name,
    },
    {
      id: "ROLE_GSKT_ENG",
      roleCode: "TECHNICAL_OFFICER",
      title: "Kỹ sư Giám sát – Kỹ thuật",
      isLeader: false,
      label: "Kỹ sư Giám sát – Kỹ thuật",
      teamId: team.id,
      teamName: team.name,
    },
    {
      id: "ROLE_GSKT_QLDA",
      roleCode: "TECHNICAL_OFFICER",
      title: "Chuyên viên Quản lý dự án",
      isLeader: false,
      label: "Chuyên viên Quản lý dự án",
      teamId: team.id,
      teamName: team.name,
    },
  ];
}

export default function ChangeRoleDrawer({
  open,
  staff,
  data,
  onClose,
  onConfirm,
  onRevokeActingDirector,
}: ChangeRoleDrawerProps) {
  const { roles: matrixRoles } = useRoleMatrix();
  const [submitting, setSubmitting] = useState(false);

  // 1. Phân rã danh sách các vai trò cán bộ hiện đang nắm giữ
  const currentRoles = useMemo<CurrentRoleItem[]>(() => {
    if (!staff) return [];
    const roles: CurrentRoleItem[] = [];

    const rawTitle = (staff.title || "").trim();
    if (rawTitle) {
      const parts = rawTitle
        .split(/\s*·\s*|\s*,\s*|\s*;\s*/)
        .map((p) => p.trim())
        .filter(Boolean);

      parts.forEach((p, idx) => {
        roles.push({
          id: `title_${idx}_${p}`,
          title: p,
          source: "title_part",
          badge: `Vai trò ${idx + 1}`,
          departmentName: data.teams.find((t) => t.id === staff.teamId)?.name,
          index: idx,
        });
      });
    }

    // Kiểm tra thêm vai trò Quyền Chủ nhiệm dự án (nếu có dự án ủy quyền)
    const actingProjects = data.projects.filter(
      (p) => p.actingDirectorId === staff.id
    );
    actingProjects.forEach((proj) => {
      // Nếu title chưa chứa "Quyền Chủ nhiệm dự án" thì bổ sung vào danh sách
      const alreadyInTitle = roles.some((r) =>
        r.title.toLowerCase().includes("quyền chủ nhiệm")
      );
      if (!alreadyInTitle) {
        roles.push({
          id: `acting_${proj.id}`,
          title: `Quyền Chủ nhiệm dự án (${proj.code})`,
          source: "acting_project",
          badge: "Dự án phụ trách",
          departmentName: proj.name,
          projectId: proj.id,
        });
      }
    });

    if (roles.length === 0) {
      roles.push({
        id: "default_role",
        title: staff.title || "Tổ viên",
        source: "title_part",
        badge: "Vai trò hiện tại",
        departmentName: data.teams.find((t) => t.id === staff.teamId)?.name,
        index: 0,
      });
    }

    return roles;
  }, [staff, data.projects, data.teams]);

  // Vai trò hiện tại được chọn để thay đổi
  const [selectedCurrentRoleId, setSelectedCurrentRoleId] = useState<string>("");

  // Tự động chọn vai trò đầu tiên khi mở drawer hoặc khi danh sách vai trò thay đổi
  useEffect(() => {
    if (open && currentRoles.length > 0) {
      setSelectedCurrentRoleId(currentRoles[0].id);
    }
  }, [open, currentRoles]);

  const selectedCurrentRole = useMemo(() => {
    return (
      currentRoles.find((r) => r.id === selectedCurrentRoleId) ||
      currentRoles[0]
    );
  }, [currentRoles, selectedCurrentRoleId]);

  // 2. Danh sách vai trò mới để lựa chọn
  const [targetTeamId, setTargetTeamId] = useState<string>("SAME");
  const [selectedNewRoleId, setSelectedNewRoleId] = useState<string>("");

  // Đồng bộ phòng ban mục tiêu khi mở drawer
  useEffect(() => {
    if (open && staff) {
      setTargetTeamId(staff.teamId || "GSKT");
    }
  }, [open, staff?.id, staff?.teamId]);

  // Tập hợp danh sách tên các chức danh thuộc phòng ban
  const departmentRoleTitles = useMemo(() => {
    const titles = new Set<string>();
    data.teams.forEach((t) => {
      (t.roles || []).forEach((r) => {
        if (r) titles.add(r.trim().toLowerCase());
      });
      const dRoles = getDepartmentRoles(t);
      dRoles.forEach((r) => {
        if (r.title) titles.add(r.title.trim().toLowerCase());
        if (r.label) titles.add(r.label.trim().toLowerCase());
      });
    });

    [
      "giám đốc",
      "giám đốc ban quản lý",
      "phó giám đốc",
      "phó giám đốc ban quản lý",
      "thư ký ban giám đốc",
      "thư ký phó giám đốc",
      "tổ trưởng giám sát – kỹ thuật",
      "tổ phó (kỹ thuật)",
      "tổ phó (kt)",
      "tổ phó (giám sát)",
      "tổ phó (gs)",
      "kỹ sư giám sát – kỹ thuật",
      "kỹ sư kỹ thuật – giám sát",
      "chuyên viên quản lý dự án",
      "chuyên viên qlda",
      "tổ trưởng bồi thường – gpmb",
      "tổ phó bồi thường – gpmb",
      "chuyên viên bồi thường",
      "chuyên viên bồi thường – gpmb",
      "chuyên viên kiểm đếm",
      "chuyên viên kiểm đếm gpmb",
      "kế toán trưởng",
      "kế toán trưởng / tổ trưởng hcth",
      "tổ trưởng hành chính – tổng hợp",
      "kế toán viên (tài chính)",
      "chuyên viên hành chính – tổng hợp",
      "văn thư lưu trữ",
    ].forEach((t) => titles.add(t.toLowerCase()));

    return titles;
  }, [data.teams]);

  // Các vai trò độc lập hệ thống và tùy chỉnh (CHỈ hiển thị khi chọn Vai trò độc lập)
  const independentRoles = useMemo<AvailableRoleOption[]>(() => {
    const customRoles = getLocalStorageCustomRoles();
    const matrixCustoms: AvailableRoleOption[] = matrixRoles
      .filter((r) => r.isCustom || r.code === "FIMI")
      .filter((r) => {
        const titleLower = r.name.toLowerCase().trim();
        const belongsToDept =
          departmentRoleTitles.has(titleLower) ||
          (Boolean(r.department) &&
            data.teams.some(
              (t) =>
                t.name.toLowerCase() === r.department?.toLowerCase() ||
                t.id.toLowerCase() === r.department?.toLowerCase()
            ));
        return !belongsToDept;
      })
      .map((r) => ({
        id: r.code,
        roleCode: r.code,
        title: r.name,
        label: r.name,
        teamId: "INDEPENDENT",
        teamName: "Vai trò tùy chỉnh / Độc lập",
        isLeader: r.group === "lead",
        isCustom: true,
      }));

    const map = new Map<string, AvailableRoleOption>();
    customRoles
      .filter((r) => !departmentRoleTitles.has(r.title.toLowerCase().trim()))
      .forEach((r) => map.set(r.title.toLowerCase().trim(), r));

    matrixCustoms.forEach((r) => map.set(r.title.toLowerCase().trim(), r));

    return Array.from(map.values());
  }, [matrixRoles, departmentRoleTitles, data.teams]);

  // Danh sách các vai trò mới theo phòng ban đang chọn
  const availableNewRoles = useMemo<AvailableRoleOption[]>(() => {
    if (targetTeamId === "INDEPENDENT") {
      return independentRoles;
    }

    const team = data.teams.find((t) => t.id === targetTeamId);
    if (!team) return independentRoles;

    const baseDeptRoles = getDepartmentRoles(team);
    const extraDeptCustomRoles: AvailableRoleOption[] = [];
    const seenTitles = new Set(baseDeptRoles.map((r) => r.title.toLowerCase().trim()));

    matrixRoles
      .filter(
        (r) =>
          r.isCustom &&
          (r.department?.toLowerCase() === team.name.toLowerCase() ||
            r.department?.toLowerCase() === team.id.toLowerCase())
      )
      .forEach((r) => {
        const titleLower = r.name.toLowerCase().trim();
        if (!seenTitles.has(titleLower)) {
          seenTitles.add(titleLower);
          extraDeptCustomRoles.push({
            id: r.code,
            roleCode: r.code,
            title: r.name,
            label: r.name,
            teamId: team.id,
            teamName: team.name,
            isLeader: r.group === "lead",
            isCustom: true,
          });
        }
      });

    return [...baseDeptRoles, ...extraDeptCustomRoles];
  }, [targetTeamId, data.teams, independentRoles, matrixRoles]);

  // Tự động gán selectedNewRoleId khi đổi phòng ban hoặc mở drawer
  useEffect(() => {
    if (availableNewRoles.length > 0) {
      // Ưu tiên chọn vai trò khác vai trò hiện tại để người dùng dễ thao tác
      const currentTitle = selectedCurrentRole?.title?.toLowerCase() || "";
      const differentRole = availableNewRoles.find(
        (r) => r.title.toLowerCase() !== currentTitle
      );
      setSelectedNewRoleId(differentRole ? differentRole.id : availableNewRoles[0].id);
    }
  }, [availableNewRoles, selectedCurrentRole]);

  const selectedNewRole = useMemo(() => {
    return (
      availableNewRoles.find((r) => r.id === selectedNewRoleId) ||
      availableNewRoles[0]
    );
  }, [availableNewRoles, selectedNewRoleId]);

  // 3. Tính toán kết quả danh sách vai trò sau khi đổi (Preview)
  const previewRoles = useMemo(() => {
    if (!staff || !selectedCurrentRole || !selectedNewRole) {
      return [];
    }

    // Danh sách các phần tử title hiện tại
    const rawTitle = (staff.title || "").trim();
    const parts = rawTitle
      ? rawTitle.split(/\s*·\s*|\s*,\s*|\s*;\s*/).map((p) => p.trim()).filter(Boolean)
      : [];

    if (selectedCurrentRole.source === "title_part" && typeof selectedCurrentRole.index === "number") {
      const nextParts = [...parts];
      if (nextParts.length > selectedCurrentRole.index) {
        nextParts[selectedCurrentRole.index] = selectedNewRole.title;
      } else {
        nextParts.push(selectedNewRole.title);
      }
      return nextParts;
    }

    // Nếu thay thế một vai trò kiêm nhiệm (như Quyền CNDA) bằng một vai trò mới
    const nextParts = parts.filter(
      (p) => !p.toLowerCase().includes(selectedCurrentRole.title.toLowerCase())
    );
    nextParts.push(selectedNewRole.title);
    return nextParts.length > 0 ? nextParts : [selectedNewRole.title];
  }, [staff, selectedCurrentRole, selectedNewRole]);

  // Xử lý lưu thay đổi vai trò
  const handleSave = async () => {
    if (!staff || !selectedCurrentRole || !selectedNewRole) return;

    setSubmitting(true);
    try {
      const finalTitle = previewRoles.join(" · ") || selectedNewRole.title;

      // Xác định roleCode hệ thống tương ứng
      let finalRoleCode = selectedNewRole.roleCode || "TECHNICAL_OFFICER";
      const titleLower = finalTitle.toLowerCase();
      if (/giám đốc/i.test(titleLower) && !/phó|thư ký/i.test(titleLower)) {
        finalRoleCode = "ADMIN";
      } else if (/phó giám đốc/i.test(titleLower)) {
        finalRoleCode = "DEPUTY_DIRECTOR";
      } else if (/kế toán trưởng/i.test(titleLower)) {
        finalRoleCode = "CHIEF_ACCOUNTANT";
      } else if (/kế toán viên/i.test(titleLower)) {
        finalRoleCode = "ACCOUNTANT";
      } else if (/bồi thường|gpmb/i.test(titleLower)) {
        finalRoleCode = "COMPENSATION_OFFICER";
      } else if (/hành chính|văn thư/i.test(titleLower)) {
        finalRoleCode = "ADMINISTRATIVE_OFFICER";
      }

      // Xác định phòng ban
      let finalTeamId: TeamId = staff.teamId;
      if (targetTeamId !== "INDEPENDENT" && targetTeamId !== "SAME") {
        finalTeamId = targetTeamId as TeamId;
      }

      // Xác định quyền lãnh đạo tổ
      const isLeader =
        Boolean(selectedNewRole.isLeader) ||
        previewRoles.some((t) => /trưởng|lead|giám đốc/i.test(t));

      // Nếu vai trò cũ được chọn là Quyền CNDA dự án thì thu hồi quyền tại dự án đó
      if (
        selectedCurrentRole.source === "acting_project" &&
        selectedCurrentRole.projectId &&
        onRevokeActingDirector
      ) {
        await onRevokeActingDirector(selectedCurrentRole.projectId, false);
      }

      const ok = await onConfirm(
        staff.id,
        {
          title: finalTitle,
          roleCode: finalRoleCode,
          teamId: finalTeamId,
          isLeader,
        },
        `Đã đổi vai trò "${selectedCurrentRole.title}" thành "${selectedNewRole.title}" cho cán bộ ${staff.name}!`
      );

      if (ok) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!staff) return null;

  const currentTeam = data.teams.find((t) => t.id === staff.teamId);
  const hasMultipleRoles = currentRoles.length > 1;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="min(680px, 100vw)"
      footer={
        <div className="flex items-center justify-start gap-2.5 w-full px-2 py-1">
          <Button
            intent="primary"
            scale="compact"
            onClick={handleSave}
            loading={submitting}
            className="text-xs font-semibold px-5 shadow-xs !bg-[#DC2626] hover:!bg-[#B91C1C] !border-[#DC2626] !text-white"
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
      }
      title={
        <h3 className="text-base font-bold text-slate-900 leading-snug">
          Đổi vai trò cán bộ
        </h3>
      }
    >
      <div className="space-y-4 pt-1 pb-2">
        {/* THÔNG TIN CÁN BỘ */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
          <div className="flex items-start gap-3">
            <Avatar
              variant="brand"
              shape="circle"
              size={42}
              className="font-bold text-xs shrink-0 mt-0.5"
            >
              {getInitials(staff.name)}
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-900">
                  {staff.name}
                </span>
                <Tag scale="sm" intent="brand" className="font-semibold">
                  {currentTeam?.name || staff.teamId}
                </Tag>
                {staff.employment && (
                  <Tag scale="sm" intent="subtle">
                    {staff.employment}
                  </Tag>
                )}
              </div>

              {/* Danh sách các vai trò hiện tại */}
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-medium text-slate-500">
                  Các vai trò đang giữ:
                </span>
                {currentRoles.map((r) => (
                  <span
                    key={r.id}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200"
                  >
                    <UserOutlined className="text-[10px] text-slate-400" />
                    {r.title}
                  </span>
                ))}
              </div>

              <div className="text-xs text-slate-500 mt-1.5">
                {staff.email}
              </div>
            </div>
          </div>
        </div>

        {/* THIẾT LẬP ĐỔI VAI TRÒ */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3.5">
          {/* 1. Chọn vai trò hiện tại cần đổi */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Chọn vai trò cần đổi:
            </label>
            <Select
              value={selectedCurrentRoleId}
              onChange={(val) => setSelectedCurrentRoleId(val)}
              className="w-full text-xs"
              options={currentRoles.map((role) => ({
                value: role.id,
                label: (
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-800">{role.title}</span>
                    <span className="text-[11px] text-slate-400">
                      {role.departmentName || role.badge}
                    </span>
                  </div>
                ),
              }))}
            />
          </div>

          {/* 2. Chọn Tổ / Bộ phận mới & Vai trò mới */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Tổ / Phòng ban mới:
              </label>
              <Select
                value={targetTeamId}
                onChange={(val) => setTargetTeamId(val)}
                className="w-full text-xs"
                options={[
                  ...data.teams.map((t) => ({
                    value: t.id,
                    label: `${t.name} (${t.id})`,
                  })),
                  {
                    value: "INDEPENDENT",
                    label: "Vai trò độc lập (Không thuộc phòng ban riêng)",
                  },
                ]}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Vai trò mới:
              </label>
              <Select
                value={selectedNewRoleId}
                onChange={(val) => setSelectedNewRoleId(val)}
                className="w-full text-xs"
                options={availableNewRoles.map((r) => ({
                  value: r.id,
                  label: (
                    <div className="flex items-center justify-between gap-1.5 w-full">
                      <div className="flex items-center gap-1.5 truncate">
                        {r.isLeader ? (
                          <CrownOutlined className="text-amber-500 shrink-0" />
                        ) : (
                          <UserOutlined className="text-slate-400 shrink-0" />
                        )}
                        <span
                          className={cn(
                            "truncate",
                            r.isLeader ? "font-bold text-slate-900" : "text-slate-700"
                          )}
                        >
                          {r.label}
                        </span>
                      </div>
                      {r.isCustom && (
                        <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-1 rounded shrink-0">
                          Custom
                        </span>
                      )}
                    </div>
                  ),
                }))}
              />
            </div>
          </div>

          {/* Ghi chú khi chọn vai trò lãnh đạo */}
          {selectedNewRole?.isLeader && (
            <div className="rounded-lg bg-amber-50 border border-amber-200/90 p-2.5 flex items-center gap-2 text-xs text-amber-900">
              <CrownOutlined className="text-amber-600 text-sm shrink-0" />
              <span>
                Cán bộ sẽ được bổ nhiệm làm <strong>{selectedNewRole.title}</strong> (phụ trách lãnh đạo đơn vị).
              </span>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
