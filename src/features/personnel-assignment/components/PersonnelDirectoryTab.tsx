"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AppstoreOutlined,
  EditOutlined,
  InfoCircleOutlined,
  RightOutlined,
  SaveOutlined,
  SearchOutlined,
  UnlockOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { App } from "antd";
import { Button, Card, Flex, Input, Select, Table, Text, Tooltip } from "@/components/ui";
import type { ColumnsType } from "@/components/ui";
import { SectionIntro } from "@/components/workspace";
import { getInitials } from "@/utils/initials";
import { normalizeSearchText } from "@/utils/search-text";
import { SYSTEM_ROLE_META } from "../constants/personnel-labels";
import { useRoleMatrix } from "../hooks/useRoleMatrix";
import { isStaffTitleLocked, useLockedTitles } from "../hooks/useLockedTitles";
import type { PersonnelController } from "../hooks/usePersonnelAssignment";
import type { CustomFieldDefinition } from "../types/custom-fields.types";
import type { PersonnelProject, Staff, Team } from "../types/personnel.types";
import { getCustomFields, subscribeCustomFieldsChange } from "../utils/custom-fields-storage";
import { sortStaffByRank } from "../utils/personnel-sorting";
import RolePermissionMatrixModal from "./RolePermissionMatrixModal";
import StaffModal from "./StaffModal";
import StaffProjectRoleModal from "./StaffProjectRoleModal";
import { useConfirmAction } from "../hooks/useConfirmAction";

interface PersonnelDirectoryTabProps {
  controller: PersonnelController;
  onLockAccount: (person: Staff) => void;
}

type AccountStatusFilter = "ALL" | "ACTIVE" | "LOCKED";

function loadAllCustomRolesMap(): Map<string, string> {
  const map = new Map<string, string>();
  if (typeof window === "undefined") return map;

  const storageKeys = [
    "cipm_custom_roles_matrix_v3",
    "cipm_custom_roles_matrix_v2",
    "cipm_custom_roles_matrix",
    "cipm_custom_roles",
    "cipm_roles",
  ];

  for (const k of storageKeys) {
    try {
      const raw = window.localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: { code?: string; id?: string; name?: string; title?: string; label?: string; shortName?: string }) => {
            const code = item.code || item.id;
            const name = item.name || item.title || item.label || item.shortName;
            if (code && name) {
              map.set(String(code).trim(), String(name).trim());
            }
          });
        }
      }
    } catch {
      // ignore
    }
  }

  return map;
}

/** Chú thích chấm màu ở cột Tài khoản */
const ACCOUNT_STATUS_LEGEND = [
  { key: "active", label: "Đang hoạt động", dotClass: "bg-emerald-500", ringClass: "ring-emerald-100" },
  {
    key: "noAccess",
    label: "Đang hoạt động nhưng tài khoản chưa có quyền (chưa có chức danh hoặc chức danh đang tắt)",
    dotClass: "bg-amber-400",
    ringClass: "ring-amber-100",
  },
  { key: "locked", label: "Đang khóa", dotClass: "bg-rose-500", ringClass: "ring-rose-100" },
] as const;

function getStaffDisplayRoles(
  staff: Staff,
  rolesMap: Map<string, string>,
  projects: PersonnelProject[]
): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  const resolveText = (text: string): string => {
    let clean = text.trim();
    if (!clean) return "";

    // Nếu mã trùng khớp trong từ điển vai trò tùy chỉnh
    if (rolesMap.has(clean)) {
      return rolesMap.get(clean)!;
    }

    // Nếu chứa mã CUSTOM_\d+ thì thay thế bằng tên thật
    if (/CUSTOM_\d+/i.test(clean)) {
      clean = clean.replace(/CUSTOM_\d+/gi, (matched) => {
        return rolesMap.get(matched) || "Chức danh tùy chỉnh";
      });
    }

    // Nếu trùng mã hệ thống
    if (SYSTEM_ROLE_META[clean]) {
      return SYSTEM_ROLE_META[clean].label;
    }

    return clean;
  };

  const addRole = (roleStr: string) => {
    const resolved = resolveText(roleStr);
    if (!resolved) return;
    const key = resolved.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(resolved);
    }
  };

  // 1. Lấy danh sách các vai trò từ staff.title (ngăn cách bởi dấu ·, ;, hoặc xuống dòng)
  const rawTitle = (staff.title || "").trim();
  if (rawTitle) {
    rawTitle
      .split(/\s*·\s*|\s*;\s*|\r?\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .forEach((p) => addRole(p));
  }

  // 2. Nếu cán bộ được gán vai trò tùy chỉnh qua roleCode (dạng CUSTOM_...)
  if (staff.roleCode) {
    const rCode = staff.roleCode.trim();
    if (/CUSTOM_\d+/i.test(rCode)) {
      const customName = rolesMap.get(rCode) || "Chức danh tùy chỉnh";
      // Nếu hiện tại chỉ có chức danh mặc định "Thành viên", ưu tiên thay thế bằng tên vai trò mới
      if (result.length === 1 && result[0].toLowerCase() === "thành viên") {
        result[0] = customName;
        seen.clear();
        seen.add(customName.toLowerCase().trim());
      } else if (!seen.has(customName.toLowerCase().trim())) {
        addRole(customName);
      }
    }
  }

  // 3. Nếu cán bộ là Quyền Chủ nhiệm dự án (ủy quyền thực tế từ các dự án)
  const actingProjects = projects.filter((p) => p.actingDirectorId === staff.id);
  actingProjects.forEach((proj) => {
    const actingTitle = `Quyền CNDA (${proj.code})`;
    if (!result.some((r) => r.toLowerCase().includes("quyền cnda") || r.toLowerCase().includes("quyền chủ nhiệm"))) {
      addRole(actingTitle);
    }
  });

  // Không có vai trò nào (VD: đã thu hồi hết) → trả về rỗng, cột Vai trò hiện "Chưa có vai trò"
  return result;
}

export default function PersonnelDirectoryTab({ controller, onLockAccount }: PersonnelDirectoryTabProps) {
  const { modal } = App.useApp();
  const confirmAction = useConfirmAction();
  const { data, staff, permissions } = controller;
  const canManageAccounts = permissions.canManageAccounts;
  const canManageTeams = permissions.canManageAccounts || permissions.canManageOrganization;

  const { roles: matrixRoles } = useRoleMatrix();
  const lockedTitles = useLockedTitles();
  const [customRolesMap, setCustomRolesMap] = useState<Map<string, string>>(() => loadAllCustomRolesMap());

  useEffect(() => {
    const handleUpdate = () => setCustomRolesMap(loadAllCustomRolesMap());
    handleUpdate();
    window.addEventListener("cipm-roles-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("cipm-roles-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const resolvedRolesMap = useMemo(() => {
    const map = new Map<string, string>(customRolesMap);
    matrixRoles.forEach((r) => {
      if (r.code && r.name) map.set(r.code, r.name);
    });
    return map;
  }, [customRolesMap, matrixRoles]);

  const [configuredTeamFields, setConfiguredTeamFields] = useState<CustomFieldDefinition[]>(() => getCustomFields("team"));
  useEffect(() => {
    return subscribeCustomFieldsChange((target, fields) => {
      if (target === "team") setConfiguredTeamFields(fields);
    });
  }, []);

  // Bộ lọc
  const [selectedTeamId, setSelectedTeamId] = useState<string>("ALL");
  const [accountStatus, setAccountStatus] = useState<AccountStatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal / Drawer — lưu id để drawer luôn hiển thị dữ liệu mới nhất sau khi cập nhật
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [matrixModalOpen, setMatrixModalOpen] = useState(false);
  // Đổi tên phòng ban ngay trên tiêu đề phòng ban (Lưu / Hủy), không mở drawer riêng
  const [renamingTeamId, setRenamingTeamId] = useState<string | null>(null);
  const [teamNameDraft, setTeamNameDraft] = useState("");
  const [teamNameError, setTeamNameError] = useState("");
  const [savingTeamName, setSavingTeamName] = useState(false);

  const startRenameTeam = (team: Team) => {
    setRenamingTeamId(team.id);
    setTeamNameDraft(team.name);
    setTeamNameError("");
  };
  const cancelRenameTeam = () => {
    setRenamingTeamId(null);
    setTeamNameError("");
  };
  const saveRenameTeam = async (team: Team) => {
    const name = teamNameDraft.trim();
    if (!name) {
      setTeamNameError("Vui lòng nhập tên phòng ban.");
      return;
    }
    const duplicated = data.teams.some(
      (t) => t.id !== team.id && normalizeSearchText(t.name) === normalizeSearchText(name)
    );
    if (duplicated) {
      setTeamNameError("Tên phòng ban này đã tồn tại.");
      return;
    }
    if (name === team.name) {
      cancelRenameTeam();
      return;
    }
    if (
      !(await confirmAction({
        title: "Đổi tên phòng ban?",
        description: (
          <>
            Đổi <strong>{team.name}</strong> thành <strong>{name}</strong>.
          </>
        ),
        okText: "Đổi tên",
      }))
    )
      return;
    setSavingTeamName(true);
    try {
      const ok = await controller.updateTeam(team.id, { name });
      if (ok) cancelRenameTeam();
    } finally {
      setSavingTeamName(false);
    }
  };
  const [detailStaffId, setDetailStaffId] = useState<string | null>(null);

  const detailStaff = staff.find((s) => s.id === detailStaffId) ?? null;

  const isFiltering = selectedTeamId !== "ALL" || accountStatus !== "ALL" || searchQuery.trim() !== "";

  const filteredStaff = useMemo(() => {
    const q = normalizeSearchText(searchQuery);
    return staff.filter((person) => {
      if (selectedTeamId !== "ALL" && person.teamId !== selectedTeamId) return false;
      if (accountStatus === "ACTIVE" && !person.accountActive) return false;
      if (accountStatus === "LOCKED" && person.accountActive) return false;
      if (!q) return true;
      return (
        normalizeSearchText(person.name).includes(q) ||
        normalizeSearchText(person.title).includes(q) ||
        normalizeSearchText(person.email).includes(q) ||
        normalizeSearchText(person.phone).includes(q)
      );
    });
  }, [staff, selectedTeamId, accountStatus, searchQuery]);

  const visibleTeams = useMemo(() => {
    return data.teams
      .filter((team) => selectedTeamId === "ALL" || team.id === selectedTeamId)
      .filter((team) => !isFiltering || filteredStaff.some((person) => person.teamId === team.id));
  }, [data.teams, selectedTeamId, filteredStaff, isFiltering]);

  // Thu gọn / mở rộng từng phòng ban. Khi đang tìm kiếm thì luôn mở để không che mất kết quả.
  const [collapsedTeamIds, setCollapsedTeamIds] = useState<Set<string>>(() => new Set());
  const isSearching = searchQuery.trim() !== "";
  const isTeamCollapsed = (teamId: string) => !isSearching && collapsedTeamIds.has(teamId);

  const toggleTeam = (teamId: string) => {
    setCollapsedTeamIds((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });
  };

  const resetFilters = () => {
    setSelectedTeamId("ALL");
    setAccountStatus("ALL");
    setSearchQuery("");
  };

  const confirmUnlock = (person: Staff) => {
    modal.confirm({
      width: 460,
      centered: true,
      icon: null,
      title: null,
      className:
        "[&_.ant-modal-content]:!rounded-2xl [&_.ant-modal-content]:!p-6 [&_.ant-modal-content]:!shadow-xl",
      content: (
        <div className="space-y-3.5">
          <div className="flex items-start gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-amber-600 text-lg shadow-xs">
              <UnlockOutlined />
            </span>
            <div className="pt-0.5">
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                Mở lại tài khoản cán bộ?
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Khôi phục quyền truy cập hệ thống cho cán bộ
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-xs text-slate-700 leading-relaxed">
            Cán bộ <strong className="text-slate-900">{person.name}</strong> sẽ có thể đăng nhập lại vào hệ thống với chức danh <strong className="text-[#0F4C81]">{resolvedRolesMap.get(person.roleCode) || SYSTEM_ROLE_META[person.roleCode]?.label || person.title || "Cán bộ"}</strong>.
          </div>
        </div>
      ),
      okText: "Mở tài khoản",
      okButtonProps: {
        className:
          "!h-9 !px-5 !rounded-lg !font-semibold !bg-amber-600 hover:!bg-amber-700 !border-amber-600 !text-white !shadow-xs",
      },
      cancelText: "Đóng",
      cancelButtonProps: {
        className:
          "!h-9 !px-4 !rounded-lg !font-medium !text-slate-700 !border-slate-300 hover:!bg-slate-50",
      },
      onOk: () => controller.unlockAccount(person.id),
    });
  };

  const getColumns = (): ColumnsType<Staff> => {
    const columns: ColumnsType<Staff> = [
      {
        title: "Cán bộ",
        key: "name",
        width: "26%",
        render: (_, person) => {
          return (
            // Một dòng: avatar · tên
            <div className="flex min-w-0 items-center gap-2.5 whitespace-nowrap" title={person.name}>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#DC2626] to-[#991B1B] text-[10px] font-bold text-white shadow-xs">
                {getInitials(person.name)}
              </span>
              <Text className="min-w-0 truncate text-[13px] font-bold text-slate-900 group-hover:text-[#DC2626] transition-colors">
                {person.name}
              </Text>
            </div>
          );
        },
      },
      {
        title: "Hình thức",
        key: "employment",
        width: "11%",
        render: (_, person) => <span className="text-xs text-slate-600">{person.employment || "Viên chức"}</span>,
      },
      {
        title: "Email",
        key: "email",
        width: "24%",
        ellipsis: { showTitle: true },
        render: (_, person) => <span className="text-xs text-slate-600">{person.email}</span>,
      },
      {
        title: "Chức danh",
        key: "role",
        width: "21%",
        align: "center",
        render: (_, person) => {
          // Dòng gọn: chỉ hiện vai trò chính (chức danh trong phòng ban), các vai trò còn lại gom vào "+N"
          const [mainRole, ...otherRoles] = getStaffDisplayRoles(person, resolvedRolesMap, data.projects);
          if (!mainRole) {
            return (
              <div className="flex w-full items-center justify-center">
                <span className="text-xs italic text-slate-400">Chưa có chức danh</span>
              </div>
            );
          }
          return (
            // Chỉ hiện tên chức danh (không nền), tên dài thì cắt "…" và rê chuột xem đủ
            <div className="flex w-full min-w-0 items-center justify-center gap-1.5">
              <Tooltip title={mainRole}>
                <span className="min-w-0 truncate text-[13px] font-semibold text-slate-800">{mainRole}</span>
              </Tooltip>
              {otherRoles.length > 0 && (
                <Tooltip
                  title={
                    <div className="py-0.5">
                      <div className="mb-1 text-[11px] font-semibold opacity-80">Chức danh khác</div>
                      <ul className="m-0 list-disc space-y-0.5 pl-4 text-xs">
                        {otherRoles.map((roleName) => (
                          <li key={roleName}>{roleName}</li>
                        ))}
                      </ul>
                    </div>
                  }
                >
                  <span
                    aria-label={`Còn ${otherRoles.length} chức danh khác: ${otherRoles.join(", ")}`}
                    className="inline-flex h-[20px] min-w-[30px] shrink-0 cursor-help items-center justify-center rounded-full border border-slate-200 bg-white px-1.5 text-[11px] font-semibold text-slate-500"
                  >
                    +{otherRoles.length}
                  </span>
                </Tooltip>
              )}
            </div>
          );
        },
      },
      {
        title: (
          <span className="inline-flex items-center gap-1">
            Tài khoản
            <Tooltip
              title={
                <div className="space-y-1 py-0.5 text-xs">
                  {ACCOUNT_STATUS_LEGEND.map((item) => (
                    <div key={item.key} className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.dotClass}`} />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              }
            >
              <InfoCircleOutlined className="cursor-help text-slate-400" />
            </Tooltip>
          </span>
        ),
        key: "account",
        width: "9%",
        align: "center",
        render: (_, person) => {
          // Chấm màu trạng thái tài khoản, rê chuột để xem chú thích
          // Chức danh đang tắt chỉ ảnh hưởng tài khoản (tạm không có quyền); cán bộ vẫn giữ chức danh
          const hasTitle = getStaffDisplayRoles(person, resolvedRolesMap, data.projects).length > 0;
          const titleLocked = isStaffTitleLocked(person.title, lockedTitles);
          const status = !person.accountActive ? "locked" : hasTitle && !titleLocked ? "active" : "noAccess";
          const legend = ACCOUNT_STATUS_LEGEND.find((item) => item.key === status)!;
          const tooltip =
            status === "locked"
              ? `${legend.label}${person.lockReason ? `: ${person.lockReason}` : ""}`
              : status === "noAccess"
              ? titleLocked
                ? `Chức danh "${person.title}" đang tắt — tài khoản tạm không có quyền`
                : "Chưa có chức danh — tài khoản chưa có quyền"
              : legend.label;
          return (
            <Tooltip title={tooltip}>
              <span
                role="img"
                aria-label={tooltip}
                className={`inline-block h-3 w-3 cursor-help rounded-full ring-4 ${legend.dotClass} ${legend.ringClass}`}
              />
            </Tooltip>
          );
        },
      },
    ];

    if (canManageAccounts) {
      columns.push({
        title: "Thao tác",
        key: "action",
        width: "9%",
        align: "center",
        render: (_, person) => (
          // Chỉ còn biểu tượng bút chì; bấm để mở hồ sơ cán bộ và cập nhật
          <Tooltip title="Cập nhật hồ sơ cán bộ">
            <Button
              intent="outline"
              scale="compact"
              aria-label={`Cập nhật hồ sơ ${person.name}`}
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                setDetailStaffId(person.id);
              }}
              className="!h-7 !w-7 !p-0 !border-[#DC2626] !text-[#DC2626] hover:!bg-red-50/60"
            />
          </Tooltip>
        ),
      });
    }

    return columns;
  };

  return (
    <>
      <Card surface="flat" padding="none" rounded="lg" className="border-slate-200 shadow-sm">
        <SectionIntro
          title="Cơ cấu tổ chức, tài khoản & phân quyền"
          description="Cán bộ theo từng phòng ban. Quản lý thông tin, trạng thái tài khoản và chức danh của cán bộ."
          countLabel={
            filteredStaff.length === staff.length
              ? `${staff.length} cán bộ · ${data.teams.length} phòng ban`
              : `${filteredStaff.length}/${staff.length} cán bộ`
          }
          actions={
            canManageAccounts && (
              <Flex align="center" gap={8} wrap="wrap">
                <Button
                  intent="outline"
                  icon={<AppstoreOutlined />}
                  className="font-semibold text-slate-700 hover:text-[#DC2626] hover:border-[#DC2626]/50 bg-white shadow-2xs"
                  onClick={() => setMatrixModalOpen(true)}
                >
                  Ma trận phân quyền
                </Button>
                <Button
                  intent="primary"
                  icon={<UserAddOutlined />}
                  className="font-semibold !bg-[#DC2626] hover:!bg-[#B91C1C] text-white shadow-2xs"
                  onClick={() => setStaffModalOpen(true)}
                >
                  Thêm tài khoản
                </Button>
              </Flex>
            )
          }
          toolbar={
            <Flex align="center" wrap="wrap" gap="small" className="w-full">
              <div className="w-full sm:w-72">
                <Input
                  allowClear
                  intent="clean"
                  prefix={<SearchOutlined className="text-slate-400" />}
                  placeholder="Tìm cán bộ, chức danh, email, SĐT..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-60">
                <Select
                  value={selectedTeamId}
                  onChange={(val) => setSelectedTeamId(val)}
                  className="w-full text-xs"
                  options={[
                    { value: "ALL", label: "Tất cả phòng ban" },
                    ...data.teams.map((t) => ({ value: t.id, label: t.name })),
                  ]}
                />
              </div>
              <div className="w-full sm:w-48">
                <Select
                  value={accountStatus}
                  onChange={(val) => setAccountStatus(val as AccountStatusFilter)}
                  className="w-full text-xs"
                  options={[
                    { value: "ALL", label: "Tất cả tài khoản" },
                    { value: "ACTIVE", label: "Đang hoạt động" },
                    { value: "LOCKED", label: "Đang khóa" },
                  ]}
                />
              </div>
              {isFiltering && (
                <Button intent="outline" scale="compact" onClick={resetFilters}>
                  Đặt lại bộ lọc
                </Button>
              )}
            </Flex>
          }
        />

        <div className="space-y-6 p-4 sm:p-5">
          {visibleTeams.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center">
              <Text className="text-sm font-semibold text-slate-700">Không tìm thấy cán bộ phù hợp</Text>
              <Text className="mt-1 text-xs text-slate-500">Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.</Text>
              <Button intent="outline" scale="compact" className="mt-3" onClick={resetFilters}>
                Đặt lại bộ lọc
              </Button>
            </div>
          ) : (
            visibleTeams.map((team) => {
              const members = sortStaffByRank(
                filteredStaff.filter((person) => person.teamId === team.id),
                team,
              );
              const teamCustomFields = Object.entries(team.customFields || {}).filter(
                ([key, val]) => val && configuredTeamFields.some((f) => f.name === key),
              );
              const collapsed = isTeamCollapsed(team.id);
              return (
                <section
                  key={team.id}
                  className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xs"
                >
                  {/* Header phòng ban / tổ — bấm để thu gọn / mở rộng */}
                  <div
                    role="button"
                    tabIndex={0}
                    aria-expanded={!collapsed}
                    onClick={() => toggleTeam(team.id)}
                    onKeyDown={(e) => {
                      if (e.target !== e.currentTarget) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleTeam(team.id);
                      }
                    }}
                    className={`flex cursor-pointer select-none flex-wrap items-center justify-between gap-3 bg-slate-50/70 px-5 py-3.5 transition-colors hover:bg-slate-100/70 focus-visible:outline-2 focus-visible:outline-[#DC2626]/40 ${
                      collapsed ? "" : "border-b border-slate-100"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <RightOutlined
                          className={`text-[11px] text-slate-500 transition-transform duration-200 ${collapsed ? "" : "rotate-90"}`}
                        />
                        {renamingTeamId === team.id ? (
                          <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
                            <Input
                              autoFocus
                              value={teamNameDraft}
                              disabled={savingTeamName}
                              onChange={(e) => {
                                setTeamNameDraft(e.target.value);
                                if (teamNameError) setTeamNameError("");
                              }}
                              onKeyDown={(e) => {
                                // Không để phím gõ trong ô thu gọn / mở rộng phòng ban
                                e.stopPropagation();
                                if (e.key === "Enter") saveRenameTeam(team);
                                if (e.key === "Escape") cancelRenameTeam();
                              }}
                              placeholder="Tên phòng ban"
                              status={teamNameError ? "error" : undefined}
                              className="h-8 w-64 sm:w-80 text-sm font-semibold"
                            />
                            {teamNameError && <span className="mt-0.5 text-[11px] text-rose-600">{teamNameError}</span>}
                          </div>
                        ) : null}
                        {/* Lưu / Hủy nằm ngay cạnh ô sửa tên phòng ban */}
                        {canManageTeams && renamingTeamId === team.id && (
                          <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              intent="primary"
                              scale="compact"
                              icon={<SaveOutlined />}
                              loading={savingTeamName}
                              onClick={() => saveRenameTeam(team)}
                              className="text-xs font-semibold"
                            >
                              Lưu
                            </Button>
                            <Button
                              intent="outline"
                              scale="compact"
                              disabled={savingTeamName}
                              onClick={cancelRenameTeam}
                              className="text-xs font-semibold"
                            >
                              Hủy
                            </Button>
                          </div>
                        )}
                        {renamingTeamId === team.id ? null : (
                          <Text className="text-sm font-bold text-slate-900">{team.name}</Text>
                        )}
                        {/* Bút chì ngay cạnh tên phòng ban để dễ thấy, dễ sửa */}
                        {canManageTeams && renamingTeamId !== team.id && (
                          <Tooltip title="Cập nhật phòng ban">
                            <button
                              type="button"
                              aria-label={`Cập nhật phòng ban ${team.name}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                startRenameTeam(team);
                              }}
                              className="inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white p-0 text-xs text-slate-500 shadow-2xs transition-colors hover:border-[#DC2626]/40 hover:bg-red-50 hover:text-[#DC2626]"
                            >
                              <EditOutlined />
                            </button>
                          </Tooltip>
                        )}
                        <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                          {members.length} người
                        </span>
                      </div>
                      {teamCustomFields.length > 0 && (
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          {teamCustomFields.map(([key, val]) => {
                            const label = configuredTeamFields.find((f) => f.name === key)?.label || key.replace(/_/g, " ");
                            return (
                              <span
                                key={key}
                                className="inline-flex items-center gap-1 text-[11px] bg-red-50/70 border border-red-200/60 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                              >
                                <span className="text-red-700 capitalize">{label}:</span>
                                <strong className="text-slate-900">{String(val)}</strong>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>

                  {collapsed ? null : members.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">Chưa có cán bộ trong phòng ban này.</div>
                  ) : (
                    <Table
                      rowKey="id"
                      columns={getColumns()}
                      dataSource={members}
                      pagination={false}
                      size="middle"
                      tableLayout="fixed"
                      scroll={{ x: canManageAccounts ? 900 : 810 }}
                      rowClassName={(person) => (person.accountActive ? "" : "[&>td]:!bg-rose-50/40")}
                      className="[&_.ant-table-thead>tr>th]:bg-slate-50/90 [&_.ant-table-thead>tr>th]:py-2.5 [&_.ant-table-thead>tr>th]:text-[13px] [&_.ant-table-thead>tr>th]:font-bold [&_.ant-table-thead>tr>th]:text-slate-600 [&_.ant-table-tbody>tr>td]:!py-1.5 [&_.ant-table-tbody>tr>td]:!align-middle [&_.ant-table-thead_th::before]:!hidden [&_.ant-table-thead_th:before]:!content-none"
                      onRow={(person) => ({
                        onClick: () => setDetailStaffId(person.id),
                        className: "cursor-pointer hover:bg-slate-50/70 transition-colors group",
                      })}
                    />
                  )}
                </section>
              );
            })
          )}
        </div>
      </Card>

      {staffModalOpen && (
        <StaffModal
          data={controller.data}
          errorText={controller.feedback?.type === "error" ? controller.feedback.text : undefined}
          onClose={() => setStaffModalOpen(false)}
          onCreate={async (input) => {
            const res = await controller.createStaff(input);
            if (res) resetFilters();
            return res;
          }}
        />
      )}

      {matrixModalOpen && (
        <RolePermissionMatrixModal
          open
          onClose={() => setMatrixModalOpen(false)}
          canManage={canManageAccounts}
        />
      )}

      {detailStaff && (
        <StaffProjectRoleModal
          staff={detailStaff}
          data={controller.data}
          currentUser={controller.currentUser}
          canManageRole={canManageAccounts && (permissions.canGrantRole ?? true)}
          onClose={() => setDetailStaffId(null)}
          onGrantRole={controller.grantActingDirector}
          onRevokeRole={controller.revokeActingDirector}
          onUpdateStaff={controller.updateStaff}
          onUpdateProjectPermissions={controller.updateProjectPermissions}
          onLockAccount={canManageAccounts ? onLockAccount : undefined}
          onUnlockAccount={canManageAccounts ? confirmUnlock : undefined}
          canEditInfo={canManageAccounts}
        />
      )}

    </>
  );
}
