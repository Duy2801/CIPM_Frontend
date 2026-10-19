"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircleFilled,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Checkbox,
  Drawer,
  Select,
  Tag,
  Text,
  toast,
} from "@/components/ui";
import { cn } from "@/utils/cn";
import { getInitials } from "@/utils/initials";
import { useRoleMatrix } from "../hooks/useRoleMatrix";
import { SYSTEM_ROLE_META } from "../constants/personnel-labels";
import type { PersonnelDataset, Staff, Team, TeamId } from "../types/personnel.types";

interface GrantRoleModalProps {
  open: boolean;
  staff: Staff | null;
  data: PersonnelDataset;
  onClose: () => void;
  onSubmit: (
    staffId: string,
    input: {
      title: string;
      roleCode: string;
      teamId: TeamId;
      isLeader: boolean;
    },
    customMessage?: string | false
  ) => Promise<boolean>;
}

interface RoleItem {
  id: string;
  title: string;
  roleCode: string;
  label: string;
  isLeader?: boolean;
  teamName?: string;
  isCustom?: boolean;
}

function getLocalStorageCustomRoles(): RoleItem[] {
  if (typeof window === "undefined") return [];
  const results: RoleItem[] = [];
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
            // Chỉ lấy các vai trò thực sự là tùy chỉnh
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
                    teamName: item.department || "Vai trò tùy chỉnh / Độc lập",
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

function getDepartmentRoles(team: Team): RoleItem[] {
  if (team.id === "BGD") {
    const rolesList = team.roles && team.roles.length > 0 ? team.roles : ["Giám đốc", "Thư ký Ban Giám đốc"];
    return rolesList.map((r, idx) => {
      const isAdmin = /giám đốc/i.test(r) && !/phó|thư ký/i.test(r);
      return {
        id: `ROLE_BGD_${idx}`,
        roleCode: isAdmin ? "ADMIN" : "ADMINISTRATIVE_OFFICER",
        title: r,
        isLeader: isAdmin,
        label: r + (isAdmin ? " (Trưởng ban)" : ""),
        teamName: team.name,
      };
    });
  }

  if (team.id === "PGD") {
    const rolesList = team.roles && team.roles.length > 0 ? team.roles : ["Phó Giám đốc", "Thư ký Phó Giám đốc"];
    return rolesList.map((r, idx) => ({
      id: `ROLE_PGD_${idx}`,
      roleCode: "DEPUTY_DIRECTOR",
      title: r,
      isLeader: false,
      label: `${r} BQL`,
      teamName: team.name,
    }));
  }

  if (team.roles && team.roles.length > 0) {
    return team.roles.map((r, idx) => {
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
        label: r + (isLead && !r.toLowerCase().includes("lead") && !r.toLowerCase().includes("trưởng") ? " (Lead)" : ""),
        teamName: team.name,
      };
    });
  }

  if (team.id === "BT") {
    return [
      { id: "ROLE_BT_LEAD", roleCode: "COMPENSATION_OFFICER", title: "Tổ trưởng Bồi thường – GPMB", isLeader: true, label: "Tổ trưởng (Lead)", teamName: team.name },
      { id: "ROLE_BT_DEPUTY", roleCode: "COMPENSATION_OFFICER", title: "Tổ phó Bồi thường – GPMB", isLeader: false, label: "Tổ phó", teamName: team.name },
      { id: "ROLE_BT_SPEC", roleCode: "COMPENSATION_OFFICER", title: "Chuyên viên Bồi thường", isLeader: false, label: "Chuyên viên bồi thường", teamName: team.name },
      { id: "ROLE_BT_COUNT", roleCode: "COMPENSATION_OFFICER", title: "Chuyên viên kiểm đếm", isLeader: false, label: "Chuyên viên kiểm đếm", teamName: team.name },
    ];
  }

  if (team.id === "HCTH") {
    return [
      { id: "ROLE_HCTH_LEAD", roleCode: "CHIEF_ACCOUNTANT", title: "Kế toán trưởng / Tổ trưởng HCTH", isLeader: true, label: "Kế toán trưởng / Tổ trưởng (Lead)", teamName: team.name },
      { id: "ROLE_HCTH_ACC", roleCode: "ACCOUNTANT", title: "Kế toán viên (Tài chính)", isLeader: false, label: "Kế toán viên", teamName: team.name },
      { id: "ROLE_HCTH_ADMIN", roleCode: "ADMINISTRATIVE_OFFICER", title: "Chuyên viên Hành chính – Tổng hợp", isLeader: false, label: "Chuyên viên Hành chính", teamName: team.name },
    ];
  }

  return [
    { id: "ROLE_GSKT_LEAD", roleCode: "TECHNICAL_OFFICER", title: "Tổ trưởng Giám sát", isLeader: true, label: "Tổ trưởng (Lead)", teamName: team.name },
    { id: "ROLE_GSKT_DEP_KT", roleCode: "TECHNICAL_OFFICER", title: "Tổ phó (Kỹ thuật)", isLeader: false, label: "Tổ phó (Kỹ thuật)", teamName: team.name },
    { id: "ROLE_GSKT_DEP_GS", roleCode: "TECHNICAL_OFFICER", title: "Tổ phó (Giám sát)", isLeader: false, label: "Tổ phó (Giám sát)", teamName: team.name },
    { id: "ROLE_GSKT_ENG", roleCode: "TECHNICAL_OFFICER", title: "Kỹ sư Giám sát – Kỹ thuật", isLeader: false, label: "Kỹ sư giám sát", teamName: team.name },
    { id: "ROLE_GSKT_QLDA", roleCode: "TECHNICAL_OFFICER", title: "Chuyên viên Quản lý dự án", isLeader: false, label: "Chuyên viên QLDA", teamName: team.name },
  ];
}

export default function GrantRoleModal({
  open,
  staff,
  data,
  onClose,
  onSubmit,
}: GrantRoleModalProps) {
  const { roles: matrixRoles } = useRoleMatrix();
  const [selectedTeamId, setSelectedTeamId] = useState<string>("ALL");
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [storedCustomRoles, setStoredCustomRoles] = useState<RoleItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Cập nhật các vai trò tùy chỉnh từ localStorage khi mở drawer hoặc khi có thay đổi
  useEffect(() => {
    if (open) {
      setStoredCustomRoles(getLocalStorageCustomRoles());
    }

    const handleSync = () => {
      setStoredCustomRoles(getLocalStorageCustomRoles());
    };

    if (typeof window !== "undefined") {
      window.addEventListener("cipm-roles-updated", handleSync);
      window.addEventListener("storage", handleSync);
      return () => {
        window.removeEventListener("cipm-roles-updated", handleSync);
        window.removeEventListener("storage", handleSync);
      };
    }
  }, [open]);

  // Tập hợp danh sách tên các chức danh thuộc phòng ban (từ cấu hình và mặc định của các phòng ban)
  const departmentRoleTitles = useMemo(() => {
    const titles = new Set<string>();
    data.teams.forEach((t) => {
      // 1. Roles cấu hình riêng trong team.roles
      (t.roles || []).forEach((r) => {
        if (r) titles.add(r.trim().toLowerCase());
      });
      // 2. Roles mặc định của phòng ban đó
      const dRoles = getDepartmentRoles(t);
      dRoles.forEach((r) => {
        if (r.title) titles.add(r.title.trim().toLowerCase());
        if (r.label) titles.add(r.label.trim().toLowerCase());
      });
    });

    // Thêm các chức danh cơ bản chắc chắn thuộc phòng ban
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

  // Thu thập các vai trò tùy chỉnh thật sự độc lập (TUYỆT ĐỐI không thuộc bất kỳ phòng ban nào)
  const trulyIndependentCustomRoles = useMemo<RoleItem[]>(() => {
    const map = new Map<string, RoleItem>();

    // 1. Từ ma trận phân quyền
    matrixRoles
      .filter((r) => r.isCustom || r.code === "FIMI" || r.name?.toLowerCase().includes("fimi"))
      .forEach((r) => {
        const titleLower = r.name.toLowerCase().trim();
        const belongsToDept =
          departmentRoleTitles.has(titleLower) ||
          (Boolean(r.department) &&
            data.teams.some(
              (t) =>
                t.name.toLowerCase() === r.department?.toLowerCase() ||
                t.id.toLowerCase() === r.department?.toLowerCase()
            ));

        if (!belongsToDept) {
          map.set(titleLower, {
            id: r.code,
            roleCode: r.code,
            title: r.name,
            label: r.name,
            teamName: "Vai trò độc lập",
            isLeader: r.group === "lead",
            isCustom: true,
          });
        }
      });

    // 2. Từ localStorage
    storedCustomRoles.forEach((r) => {
      const titleLower = r.title.toLowerCase().trim();
      const belongsToDept =
        departmentRoleTitles.has(titleLower) ||
        (Boolean(r.teamName) &&
          data.teams.some(
            (t) =>
              t.name.toLowerCase() === r.teamName?.toLowerCase() ||
              t.id.toLowerCase() === r.teamName?.toLowerCase()
          ));

      if (!belongsToDept && !map.has(titleLower)) {
        map.set(titleLower, {
          ...r,
          teamName: "Vai trò độc lập",
          isCustom: true,
        });
      }
    });

    return Array.from(map.values());
  }, [matrixRoles, storedCustomRoles, departmentRoleTitles, data.teams]);

  // Danh sách các vai trò độc lập (CHỈ hiện các vai trò độc lập thực tế do người dùng tạo, không mock dữ liệu)
  const systemIndependentRoles = useMemo<RoleItem[]>(() => {
    return trulyIndependentCustomRoles;
  }, [trulyIndependentCustomRoles]);

  // Tổng hợp tất cả vai trò trong hệ thống để tra cứu
  const allKnownRolesMap = useMemo(() => {
    const map = new Map<string, RoleItem>();
    systemIndependentRoles.forEach((r) => map.set(r.id, r));
    data.teams.forEach((t) => {
      const teamRoles = getDepartmentRoles(t);
      teamRoles.forEach((r) => map.set(r.id, r));
    });
    return map;
  }, [systemIndependentRoles, data.teams]);

  // Danh sách vai trò hiển thị tương ứng với lựa chọn phòng ban
  const displayedRoles = useMemo<RoleItem[]>(() => {
    if (selectedTeamId === "ALL") {
      return systemIndependentRoles;
    }

    const targetTeam = data.teams.find((t) => t.id === selectedTeamId);
    if (!targetTeam) return systemIndependentRoles;

    const baseDeptRoles = getDepartmentRoles(targetTeam);

    // Thêm các role tùy chỉnh thuộc riêng phòng ban này (nếu có trong matrixRoles)
    const extraDeptCustomRoles: RoleItem[] = [];
    const seenTitles = new Set(baseDeptRoles.map((r) => r.title.toLowerCase().trim()));

    matrixRoles
      .filter(
        (r) =>
          r.isCustom &&
          (r.department?.toLowerCase() === targetTeam.name.toLowerCase() ||
            r.department?.toLowerCase() === targetTeam.id.toLowerCase())
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
            teamName: targetTeam.name,
            isLeader: r.group === "lead",
            isCustom: true,
          });
        }
      });

    return [...baseDeptRoles, ...extraDeptCustomRoles];
  }, [selectedTeamId, systemIndependentRoles, data.teams, matrixRoles]);

  // Khởi tạo vai trò ban đầu khi mở Drawer
  useEffect(() => {
    if (staff && open) {
      // Mặc định chọn phòng ban hiện tại của cán bộ nếu có, ngược lại chọn "ALL"
      const defaultTeamId =
        staff.teamId && data.teams.some((t) => t.id === staff.teamId)
          ? staff.teamId
          : "ALL";
      setSelectedTeamId(defaultTeamId);

      // Khởi tạo các vai trò đang có từ staff.title
      const titleLower = (staff.title || "").toLowerCase();
      const initialMatches: string[] = [];

      allKnownRolesMap.forEach((role, id) => {
        if (titleLower.includes(role.title.toLowerCase())) {
          initialMatches.push(id);
        }
      });

      if (initialMatches.length > 0) {
        setSelectedRoleIds(initialMatches);
      } else {
        const defaultRoles =
          defaultTeamId === "ALL"
            ? systemIndependentRoles
            : getDepartmentRoles(data.teams.find((t) => t.id === defaultTeamId)!);
        if (defaultRoles.length > 0) {
          setSelectedRoleIds([defaultRoles[0].id]);
        }
      }
    }
  }, [staff?.id, open]);

  // Toggle chọn / bỏ chọn vai trò (lưu trữ độc lập, không bị mất khi chuyển phòng ban)
  const handleToggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  // Danh sách các vai trò đang được chọn
  const selectedRoles = useMemo<RoleItem[]>(() => {
    return selectedRoleIds
      .map((id) => allKnownRolesMap.get(id))
      .filter(Boolean) as RoleItem[];
  }, [selectedRoleIds, allKnownRolesMap]);

  // Tự động kết hợp tên chức danh từ các role đã chọn
  const combinedTitle = useMemo(() => {
    if (selectedRoles.length === 0) return "";
    return selectedRoles.map((r) => r.title).join(" · ");
  }, [selectedRoles]);

  const handleConfirm = async () => {
    if (!staff || selectedRoles.length === 0) {
      toast.warning("Vui lòng chọn ít nhất một vai trò để bổ nhiệm!");
      return;
    }
    setSubmitting(true);
    try {
      const finalTitle = combinedTitle || "Chuyên viên";
      const hasAdmin = selectedRoles.some((r) => r.roleCode === "ADMIN");
      const finalRoleCode = hasAdmin ? "ADMIN" : selectedRoles[0].roleCode;

      // Giữ nguyên phòng ban hiện tại của cán bộ nếu chọn "ALL", chỉ đổi khi người dùng chọn phòng ban cụ thể
      const finalTeamId = selectedTeamId === "ALL" ? staff.teamId : (selectedTeamId as TeamId);

      // Giữ nguyên trạng thái lãnh đạo hiện có của cán bộ, tuyệt đối không tự ý đổi phụ trách của người khác
      const isAlreadyLeader = data.teams.find((t) => t.id === staff.teamId)?.leaderId === staff.id;

      const ok = await onSubmit(
        staff.id,
        {
          title: finalTitle,
          roleCode: finalRoleCode,
          teamId: finalTeamId,
          isLeader: isAlreadyLeader,
        },
        `Đã cấp ${selectedRoles.length} vai trò cho cán bộ ${staff.name} thành công!`
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

  // Danh sách lựa chọn phòng ban
  const departmentOptions = [
    {
      value: "ALL",
      label: "Vai trò độc lập (Không thuộc phòng ban riêng)",
    },
    ...data.teams.map((t) => ({
      value: t.id,
      label: `${t.name} (${t.id})`,
    })),
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="min(680px, 100vw)"
      footer={
        <div className="flex items-center justify-start gap-2.5 px-2 py-1">
          <Button
            intent="primary"
            scale="compact"
            onClick={handleConfirm}
            loading={submitting}
            disabled={selectedRoleIds.length === 0}
            className="!bg-[#DC2626] hover:!bg-[#B91C1C] !border-[#DC2626] disabled:!bg-slate-300 disabled:!border-slate-300 text-white text-xs font-semibold px-5 shadow-xs"
          >
            Xác nhận cấp role
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
        <div>
          <h3 className="text-base font-bold text-slate-900 leading-snug">
            Cấp vai trò / Bổ nhiệm cán bộ
          </h3>
          <p className="text-xs text-slate-500 font-normal">
            Phân công vai trò và cập nhật quyền hạn hệ thống cho nhân sự
          </p>
        </div>
      }
    >
      <div className="space-y-4 pt-1">
        {/* Card thông tin cán bộ hiện tại */}
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
                Chức vụ hiện tại: <strong className="text-slate-800">{staff.title}</strong> · {currentTeam?.name}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {staff.email}
              </div>
            </div>
          </div>
        </div>

        {/* Khung cấu hình cấp vai trò */}
        <div className="rounded-xl border border-sky-200/80 bg-sky-50/20 p-4 space-y-4">
          {/* 1. Chọn phòng ban / tổ chuyên môn hoặc Toàn đơn vị */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block mb-1.5">
              1. Lọc theo phòng ban / Vai trò độc lập:
            </label>
            <Select
              value={selectedTeamId}
              onChange={(val) => setSelectedTeamId(val)}
              className="w-full text-xs"
              options={departmentOptions}
            />
          </div>

          {/* 2. Chọn các vai trò bổ nhiệm (Cho phép tích nhiều vai trò) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                2. Chọn các vai trò bổ nhiệm:
              </label>
              <span className="text-xs font-semibold text-[#0F4C81]">
                Đã chọn: {selectedRoleIds.length} vai trò
              </span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {displayedRoles.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  Chưa có vai trò độc lập nào được thiết lập.
                </div>
              ) : (
                displayedRoles.map((r) => {
                const isChecked = selectedRoleIds.includes(r.id);
                return (
                  <div
                    key={r.id}
                    onClick={() => handleToggleRole(r.id)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none",
                      isChecked
                        ? "bg-sky-50/80 border-sky-300 shadow-2xs"
                        : "bg-white border-slate-200/80 hover:bg-slate-50/80 hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isChecked}
                        onChange={() => handleToggleRole(r.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <span>{r.title}</span>
                          {r.isCustom && (
                            <span className="text-[10px] bg-sky-100 text-[#0F4C81] font-semibold px-1.5 py-0.2 rounded border border-sky-200">
                              Vai trò tùy chỉnh
                            </span>
                          )}
                          {r.teamName && !r.isCustom && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-1.5 py-0.2 rounded border border-slate-200">
                              {r.teamName}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Vai trò hệ thống: <strong className="text-slate-700 font-medium">{r.isCustom || r.roleCode.startsWith("CUSTOM_") ? (r.title || "Vai trò tùy chỉnh") : (SYSTEM_ROLE_META[r.roleCode]?.label || r.roleCode)}</strong>
                        </div>
                      </div>
                    </div>
                    {isChecked && (
                      <span className="text-xs font-semibold text-[#0F4C81] flex items-center gap-1 shrink-0">
                        <CheckCircleFilled className="text-sm" />
                      </span>
                    )}
                  </div>
                );
              }))}
            </div>
          </div>

          {/* Tổng kết các vai trò đã chọn (KHÔNG CÓ DẤU X) */}
          {selectedRoles.length > 0 && (
            <div className="p-3 rounded-xl bg-white border border-sky-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Chức danh tổng hợp sau khi cấp:
                </span>
                <span className="text-[11px] font-semibold text-[#0F4C81]">
                  {selectedRoles.length} vai trò
                </span>
              </div>
              <div className="text-xs font-bold text-[#0F4C81] leading-relaxed bg-sky-50/60 p-2 rounded-lg border border-sky-100">
                {combinedTitle}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                {selectedRoles.map((r) => (
                  <span
                    key={r.id}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white text-[#0F4C81] border border-sky-200 shadow-2xs"
                  >
                    {r.title}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
