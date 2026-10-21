"use client";

import { useMemo } from "react";
import { Checkbox } from "@/components/ui";
import type { MatrixModule, MatrixPermission } from "../constants/role-matrix-data";

interface PermissionChecklistProps {
  modules: MatrixModule[];
  permissions: MatrixPermission[];
  isChecked: (permId: string) => boolean;
  onToggle: (permId: string) => void;
  onToggleModule: (moduleId: string, permIds: string[]) => void;
  canManage?: boolean;
}

/** Danh sách quyền gom theo màn hình / phân hệ: tick cả nhóm ở tiêu đề, từng quyền xếp 3 cột */
export default function PermissionChecklist({
  modules,
  permissions,
  isChecked,
  onToggle,
  onToggleModule,
  canManage = true,
}: PermissionChecklistProps) {
  const permissionsByModule = useMemo(() => {
    const map = new Map<string, MatrixPermission[]>();
    permissions.forEach((perm) => {
      const list = map.get(perm.moduleId) || [];
      list.push(perm);
      map.set(perm.moduleId, list);
    });
    return map;
  }, [permissions]);

  return (
    <div className="space-y-3">
      {modules.map((mod) => {
        const modPerms = permissionsByModule.get(mod.id);
        if (!modPerms || modPerms.length === 0) return null;

        const grantedCount = modPerms.filter((p) => isChecked(p.id)).length;

        return (
          <div key={mod.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            {/* Tiêu đề nhóm: tick để chọn / bỏ toàn bộ quyền trong nhóm */}
            <Checkbox
              checked={grantedCount === modPerms.length}
              indeterminate={grantedCount > 0 && grantedCount < modPerms.length}
              disabled={!canManage}
              onChange={() => onToggleModule(mod.id, modPerms.map((p) => p.id))}
              className="[&_.ant-checkbox+span]:!pl-2.5"
            >
              <span className="text-sm font-bold text-slate-900">{mod.name}</span>
            </Checkbox>

            <div className="mt-2.5 grid grid-cols-1 gap-x-6 gap-y-2 pl-7 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {modPerms.map((perm) => (
                <Checkbox
                  key={perm.id}
                  checked={isChecked(perm.id)}
                  disabled={!canManage}
                  onChange={() => onToggle(perm.id)}
                  title={perm.description}
                  className="text-[13px] text-slate-600"
                >
                  {perm.name}
                </Checkbox>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
