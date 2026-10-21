"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { EditOutlined, EyeOutlined, HistoryOutlined, PlusOutlined, SafetyCertificateOutlined, SearchOutlined } from "@ant-design/icons";
import { App } from "antd";
import {
  Button,
  Input,
  LARGE_MODAL_CONTAINER_STYLE,
  LARGE_MODAL_PROPS,
  Modal,
  Switch,
  Table,
  Title,
  Tooltip,
  toast,
} from "@/components/ui";
import type { ColumnsType } from "@/components/ui";
import { normalizeSearchText } from "@/utils/search-text";
import type { MatrixRole } from "../constants/role-matrix-data";
import { useRoleMatrix } from "../hooks/useRoleMatrix";
import RoleEditorView from "./RoleEditorView";
import ActivityTimeline from "./ActivityTimeline";
import ActivityDateFilter, { toLocalDate } from "./ActivityDateFilter";
import { useAuthStore } from "@/stores/auth.store";
import { useActivityLogVersion } from "../hooks/useActivityLogVersion";
import { appendActivity, getPermissionChangeHistory, PERMISSION_LOG_MODULE, type ActivityChange } from "../utils/activity-log";

interface RolePermissionMatrixModalProps {
  open: boolean;
  onClose: () => void;
  canManage?: boolean;
}

/** "list" = danh sách chức danh; "create" / "edit" = màn Tạo / Chỉnh sửa chức danh (có quay lại) */
type MatrixView = { mode: "list" } | { mode: "create" } | { mode: "edit"; roleCode: string };

/** Số quyền hiện thẳng trên mỗi dòng theo bề ngang màn hình, phần còn lại gom vào "+N" */
const getVisibleTagCount = (screenWidth: number) => (screenWidth >= 1700 ? 8 : screenWidth >= 1400 ? 6 : screenWidth >= 1024 ? 5 : 3);

const formatDate = (iso?: string) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("vi-VN");
};

/** Bề ngang cửa sổ, tự cập nhật khi đổi kích thước */
function useWindowWidth() {
  const [width, setWidth] = useState(() => (typeof window === "undefined" ? 1280 : window.innerWidth));
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return width;
}

export default function RolePermissionMatrixModal({
  open,
  onClose,
  canManage = true,
}: RolePermissionMatrixModalProps) {
  const { modal } = App.useApp();
  const {
    roles,
    modules,
    permissions,
    hasPermission,
    addCustomRole,
    lockedRoleCodes,
    setRoleLocked,
    renameRole,
    updateRolePermissions,
  } = useRoleMatrix();

  const [view, setView] = useState<MatrixView>({ mode: "list" });
  const visibleTagCount = getVisibleTagCount(useWindowWidth());
  const [search, setSearch] = useState("");
  // Tab: danh sách chức danh / lịch sử thay đổi quyền (ai cũng xem được)
  const [listTab, setListTab] = useState<"roles" | "history">("roles");
  // Lọc lịch sử thay đổi quyền theo một ngày (yyyy-mm-dd)
  const [historyDate, setHistoryDate] = useState("");
  const logVersion = useActivityLogVersion();
  const currentUser = useAuthStore((state) => state.user);

  // Ghi lịch sử thay đổi quyền: ai, lúc nào, chức danh nào, thay đổi gì
  const logPermissionChange = (role: { code: string; name: string }, action: string, changes?: ActivityChange[], note?: string) =>
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

  const permissionHistory = useMemo(() => {
    const all = getPermissionChangeHistory();
    return historyDate ? all.filter((e) => toLocalDate(e.at) === historyDate) : all;
    // đọc lại khi nhật ký có dòng mới
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyDate, logVersion]);

  // Chức danh thực tế (ẩn base roles dùng để kế thừa), sắp theo Ban Giám đốc → Phó Giám đốc → các tổ → chức danh tự thêm
  const sortedRoles = useMemo(() => {
    const departmentOrder: ((d: string) => boolean)[] = [
      (d) => /Ban Giám đốc/i.test(d),
      (d) => /Phó Giám đốc/i.test(d),
      (d) => /Giám sát/i.test(d) || /Kỹ thuật/i.test(d),
      (d) => /Bồi thường/i.test(d) || /GPMB/i.test(d),
      (d) => /Hành chính/i.test(d) || /Tài chính/i.test(d) || /Kế toán/i.test(d),
    ];
    const orderOf = (role: MatrixRole) => {
      if (role.isCustom) return departmentOrder.length + 1;
      const idx = departmentOrder.findIndex((match) => match(role.department || ""));
      return idx === -1 ? departmentOrder.length : idx;
    };
    return roles
      .filter((r) => r.group !== "base")
      .map((role, idx) => ({ role, idx }))
      .sort((a, b) => orderOf(a.role) - orderOf(b.role) || a.idx - b.idx)
      .map(({ role }) => role);
  }, [roles]);

  const getRolePermIds = useCallback(
    (roleCode: string) => permissions.filter((p) => hasPermission(roleCode, p.id)).map((p) => p.id),
    [permissions, hasPermission]
  );

  const filteredRoles = useMemo(() => {
    const keyword = normalizeSearchText(search.trim());
    return keyword ? sortedRoles.filter((r) => normalizeSearchText(r.name).includes(keyword)) : sortedRoles;
  }, [sortedRoles, search]);

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
        onOk: () => {
          setRoleLocked(role.code, false);
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
      onOk: () => {
        setRoleLocked(role.code, true);
        logPermissionChange(role, "Tắt chức danh", [{ label: "Trạng thái", from: "Đang bật", to: "Đang tắt" }]);
      },
    });
  };

  // Lưu từ màn Tạo / Chỉnh sửa (lưu ngay), xong quay về danh sách
  const handleCreate = (name: string, permIds: string[]) => {
    const created = addCustomRole({
      name,
      shortName: name,
      group: "member",
      description: `Chức danh ${name} trong hệ thống`,
      initialPermissions: permIds,
    });
    if (!created?.code) return false;
    const permNames = permissions.filter((p) => permIds.includes(p.id)).map((p) => p.name);
    logPermissionChange(
      { code: created.code, name },
      "Tạo chức danh",
      [{ label: "Số quyền", to: `${permIds.length} quyền` }],
      permNames.length ? `Quyền được cấp: ${permNames.join(", ")}` : undefined
    );
    return true;
  };
  const handleUpdate = (roleCode: string, name: string, permIds: string[]) => {
    const before = sortedRoles.find((r) => r.code === roleCode);
    const beforeIds = new Set(getRolePermIds(roleCode));
    if (!renameRole(roleCode, name)) return false;
    updateRolePermissions(roleCode, permIds);
    toast.success(`Đã lưu chức danh "${name}".`);

    // Ghi lại đúng phần thay đổi: tên, quyền thêm, quyền bỏ
    const afterIds = new Set(permIds);
    const nameOf = (id: string) => permissions.find((p) => p.id === id)?.name ?? id;
    const added = permIds.filter((id) => !beforeIds.has(id)).map(nameOf);
    const removed = [...beforeIds].filter((id) => !afterIds.has(id)).map(nameOf);
    const changes: ActivityChange[] = [];
    if (before && before.name !== name) changes.push({ label: "Tên chức danh", from: before.name, to: name });
    if (added.length || removed.length) {
      changes.push({ label: "Số quyền", from: `${beforeIds.size} quyền`, to: `${permIds.length} quyền` });
      if (added.length) changes.push({ label: "Thêm quyền", to: added.join(", ") });
      if (removed.length) changes.push({ label: "Bỏ quyền", to: removed.join(", ") });
    }
    if (changes.length) logPermissionChange({ code: roleCode, name }, "Cập nhật chức danh", changes);
    return true;
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
              onClick={() => setView({ mode: "edit", roleCode: role.code })}
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

  const editingRole = view.mode === "edit" ? sortedRoles.find((r) => r.code === view.roleCode) : undefined;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      // Kích thước popup lớn dùng chung (cùng cỡ với Cấu hình quy trình thủ tục); khung không đệm, nội dung tự lo khoảng cách
      {...LARGE_MODAL_PROPS}
      styles={{ container: { ...LARGE_MODAL_CONTAINER_STYLE, padding: 0, overflow: "hidden" }, body: { flex: 1, minHeight: 0 } }}
      className="shadow-2xl"
    >
      <div className="flex flex-col h-full bg-white text-slate-900 overflow-hidden rounded-2xl">
        {view.mode !== "list" ? (
          <RoleEditorView
            key={view.mode === "edit" ? `edit-${view.roleCode}` : "create"}
            mode={view.mode}
            role={editingRole}
            roles={sortedRoles}
            modules={modules}
            permissions={permissions}
            initialPermIds={editingRole ? getRolePermIds(editingRole.code) : []}
            readOnly={!canManage}
            onBack={() => setView({ mode: "list" })}
            onSubmit={(name, permIds) =>
              editingRole ? handleUpdate(editingRole.code, name, permIds) : handleCreate(name, permIds)
            }
          />
        ) : (
          <>
            {/* Tiêu đề + nút tạo */}
            <div className="px-6 pt-5 pb-4 flex flex-wrap items-start justify-between gap-4 shrink-0">
              <div>
                <Title level={4} className="!m-0 text-slate-900 font-bold text-lg sm:text-xl">
                  Quản lý chức danh
                </Title>
                <p className="m-0 mt-1 text-sm text-slate-500">Quản lý các chức danh và phân quyền trong hệ thống</p>
              </div>
              {canManage && listTab === "roles" && (
                <Button
                  intent="primary"
                  icon={<PlusOutlined />}
                  className="h-9 px-4 text-sm font-semibold rounded-lg"
                  onClick={() => setView({ mode: "create" })}
                >
                  Tạo chức danh
                </Button>
              )}
            </div>

            {/* 2 tab: danh sách chức danh / lịch sử thay đổi quyền */}
            <div className="px-6 pb-3 shrink-0">
              {/* Tab nhỏ gọn: rộng vừa chữ, icon cùng hàng với chữ */}
              <div role="tablist" className="inline-flex gap-1 rounded-lg border border-slate-200 bg-slate-100/70 p-0.5">
                {(
                  [
                    { key: "roles", icon: <SafetyCertificateOutlined />, label: "Danh sách chức danh" },
                    { key: "history", icon: <HistoryOutlined />, label: "Lịch sử thay đổi quyền" },
                  ] as const
                ).map((tab) => {
                  const active = listTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setListTab(tab.key)}
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors ${
                        active
                          ? "bg-white font-semibold text-slate-900 shadow-xs"
                          : "font-medium text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <span className={active ? "text-[#DC2626]" : "text-slate-400"}>{tab.icon}</span>
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {listTab === "history" ? (
              <>
                {/* Lọc ngày nằm bên phải */}
                <div className="px-6 pb-3 shrink-0 flex justify-end">
                  <ActivityDateFilter value={historyDate} onChange={setHistoryDate} />
                </div>
                <div className="flex-1 overflow-auto [scrollbar-width:thin] min-h-0 px-6 pb-4">
                  <ActivityTimeline
                    key={historyDate}
                    entries={permissionHistory}
                    pageSize={20}
                    emptyText={
                      historyDate ? "Không có thay đổi quyền nào trong ngày đã chọn." : "Chưa có thay đổi quyền nào được ghi nhận."
                    }
                  />
                </div>
                <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0">
                  <span className="text-xs text-slate-500">{permissionHistory.length} lần thay đổi</span>
                  <Button
                    intent="outline"
                    className="!border-slate-300 text-xs h-8.5 rounded-lg text-slate-700 hover:text-slate-900"
                    onClick={onClose}
                  >
                    Đóng
                  </Button>
                </div>
              </>
            ) : (
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
                  onClick: () => setView({ mode: "edit", roleCode: role.code }),
                  className: "cursor-pointer",
                })}
                className="rounded-xl border border-slate-200 overflow-hidden [&_.ant-table-thead>tr>th]:bg-slate-50 [&_.ant-table-thead>tr>th]:font-bold [&_.ant-table-thead>tr>th]:text-slate-700 [&_.ant-table-tbody>tr>td]:!align-middle [&_.ant-table-thead_th::before]:!hidden"
              />
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-slate-500">
                {filteredRoles.length}/{sortedRoles.length} chức danh
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
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
