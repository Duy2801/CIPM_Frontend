"use client";

import { useMemo, useState } from "react";
import { CheckCircleFilled, EditOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Checkbox, Text } from "@/components/ui";
import type { Staff, StaffInput } from "../types/personnel.types";
import { getAllRbacPermissions, getStaffEffectivePermissions, type RbacPermissionItem } from "../utils/personnel-rbac";
import { useConfirmAction } from "../hooks/useConfirmAction";

interface StaffPermissionPanelProps {
  staff: Staff;
  /** Quyền mặc định theo chức danh & tổ của cán bộ */
  basePermissions: RbacPermissionItem[];
  /** Có truyền thì cho chỉnh quyền riêng của cán bộ */
  onUpdateStaff?: (staffId: string, input: Partial<StaffInput>, customMessage?: string | false) => Promise<boolean>;
}

/**
 * Mục "Quyền hạn hệ thống & nghiệp vụ chuyên môn" trong hồ sơ cán bộ.
 * Chỉnh quyền chỉ áp dụng RIÊNG cán bộ này: quyền mặc định của chức danh không đổi, người khác cùng chức danh không bị ảnh hưởng.
 */
export default function StaffPermissionPanel({ staff, basePermissions, onUpdateStaff }: StaffPermissionPanelProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const confirmAction = useConfirmAction();
  const [draft, setDraft] = useState<Set<string>>(new Set());

  const baseCodes = useMemo(() => new Set(basePermissions.map((p) => p.code)), [basePermissions]);
  const effective = useMemo(() => getStaffEffectivePermissions(staff, basePermissions), [staff, basePermissions]);
  const grantedCodes = new Set((staff.permissions ?? []).filter((code) => !baseCodes.has(code)));
  const revokedCount = (staff.revokedPermissions ?? []).filter((code) => baseCodes.has(code)).length;

  // Danh mục khi chỉnh: quyền theo chức danh lên trước, sau đó các quyền khác có thể cấp thêm
  const catalog = useMemo(() => {
    const all = getAllRbacPermissions();
    return [...all.filter((p) => baseCodes.has(p.code)), ...all.filter((p) => !baseCodes.has(p.code))];
  }, [baseCodes]);

  const startEdit = () => {
    setDraft(new Set(effective.map((p) => p.code)));
    setEditing(true);
  };

  const toggle = (code: string) =>
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  const handleSave = async () => {
    if (!onUpdateStaff) return;
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
      const ok = await onUpdateStaff(
        staff.id,
        { permissions, revokedPermissions },
        `Đã cập nhật quyền hạn riêng của cán bộ ${staff.name}.`
      );
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
          {onUpdateStaff && !editing && (
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
          ? "Tick để cấp thêm hoặc bỏ tick để thu hồi quyền — chỉ áp dụng riêng cán bộ này, không đổi quyền của chức danh."
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
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {catalog.map((perm) => (
              <label
                key={perm.code}
                title={perm.description}
                className={`flex cursor-pointer items-center gap-2.5 rounded-lg border p-2.5 text-xs transition-colors ${
                  draft.has(perm.code) ? "border-slate-300 bg-white" : "border-slate-200/80 bg-slate-50/50"
                }`}
              >
                <Checkbox checked={draft.has(perm.code)} onChange={() => toggle(perm.code)} />
                <span className="min-w-0 flex-1 font-medium text-slate-800 leading-snug">{perm.name}</span>
                {baseCodes.has(perm.code) && (
                  <span className="shrink-0 rounded border border-slate-200 bg-slate-100 px-1.5 text-[10px] text-slate-500">
                    Theo chức danh
                  </span>
                )}
              </label>
            ))}
          </div>
          <div className="mt-3.5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <Button intent="outline" scale="compact" disabled={saving} onClick={() => setEditing(false)}>
              Hủy
            </Button>
            <Button intent="primary" scale="compact" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
              Lưu quyền
            </Button>
          </div>
        </>
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
