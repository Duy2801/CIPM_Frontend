"use client";

import { useMemo, useState } from "react";
import { CrownOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { Button, Select, Text } from "@/components/ui";
import { normalizeSearchText } from "@/utils/search-text";
import { useRoleMatrix } from "../hooks/useRoleMatrix";
import type { PersonnelDataset, Staff, StaffInput, TeamId } from "../types/personnel.types";
import { buildAssignableRoles, resolveRoleCodeFromTitle } from "../utils/assignable-roles";
import { useLockedTitles } from "../hooks/useLockedTitles";
import { useConfirmAction } from "../hooks/useConfirmAction";

interface RoleAdjustPanelProps {
  staff: Staff;
  data: PersonnelDataset;
  onUpdateStaff: (staffId: string, input: Partial<StaffInput>, customMessage?: string | false) => Promise<boolean>;
}

const normalizeTitle = (title: string) => title.trim().toLowerCase();

/** Mục "Chức danh" trong drawer chi tiết cán bộ: mỗi cán bộ chỉ giữ MỘT chức danh, chọn trong danh sách là xong.
 *  Quyền hạn của cán bộ được suy ra từ chức danh (xem tab "Quyền hạn"). */
export default function RoleAdjustPanel({ staff, data, onUpdateStaff }: RoleAdjustPanelProps) {
  const { roles: matrixRoles } = useRoleMatrix();
  const lockedTitles = useLockedTitles();
  const [saving, setSaving] = useState(false);
  const confirmAction = useConfirmAction();

  const roles = useMemo(() => buildAssignableRoles(data.teams, matrixRoles), [data.teams, matrixRoles]);

  // Chức danh hiện tại: dữ liệu cũ có thể ghép nhiều chức danh bằng "·" → lấy chức danh đầu tiên
  const currentTitle = (staff.title || "").split(/\s*·\s*|\s*;\s*/)[0]?.trim() ?? "";
  // Chức danh hiện tại đang tắt → chỉ báo tài khoản tạm không có quyền, cán bộ vẫn giữ chức danh
  const currentTitleLocked = Boolean(currentTitle) && lockedTitles.has(normalizeTitle(currentTitle));
  const currentRoleId = useMemo(() => {
    const sameTitle = roles.filter((r) => normalizeTitle(r.title) === normalizeTitle(currentTitle));
    return (sameTitle.find((r) => r.teamId === staff.teamId) ?? sameTitle[0])?.id;
  }, [roles, currentTitle, staff.teamId]);

  const [selectedId, setSelectedId] = useState<string | undefined>(currentRoleId);
  const selectedRole = roles.find((r) => r.id === selectedId);
  const hasChanged = Boolean(selectedRole) && selectedId !== currentRoleId;

  // Danh sách chỉ hiện tên chức danh (không chia nhóm phòng ban); tên trùng ở nhiều phòng ban chỉ hiện một lần,
  // ưu tiên chức danh thuộc phòng ban hiện tại của cán bộ (và mục đang chọn) để không tự chuyển phòng ban
  const options = useMemo(() => {
    const byTitle = new Map<string, (typeof roles)[number]>();
    roles.forEach((r) => {
      // Chức danh đang tắt không cho chọn mới (chức danh cán bộ đang giữ vẫn hiện)
      if (lockedTitles.has(normalizeTitle(r.title)) && r.id !== currentRoleId) return;
      const key = normalizeTitle(r.title);
      const existing = byTitle.get(key);
      const preferred = r.id === currentRoleId || (r.teamId === staff.teamId && existing?.id !== currentRoleId);
      if (!existing || preferred) byTitle.set(key, r);
    });
    return [...byTitle.values()].map((r) => ({ value: r.id, label: r.title }));
  }, [roles, currentRoleId, staff.teamId, lockedTitles]);

  const handleSave = async () => {
    if (!selectedRole) return;
    if (
      !(await confirmAction({
        title: `Đổi chức danh của ${staff.name}?`,
        description: (
          <>
            Chức danh mới: <strong>{selectedRole.title}</strong>. Quyền hạn của cán bộ sẽ cập nhật theo chức danh này.
          </>
        ),
        okText: "Lưu chức danh",
      }))
    )
      return;
    setSaving(true);
    try {
      // Chức danh độc lập giữ nguyên phòng ban hiện tại; chức danh phòng ban thì chuyển cán bộ sang phòng ban đó
      const teamId: TeamId =
        selectedRole.teamId && data.teams.some((t) => t.id === selectedRole.teamId)
          ? (selectedRole.teamId as TeamId)
          : staff.teamId;
      await onUpdateStaff(
        staff.id,
        {
          title: selectedRole.title,
          roleCode: resolveRoleCodeFromTitle(selectedRole.title, selectedRole.roleCode),
          teamId,
          isLeader: Boolean(selectedRole.isLeader),
          revokedRoles: [],
        },
        `Đã cập nhật chức danh "${selectedRole.title}" cho cán bộ ${staff.name}!`
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
      <Text className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-800">Chức danh</Text>
      <p className="m-0 mb-3 text-xs text-slate-500">
        Mỗi cán bộ giữ một chức danh. Quyền hạn tự cập nhật theo chức danh được chọn.
      </p>

      <label className="mb-1 block text-xs font-semibold text-slate-700">Chức danh</label>
      <Select
        showSearch
        value={selectedId}
        onChange={setSelectedId}
        placeholder="Chọn chức danh..."
        className="w-full"
        options={options}
        filterOption={(input, option) =>
          normalizeSearchText(String(option?.label ?? "")).includes(normalizeSearchText(input))
        }
        notFoundContent={<div className="py-1 text-xs text-slate-400">Không tìm thấy chức danh.</div>}
      />

      {currentTitleLocked && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700">
          <InfoCircleOutlined className="text-amber-500" />
          <span>
            Chức danh <strong>{currentTitle}</strong> đang tắt: tài khoản cán bộ tạm không có quyền cho tới khi bật lại
            chức danh ở màn phân quyền.
          </span>
        </div>
      )}
      {!currentRoleId && currentTitle && !currentTitleLocked && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
          <InfoCircleOutlined className="text-slate-400" />
          <span>
            Chức danh hiện tại <strong className="text-slate-700">{currentTitle}</strong> không còn trong danh mục, hãy
            chọn chức danh mới.
          </span>
        </div>
      )}

      {hasChanged && selectedRole?.isLeader && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200/90 bg-amber-50 p-2.5 text-xs text-amber-900">
          <CrownOutlined className="shrink-0 text-sm text-amber-600" />
          <span>
            Cán bộ sẽ được bổ nhiệm làm <strong>{selectedRole.title}</strong> (phụ trách lãnh đạo đơn vị).
          </span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-end gap-2">
        {hasChanged && (
          <Button intent="outline" scale="compact" onClick={() => setSelectedId(currentRoleId)} disabled={saving}>
            Hoàn tác
          </Button>
        )}
        <Button
          intent="primary"
          scale="compact"
          onClick={handleSave}
          loading={saving}
          disabled={!hasChanged}
          className="px-4 text-xs font-semibold"
        >
          Lưu chức danh
        </Button>
      </div>
    </div>
  );
}
