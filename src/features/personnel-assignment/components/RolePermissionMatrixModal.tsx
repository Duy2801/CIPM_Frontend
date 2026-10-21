"use client";

import { useCallback, useMemo, useState } from "react";
import { Modal, toast } from "@/components/ui";
import { App } from "antd";
import { useRoleMatrix } from "../hooks/useRoleMatrix";
import RoleEditorView from "./RoleEditorView";

interface RolePermissionMatrixModalProps {
  open: boolean;
  onClose: () => void;
  canManage?: boolean;
}

/** "main" = chọn chức danh, sửa tên / trạng thái / quyền ngay tại chỗ; "create" = màn Thêm chức danh (có quay lại) */
type MatrixView = "main" | "create";

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
    deleteCustomRole,
    lockedRoleCodes,
    setRoleLocked,
    renameRole,
    updateRolePermissions,
  } = useRoleMatrix();

  // Danh sách chức vụ thực tế trong cơ quan (ẩn base roles dùng để kế thừa)
  const visibleRoles = useMemo(() => {
    return roles.filter((r) => r.group !== "base");
  }, [roles]);

  // Danh sách chức danh trong dropdown: một danh sách liền (không chia nhóm theo phòng ban),
  // vẫn sắp theo thứ tự Ban Giám đốc → Phó Giám đốc → các tổ → chức danh khác → chức danh tự thêm.
  const roleSelectOptions = useMemo(() => {
    const departmentOrder: ((d: string) => boolean)[] = [
      (d) => /Ban Giám đốc/i.test(d),
      (d) => /Phó Giám đốc/i.test(d),
      (d) => /Giám sát/i.test(d) || /Kỹ thuật/i.test(d),
      (d) => /Bồi thường/i.test(d) || /GPMB/i.test(d),
      (d) => /Hành chính/i.test(d) || /Tài chính/i.test(d) || /Kế toán/i.test(d),
    ];
    const orderOf = (department?: string) => {
      const idx = departmentOrder.findIndex((match) => match(department || ""));
      return idx === -1 ? departmentOrder.length : idx;
    };

    const standardRoles = visibleRoles
      .filter((r) => !r.isCustom)
      .map((r, idx) => ({ role: r, idx }))
      .sort((a, b) => orderOf(a.role.department) - orderOf(b.role.department) || a.idx - b.idx)
      .map(({ role }) => role);

    // Chức danh tự thêm (loại bỏ trùng tên)
    const seenCustomNames = new Set<string>();
    const customRoles = visibleRoles.filter((r) => {
      if (!r.isCustom) return false;
      const key = (r.name || "").trim().toLowerCase();
      if (!key || seenCustomNames.has(key)) return false;
      seenCustomNames.add(key);
      return true;
    });

    // Tên trùng nhau → ghi kèm phòng ban để phân biệt
    const nameCount = new Map<string, number>();
    standardRoles.forEach((r) => {
      const key = r.name.trim().toLowerCase();
      nameCount.set(key, (nameCount.get(key) ?? 0) + 1);
    });

    // Chức danh đang tắt vẫn hiện để xem / bật lại, kèm nhãn "(Đã tắt)"
    const lockedSuffix = (code: string) => (lockedRoleCodes.includes(code) ? " (Đã tắt)" : "");
    return [
      ...standardRoles.map((r) => {
        const isShared = (nameCount.get(r.name.trim().toLowerCase()) ?? 0) > 1;
        const label = (isShared && r.department ? `${r.name} (${r.department})` : r.name) + lockedSuffix(r.code);
        return { value: r.code, label, searchText: `${label} ${r.department ?? ""}` };
      }),
      ...customRoles.map((r) => ({
        value: r.code,
        label: `${r.name}${lockedSuffix(r.code)}`,
        searchText: `${r.name} ${r.department ?? ""}`,
      })),
    ];
  }, [visibleRoles, lockedRoleCodes]);

  const [view, setView] = useState<MatrixView>("main");
  // Chức danh đang chọn (nhớ lại khi quay về từ màn Thêm chức danh)
  const [selectedRoleCode, setSelectedRoleCode] = useState<string>(() => visibleRoles[0]?.code || "ADMIN");
  const activeRoleCode = visibleRoles.some((r) => r.code === selectedRoleCode)
    ? selectedRoleCode
    : visibleRoles[0]?.code;
  // Tắt chức danh: hỏi xác nhận trước; bật lại thì làm ngay
  const handleToggleLock = (roleCode: string) => {
    const role = visibleRoles.find((r) => r.code === roleCode);
    if (!role) return;
    if (lockedRoleCodes.includes(roleCode)) {
      setRoleLocked(roleCode, false);
      return;
    }
    modal.confirm({
      centered: true,
      width: 440,
      icon: null,
      title: `Tắt chức danh "${role.name}"?`,
      content: (
        <p className="m-0 text-xs leading-relaxed text-slate-600">
          Sau khi tắt, cán bộ đang giữ chức danh này tạm thời không còn chức danh và quyền hạn, và không ai chọn được
          chức danh này. Bật lại thì mọi người có lại chức danh như cũ.
        </p>
      ),
      okText: "Tắt chức danh",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: () => setRoleLocked(roleCode, true),
    });
  };

  // Lưu: thêm mới (không có mã) hoặc đổi tên + quyền (lưu ngay), rồi chọn chức danh đó
  const handleSubmitRole = (roleCode: string | undefined, name: string, permIds: string[]) => {
    if (!roleCode) {
      const created = addCustomRole({
        name,
        shortName: name,
        group: "member",
        description: `Chức danh ${name} trong hệ thống`,
        initialPermissions: permIds,
      });
      if (!created?.code) return null;
      setSelectedRoleCode(created.code);
      return created.code;
    }
    if (!renameRole(roleCode, name)) return null;
    updateRolePermissions(roleCode, permIds);
    setSelectedRoleCode(roleCode);
    toast.success(`Đã lưu chức danh "${name}".`);
    // Lưu xong thì đóng luôn form phân quyền
    onClose();
    return roleCode;
  };

  const getRolePermIds = useCallback(
    (roleCode: string) => permissions.filter((p) => hasPermission(roleCode, p.id)).map((p) => p.id),
    [permissions, hasPermission]
  );

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
        <RoleEditorView
          key={view}
          mode={view === "create" ? "create" : "edit"}
          title={view === "create" ? "Thêm chức danh" : "Cấu hình phân quyền hệ thống BQL ĐTXD"}
          roles={visibleRoles}
          roleOptions={roleSelectOptions}
          initialRoleCode={activeRoleCode}
          modules={modules}
          permissions={permissions}
          getRolePermIds={getRolePermIds}
          lockedRoleCodes={lockedRoleCodes}
          onToggleLock={handleToggleLock}
          onSubmit={handleSubmitRole}
          {...(view === "create"
            ? { onBack: () => setView("main") }
            : {
                onClose,
                onRoleChange: setSelectedRoleCode,
                onDeleteRole: deleteCustomRole,
                onCreateNew: () => setView("create"),
                readOnly: !canManage,
              })}
        />
      </div>
    </Modal>
  );
}
