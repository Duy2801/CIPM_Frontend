"use client";

import { useMemo, useState } from "react";
import { SwapOutlined } from "@ant-design/icons";
import { Button, Checkbox, Modal, Select, Spin, StandardFileUpload, Text, type UploadedAttachment } from "@/components/ui";
import { useAuthStore } from "@/stores/auth.store";
import { formatDateVi } from "@/utils/date";
import { useHandoverTasks } from "../hooks/usePersonnelMutations";
import { useStaff, useStaffList, useStaffOpenTasks, useTeams } from "@/shared/personnel-assignment/hooks/usePersonnelQueries";
import type { HandoverTask } from "@/shared/personnel-assignment/services/handover.api";

export default function StaffHandoverModal({ staffId, onClose }: { staffId: string; onClose: () => void }) {
  const { data: staff } = useStaff(staffId);
  const { data: staffList = [] } = useStaffList();
  const { data: teams = [] } = useTeams();
  const { data: tasks = [], isLoading, error } = useStaffOpenTasks(staffId);
  const currentUser = useAuthStore((state) => state.user);
  const handover = useHandoverTasks();

  const [receiverId, setReceiverId] = useState<string>();
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [files, setFiles] = useState<UploadedAttachment[]>([]);

  const receiverOptions = useMemo(() => {
    const teamName = (id?: string) => teams.find((t) => t.id === id)?.name ?? "";
    return staffList
        .filter((s) => s.id !== staffId && s.accountActive)
        .sort((a, b) => Number(b.teamId === staff?.teamId) - Number(a.teamId === staff?.teamId) || a.name.localeCompare(b.name, "vi"))
        .map((s) => ({
          value: s.id,
          label: s.name,
          search: `${s.name} ${s.title} ${teamName(s.teamId)}`.toLowerCase(),
          detail: [s.title, teamName(s.teamId)].filter(Boolean).join(" · "),
        }));
  }, [staffList, teams, staffId, staff?.teamId]);

  const byProject = useMemo(() => {
    const groups = new Map<string, { name: string; items: HandoverTask[] }>();
    for (const task of tasks) {
      const group = groups.get(task.projectId) ?? { name: task.projectName, items: [] };
      group.items.push(task);
      groups.set(task.projectId, group);
    }
    return [...groups.entries()];
  }, [tasks]);

  if (!staff) return null;

  const selectedIds = tasks.filter((t) => !excluded.has(t.stepId)).map((t) => t.stepId);
  const allChecked = selectedIds.length === tasks.length && tasks.length > 0;
  const receiver = staffList.find((s) => s.id === receiverId);

  const toggle = (ids: string[], checked: boolean) =>
    setExcluded((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (checked ? next.delete(id) : next.add(id)));
      return next;
    });

  const confirm = async () => {
    if (!receiver || selectedIds.length === 0) return;
    const moved = await handover.run({
      from: { id: staff.id, name: staff.name },
      to: { id: receiver.id, name: receiver.name },
      stepIds: selectedIds,
      files,
      actor: {
        name: currentUser?.displayName || currentUser?.name || "Cán bộ",
        role: (currentUser as { roleName?: string } | null)?.roleName || "Cán bộ Ban QLDA",
      },
    });
    if (moved !== null) onClose();
  };

  return (
    <Modal
      open
      centered
      width={620}
      footer={
        <div className="flex w-full justify-end gap-2 border-t border-slate-100 pt-3.5">
          <Button
            intent="primary"
            onClick={confirm}
            loading={handover.isPending}
            disabled={!receiver || selectedIds.length === 0}
          >
            Bàn giao{selectedIds.length > 0 ? ` ${selectedIds.length} việc` : ""}
          </Button>
          <Button intent="outline" onClick={onClose} disabled={handover.isPending}>
            Đóng
          </Button>
        </div>
      }
      styles={{
        container: { maxHeight: "calc(100vh - 32px)", display: "flex", flexDirection: "column" },
        body: { flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 4 },
      }}
      onCancel={onClose}
      destroyOnHidden
      title={
        <span className="flex items-center gap-2 text-base font-bold text-slate-900">
          <SwapOutlined className="text-[#0F4C81]" />
          Bàn giao công việc của {staff.name}
        </span>
      }
    >
      <div className="mb-4 rounded-lg border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 text-[13px] text-slate-700">
        {[staff.title, teams.find((t) => t.id === staff.teamId)?.name].filter(Boolean).join(" · ")}
        {!isLoading && !error && (
          <span className="text-slate-500"> · {tasks.length} việc đang mở</span>
        )}
      </div>

      <div className="mb-4">
        <Text strong className="mb-1.5 block text-[13px] text-slate-800">
          Người nhận bàn giao <span className="text-rose-500">*</span>
        </Text>
        <Select
          showSearch
          className="w-full"
          placeholder="Chọn cán bộ nhận việc"
          value={receiverId}
          onChange={setReceiverId}
          options={receiverOptions}
          filterOption={(input, option) => Boolean(option?.search.includes(input.trim().toLowerCase()))}
          optionRender={(option) => (
            <div className="flex flex-col py-0.5">
              <span className="text-[13px] font-medium text-slate-900">{option.data.label}</span>
              {option.data.detail && <span className="text-[11px] text-slate-500">{option.data.detail}</span>}
            </div>
          )}
        />
      </div>

      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between">
          <Text strong className="text-[13px] text-slate-800">
            Công việc bàn giao
          </Text>
          {tasks.length > 0 && (
            <Checkbox
              checked={allChecked}
              indeterminate={selectedIds.length > 0 && !allChecked}
              onChange={(e) => toggle(tasks.map((t) => t.stepId), e.target.checked)}
              className="text-xs text-slate-600"
            >
              Chọn tất cả ({selectedIds.length}/{tasks.length})
            </Checkbox>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center rounded-lg border border-slate-200 py-8">
            <Spin size="small" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-[13px] text-amber-800">
            {error.message}
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 px-3.5 py-6 text-center text-[13px] text-slate-500">
            Cán bộ này không có công việc nào đang mở.
          </div>
        ) : (
          <div className="max-h-[40vh] overflow-y-auto rounded-lg border border-slate-200">
            {byProject.map(([projectId, group]) => (
              <div key={projectId} className="border-b border-slate-100 last:border-b-0">
                <div className="sticky top-0 z-10 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  {group.name}
                </div>
                {group.items.map((task) => (
                  <label
                    key={task.stepId}
                    className="flex cursor-pointer items-start gap-2.5 px-3 py-2 hover:bg-slate-50/70"
                  >
                    <Checkbox
                      checked={!excluded.has(task.stepId)}
                      onChange={(e) => toggle([task.stepId], e.target.checked)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] text-slate-900">
                        <span className="font-semibold text-[#0F4C81]">{task.stepCode}</span> {task.stepName}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
                        {task.department && <span>{task.department}</span>}
                        {task.dueDate && <span>Hạn {formatDateVi(task.dueDate)}</span>}
                        {task.submitted && (
                          <span className="rounded border border-amber-200 bg-amber-50 px-1.5 text-amber-700">
                            Đang chờ duyệt
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            ))}
          </div>
        )}
        {tasks.length > 0 && (
          <div className="mt-1.5 text-[11px] text-slate-500">
            Việc chưa nộp sẽ chuyển về &quot;Chờ tiếp nhận&quot; của người nhận; ghi chú và hồ sơ đã có được giữ nguyên.
          </div>
        )}
      </div>

      <div>
        <Text strong className="mb-1.5 block text-[13px] text-slate-800">
          Hồ sơ bàn giao
        </Text>
        <StandardFileUpload
          hideHeader
          value={files}
          onChange={setFiles}
          promptText="Nhấn hoặc kéo thả biên bản bàn giao, quyết định điều động..."
          className="border-0 bg-transparent p-0"
        />
      </div>

    </Modal>
  );
}
