"use client";

import { useState } from "react";
import { LockOutlined, UnlockOutlined } from "@ant-design/icons";
import { App } from "antd";
import { Avatar, Button, Text, Tooltip } from "@/components/ui";
import { getInitials } from "@/utils/initials";
import { SYSTEM_ROLE_META } from "../constants/personnel-labels";
import { useStaffAccess, useStaffDetail } from "../hooks/usePersonnelAccess";
import { useUnlockAccount } from "../hooks/usePersonnelMutations";
import { useRoleNameMap } from "../hooks/useRoleNameMap";
import ConfirmDialogContent, { CONFIRM_DIALOG_CLASS } from "./ConfirmDialogContent";
import StaffLockAccountModal from "./StaffLockAccountModal";

/** Đầu hồ sơ cán bộ: ảnh đại diện, chức danh, phòng ban, email và nút khóa / mở lại tài khoản */
export default function StaffDetailHeader({ staffId }: { staffId: string }) {
  const { modal } = App.useApp();
  const detail = useStaffDetail(staffId);
  const { canManageAccounts } = useStaffAccess();
  const roleNameMap = useRoleNameMap();
  const unlockAccount = useUnlockAccount();
  const [lockOpen, setLockOpen] = useState(false);

  if (!detail) return null;
  const { staff, team, titleLocked } = detail;

  const confirmUnlock = () => {
    const roleLabel =
      roleNameMap.get(staff.roleCode) || SYSTEM_ROLE_META[staff.roleCode]?.label || staff.title || "Cán bộ";
    modal.confirm({
      width: 460,
      centered: true,
      icon: null,
      title: null,
      className: CONFIRM_DIALOG_CLASS,
      content: (
        <ConfirmDialogContent
          icon={<UnlockOutlined />}
          title="Mở lại tài khoản cán bộ?"
          subtitle="Khôi phục quyền truy cập hệ thống cho cán bộ"
          bodyClassName="leading-relaxed"
        >
          Cán bộ <strong className="text-slate-900">{staff.name}</strong> sẽ có thể đăng nhập lại vào hệ thống với chức danh{" "}
          <strong className="text-[#0F4C81]">{roleLabel}</strong>.
        </ConfirmDialogContent>
      ),
      okText: "Mở tài khoản",
      okButtonProps: {
        className:
          "!h-9 !px-5 !rounded-lg !font-semibold !bg-amber-600 hover:!bg-amber-700 !border-amber-600 !text-white !shadow-xs",
      },
      cancelText: "Đóng",
      cancelButtonProps: {
        className:
          "!h-9 !px-4 !rounded-lg !font-medium !text-slate-700 !border-slate-300 hover:!bg-slate-50",
      },
      onOk: () => unlockAccount.run(staff.id),
    });
  };

  return (
    <div className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar variant="brand" shape="circle" size={44} className="font-semibold text-xs shrink-0">
            {getInitials(staff.name)}
          </Avatar>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Text className="text-sm font-semibold text-slate-900">{staff.name}</Text>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {staff.title || "Chưa có chức danh"} · {team?.name}
              {titleLocked && (
                <Tooltip title="Chức danh đang tắt: tài khoản tạm không có quyền, cán bộ vẫn giữ chức danh">
                  <span className="ml-1.5 inline-block cursor-help whitespace-nowrap rounded border border-amber-200 bg-amber-50 px-1.5 text-[11px] text-amber-700">
                    Chức danh đang tắt
                  </span>
                </Tooltip>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Email: {staff.email}
            </div>
          </div>
        </div>

        {/* Khóa / Mở lại tài khoản cán bộ */}
        {canManageAccounts && (
          <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
            {staff.accountActive ? (
              <Button
                intent="outline"
                scale="compact"
                onClick={() => setLockOpen(true)}
                icon={<LockOutlined />}
                className="!border-rose-200 !text-rose-700 hover:!border-rose-400 hover:!bg-rose-50 text-xs"
              >
                Khóa tài khoản
              </Button>
            ) : (
              <Button
                intent="primary"
                scale="compact"
                onClick={confirmUnlock}
                icon={<UnlockOutlined />}
                className="!bg-amber-600 !border-amber-600 hover:!bg-amber-700 text-white text-xs font-semibold"
              >
                Mở lại tài khoản
              </Button>
            )}
          </div>
        )}
      </div>

      {lockOpen && <StaffLockAccountModal staffId={staff.id} onClose={() => setLockOpen(false)} />}
    </div>
  );
}
