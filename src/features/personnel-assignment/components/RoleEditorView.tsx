"use client";

import { useMemo, useState } from "react";
import { ArrowLeftOutlined, DeleteOutlined, PlusOutlined, SaveOutlined } from "@ant-design/icons";
import { App } from "antd";
import { Button, Input, Select, Switch, Title, Tooltip } from "@/components/ui";
import { normalizeSearchText } from "@/utils/search-text";
import type { MatrixModule, MatrixPermission, MatrixRole } from "../constants/role-matrix-data";
import PermissionChecklist from "./PermissionChecklist";

interface RoleOption {
  value: string;
  label: string;
  searchText: string;
}

interface RoleEditorViewProps {
  /** "create" = thêm chức danh mới, "edit" = chọn một chức danh để cập nhật */
  mode: "create" | "edit";
  /** Tất cả chức danh hiện có (để chọn khi cập nhật và kiểm tra trùng tên) */
  roles: MatrixRole[];
  roleOptions: RoleOption[];
  /** Chức danh chọn sẵn khi mở màn cập nhật */
  initialRoleCode?: string;
  modules: MatrixModule[];
  permissions: MatrixPermission[];
  /** Quyền hiện có của một chức danh */
  getRolePermIds: (roleCode: string) => string[];
  lockedRoleCodes: string[];
  onToggleLock: (roleCode: string) => void;
  /** Tiêu đề màn hình (mặc định: "Thêm chức danh" / "Cập nhật chức danh") */
  title?: string;
  /** Có truyền thì hiện icon quay lại trên tiêu đề; lưu xong cũng quay lại */
  onBack?: () => void;
  /** Có truyền thì hiện nút "Thêm chức danh" ở góc phải tiêu đề */
  onCreateNew?: () => void;
  /** Chỉ xem: không sửa tên, trạng thái, quyền */
  readOnly?: boolean;
  /** Có truyền thì hiện nút "Đóng" ở thanh dưới */
  onClose?: () => void;
  /** Báo chức danh đang chọn để màn cha nhớ lại */
  onRoleChange?: (roleCode: string) => void;
  /** Xóa chức danh tự thêm */
  onDeleteRole?: (roleCode: string) => void;
  /** Lưu tên + quyền (roleCode trống = thêm mới); trả về mã chức danh đã lưu, hoặc null nếu không lưu được */
  onSubmit: (roleCode: string | undefined, name: string, permIds: string[]) => string | null;
}

/** Màn Thêm / Cập nhật chức danh: chọn chức danh (khi cập nhật), nhập tên, tick quyền rồi lưu */
export default function RoleEditorView({
  mode,
  roles,
  roleOptions,
  initialRoleCode,
  modules,
  permissions,
  getRolePermIds,
  lockedRoleCodes,
  onToggleLock,
  title,
  onBack,
  onCreateNew,
  readOnly = false,
  onClose,
  onRoleChange,
  onDeleteRole,
  onSubmit,
}: RoleEditorViewProps) {
  const { modal } = App.useApp();
  const isCreating = mode === "create";

  const [roleCode, setRoleCode] = useState<string | undefined>(isCreating ? undefined : initialRoleCode);
  const role = roles.find((r) => r.code === roleCode);
  // Giá trị gốc để biết có thay đổi chưa lưu
  const baselineName = role?.name ?? "";
  const baselinePerms = useMemo(() => (roleCode ? getRolePermIds(roleCode) : []), [roleCode, getRolePermIds]);

  const [name, setName] = useState(baselineName);
  // Quyền đang tick là bản nháp: chỉ lưu khi bấm nút ở dưới
  const [draftPerms, setDraftPerms] = useState<string[]>(baselinePerms);

  const trimmedName = name.trim();
  const isNameTaken = roles.some(
    (r) => r.code !== roleCode && normalizeSearchText(r.name) === normalizeSearchText(trimmedName)
  );
  const canEdit = !readOnly && (isCreating || Boolean(role));
  const canSubmit = canEdit && Boolean(trimmedName) && !isNameTaken;
  const isLocked = Boolean(roleCode) && lockedRoleCodes.includes(roleCode!);

  const isDirty = useMemo(() => {
    if (trimmedName !== baselineName.trim()) return true;
    const initial = new Set(baselinePerms);
    return draftPerms.length !== initial.size || draftPerms.some((id) => !initial.has(id));
  }, [trimmedName, baselineName, draftPerms, baselinePerms]);

  const togglePerm = (permId: string) =>
    setDraftPerms((prev) => (prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]));
  const toggleModule = (_moduleId: string, permIds: string[]) =>
    setDraftPerms((prev) =>
      permIds.every((id) => prev.includes(id))
        ? prev.filter((id) => !permIds.includes(id))
        : Array.from(new Set([...prev, ...permIds]))
    );

  // Còn thay đổi chưa lưu thì hỏi trước khi bỏ
  const confirmDiscard = (onConfirm: () => void) => {
    if (!isDirty) {
      onConfirm();
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
      onOk: onConfirm,
    });
  };

  // Nạp tên và quyền của chức danh được chọn
  const loadRole = (code: string | undefined) => {
    setRoleCode(code);
    setName(roles.find((r) => r.code === code)?.name ?? "");
    setDraftPerms(code ? getRolePermIds(code) : []);
    if (code) onRoleChange?.(code);
  };
  const selectRole = (code: string) => confirmDiscard(() => loadRole(code));

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (onSubmit(roleCode, trimmedName, draftPerms)) onBack?.();
  };

  // Xóa chức danh tự thêm: hỏi xác nhận, xóa xong chuyển sang chức danh đầu danh sách
  const handleDelete = () => {
    if (!role || !onDeleteRole) return;
    modal.confirm({
      centered: true,
      width: 420,
      icon: null,
      title: `Xóa chức danh "${role.name}"?`,
      content: (
        <p className="m-0 text-xs leading-relaxed text-slate-600">
          Chức danh và các quyền đã cấu hình cho chức danh này sẽ bị xóa khỏi hệ thống.
        </p>
      ),
      okText: "Xóa chức danh",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: () => {
        onDeleteRole(role.code);
        loadRole(roles.find((r) => r.code !== role.code)?.code);
      },
    });
  };

  return (
    <>
      {/* Tiêu đề: (icon quay lại) + tên màn hình + nút góc phải */}
      <div className="px-6 py-3.5 border-b border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {onBack && (
            <Tooltip title="Quay lại">
              <Button
                intent="ghost"
                scale="compact"
                aria-label="Quay lại"
                icon={<ArrowLeftOutlined />}
                onClick={() => confirmDiscard(onBack)}
                className="!h-8 !w-8 !p-0 text-slate-600 hover:!text-[#DC2626] hover:!bg-slate-100"
              />
            </Tooltip>
          )}
          <Title level={4} className="!m-0 text-slate-900 font-bold text-base sm:text-lg">
            {title ?? (isCreating ? "Thêm chức danh" : "Cập nhật chức danh")}
          </Title>
        </div>
        {onCreateNew && !readOnly && (
          <Button
            intent="outline"
            scale="compact"
            icon={<PlusOutlined className="text-[#DC2626]" />}
            onClick={() => confirmDiscard(onCreateNew)}
            className="text-xs font-semibold !border-slate-300 text-slate-700 hover:text-[#DC2626] hover:!border-red-200 h-8 px-3"
          >
            Thêm chức danh
          </Button>
        )}
      </div>

      {/* Chọn chức danh (khi cập nhật), tên, trạng thái & bộ lọc màn hình */}
      <div className="px-6 py-3 border-b border-slate-200 bg-slate-50/70 shrink-0">
        <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
          {!isCreating && (
            <div className="shrink-0">
              <span className="block text-xs font-semibold text-slate-700 mb-1">Chức danh</span>
              <div className="flex items-center gap-1.5">
              <Select
                showSearch
                value={roleCode}
                onChange={selectRole}
                placeholder="Chọn chức danh..."
                className="w-60 text-xs font-semibold"
                options={roleOptions}
                filterOption={(input, option) =>
                  normalizeSearchText(String(option?.searchText ?? "")).includes(normalizeSearchText(input))
                }
                popupMatchSelectWidth={false}
                notFoundContent={<div className="py-1 text-xs text-slate-400">Không tìm thấy chức danh.</div>}
              />
              {role?.isCustom && onDeleteRole && !readOnly && (
                <Tooltip title={`Xóa chức danh "${role.name}"`}>
                  <Button
                    intent="outline"
                    scale="compact"
                    aria-label="Xóa chức danh"
                    icon={<DeleteOutlined className="text-rose-500" />}
                    onClick={handleDelete}
                    className="!h-8 !w-8 !p-0 shrink-0 !border-rose-200 hover:!border-rose-400 hover:!bg-rose-50"
                  />
                </Tooltip>
              )}
              </div>
            </div>
          )}

          <div className="w-full sm:w-80">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isCreating ? "Tên chức danh mới" : "Tên chức danh"} <span className="text-red-500">*</span>
            </label>
            <Input
              autoFocus={isCreating}
              intent="clean"
              value={name}
              disabled={!canEdit}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Cán bộ Pháp chế, Tổ phó Kỹ thuật, Giám sát viên..."
              status={trimmedName && isNameTaken ? "error" : undefined}
              className="w-full text-xs h-8"
            />
          </div>

          {/* Bật / tắt chức danh (chỉ khi cập nhật): áp dụng ngay, tắt thì hỏi xác nhận trước */}
          {!isCreating && role && (
            <div className="ml-auto mr-8">
              <span className="block text-xs font-semibold text-slate-700 mb-1">Trạng thái</span>
              <div className="flex h-8 items-center gap-2">
                <Switch checked={!isLocked} disabled={readOnly} onChange={() => onToggleLock(role.code)} />
                <span className="text-[11px] text-slate-500">{isLocked ? "Đang tắt" : "Đang bật"}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Danh sách quyền (bản nháp) */}
      <div className="flex-1 overflow-auto [scrollbar-width:thin] min-h-0 p-6 space-y-4 bg-slate-50/50">
        <div className="text-xs font-bold uppercase tracking-wide text-slate-700">
          Quyền hạn <span className="font-semibold normal-case text-slate-500">({draftPerms.length}/{permissions.length})</span>
        </div>
        <PermissionChecklist
          modules={modules}
          permissions={permissions}
          isChecked={(id) => draftPerms.includes(id)}
          onToggle={togglePerm}
          onToggleModule={toggleModule}
          canManage={canEdit}
        />
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
        <span className="text-xs text-slate-600">
          {isCreating ? "Chức danh mới" : "Chức danh"}: <strong className="text-slate-900">{trimmedName || "…"}</strong> ·
          Đã chọn <strong className="text-[#DC2626]">{draftPerms.length}</strong>/{permissions.length} quyền.
          {isDirty && <span className="text-amber-600 font-semibold ml-1.5">(Chưa lưu)</span>}
        </span>
        <div className="flex items-center gap-2">
          {onClose && (
            <Button
              intent="outline"
              className="!border-slate-300 text-xs h-8.5 rounded-lg text-slate-700 hover:text-slate-900"
              onClick={() => confirmDiscard(onClose)}
            >
              Đóng
            </Button>
          )}
          {!readOnly && (
          <Button
            intent="primary"
            icon={isCreating ? <PlusOutlined /> : <SaveOutlined />}
            disabled={!canSubmit || (!isCreating && !isDirty)}
            className="h-8.5 text-xs font-semibold bg-[#DC2626] hover:bg-red-700 text-white rounded-lg shadow-xs disabled:opacity-50"
            onClick={handleSubmit}
          >
            {isCreating ? "Thêm chức danh" : "Lưu thay đổi"}
          </Button>
          )}
        </div>
      </div>
    </>
  );
}
