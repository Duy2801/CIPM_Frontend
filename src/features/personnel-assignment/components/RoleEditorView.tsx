"use client";

import { useMemo, useState } from "react";
import { PlusOutlined, SaveOutlined } from "@ant-design/icons";
import { App } from "antd";
import { Button, Input, Title, toast } from "@/components/ui";
import { normalizeSearchText } from "@/utils/search-text";
import PermissionChecklist from "./PermissionChecklist";
import { useConfirmAction } from "../hooks/useConfirmAction";
import { usePermissionChangeLog } from "../hooks/usePermissionChangeLog";
import { useStaffAccess } from "../hooks/usePersonnelAccess";
import { useRoleMatrix, useRoleMatrixActions, useSortedMatrixRoles } from "../hooks/useRoleMatrix";
import type { ActivityChange } from "../utils/activity-log";

interface RoleEditorViewProps {
  /** Mã chức danh cần xem / sửa; bỏ trống = tạo chức danh mới */
  roleCode?: string;
  /** Quay lại danh sách chức danh */
  onBack: () => void;
}

/** Màn Tạo / Chỉnh sửa chức danh: nhập tên, tick quyền theo nhóm rồi lưu; "Hủy" để quay lại danh sách */
export default function RoleEditorView({ roleCode, onBack }: RoleEditorViewProps) {
  const { sortedRoles: roles, getRolePermIds } = useSortedMatrixRoles();
  const { modules, permissions } = useRoleMatrix();
  const { createRole, renameRole, updateRolePermissions } = useRoleMatrixActions();
  // Không có quyền quản lý → chỉ xem
  const readOnly = !useStaffAccess().canManageAccounts;
  const logPermissionChange = usePermissionChangeLog();
  const role = roleCode ? roles.find((r) => r.code === roleCode) : undefined;
  const { modal } = App.useApp();
  const confirmAction = useConfirmAction();
  const isCreating = !roleCode;
  const baselineName = role?.name ?? "";

  const [name, setName] = useState(baselineName);
  // Quyền ban đầu (chỉnh sửa: quyền hiện có; tạo mới: rỗng) — chụp lúc mở màn
  const [initialPermIds] = useState<string[]>(() => (roleCode ? getRolePermIds(roleCode) : []));
  // Quyền đang tick là bản nháp: chỉ lưu khi bấm nút ở dưới
  const [draftPerms, setDraftPerms] = useState<string[]>(initialPermIds);

  const trimmedName = name.trim();
  const isNameTaken = roles.some(
    (r) => r.code !== role?.code && normalizeSearchText(r.name) === normalizeSearchText(trimmedName)
  );
  const canSubmit = !readOnly && Boolean(trimmedName) && !isNameTaken;

  const isDirty = useMemo(() => {
    if (trimmedName !== baselineName.trim()) return true;
    const initial = new Set(initialPermIds);
    return draftPerms.length !== initial.size || draftPerms.some((id) => !initial.has(id));
  }, [trimmedName, baselineName, draftPerms, initialPermIds]);

  const togglePerm = (permId: string) =>
    setDraftPerms((prev) => (prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]));
  const toggleModule = (_moduleId: string, permIds: string[]) =>
    setDraftPerms((prev) =>
      permIds.every((id) => prev.includes(id))
        ? prev.filter((id) => !permIds.includes(id))
        : Array.from(new Set([...prev, ...permIds]))
    );

  // Quay lại: còn thay đổi chưa lưu thì hỏi trước khi bỏ
  const handleBack = () => {
    if (readOnly || !isDirty) {
      onBack();
      return;
    }
    modal.confirm({
      centered: true,
      width: 420,
      icon: null,
      title: "Bỏ các thay đổi chưa lưu?",
      content: (
        <p className="m-0 text-xs leading-relaxed text-slate-600">Tên và các quyền bạn vừa chỉnh sẽ không được lưu.</p>
      ),
      okText: "Bỏ thay đổi",
      cancelText: "Ở lại",
      okButtonProps: { danger: true },
      onOk: onBack,
    });
  };

  /** Tạo chức danh mới + ghi nhật ký; trả về false nếu không tạo được */
  const saveNewRole = () => {
    const created = createRole(trimmedName, draftPerms);
    if (!created?.code) return false;
    const permNames = permissions.filter((p) => draftPerms.includes(p.id)).map((p) => p.name);
    logPermissionChange(
      { code: created.code, name: trimmedName },
      "Tạo chức danh",
      [{ label: "Số quyền", to: `${draftPerms.length} quyền` }],
      permNames.length ? `Quyền được cấp: ${permNames.join(", ")}` : undefined
    );
    return true;
  };

  /** Lưu tên + quyền của chức danh đang sửa, ghi lại đúng phần thay đổi; trả về false nếu tên không hợp lệ */
  const saveExistingRole = (code: string) => {
    if (!renameRole(code, trimmedName)) return false;
    updateRolePermissions(code, draftPerms);
    toast.success(`Đã lưu chức danh "${trimmedName}".`);

    const beforeIds = new Set(initialPermIds);
    const afterIds = new Set(draftPerms);
    const nameOf = (id: string) => permissions.find((p) => p.id === id)?.name ?? id;
    const added = draftPerms.filter((id) => !beforeIds.has(id)).map(nameOf);
    const removed = [...beforeIds].filter((id) => !afterIds.has(id)).map(nameOf);
    const changes: ActivityChange[] = [];
    if (baselineName !== trimmedName) changes.push({ label: "Tên chức danh", from: baselineName, to: trimmedName });
    if (added.length || removed.length) {
      changes.push({ label: "Số quyền", from: `${beforeIds.size} quyền`, to: `${draftPerms.length} quyền` });
      if (added.length) changes.push({ label: "Thêm quyền", to: added.join(", ") });
      if (removed.length) changes.push({ label: "Bỏ quyền", to: removed.join(", ") });
    }
    if (changes.length) logPermissionChange({ code, name: trimmedName }, "Cập nhật chức danh", changes);
    return true;
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (
      !(await confirmAction({
        title: isCreating ? `Tạo chức danh "${trimmedName}"?` : `Lưu thay đổi chức danh "${trimmedName}"?`,
        description: isCreating
          ? `Chức danh mới có ${draftPerms.length} quyền.`
          : `Chức danh sẽ có ${draftPerms.length} quyền. Mọi cán bộ giữ chức danh này đều cập nhật theo.`,
        okText: isCreating ? "Tạo chức danh" : "Lưu thay đổi",
      }))
    )
      return;
    const saved = roleCode ? saveExistingRole(roleCode) : saveNewRole();
    if (saved) onBack();
  };

  const title = readOnly ? "Xem chức danh" : isCreating ? "Tạo chức danh mới" : "Chỉnh sửa chức danh";

  return (
    <>
      {/* Tiêu đề (quay lại danh sách bằng nút "Hủy" ở dưới) */}
      <div className="px-6 py-3.5 border-b border-slate-200 bg-white flex items-center gap-2.5 shrink-0">
        <Title level={4} className="!m-0 text-slate-900 font-bold text-base sm:text-lg">
          {title}
        </Title>
      </div>

      {/* Nội dung: tên chức danh + phân quyền (cuộn chung) */}
      <div className="flex-1 overflow-auto [scrollbar-width:thin] min-h-0 px-6 py-5">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <div className="min-w-0 flex-1 basis-80">
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              Tên chức danh {!readOnly && <span className="text-red-500">*</span>}
            </label>
            <Input
              autoFocus={!readOnly}
              intent="clean"
              value={name}
              disabled={readOnly}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên chức danh..."
              status={trimmedName && isNameTaken ? "error" : undefined}
              className="w-full h-10 text-sm"
            />
          </div>

        </div>
        {trimmedName && isNameTaken && <div className="mt-1 text-xs text-rose-600">Tên chức danh này đã tồn tại.</div>}

        <div className="mt-6 mb-2.5 text-sm font-semibold text-slate-800">
          Phân quyền{" "}
          <span className="font-normal text-slate-500">
            ({draftPerms.length}/{permissions.length})
          </span>
        </div>
        <PermissionChecklist
          modules={modules}
          permissions={permissions}
          isChecked={(id) => draftPerms.includes(id)}
          onToggle={togglePerm}
          onToggleModule={toggleModule}
          canManage={!readOnly}
        />
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-end gap-2 shrink-0">
        <Button
          intent="outline"
          className="!border-slate-300 text-xs h-8.5 rounded-lg text-slate-700 hover:text-slate-900"
          onClick={handleBack}
        >
          {readOnly ? "Quay lại" : "Hủy"}
        </Button>
        {!readOnly && (
          <Button
            intent="primary"
            icon={isCreating ? <PlusOutlined /> : <SaveOutlined />}
            disabled={!canSubmit || (!isCreating && !isDirty)}
            className="h-8.5 text-xs font-semibold bg-[#DC2626] hover:bg-red-700 text-white rounded-lg shadow-xs disabled:opacity-50"
            onClick={handleSubmit}
          >
            {isCreating ? "Tạo chức danh" : "Lưu thay đổi"}
          </Button>
        )}
      </div>
    </>
  );
}
