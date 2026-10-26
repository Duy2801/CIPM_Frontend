"use client";

import { EditOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { Button, Text, Tooltip } from "@/components/ui";
import type { ColumnsType } from "@/components/ui";
import { getInitials } from "@/utils/initials";
import { isStaffTitleLocked, useLockedTitles } from "../hooks/useLockedTitles";
import { useStaffAccess } from "../hooks/usePersonnelAccess";
import { useRoleNameMap } from "../hooks/useRoleNameMap";
import type { Staff } from "../types/personnel.types";
import { ACCOUNT_STATUS_LEGEND, getAccountStatus, getStaffDisplayRoles } from "../utils/staff-display-roles";

/** Chức danh chính + "+N" gom các chức danh còn lại (rê chuột xem đủ) */
function StaffRoleCell({ roles }: { roles: string[] }) {
  const [mainRole, ...otherRoles] = roles;
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
}

/** Tiêu đề cột Tài khoản kèm chú thích màu */
function AccountColumnTitle() {
  return (
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
  );
}

/** Chấm màu trạng thái tài khoản, rê chuột để xem chú thích */
function AccountStatusDot({ person, hasTitle, lockedTitles }: { person: Staff; hasTitle: boolean; lockedTitles: Set<string> }) {
  const { legend, tooltip } = getAccountStatus(person, hasTitle, isStaffTitleLocked(person.title, lockedTitles));
  return (
    <Tooltip title={tooltip}>
      <span
        role="img"
        aria-label={tooltip}
        className={`inline-block h-3 w-3 cursor-help rounded-full ring-4 ${legend.dotClass} ${legend.ringClass}`}
      />
    </Tooltip>
  );
}

/** Các cột bảng cán bộ trong từng phòng ban; bấm bút chì → `onEditStaff` */
export function useDirectoryStaffColumns(onEditStaff: (person: Staff) => void): ColumnsType<Staff> {
  const roleNameMap = useRoleNameMap();
  const lockedTitles = useLockedTitles();
  const { canManageAccounts } = useStaffAccess();
  const displayRolesOf = (person: Staff) => getStaffDisplayRoles(person, roleNameMap);

  const columns: ColumnsType<Staff> = [
    {
      title: "Cán bộ",
      key: "name",
      width: "26%",
      render: (_, person) => (
        // Một dòng: avatar · tên
        <div className="flex min-w-0 items-center gap-2.5 whitespace-nowrap" title={person.name}>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#DC2626] to-[#991B1B] text-[10px] font-bold text-white shadow-xs">
            {getInitials(person.name)}
          </span>
          <Text className="min-w-0 truncate text-[13px] font-bold text-slate-900 group-hover:text-[#DC2626] transition-colors">
            {person.name}
          </Text>
        </div>
      ),
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
      // Dòng gọn: chỉ hiện vai trò chính (chức danh trong phòng ban), các vai trò còn lại gom vào "+N"
      render: (_, person) => <StaffRoleCell roles={displayRolesOf(person)} />,
    },
    {
      title: <AccountColumnTitle />,
      key: "account",
      width: "9%",
      align: "center",
      render: (_, person) => (
        <AccountStatusDot person={person} hasTitle={displayRolesOf(person).length > 0} lockedTitles={lockedTitles} />
      ),
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
              onEditStaff(person);
            }}
            className="!h-7 !w-7 !p-0 !border-[#DC2626] !text-[#DC2626] hover:!bg-red-50/60"
          />
        </Tooltip>
      ),
    });
  }

  return columns;
}
