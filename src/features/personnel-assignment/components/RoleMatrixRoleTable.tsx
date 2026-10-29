"use client";

import { useMemo, useState } from "react";
import { EditOutlined, EyeOutlined, SearchOutlined } from "@ant-design/icons";
import { App } from "antd";
import { Button, Input, Switch, Table, Tooltip } from "@/components/ui";
import type { ColumnsType } from "@/components/ui";
import { normalizeSearchText } from "@/utils/search-text";
import type { MatrixRole } from "../constants/role-matrix-data";
import { usePermissionChangeLog } from "../hooks/usePermissionChangeLog";
import { useStaffAccess } from "../hooks/usePersonnelAccess";
import { useRoleMatrix, useRoleMatrixActions, useSortedMatrixRoles } from "../hooks/useRoleMatrix";
import { useWindowWidth } from "../hooks/useWindowWidth";

interface RoleMatrixRoleTableProps {
  /** Bấm một chức danh → mở màn xem / chỉnh sửa */
  onOpenRole: (roleCode: string) => void;
  onClose: () => void;
}

/** Số quyền hiện thẳng trên mỗi dòng theo bề ngang màn hình, phần còn lại gom vào "+N" */
const getVisibleTagCount = (screenWidth: number) => (screenWidth >= 1700 ? 8 : screenWidth >= 1400 ? 6 : screenWidth >= 1024 ? 5 : 3);

const formatDate = (iso?: string) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("vi-VN");
};

/** Tab "Danh sách chức danh": tìm kiếm, bảng chức danh kèm quyền, bật / tắt chức danh */
export default function RoleMatrixRoleTable({ onOpenRole, onClose }: RoleMatrixRoleTableProps) {
  const { modal } = App.useApp();
  const { sortedRoles: roles } = useSortedMatrixRoles();
  const { permissions, hasPermission, lockedRoleCodes } = useRoleMatrix();
  const { setRoleLocked } = useRoleMatrixActions();
  const { canManageAccounts: canManage } = useStaffAccess();
  const logPermissionChange = usePermissionChangeLog();
  const [search, setSearch] = useState("");
  const visibleTagCount = getVisibleTagCount(useWindowWidth());

  const filteredRoles = useMemo(() => {
    const keyword = normalizeSearchText(search.trim());
    return keyword ? roles.filter((r) => normalizeSearchText(r.name).includes(keyword)) : roles;
  }, [roles, search]);

  // Tắt chức danh: hỏi xác nhận trước; bật lại thì làm ngay
  const handleToggleLock = (role: MatrixRole) => {
    if (lockedRoleCodes.includes(role.code)) {
      modal.confirm({
        centered: true,
        width: 440,
        icon: null,
        title: `Bật lại chức danh "${role.name}"?`,
        content: (
          <p className="m-0 text-xs leading-relaxed text-slate-600">
            Tài khoản của cán bộ đang giữ chức danh này có lại quyền hạn, và chức danh được chọn lại khi thêm nhân sự /
            đổi chức danh.
          </p>
        ),
        okText: "Bật chức danh",
        cancelText: "Hủy",
        okButtonProps: { className: "!bg-[#DC2626] !border-[#DC2626] hover:!bg-[#B91C1C]" },
        onOk: async () => {
          if (!(await setRoleLocked(role.code, false))) return;
          logPermissionChange(role, "Bật lại chức danh", [{ label: "Trạng thái", from: "Đang tắt", to: "Đang bật" }]);
        },
      });
      return;
    }
    modal.confirm({
      centered: true,
      width: 440,
      icon: null,
      title: `Tắt chức danh "${role.name}"?`,
      content: (
        <p className="m-0 text-xs leading-relaxed text-slate-600">
          Sau khi tắt, tài khoản của cán bộ đang giữ chức danh này tạm không có quyền (cán bộ vẫn giữ chức danh), và
          không chọn được chức danh này khi thêm nhân sự / đổi chức danh. Bật lại thì tài khoản có lại quyền như cũ.
        </p>
      ),
      okText: "Tắt chức danh",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: async () => {
        if (!(await setRoleLocked(role.code, true))) return;
        logPermissionChange(role, "Tắt chức danh", [{ label: "Trạng thái", from: "Đang bật", to: "Đang tắt" }]);
      },
    });
  };

  const columns: ColumnsType<MatrixRole> = [
    {
      title: "STT",
      key: "index",
      width: 64,
      render: (_, __, index) => <span className="text-slate-600">{index + 1}</span>,
    },
    {
      title: "Tên chức danh",
      key: "name",
      width: visibleTagCount >= 6 ? 280 : 220,
      sorter: (a, b) => a.name.localeCompare(b.name, "vi"),
      render: (_, role) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-semibold text-slate-900">{role.name}</span>
          {lockedRoleCodes.includes(role.code) && (
            <span className="rounded border border-slate-200 bg-slate-100 px-1.5 text-[11px] text-slate-500">Đã tắt</span>
          )}
        </div>
      ),
    },
    {
      title: "Quyền",
      key: "permissions",
      render: (_, role) => {
        const granted = permissions.filter((p) => hasPermission(role.code, p.id));
        if (granted.length === 0) return <span className="text-xs italic text-slate-400">Chưa có quyền</span>;
        const shown = granted.slice(0, visibleTagCount);
        const rest = granted.slice(visibleTagCount);
        return (
          <div className="flex flex-wrap gap-1.5">
            {shown.map((p) => (
              <span key={p.id} className="rounded-md bg-[#0F4C81] px-2 py-0.5 text-[11px] font-medium text-white">
                {p.name}
              </span>
            ))}
            {rest.length > 0 && (
              <Tooltip title={rest.map((p) => p.name).join(", ")}>
                <span className="cursor-default rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  +{rest.length}
                </span>
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      title: "Ngày tạo",
      key: "createdAt",
      width: 130,
      sorter: (a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""),
      render: (_, role) => formatDate(role.createdAt) ?? <span className="text-slate-400">—</span>,
    },
    {
      title: "Hành động",
      key: "actions",
      width: 120,
      align: "center",
      render: (_, role) => (
        <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Tooltip title={canManage ? "Chỉnh sửa" : "Xem"}>
            <Button
              intent="outline"
              scale="compact"
              aria-label={canManage ? "Chỉnh sửa" : "Xem"}
              icon={canManage ? <EditOutlined /> : <EyeOutlined />}
              onClick={() => onOpenRole(role.code)}
              className="!h-8 !w-8 !p-0"
            />
          </Tooltip>
          {/* Bật / tắt chức danh ngay trên dòng: tắt thì hỏi xác nhận trước */}
          <Tooltip
            title={
              lockedRoleCodes.includes(role.code) ? "Chức danh đang tắt, bấm để bật lại" : "Chức danh đang bật, bấm để tắt"
            }
          >
            <Switch
              aria-label="Bật / tắt chức danh"
              checked={!lockedRoleCodes.includes(role.code)}
              disabled={!canManage}
              onChange={() => handleToggleLock(role)}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* Tìm kiếm */}
      <div className="px-6 pb-3 shrink-0">
        <Input
          allowClear
          intent="clean"
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder="Tìm kiếm theo tên chức danh..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-96 h-9 text-sm"
        />
      </div>

      {/* Danh sách chức danh */}
      <div className="flex-1 overflow-auto [scrollbar-width:thin] min-h-0 px-6 pb-4">
        <Table<MatrixRole>
          rowKey="code"
          columns={columns}
          dataSource={filteredRoles}
          pagination={false}
          size="middle"
          tableLayout="fixed"
          scroll={{ x: 860 }}
          locale={{ emptyText: "Không tìm thấy chức danh phù hợp." }}
          onRow={(role) => ({
            onClick: () => onOpenRole(role.code),
            className: "cursor-pointer",
          })}
          className="rounded-xl border border-slate-200 overflow-hidden [&_.ant-table-thead>tr>th]:bg-slate-50 [&_.ant-table-thead>tr>th]:font-bold [&_.ant-table-thead>tr>th]:text-slate-700 [&_.ant-table-tbody>tr>td]:!align-middle [&_.ant-table-thead_th::before]:!hidden"
        />
      </div>

      <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0">
        <span className="text-xs text-slate-500">
          {filteredRoles.length}/{roles.length} chức danh
        </span>
        <Button
          intent="outline"
          className="!border-slate-300 text-xs h-8.5 rounded-lg text-slate-700 hover:text-slate-900"
          onClick={onClose}
        >
          Đóng
        </Button>
      </div>
    </>
  );
}
