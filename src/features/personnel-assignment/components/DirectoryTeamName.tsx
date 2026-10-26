"use client";

import { useState } from "react";
import { EditOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Input, Text, Tooltip } from "@/components/ui";
import { normalizeSearchText } from "@/utils/search-text";
import { useConfirmAction } from "../hooks/useConfirmAction";
import { useStaffAccess } from "../hooks/usePersonnelAccess";
import { useUpdateTeam } from "../hooks/usePersonnelMutations";
import { useTeams } from "../hooks/usePersonnelQueries";
import type { Team } from "../types/personnel.types";

/** Tên phòng ban trên tiêu đề, kèm bút chì để đổi tên tại chỗ (Lưu / Hủy) nếu có quyền */
export default function DirectoryTeamName({ team }: { team: Team }) {
  const { canManageTeams } = useStaffAccess();
  const { data: teams = [] } = useTeams();
  const updateTeam = useUpdateTeam();
  const confirmAction = useConfirmAction();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  const start = () => {
    setDraft(team.name);
    setError("");
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setError("");
  };

  const save = async () => {
    const name = draft.trim();
    if (!name) {
      setError("Vui lòng nhập tên phòng ban.");
      return;
    }
    const duplicated = teams.some(
      (t) => t.id !== team.id && normalizeSearchText(t.name) === normalizeSearchText(name)
    );
    if (duplicated) {
      setError("Tên phòng ban này đã tồn tại.");
      return;
    }
    if (name === team.name) {
      cancel();
      return;
    }
    if (
      !(await confirmAction({
        title: "Đổi tên phòng ban?",
        description: (
          <>
            Đổi <strong>{team.name}</strong> thành <strong>{name}</strong>.
          </>
        ),
        okText: "Đổi tên",
      }))
    )
      return;
    if (await updateTeam.run({ teamId: team.id, input: { name } })) cancel();
  };

  if (!editing) {
    return (
      <>
        <Text className="text-sm font-bold text-slate-900">{team.name}</Text>
        {/* Bút chì ngay cạnh tên phòng ban để dễ thấy, dễ sửa */}
        {canManageTeams && (
          <Tooltip title="Cập nhật phòng ban">
            <button
              type="button"
              aria-label={`Cập nhật phòng ban ${team.name}`}
              onClick={(e) => {
                e.stopPropagation();
                start();
              }}
              className="inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white p-0 text-xs text-slate-500 shadow-2xs transition-colors hover:border-[#DC2626]/40 hover:bg-red-50 hover:text-[#DC2626]"
            >
              <EditOutlined />
            </button>
          </Tooltip>
        )}
      </>
    );
  }

  const saving = updateTeam.isPending;
  return (
    <>
      <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
        <Input
          autoFocus
          value={draft}
          disabled={saving}
          onChange={(e) => {
            setDraft(e.target.value);
            if (error) setError("");
          }}
          onKeyDown={(e) => {
            // Không để phím gõ trong ô thu gọn / mở rộng phòng ban
            e.stopPropagation();
            if (e.key === "Enter") save();
            if (e.key === "Escape") cancel();
          }}
          placeholder="Tên phòng ban"
          status={error ? "error" : undefined}
          className="h-8 w-64 sm:w-80 text-sm font-semibold"
        />
        {error && <span className="mt-0.5 text-[11px] text-rose-600">{error}</span>}
      </div>
      {/* Lưu / Hủy nằm ngay cạnh ô sửa tên phòng ban */}
      <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <Button
          intent="primary"
          scale="compact"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={save}
          className="text-xs font-semibold"
        >
          Lưu
        </Button>
        <Button intent="outline" scale="compact" disabled={saving} onClick={cancel} className="text-xs font-semibold">
          Hủy
        </Button>
      </div>
    </>
  );
}
