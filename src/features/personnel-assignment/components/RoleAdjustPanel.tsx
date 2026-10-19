"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { MinusCircleOutlined, PlusCircleOutlined, RightOutlined, SwapOutlined } from "@ant-design/icons";
import { Text } from "@/components/ui";
import type { PersonnelDataset, Staff, StaffInput } from "../types/personnel.types";
import ChangeRoleDrawer from "./ChangeRoleDrawer";
import GrantRoleModal from "./GrantRoleModal";
import RevokeRoleDrawer from "./RevokeRoleDrawer";

type RoleAction = "grant" | "change" | "revoke";

const ACTIONS: { key: RoleAction; label: string; hint: string; icon: ReactNode }[] = [
  { key: "grant", label: "Cấp vai trò", hint: "Thêm vai trò mới", icon: <PlusCircleOutlined /> },
  { key: "change", label: "Đổi vai trò", hint: "Đổi sang vai trò khác", icon: <SwapOutlined /> },
  { key: "revoke", label: "Thu hồi vai trò", hint: "Gỡ vai trò đang giữ", icon: <MinusCircleOutlined /> },
];

interface RoleAdjustPanelProps {
  staff: Staff;
  data: PersonnelDataset;
  onUpdateStaff: (staffId: string, input: Partial<StaffInput>, customMessage?: string | false) => Promise<boolean>;
  onRevokeActingDirector?: (projectId: string, customMessage?: string | false) => Promise<boolean>;
}

/** Mục "Điều chỉnh vai trò" trong drawer chi tiết cán bộ: chọn Cấp / Đổi / Thu hồi, nội dung hiện ngay bên dưới.
 *  Quyền hạn của cán bộ được suy ra từ vai trò (xem mục "Quyền hạn hệ thống" bên dưới). */
export default function RoleAdjustPanel({ staff, data, onUpdateStaff, onRevokeActingDirector }: RoleAdjustPanelProps) {
  const [action, setAction] = useState<RoleAction | null>(null);
  const closePanel = () => setAction(null);
  const activeHint = ACTIONS.find((a) => a.key === action)?.hint;

  return (
    <div className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
      <Text className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-800">Điều chỉnh vai trò</Text>
      <p className="m-0 mb-3 text-xs text-slate-500">
        {activeHint
          ? `Đang mở: ${activeHint.toLowerCase()} cho cán bộ.`
          : "Bấm vào một thao tác bên dưới để cấp, đổi hoặc thu hồi vai trò. Quyền hạn sẽ tự cập nhật theo vai trò."}
      </p>

      {/* Chọn thao tác: 3 ô hành động rõ là nút bấm (biểu tượng + tên + mô tả) */}
      <div role="tablist" aria-label="Điều chỉnh vai trò" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {ACTIONS.map((item) => {
          const active = action === item.key;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setAction(active ? null : item.key)}
              className={`group flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                active
                  ? "border-[#DC2626] bg-[#DC2626] text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-[#DC2626]/60 hover:bg-red-50/50"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-base ${
                  active ? "bg-white/20 text-white" : "bg-red-50 text-[#DC2626]"
                }`}
              >
                {item.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold">{item.label}</span>
                <span className={`block truncate text-[11px] ${active ? "text-white/85" : "text-slate-500"}`}>
                  {item.hint}
                </span>
              </span>
              <RightOutlined
                className={`shrink-0 text-[10px] transition-transform ${
                  active ? "rotate-90 text-white" : "text-slate-400 group-hover:translate-x-0.5"
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Nội dung thao tác đang chọn (dùng lại đúng màn Cấp / Đổi / Thu hồi, ở chế độ nhúng) */}
      {action && (
        <div role="tabpanel" className="mt-4 border-t border-slate-100 pt-4">
          {action === "grant" && (
            <GrantRoleModal
              key={`grant-${staff.id}`}
              embedded
              open
              staff={staff}
              data={data}
              onClose={closePanel}
              onSubmit={onUpdateStaff}
            />
          )}
          {action === "change" && (
            <ChangeRoleDrawer
              key={`change-${staff.id}`}
              embedded
              open
              staff={staff}
              data={data}
              onClose={closePanel}
              onConfirm={(staffId, updateInput, customMessage) => onUpdateStaff(staffId, updateInput, customMessage)}
              onRevokeActingDirector={onRevokeActingDirector}
            />
          )}
          {action === "revoke" && (
            <RevokeRoleDrawer
              key={`revoke-${staff.id}`}
              embedded
              open
              staff={staff}
              data={data}
              onClose={closePanel}
              onConfirm={async (staffId, updateInput, revokedActingProjectIds, customMessage) => {
                for (const projectId of revokedActingProjectIds ?? []) {
                  await onRevokeActingDirector?.(projectId, false);
                }
                return onUpdateStaff(staffId, updateInput, customMessage);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
