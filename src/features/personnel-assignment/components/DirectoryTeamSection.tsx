"use client";

import { useState } from "react";
import { RightOutlined } from "@ant-design/icons";
import { Table } from "@/components/ui";
import { useCustomFieldDefs } from "../hooks/useCustomFieldDefs";
import { useStaffAccess } from "../hooks/usePersonnelAccess";
import type { Staff, Team } from "../types/personnel.types";
import { sortStaffByRank } from "../utils/personnel-sorting";
import { useDirectoryStaffColumns } from "./DirectoryStaffColumns";
import DirectoryTeamName from "./DirectoryTeamName";
import StaffDetailDrawer from "./StaffDetailDrawer";

interface DirectoryTeamSectionProps {
  team: Team;
  /** Cán bộ của phòng ban sau khi lọc */
  members: Staff[];
  /** Đang tìm kiếm → luôn mở để không che mất kết quả */
  forceExpanded?: boolean;
}

const TABLE_CLASS =
  "[&_.ant-table-thead>tr>th]:bg-slate-50/90 [&_.ant-table-thead>tr>th]:py-2.5 [&_.ant-table-thead>tr>th]:text-[13px] [&_.ant-table-thead>tr>th]:font-bold [&_.ant-table-thead>tr>th]:text-slate-600 [&_.ant-table-tbody>tr>td]:!py-1.5 [&_.ant-table-tbody>tr>td]:!align-middle [&_.ant-table-thead_th::before]:!hidden [&_.ant-table-thead_th:before]:!content-none";

/** Thẻ trường tùy biến của phòng ban có giá trị (vẫn còn trong cấu hình) */
function TeamCustomFieldChips({ team }: { team: Team }) {
  const [configuredFields] = useCustomFieldDefs("team");
  const chips = Object.entries(team.customFields || {}).filter(
    ([key, val]) => val && configuredFields.some((f) => f.name === key),
  );
  if (chips.length === 0) return null;
  return (
    <div className="mt-2 flex items-center gap-2 flex-wrap">
      {chips.map(([key, val]) => (
        <span
          key={key}
          className="inline-flex items-center gap-1 text-[11px] bg-red-50/70 border border-red-200/60 text-slate-700 px-2 py-0.5 rounded-md font-medium"
        >
          <span className="text-red-700 capitalize">
            {configuredFields.find((f) => f.name === key)?.label || key.replace(/_/g, " ")}:
          </span>
          <strong className="text-slate-900">{String(val)}</strong>
        </span>
      ))}
    </div>
  );
}

/** Một phòng ban trong danh bạ: tiêu đề bấm để thu gọn / mở rộng, bên dưới là bảng cán bộ; bấm cán bộ để mở hồ sơ */
export default function DirectoryTeamSection({ team, members, forceExpanded = false }: DirectoryTeamSectionProps) {
  const { canManageAccounts } = useStaffAccess();
  const [userCollapsed, setUserCollapsed] = useState(false);
  const [detailStaffId, setDetailStaffId] = useState<string | null>(null);
  const columns = useDirectoryStaffColumns((person) => setDetailStaffId(person.id));
  const collapsed = !forceExpanded && userCollapsed;
  const onToggle = () => setUserCollapsed((prev) => !prev);
  const sortedMembers = sortStaffByRank(members, team);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xs">
      {/* Header phòng ban / tổ — bấm để thu gọn / mở rộng */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={!collapsed}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
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
            <DirectoryTeamName team={team} />
            <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
              {members.length} người
            </span>
          </div>
          <TeamCustomFieldChips team={team} />
        </div>
      </div>

      {collapsed ? null : members.length === 0 ? (
        <div className="p-6 text-center text-xs text-slate-400">Chưa có cán bộ trong phòng ban này.</div>
      ) : (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={sortedMembers}
          pagination={false}
          size="middle"
          tableLayout="fixed"
          scroll={{ x: canManageAccounts ? 900 : 810 }}
          rowClassName={(person) => (person.accountActive ? "" : "[&>td]:!bg-rose-50/40")}
          className={TABLE_CLASS}
          onRow={(person) => ({
            onClick: () => setDetailStaffId(person.id),
            className: "cursor-pointer hover:bg-slate-50/70 transition-colors group",
          })}
        />
      )}

      {detailStaffId && (
        <StaffDetailDrawer key={detailStaffId} staffId={detailStaffId} onClose={() => setDetailStaffId(null)} />
      )}
    </section>
  );
}
