"use client";

import { useMemo, useState } from "react";
import { ArrowLeftOutlined, PlusOutlined, SaveOutlined } from "@ant-design/icons";
import { App } from "antd";
import { Button, Input, Switch, Title, Tooltip } from "@/components/ui";
import { normalizeSearchText } from "@/utils/search-text";
import type { MatrixModule, MatrixPermission, MatrixRole } from "../constants/role-matrix-data";
import PermissionChecklist from "./PermissionChecklist";

interface RoleEditorViewProps {
  /** "create" = tạo chức danh mới, "edit" = chỉnh sửa chức danh `role` */
  mode: "create" | "edit";
  role?: MatrixRole;
  /** Tất cả chức danh hiện có (để kiểm tra trùng tên) */
  roles: MatrixRole[];
  modules: MatrixModule[];
  permissions: MatrixPermission[];
  /** Quyền ban đầu (chỉnh sửa: quyền hiện có; tạo mới: rỗng) */
  initialPermIds: string[];
  isLocked?: boolean;
  onToggleLock?: () => void;
  /** Chỉ xem: không sửa tên, trạng thái, quyền */
  readOnly?: boolean;
  onBack: () => void;
  /** Lưu tên + quyền; trả về false nếu không lưu được (giữ nguyên màn hình) */
  onSubmit: (name: string, permIds: string[]) => boolean;
}

/** Màn Tạo / Chỉnh sửa chức danh: nhập tên, tick quyền theo nhóm rồi lưu; có icon quay lại danh sách */
export default function RoleEditorView({
  mode,
  role,
  roles,
  modules,
  permissions,
  initialPermIds,
  isLocked = false,
  onToggleLock,
  readOnly = false,
  onBack,
  onSubmit,
}: RoleEditorViewProps) {
  const { modal } = App.useApp();
  const isCreating = mode === "create";
  const baselineName = role?.name ?? "";

  const [name, setName] = useState(baselineName);
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

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (onSubmit(trimmedName, draftPerms)) onBack();
  };

  const title = readOnly ? "Xem chức danh" : isCreating ? "Tạo chức danh mới" : "Chỉnh sửa chức danh";

  return (
    <>
      {/* Tiêu đề: icon quay lại + tên thao tác */}
      <div className="px-6 py-3.5 border-b border-slate-200 bg-white flex items-center gap-2.5 shrink-0">
        <Tooltip title="Quay lại danh sách">
          <Button
            intent="ghost"
            scale="compact"
            aria-label="Quay lại"
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            className="!h-8 !w-8 !p-0 text-slate-600 hover:!text-[#DC2626] hover:!bg-slate-100"
          />
        </Tooltip>
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

          {/* Bật / tắt chức danh (khi chỉnh sửa): áp dụng ngay, tắt thì hỏi xác nhận trước */}
          {!isCreating && onToggleLock && (
            <div className="shrink-0">
              <span className="block text-sm font-semibold text-slate-800 mb-1.5">Trạng thái</span>
              <div className="flex h-10 items-center gap-2">
                <Switch checked={!isLocked} disabled={readOnly} onChange={onToggleLock} />
                <span className="text-xs text-slate-500">{isLocked ? "Đang tắt" : "Đang bật"}</span>
              </div>
            </div>
          )}
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
