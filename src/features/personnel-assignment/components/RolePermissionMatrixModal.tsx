"use client";

import { Fragment, useMemo, useState } from "react";
import {
  AppstoreOutlined,
  DeleteOutlined,
  FilterOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Button,
  Input,
  Modal,
  Select,
  Text,
  Title,
  Tooltip,
} from "@/components/ui";
import { useRoleMatrix } from "../hooks/useRoleMatrix";
import type { MatrixPermission } from "../constants/role-matrix-data";
import AddRoleModal from "./AddRoleModal";

interface RolePermissionMatrixModalProps {
  open: boolean;
  onClose: () => void;
  canManage?: boolean;
}

export default function RolePermissionMatrixModal({
  open,
  onClose,
  canManage = true,
}: RolePermissionMatrixModalProps) {
  const {
    roles,
    modules,
    permissions,
    isDirty,
    hasPermission,
    togglePermission,
    resetToDefault,
    saveMatrix,
    addCustomRole,
    deleteCustomRole,
  } = useRoleMatrix();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState<string>("ALL");
  const [addRoleModalOpen, setAddRoleModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<{ code: string; name: string } | null>(null);

  // Lọc chỉ hiển thị các chức vụ thực tế trong cơ quan (ẩn các role quyền chung cơ sở)
  const visibleRoles = useMemo(() => {
    return roles.filter((r) => r.group !== "base");
  }, [roles]);

  // Lọc quyền theo tìm kiếm và phân hệ
  const filteredPermissions = useMemo(() => {
    return permissions.filter((perm) => {
      if (selectedModuleId !== "ALL" && perm.moduleId !== selectedModuleId) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = perm.name.toLowerCase().includes(q);
        const matchCode = perm.code.toLowerCase().includes(q);
        const matchDesc = perm.description.toLowerCase().includes(q);
        const matchModule = perm.moduleName.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchDesc && !matchModule) {
          return false;
        }
      }
      return true;
    });
  }, [permissions, selectedModuleId, searchQuery]);

  // Gom nhóm quyền theo Module
  const permissionsByModule = useMemo(() => {
    const map = new Map<string, MatrixPermission[]>();
    filteredPermissions.forEach((perm) => {
      const list = map.get(perm.moduleId) || [];
      list.push(perm);
      map.set(perm.moduleId, list);
    });
    return map;
  }, [filteredPermissions]);

  // Badge phân loại hành động: Tối giản màu sắc sang tone trung tính / đỏ thương hiệu
  const getCategoryBadge = (category: MatrixPermission["category"]) => {
    switch (category) {
      case "read":
        return (
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
            Xem
          </span>
        );
      case "write":
        return (
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Nhập/Sửa
          </span>
        );
      case "approve":
        return (
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-[#DC2626] border border-red-200/70">
            Phê duyệt
          </span>
        );
      case "admin":
        return (
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-[#DC2626] border border-red-200/70">
            Quản trị
          </span>
        );
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      width="min(1440px, calc(100vw - 32px))"
      centered
      wrapClassName="cipm-centered-modal-wrap !overflow-hidden"
      style={{ maxWidth: 1440, top: 0, paddingBottom: 0 }}
      className="m-0 max-w-[calc(100vw-32px)] [&_.ant-modal-content]:!p-0 [&_.ant-modal-content]:!rounded-2xl overflow-hidden shadow-2xl"
    >
      <div className="flex flex-col h-[min(88vh,780px)] max-h-[calc(100vh-48px)] bg-white text-slate-900 overflow-hidden">
        {/* Header tối giản & thanh lịch */}
        <div className="px-6 py-3.5 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-[#DC2626] border border-red-200">
              <AppstoreOutlined className="text-lg" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Title level={4} className="!m-0 text-slate-900 font-bold text-base sm:text-lg">
                  Ma trận phân quyền hệ thống BQL ĐTXD
                </Title>
                <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
                  {visibleRoles.length} chức vụ
                </span>
                <span className="rounded-full bg-red-50 border border-red-200 text-[#DC2626] px-2 py-0.5 text-xs font-semibold">
                  {permissions.length} quyền / 10 phân hệ
                </span>
              </div>
              <Text className="text-xs text-slate-500">
                Cấu hình quyền linh động cho từng vị trí chức danh trong cơ quan
              </Text>
            </div>
          </div>

          {/* Các nút hành động Header: Thêm vai trò */}
          <div className="flex items-center gap-2.5">
            {canManage && (
              <Button
                intent="outline"
                scale="compact"
                icon={<PlusOutlined className="text-[#DC2626]" />}
                className="text-xs font-semibold !border-slate-300 text-slate-700 hover:text-[#DC2626] hover:!border-red-200 h-8.5 px-3"
                onClick={() => setAddRoleModalOpen(true)}
              >
                Thêm vai trò
              </Button>
            )}
          </div>
        </div>

        {/* Thanh công cụ tìm kiếm và lọc gọn gàng (đã loại bỏ các nút rườm rà) */}
        <div className="px-6 py-2.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Tìm kiếm */}
            <div className="w-72">
              <Input
                allowClear
                intent="clean"
                placeholder="Tìm quyền, mã, phân hệ..."
                prefix={<SearchOutlined className="text-slate-400 text-xs" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs h-8.5"
              />
            </div>

            {/* Lọc Phân hệ */}
            <div className="w-64">
              <Select
                value={selectedModuleId}
                onChange={(val) => setSelectedModuleId(val)}
                className="w-full text-xs h-8.5"
                options={[
                  { value: "ALL", label: "Tất cả 10 Phân hệ" },
                  ...modules.map((m) => ({
                    value: m.id,
                    label: `${m.code} - ${m.shortName}`,
                  })),
                ]}
              />
            </div>

            {(searchQuery || selectedModuleId !== "ALL") && (
              <Button
                intent="outline"
                scale="compact"
                className="text-xs h-8 text-slate-600 hover:text-[#DC2626]"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedModuleId("ALL");
                }}
              >
                Xóa lọc
              </Button>
            )}
          </div>

          {/* Nút Khôi phục mặc định gọn gàng */}
          <div>
            <Tooltip title="Khôi phục ma trận phân quyền về chuẩn mặc định ban đầu của BQL">
              <Button
                intent="outline"
                scale="compact"
                icon={<ReloadOutlined className="text-slate-400" />}
                className="text-xs !border-slate-200 text-slate-600 hover:text-[#DC2626] hover:!border-red-200 h-8"
                onClick={resetToDefault}
              >
                Khôi phục mặc định
              </Button>
            </Tooltip>
          </div>
        </div>

        {/* Bảng Ma trận Phân quyền sạch sẽ, đồng bộ màu sắc */}
        <div className="flex-1 overflow-auto [scrollbar-width:thin] min-h-0">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            {/* Header các cột Roles: Đồng bộ tone Slate trung tính, không rực rỡ */}
            <thead className="sticky top-0 z-20 bg-slate-50 shadow-xs border-b border-slate-200">
              <tr className="text-slate-800">
                {/* Cột 1: Tên quyền & phân hệ */}
                <th className="sticky left-0 z-30 bg-slate-50 w-[340px] min-w-[340px] px-4 py-3 border-r border-slate-200 text-xs font-bold uppercase tracking-wider">
                  <div className="flex items-center justify-between">
                    <span>Phân hệ / Quyền hạn</span>
                    <FilterOutlined className="text-slate-400" />
                  </div>
                </th>

                {/* Các cột Roles: Chỉ hiện chức vụ, không tag nhóm, không nút chọn tất cả */}
                {visibleRoles.map((role) => {
                  return (
                    <th
                      key={role.code}
                      className="px-3 py-3 text-center border-r border-slate-200 align-middle min-w-[110px] max-w-[140px] bg-slate-50"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <Text
                          strong
                          className="text-xs text-slate-900 leading-tight text-center"
                          title={role.description || role.name}
                        >
                          {role.shortName || role.name}
                        </Text>

                        {role.isCustom && canManage && (
                          <Tooltip title="Xóa vai trò tùy chỉnh này">
                            <button
                              type="button"
                              onClick={() => setRoleToDelete({ code: role.code, name: role.name })}
                              className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer p-0.5 rounded"
                            >
                              <DeleteOutlined className="text-xs" />
                            </button>
                          </Tooltip>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Thân bảng */}
            <tbody className="divide-y divide-slate-200 text-xs">
              {modules.map((mod) => {
                const modPerms = permissionsByModule.get(mod.id);
                if (!modPerms || modPerms.length === 0) return null;

                return (
                  <Fragment key={`group-${mod.id}`}>
                    {/* Dòng phân cách Phân hệ */}
                    <tr className="bg-slate-100/90 font-bold border-y border-slate-200">
                      <td
                        colSpan={visibleRoles.length + 1}
                        className="px-4 py-2 bg-slate-100 text-slate-800 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-800 font-bold">
                              {mod.code}
                            </span>
                            <span className="font-bold text-slate-900">{mod.name}</span>
                            <span className="text-[11px] font-normal text-slate-500">
                              ({modPerms.length} quyền)
                            </span>
                          </div>
                          <span className="text-[11px] font-normal text-slate-400">
                            Bấm ô checkbox để cấp hoặc thu hồi quyền
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Danh sách quyền */}
                    {modPerms.map((perm) => {
                      return (
                        <tr
                          key={perm.id}
                          className="hover:bg-slate-50/80 transition-colors group"
                        >
                          {/* Cột Tên quyền */}
                          <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 px-4 py-2.5 border-r border-slate-200 shadow-2xs">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-2">
                                {getCategoryBadge(perm.category)}
                                <Text strong className="text-xs text-slate-900 leading-snug">
                                  {perm.name}
                                </Text>
                              </div>
                              <Text className="text-[11px] text-slate-500 leading-normal line-clamp-1">
                                {perm.description}
                              </Text>
                              <span className="font-mono text-[9.5px] text-slate-400">
                                {perm.code}
                              </span>
                            </div>
                          </td>

                          {/* Checkbox các Roles: Nền trắng sạch sẽ, chỉ dùng đỏ thương hiệu */}
                          {visibleRoles.map((role) => {
                            const isChecked = hasPermission(role.code, perm.id);
                            const isDirector = role.code === "ADMIN";

                            return (
                              <td
                                key={`${role.code}-${perm.id}`}
                                onClick={() => {
                                  if (!isDirector && canManage) {
                                    togglePermission(role.code, perm.id);
                                  }
                                }}
                                className={`px-2 py-2 text-center border-r border-slate-200 select-none transition-colors ${
                                  isDirector
                                    ? "bg-slate-50/50 cursor-not-allowed"
                                    : "hover:bg-slate-50 cursor-pointer"
                                }`}
                              >
                                <div className="flex items-center justify-center">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    disabled={isDirector || !canManage}
                                    onChange={() => togglePermission(role.code, perm.id)}
                                    className={`h-4 w-4 rounded transition-all ${
                                      isDirector
                                        ? "accent-slate-400 opacity-60 cursor-not-allowed"
                                        : "accent-[#DC2626] cursor-pointer"
                                    }`}
                                  />
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer tinh giản & rõ ràng */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span
              className={`h-2 w-2 rounded-full inline-block ${
                isDirty ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
              }`}
            />
            <span>
              Tổng cộng <strong>{permissions.length}</strong> quyền hạn trên <strong>{visibleRoles.length}</strong> chức vụ.
              {isDirty ? (
                <span className="text-amber-600 font-medium ml-1">
                  (Có thay đổi chưa lưu, bấm &quot;Lưu cấu hình&quot; để ghi nhận vào hệ thống)
                </span>
              ) : (
                <span className="text-slate-500 ml-1">
                  (Cấu hình phân quyền đã đồng bộ)
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              intent="outline"
              className="!border-slate-300 text-xs h-8.5 rounded-lg text-slate-700 hover:text-slate-900"
              onClick={onClose}
            >
              Đóng
            </Button>
            <Button
              intent="primary"
              icon={<SaveOutlined />}
              className="h-8.5 text-xs font-semibold bg-[#DC2626] hover:bg-red-700 text-white rounded-lg shadow-xs"
              onClick={saveMatrix}
            >
              Lưu cấu hình
            </Button>
          </div>
        </div>
      </div>

      {/* Modal Thêm vai trò mới */}
      {addRoleModalOpen && (
        <AddRoleModal
          open={addRoleModalOpen}
          onClose={() => setAddRoleModalOpen(false)}
          onAddRole={(roleData) => {
            addCustomRole(roleData);
          }}
        />
      )}

      {/* Modal Xác nhận xóa vai trò tùy chỉnh */}
      {roleToDelete && (
        <Modal
          open={!!roleToDelete}
          onCancel={() => setRoleToDelete(null)}
          footer={null}
          closable={false}
          width={420}
          className="[&_.ant-modal-content]:!p-0 [&_.ant-modal-content]:!rounded-2xl overflow-hidden shadow-2xl"
        >
          <div className="p-6 bg-white text-slate-900">
            <Title level={4} className="!m-0 text-base font-bold text-slate-900 mb-2">
              Xác nhận xóa vai trò
            </Title>
            <Text className="text-xs text-slate-600 block mb-6 leading-relaxed">
              Bạn có chắc chắn muốn xóa vai trò tùy chỉnh{" "}
              <strong className="text-slate-900">&quot;{roleToDelete.name}&quot;</strong> khỏi ma trận phân quyền? Các thiết lập quyền của vai trò này sẽ bị gỡ bỏ.
            </Text>
            <div className="flex items-center justify-end gap-2.5">
              <Button
                intent="outline"
                className="text-xs h-8.5 rounded-lg text-slate-700"
                onClick={() => setRoleToDelete(null)}
              >
                Hủy
              </Button>
              <Button
                intent="primary"
                className="text-xs h-8.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
                onClick={() => {
                  deleteCustomRole(roleToDelete.code);
                  setRoleToDelete(null);
                }}
              >
                Xác nhận xóa
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
}
