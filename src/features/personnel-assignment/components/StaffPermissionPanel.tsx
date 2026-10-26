"use client";

import { useMemo, useState } from "react";
import {
  CheckCircleFilled,
  CloseOutlined,
  EditOutlined,
  SafetyCertificateOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { Button, Checkbox, Select, Text } from "@/components/ui";
import { getAllRbacPermissions, getStaffEffectivePermissions, type RbacPermissionItem } from "../utils/personnel-rbac";
import { useConfirmAction } from "../hooks/useConfirmAction";
import { useStaffAccess, useStaffDetail } from "../hooks/usePersonnelAccess";
import { useUpdateStaff } from "../hooks/usePersonnelMutations";

const NO_PERMISSIONS: RbacPermissionItem[] = [];

/**
 * Mục "Quyền hạn hệ thống & nghiệp vụ chuyên môn" trong hồ sơ cán bộ.
 * Chỉnh quyền chỉ áp dụng RIÊNG cán bộ này: quyền mặc định của chức danh không đổi, người khác cùng chức danh không bị ảnh hưởng.
 */
export default function StaffPermissionPanel({ staffId }: { staffId: string }) {
  const detail = useStaffDetail(staffId);
  // Quyền mặc định theo chức danh & tổ của cán bộ
  const basePermissions = detail?.basePermissions ?? NO_PERMISSIONS;
  // Người có quyền quản lý chức danh mới chỉnh được quyền riêng
  const { canManageRole: canEdit } = useStaffAccess();
  const updateStaff = useUpdateStaff();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const confirmAction = useConfirmAction();
  const [draft, setDraft] = useState<Set<string>>(new Set());

  const baseCodes = useMemo(() => new Set(basePermissions.map((p) => p.code)), [basePermissions]);
  const staff = detail?.staff;
  const effective = useMemo(
    () => (staff ? getStaffEffectivePermissions(staff, basePermissions) : NO_PERMISSIONS),
    [staff, basePermissions],
  );

  // Toàn bộ danh mục quyền trong hệ thống
  const catalog = useMemo(() => {
    const all = getAllRbacPermissions();
    return [...all.filter((p) => baseCodes.has(p.code)), ...all.filter((p) => !baseCodes.has(p.code))];
  }, [baseCodes]);

  // Options cho Select gộp
  const permissionOptions = useMemo(() => {
    return catalog.map((perm) => ({
      value: perm.code,
      label: perm.name,
      title: perm.description,
      module: perm.module,
      isBase: baseCodes.has(perm.code),
    }));
  }, [catalog, baseCodes]);

  // Các quyền đang được cấp cho cán bộ trong draft
  const currentPermissions = useMemo(
    () => catalog.filter((p) => draft.has(p.code)),
    [catalog, draft],
  );

  if (!staff) return null;
  const grantedCodes = new Set((staff.permissions ?? []).filter((code) => !baseCodes.has(code)));
  const revokedCount = (staff.revokedPermissions ?? []).filter((code) => baseCodes.has(code)).length;

  const startEdit = () => {
    setDraft(new Set(effective.map((p) => p.code)));
    setEditing(true);
  };

  const handleRemovePermission = (code: string) => {
    if (!code) return;
    setDraft((prev) => {
      const next = new Set(prev);
      next.delete(code);
      return next;
    });
  };

  const handleSave = async () => {
    if (!canEdit) return;
    // Lưu phần khác biệt so với chức danh: cấp thêm = tick mà chức danh không có; thu hồi = chức danh có mà bỏ tick
    const permissions = [...draft].filter((code) => !baseCodes.has(code));
    const revokedPermissions = [...baseCodes].filter((code) => !draft.has(code));
    if (
      !(await confirmAction({
        title: `Cập nhật quyền hạn của ${staff.name}?`,
        description: `Cán bộ sẽ có ${draft.size} quyền. Thay đổi chỉ áp dụng riêng cán bộ này.`,
        okText: "Lưu quyền",
      }))
    )
      return;
    setSaving(true);
    try {
      const ok = await updateStaff.run({
        staffId,
        input: { permissions, revokedPermissions },
        successText: `Đã cập nhật quyền hạn riêng của cán bộ ${staff.name}.`,
      });
      if (ok) setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
      <div className="mb-1 flex items-center justify-between gap-2 flex-wrap">
        <Text className="text-xs font-bold text-slate-800 uppercase tracking-wide">
          Quyền hạn hệ thống & Nghiệp vụ chuyên môn
        </Text>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
            {editing ? draft.size : effective.length} quyền khả dụng
          </span>
          {canEdit && !editing && (
            <Button
              intent="outline"
              scale="compact"
              icon={<EditOutlined />}
              onClick={startEdit}
              className="text-xs font-semibold !text-[#DC2626] !border-[#DC2626] hover:!bg-red-50/60"
            >
              Chỉnh quyền
            </Button>
          )}
        </div>
      </div>
      <div className="text-[11px] text-slate-500 mb-3.5">
        {editing
          ? "Chọn hoặc bỏ chọn quyền bằng ô bên dưới — chỉ áp dụng riêng cán bộ này, không đổi quyền của chức danh."
          : "Quyền hạn được cấp theo chức danh của cán bộ, cộng / trừ các quyền điều chỉnh riêng (nếu có)."}
        {!editing && (grantedCodes.size > 0 || revokedCount > 0) && (
          <span className="ml-1 font-semibold text-slate-700">
            Điều chỉnh riêng: {grantedCodes.size > 0 && `cấp thêm ${grantedCodes.size}`}
            {grantedCodes.size > 0 && revokedCount > 0 && ", "}
            {revokedCount > 0 && `thu hồi ${revokedCount}`} quyền.
          </span>
        )}
      </div>

      {editing ? (
        <div className="space-y-3.5">
          {/* Hộp chọn quyền gộp 1 input */}
          <div className="rounded-lg border border-slate-200/90 bg-slate-50/70 p-3">
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <SafetyCertificateOutlined className="text-amber-600 text-xs" />
              <span>Chọn quyền hạn (tích để thêm quyền, bỏ tích để thu hồi quyền):</span>
            </label>
            <Select
              mode="multiple"
              showSearch
              allowClear
              maxTagCount="responsive"
              maxTagPlaceholder={(omittedValues) => (
                <span className="text-[11px] font-medium text-slate-500">
                  +{omittedValues.length} quyền khác
                </span>
              )}
              placeholder="-- Tìm kiếm & tích chọn quyền hạn cho cán bộ --"
              className="w-full text-xs"
              value={Array.from(draft)}
              onChange={(codes: string[]) => setDraft(new Set(codes))}
              filterOption={(input, option) => {
                const label = String(option?.label ?? "").toLowerCase();
                const title = String(option?.title ?? "").toLowerCase();
                const search = input.toLowerCase().trim();
                return label.includes(search) || title.includes(search);
              }}
              options={permissionOptions}
              optionRender={(option) => {
                const data = option.data as {
                  value: string;
                  label: string;
                  title?: string;
                  module?: string;
                  isBase?: boolean;
                };
                const isChecked = draft.has(data.value);
                return (
                  <div className="flex items-center gap-2.5 py-1 w-full">
                    <Checkbox checked={isChecked} className="pointer-events-none shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-medium text-slate-800">{data.label}</span>
                        {data.module && (
                          <span className="text-[10px] text-slate-400">[{data.module}]</span>
                        )}
                      </div>
                      {data.title && (
                        <div className="text-[11px] text-slate-400 line-clamp-1">{data.title}</div>
                      )}
                    </div>
                    {data.isBase && (
                      <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                        Chức danh
                      </span>
                    )}
                  </div>
                );
              }}
            />
          </div>

          {/* Danh sách các quyền khả dụng hiện tại */}
          <div>
            <div className="mb-2 flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-700">
                Danh sách quyền khả dụng ({currentPermissions.length}):
              </span>
              <span className="text-[11px] text-slate-400 italic">
                Bấm nút [✕] trên từng quyền để bỏ nhanh
              </span>
            </div>

            {currentPermissions.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs italic text-slate-400">
                Cán bộ chưa có quyền nào. Vui lòng chọn quyền ở ô &ldquo;Chọn quyền hạn&rdquo; phía trên.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentPermissions.map((perm) => {
                  const isBase = baseCodes.has(perm.code);
                  return (
                    <div
                      key={perm.code}
                      title={perm.description}
                      className="group flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-2.5 text-xs shadow-2xs hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <CheckCircleFilled className="text-amber-500 text-sm shrink-0" />
                        <span
                          className="min-w-0 flex-1 font-medium text-xs text-slate-800 leading-snug truncate"
                          title={perm.name}
                        >
                          {perm.name}
                        </span>
                        {isBase ? (
                          <span className="shrink-0 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                            Theo chức danh
                          </span>
                        ) : (
                          <span className="shrink-0 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                            Cấp thêm
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePermission(perm.code)}
                        className="shrink-0 rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                        title="Bỏ quyền này"
                      >
                        <CloseOutlined className="text-[10px]" />
                        <span className="hidden group-hover:inline font-medium">Bỏ</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-3.5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <Button intent="outline" scale="compact" disabled={saving} onClick={() => setEditing(false)}>
              Hủy
            </Button>
            <Button intent="primary" scale="compact" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
              Lưu quyền
            </Button>
          </div>
        </div>
      ) : effective.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs italic text-slate-400">
          Cán bộ chưa có quyền nào.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {effective.map((perm) => (
            <div
              key={perm.code}
              title={perm.description}
              className="flex items-center gap-2.5 rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5 text-xs hover:border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <CheckCircleFilled className="text-amber-500 text-sm shrink-0" />
              <span className="min-w-0 flex-1 font-medium text-xs text-slate-800 leading-snug">{perm.name}</span>
              {grantedCodes.has(perm.code) && (
                <span className="shrink-0 rounded border border-amber-200 bg-amber-50 px-1.5 text-[10px] font-semibold text-amber-700">
                  Cấp thêm
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
