"use client";

import { useMemo, useState } from "react";
import {
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Button,
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
    toggleModuleForRole,
    resetToDefault,
    saveMatrix,
    addCustomRole,
    deleteCustomRole,
  } = useRoleMatrix();

  // Danh sách chức vụ thực tế trong cơ quan (ẩn base roles dùng để kế thừa)
  const visibleRoles = useMemo(() => {
    return roles.filter((r) => r.group !== "base");
  }, [roles]);

  // Phân nhóm hiển thị trong dropdown chọn chức danh theo Phòng ban / Tổ chuyên môn từ trên xuống dưới
  const selectGroupedOptions = useMemo(() => {
    // Thứ tự các phòng ban chuẩn của BQL ĐTXD
    const departmentOrder = [
      { key: "bgd", title: "🏛️ BAN GIÁM ĐỐC", match: (d: string) => /Ban Giám đốc/i.test(d) },
      { key: "pgd", title: "🏢 BAN PHÓ GIÁM ĐỐC (GIAO 03 NGƯỜI)", match: (d: string) => /Phó Giám đốc/i.test(d) },
      { key: "gskt", title: "📐 TỔ GIÁM SÁT – KỸ THUẬT", match: (d: string) => /Giám sát/i.test(d) || /Kỹ thuật/i.test(d) },
      { key: "bt", title: "🌳 TỔ BỒI THƯỜNG, GIẢI TỎA, GPMB – TÁI ĐỊNH CƯ", match: (d: string) => /Bồi thường/i.test(d) || /GPMB/i.test(d) },
      { key: "hcth", title: "📋 TỔ HÀNH CHÍNH – TỔNG HỢP", match: (d: string) => /Hành chính/i.test(d) || /Tài chính/i.test(d) || /Kế toán/i.test(d) },
    ];

    const standardRoles = visibleRoles.filter((r) => !r.isCustom);
    const customRoles = visibleRoles.filter((r) => r.isCustom);

    const groups: { label: string; options: { value: string; label: string }[] }[] = [];
    const assignedCodes = new Set<string>();

    departmentOrder.forEach((dept) => {
      const deptRoles = standardRoles.filter((r) => !assignedCodes.has(r.code) && dept.match(r.department || ""));
      if (deptRoles.length > 0) {
        deptRoles.forEach((r) => assignedCodes.add(r.code));
        groups.push({
          label: dept.title,
          options: deptRoles.map((r) => ({
            value: r.code,
            label: r.name,
          })),
        });
      }
    });

    // Các vai trò chuẩn còn lại (nếu có)
    const remainingRoles = standardRoles.filter((r) => !assignedCodes.has(r.code));
    if (remainingRoles.length > 0) {
      groups.push({
        label: "⭐ VAI TRÒ KHÁC",
        options: remainingRoles.map((r) => ({
          value: r.code,
          label: r.department ? `${r.name} · ${r.department}` : r.name,
        })),
      });
    }

    // Các vai trò tùy chỉnh (loại bỏ trùng lặp nếu có)
    const seenCustomNames = new Set<string>();
    const uniqueCustomRoles = customRoles.filter((r) => {
      const key = (r.name || "").trim().toLowerCase();
      if (!key || seenCustomNames.has(key)) return false;
      seenCustomNames.add(key);
      return true;
    });

    if (uniqueCustomRoles.length > 0) {
      groups.push({
        label: "🛠️ VAI TRÒ TÙY CHỈNH",
        options: uniqueCustomRoles.map((r) => ({
          value: r.code,
          label: `${r.name} (Tùy chỉnh)`,
        })),
      });
    }

    return groups;
  }, [visibleRoles]);

  // Vai trò đang được chọn để cấu hình phân quyền
  const [selectedRoleCode, setSelectedRoleCode] = useState<string>(() => {
    return visibleRoles[0]?.code || "ADMIN";
  });

  const [selectedModuleId, setSelectedModuleId] = useState<string>("ALL");
  const [addRoleModalOpen, setAddRoleModalOpen] = useState(false);

  // Đảm bảo selectedRoleCode luôn hợp lệ nếu danh sách roles thay đổi
  const currentRole = useMemo(() => {
    return visibleRoles.find((r) => r.code === selectedRoleCode) || visibleRoles[0];
  }, [visibleRoles, selectedRoleCode]);

  const activeRoleCode = currentRole?.code || visibleRoles[0]?.code || "ADMIN";

  // Thống kê số quyền đã cấp cho role hiện tại
  const roleGrantedCount = useMemo(() => {
    return permissions.filter((p) => hasPermission(activeRoleCode, p.id)).length;
  }, [permissions, hasPermission, activeRoleCode]);

  // Lọc quyền theo màn hình / phân hệ
  const filteredPermissions = useMemo(() => {
    return permissions.filter((perm) => {
      if (selectedModuleId !== "ALL" && perm.moduleId !== selectedModuleId) {
        return false;
      }
      return true;
    });
  }, [permissions, selectedModuleId]);

  // Gom nhóm quyền theo Module / Màn hình
  const permissionsByModule = useMemo(() => {
    const map = new Map<string, MatrixPermission[]>();
    filteredPermissions.forEach((perm) => {
      const list = map.get(perm.moduleId) || [];
      list.push(perm);
      map.set(perm.moduleId, list);
    });
    return map;
  }, [filteredPermissions]);

  // Badge phân loại hành động (chuyển đồng bộ tông màu vàng/amber cho dễ nhìn)
  const getCategoryBadge = (category: MatrixPermission["category"]) => {
    switch (category) {
      case "read":
        return (
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            Xem
          </span>
        );
      case "write":
        return (
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            Nhập/Sửa
          </span>
        );
      case "approve":
        return (
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            Phê duyệt
          </span>
        );
      case "admin":
        return (
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
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
      width="min(1120px, calc(100vw - 32px))"
      centered
      wrapClassName="cipm-centered-modal-wrap !overflow-hidden"
      style={{ maxWidth: 1120, top: 0, paddingBottom: 0 }}
      className="m-0 max-w-[calc(100vw-32px)] [&_.ant-modal-content]:!p-0 [&_.ant-modal-content]:!rounded-2xl overflow-hidden shadow-2xl"
    >
      <div className="flex flex-col h-[min(88vh,780px)] max-h-[calc(100vh-48px)] bg-white text-slate-900 overflow-hidden">
        {/* 1. Header Modal */}
        <div className="px-6 py-3.5 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Title level={4} className="!m-0 text-slate-900 font-bold text-base sm:text-lg">
                Cấu hình phân quyền hệ thống BQL ĐTXD
              </Title>
            </div>
          </div>
        </div>

        {/* 2. THANH CÔNG CỤ & BỘ LỌC TINH GỌN (CĂN GỌN TRÊN 1 DÒNG) */}
        <div className="px-6 py-2.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
            {/* Chọn Chức danh */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">Chức danh:</span>
              <div className="w-56 sm:w-80 flex items-center gap-1.5">
                <Select
                  value={activeRoleCode}
                  onChange={(val) => setSelectedRoleCode(val)}
                  className="w-full text-xs font-semibold"
                  options={selectGroupedOptions}
                  popupMatchSelectWidth={false}
                />
                {currentRole?.isCustom && canManage && (
                  <Tooltip title={`Xóa vai trò tùy chỉnh "${currentRole.name}"`}>
                    <Button
                      intent="outline"
                      scale="compact"
                      icon={<DeleteOutlined className="text-rose-500" />}
                      className="text-xs h-8 px-2 !border-rose-200 text-rose-600 hover:!border-rose-400 hover:!bg-rose-50 shrink-0 shadow-2xs"
                      onClick={() => {
                        deleteCustomRole(currentRole.code);
                        setSelectedRoleCode(visibleRoles[0]?.code || "ADMIN");
                      }}
                    >
                      Xóa
                    </Button>
                  </Tooltip>
                )}
              </div>
            </div>

            {/* Đường ngăn cách nhẹ */}
            <div className="h-4 w-px bg-slate-300 hidden sm:block mx-0.5" />

            {/* Lọc màn hình / phân hệ */}
            <div className="w-48 sm:w-56">
              <Select
                value={selectedModuleId}
                onChange={(val) => setSelectedModuleId(val)}
                className="w-full text-xs h-8"
                options={[
                  { value: "ALL", label: `Tất cả ${modules.length} Màn hình` },
                  ...modules.map((m) => ({
                    value: m.id,
                    label: `${m.code} - ${m.shortName}`,
                  })),
                ]}
              />
            </div>

            {selectedModuleId !== "ALL" && (
              <Button
                intent="outline"
                scale="compact"
                className="text-xs h-8 text-slate-600 hover:text-[#DC2626]"
                onClick={() => setSelectedModuleId("ALL")}
              >
                Xóa lọc
              </Button>
            )}
          </div>

          {/* Góc phải: Nút Thêm vai trò & Nút Khôi phục mặc định */}
          <div className="flex items-center gap-2 shrink-0">
            {canManage && (
              <Button
                intent="outline"
                scale="compact"
                icon={<PlusOutlined className="text-[#DC2626]" />}
                className="text-xs font-semibold !border-slate-300 text-slate-700 hover:text-[#DC2626] hover:!border-red-200 h-8 px-3"
                onClick={() => setAddRoleModalOpen(true)}
              >
                Thêm vai trò
              </Button>
            )}

            <Tooltip title="Khôi phục phân quyền về chuẩn mặc định ban đầu của BQL">
              <Button
                intent="outline"
                scale="compact"
                icon={<ReloadOutlined className="text-slate-400" />}
                className="text-xs !border-slate-300 text-slate-700 hover:text-[#DC2626] hover:!border-red-200 h-8"
                onClick={resetToDefault}
              >
                Khôi phục mặc định
              </Button>
            </Tooltip>
          </div>
        </div>

        {/* 3. DANH SÁCH QUYỀN HẠN CÁC MÀN HÌNH ĐỂ TÍCH CHỌN */}
        <div className="flex-1 overflow-auto [scrollbar-width:thin] min-h-0 p-6 space-y-4 bg-slate-50/50">
          {filteredPermissions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
              <SearchOutlined className="text-slate-300 text-3xl mb-3" />
              <div className="text-sm font-semibold text-slate-700">Không tìm thấy quyền hạn phù hợp</div>
              <div className="text-xs text-slate-400 mt-1">
                Thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn bộ lọc màn hình
              </div>
            </div>
          ) : (
            modules.map((mod) => {
              const modPerms = permissionsByModule.get(mod.id);
              if (!modPerms || modPerms.length === 0) return null;

              const modGrantedCount = modPerms.filter((p) => hasPermission(activeRoleCode, p.id)).length;

              return (
                <div
                  key={`group-${mod.id}`}
                  className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden"
                >
                  {/* Tiêu đề Màn hình / Phân hệ */}
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-800 font-bold">
                        {mod.code}
                      </span>
                      <span className="font-bold text-xs sm:text-sm text-slate-900">{mod.name}</span>
                    </div>

                    <label
                      onClick={(e) => e.stopPropagation()}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md transition-colors select-none ${
                        canManage
                          ? "cursor-pointer text-slate-700 hover:text-[#DC2626] hover:bg-slate-200/60"
                          : "cursor-default text-slate-400"
                      }`}
                      title="Chọn toàn bộ quyền trong màn hình này"
                    >
                      <input
                        type="checkbox"
                        checked={modPerms.length > 0 && modGrantedCount === modPerms.length}
                        ref={(el) => {
                          if (el) {
                            el.indeterminate = modGrantedCount > 0 && modGrantedCount < modPerms.length;
                          }
                        }}
                        disabled={!canManage}
                        onChange={() => {
                          if (canManage) {
                            toggleModuleForRole(
                              activeRoleCode,
                              mod.id,
                              modPerms.map((p) => p.id)
                            );
                          }
                        }}
                        className="h-4 w-4 rounded accent-[#DC2626] cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span>Chọn tất cả</span>
                    </label>
                  </div>

                  {/* Danh sách các quyền của màn hình để tích */}
                  <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {modPerms.map((perm) => {
                      const isChecked = hasPermission(activeRoleCode, perm.id);

                      return (
                        <div
                          key={perm.id}
                          role="checkbox"
                          aria-checked={isChecked}
                          tabIndex={canManage ? 0 : -1}
                          onClick={() => {
                            if (canManage) {
                              togglePermission(activeRoleCode, perm.id);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (canManage && (e.key === " " || e.key === "Enter")) {
                              e.preventDefault();
                              togglePermission(activeRoleCode, perm.id);
                            }
                          }}
                          className={`flex items-start gap-3 p-3 rounded-lg border bg-white transition-all select-none ${
                            isChecked
                              ? "border-slate-300 shadow-2xs"
                              : "border-slate-200/80"
                          } ${canManage ? "cursor-pointer hover:border-slate-300 hover:bg-slate-50/50" : "cursor-default"}`}
                        >
                          <div className="pt-0.5 shrink-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={!canManage}
                              readOnly
                              tabIndex={-1}
                              aria-hidden="true"
                              className="h-4.5 w-4.5 rounded accent-[#DC2626] pointer-events-none cursor-pointer"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              {getCategoryBadge(perm.category)}
                              <span className="font-bold text-xs text-slate-900 leading-snug">
                                {perm.name}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 leading-normal mb-1 line-clamp-2">
                              {perm.description}
                            </div>
                            <span className="font-mono text-[9.5px] text-slate-400">
                              {perm.code}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 4. Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span
              className=""
            />
            <span>
              Đang xem chức danh: <strong className="text-slate-900">{currentRole?.name}</strong>{" "}
              {currentRole?.department && (
                <span className="text-slate-500 font-medium">({currentRole.department})</span>
              )}{" "}
              · Đã cấp <strong className="text-[#DC2626]">{roleGrantedCount}</strong>/{permissions.length} quyền.
              {isDirty && (
                <span className="text-amber-600 font-semibold ml-1.5">
                  (Chưa lưu — bấm &quot;Lưu cấu hình&quot; để áp dụng)
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
              onClick={() => {
                saveMatrix();
                onClose();
              }}
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
            const newRole = addCustomRole(roleData);
            if (newRole?.code) {
              setSelectedRoleCode(newRole.code);
            }
          }}
        />
      )}
    </Modal>
  );
}
