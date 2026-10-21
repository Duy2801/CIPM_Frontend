"use client";

import { useMemo } from "react";
import { SearchOutlined } from "@ant-design/icons";
import type { MatrixModule, MatrixPermission } from "../constants/role-matrix-data";

interface PermissionChecklistProps {
  modules: MatrixModule[];
  /** Quyền cần hiển thị (đã lọc theo màn hình nếu có) */
  permissions: MatrixPermission[];
  isChecked: (permId: string) => boolean;
  onToggle: (permId: string) => void;
  onToggleModule: (moduleId: string, permIds: string[]) => void;
  canManage?: boolean;
}

const CATEGORY_LABELS: Record<MatrixPermission["category"], string> = {
  read: "Xem",
  write: "Nhập/Sửa",
  approve: "Phê duyệt",
  admin: "Quản trị",
};

/** Danh sách quyền gom theo màn hình / phân hệ, tick từng quyền hoặc "Chọn tất cả" theo màn hình */
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

  if (permissions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
        <SearchOutlined className="text-slate-300 text-3xl mb-3" />
        <div className="text-sm font-semibold text-slate-700">Không tìm thấy quyền hạn phù hợp</div>
        <div className="text-xs text-slate-400 mt-1">Thử bỏ chọn bộ lọc màn hình</div>
      </div>
    );
  }

  return (
    <>
      {modules.map((mod) => {
        const modPerms = permissionsByModule.get(mod.id);
        if (!modPerms || modPerms.length === 0) return null;

        const modGrantedCount = modPerms.filter((p) => isChecked(p.id)).length;

        return (
          <div key={`group-${mod.id}`} className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
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
                  checked={modGrantedCount === modPerms.length}
                  ref={(el) => {
                    if (el) el.indeterminate = modGrantedCount > 0 && modGrantedCount < modPerms.length;
                  }}
                  disabled={!canManage}
                  onChange={() => canManage && onToggleModule(mod.id, modPerms.map((p) => p.id))}
                  className="h-4 w-4 rounded accent-[#DC2626] cursor-pointer disabled:cursor-not-allowed"
                />
                <span>Chọn tất cả</span>
              </label>
            </div>

            {/* Danh sách các quyền của màn hình để tích */}
            <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {modPerms.map((perm) => {
                const checked = isChecked(perm.id);
                return (
                  <div
                    key={perm.id}
                    role="checkbox"
                    aria-checked={checked}
                    tabIndex={canManage ? 0 : -1}
                    onClick={() => canManage && onToggle(perm.id)}
                    onKeyDown={(e) => {
                      if (canManage && (e.key === " " || e.key === "Enter")) {
                        e.preventDefault();
                        onToggle(perm.id);
                      }
                    }}
                    className={`flex items-start gap-3 p-3 rounded-lg border bg-white transition-all select-none ${
                      checked ? "border-slate-300 shadow-2xs" : "border-slate-200/80"
                    } ${canManage ? "cursor-pointer hover:border-slate-300 hover:bg-slate-50/50" : "cursor-default"}`}
                  >
                    <div className="pt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!canManage}
                        readOnly
                        tabIndex={-1}
                        aria-hidden="true"
                        className="h-4.5 w-4.5 rounded accent-[#DC2626] pointer-events-none cursor-pointer"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          {CATEGORY_LABELS[perm.category]}
                        </span>
                        <span className="font-bold text-xs text-slate-900 leading-snug">{perm.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 leading-normal mb-1 line-clamp-2">
                        {perm.description}
                      </div>
                      <span className="font-mono text-[9.5px] text-slate-400">{perm.code}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}
