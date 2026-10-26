"use client";

import { ReasonModal } from "@/components/workspace";
import { useLockAccount } from "../hooks/usePersonnelMutations";
import { useStaff, useTeams } from "../hooks/usePersonnelQueries";

const LOCK_REASONS = [
  "Nhân viên nghỉ việc / Chấm dứt hợp đồng lao động",
  "Chuyển công tác / Luân chuyển đơn vị",
  "Nghỉ phép dài hạn / Nghỉ chế độ thai sản",
  "Tạm đình chỉ công tác để phục vụ kiểm tra, xác minh",
  "Vi phạm quy chế làm việc / An toàn thông tin hệ thống",
];

/** Hộp khóa tài khoản cán bộ: bắt buộc chọn / nhập lý do */
export default function StaffLockAccountModal({ staffId, onClose }: { staffId: string; onClose: () => void }) {
  const { data: staff } = useStaff(staffId);
  const { data: teams } = useTeams();
  const lockAccount = useLockAccount();

  if (!staff) return null;
  const teamName = teams?.find((team) => team.id === staff.teamId)?.name;

  return (
    <ReasonModal
      open
      title={`Khóa tài khoản của ${staff.name}`}
      summary={
        <>
          {staff.title} · {teamName}
        </>
      }
      label="Lý do khóa tài khoản"
      presetReasons={LOCK_REASONS}
      placeholder="Nêu rõ lý do cụ thể cần khóa tài khoản..."
      confirmText="Khóa tài khoản"
      onClose={onClose}
      onConfirm={async (reason) => Boolean(await lockAccount.run({ staffId, reason }))}
    />
  );
}
