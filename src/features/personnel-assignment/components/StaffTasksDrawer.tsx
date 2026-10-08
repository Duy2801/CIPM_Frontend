"use client";

import { useMemo, useState } from "react";
import {
  CheckOutlined,
  ClockCircleOutlined,
  FolderOpenOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Flex, Tag, Text } from "@/components/ui";
import { daysBetween, formatDateVi } from "@/utils/date";
import { getInitials } from "@/utils/initials";
import {
  ASSIGNMENT_STATUS_META,
  PRIORITY_META,
  SYSTEM_ROLE_META,
} from "../constants/personnel-labels";
import type { PersonnelController } from "../hooks/usePersonnelAssignment";
import type { Assignment, Staff } from "../types/personnel.types";
import { isDueSoon, isOverdue } from "../utils/personnel-rules";

interface StaffTasksDrawerProps {
  open: boolean;
  staff: Staff | null;
  controller: PersonnelController;
  onClose: () => void;
}

export default function StaffTasksDrawer({
  open,
  staff,
  controller,
  onClose,
}: StaffTasksDrawerProps) {
  const { data, today } = controller;
  const [filterMode, setFilterMode] = useState<"ACTIVE" | "DONE" | "ALL">("ACTIVE");

  const isMe = useMemo(() => {
    if (!staff || !controller.currentUser) return false;
    const currentName = (controller.currentUser.displayName || controller.currentUser.name || "").trim().toLowerCase();
    const currentEmail = (controller.currentUser.email || "").trim().toLowerCase();
    return (
      staff.id === controller.currentUser.id ||
      (currentEmail && staff.email?.toLowerCase() === currentEmail) ||
      (currentName && staff.name.toLowerCase() === currentName)
    );
  }, [staff, controller.currentUser]);

  const staffAssignments = useMemo(() => {
    if (!staff) return [];
    return data.assignments.filter((a) => a.assigneeId === staff.id);
  }, [staff, data.assignments]);

  const activeTasks = useMemo(
    () => staffAssignments.filter((a) => a.status !== "DONE"),
    [staffAssignments]
  );
  const doneTasks = useMemo(
    () => staffAssignments.filter((a) => a.status === "DONE"),
    [staffAssignments]
  );

  const displayedTasks = useMemo(() => {
    const list =
      filterMode === "ACTIVE"
        ? activeTasks
        : filterMode === "DONE"
        ? doneTasks
        : staffAssignments;

    return [...list].sort((a, b) => {
      const weight = (item: Assignment) => {
        if (isOverdue(item, today)) return 0;
        if (isDueSoon(item, today)) return 1;
        if (item.status === "DONE") return 3;
        return 2;
      };
      return weight(a) - weight(b) || a.dueDate.localeCompare(b.dueDate);
    });
  }, [filterMode, activeTasks, doneTasks, staffAssignments, today]);

  if (!staff) return null;

  const team = data.teams.find((t) => t.id === staff.teamId);

  return (
    <Drawer
      open={open}
      width="min(680px, 100vw)"
      closable={false}
      onClose={onClose}
      footer={
        <Flex justify="end">
          <Button intent="outline" onClick={onClose}>
            Đóng
          </Button>
        </Flex>
      }
      title={
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B2546] to-[#174674] text-sm font-bold text-white shadow-xs">
            {getInitials(staff.name)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold text-[#102A43] truncate">
                {staff.name}
              </span>
              <Tag intent="brand" scale="sm" className="m-0 font-medium">
                {SYSTEM_ROLE_META[staff.roleCode]?.label ?? staff.roleCode}
              </Tag>
            </div>
            <span className="block text-xs text-slate-500 mt-0.5">
              {staff.title} · {team?.name ?? "—"} · {staff.phone}
            </span>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Thanh chọn chế độ xem */}
        <Flex justify="space-between" align="center" className="border-b border-slate-100 pb-2">
          <Flex gap={6}>
            <button
              type="button"
              onClick={() => setFilterMode("ACTIVE")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                filterMode === "ACTIVE"
                  ? "bg-[#0B2546] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Đang làm ({activeTasks.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("DONE")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                filterMode === "DONE"
                  ? "bg-[#0B2546] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Đã xong ({doneTasks.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("ALL")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                filterMode === "ALL"
                  ? "bg-[#0B2546] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tất cả ({staffAssignments.length})
            </button>
          </Flex>

          <Text className="text-xs text-slate-400">
            {displayedTasks.length} nhiệm vụ
          </Text>
        </Flex>

        {/* Danh sách công việc */}
        {displayedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
            <InfoCircleOutlined className="text-2xl text-slate-400" />
            <Text className="mt-2 text-sm font-semibold text-slate-700">
              Không có nhiệm vụ nào
            </Text>
            <Text className="mt-0.5 text-xs text-slate-500">
              {filterMode === "ACTIVE"
                ? "Cán bộ hiện không có nhiệm vụ nào đang thực hiện."
                : filterMode === "DONE"
                ? "Chưa có nhiệm vụ nào đã hoàn thành."
                : "Cán bộ chưa được phân công nhiệm vụ nào."}
            </Text>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedTasks.map((task) => {
              const project = data.projects.find((p) => p.id === task.projectId);
              const overdue = isOverdue(task, today);
              const dueSoon = isDueSoon(task, today);
              const priorityMeta = PRIORITY_META[task.priority];
              const statusMeta = ASSIGNMENT_STATUS_META[task.status];

              return (
                <article
                  key={task.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:border-slate-300 hover:shadow-xs"
                >
                  {/* Dự án & Nhãn */}
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 font-medium truncate max-w-[340px]">
                      <FolderOpenOutlined className="text-slate-400 shrink-0" />
                      <span className="truncate">{project?.name ?? "Dự án khác"}</span>
                    </span>
                    <Flex gap={4}>
                      <Tag intent={priorityMeta.intent} scale="sm" className="m-0">
                        {priorityMeta.label}
                      </Tag>
                      <Tag intent={statusMeta.intent} scale="sm" className="m-0">
                        {statusMeta.label}
                      </Tag>
                    </Flex>
                  </div>

                  {/* Tiêu đề nhiệm vụ */}
                  <h4 className="mt-2 text-sm font-bold text-[#102A43] leading-snug">
                    {task.title}
                  </h4>

                  {/* Ghi chú nếu có */}
                  {task.note && (
                    <p className="mt-1.5 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {task.note}
                    </p>
                  )}

                  {/* Cảnh báo yêu cầu làm lại */}
                  {task.rejectionNote && task.status === "IN_PROGRESS" && (
                    <div className="mt-2 text-xs text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
                      <strong>Lãnh đạo yêu cầu hoàn thiện lại:</strong> {task.rejectionNote}
                    </div>
                  )}

                  {/* Thời hạn & người giao */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <ClockCircleOutlined
                        className={overdue ? "text-rose-600" : dueSoon ? "text-amber-500" : "text-slate-400"}
                      />
                      <span className={overdue ? "font-bold text-rose-600" : dueSoon ? "font-semibold text-amber-600" : ""}>
                        Hạn: {formatDateVi(task.dueDate)}
                        {overdue && ` (Quá hạn ${daysBetween(task.dueDate, today)} ngày)`}
                        {dueSoon && ` (Còn ${daysBetween(today, task.dueDate)} ngày)`}
                      </span>
                    </span>
                    <span>Giao bởi: {task.assignedBy}</span>
                  </div>

                  {/* Nút hành động gửi duyệt nghiệm thu */}
                  {task.status !== "DONE" && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                      {task.status === "PENDING_APPROVAL" ? (
                        <Tag color="warning" className="!m-0 text-xs font-semibold">
                          Đã gửi báo cáo · Chờ nghiệm thu
                        </Tag>
                      ) : isMe ? (
                        <Button
                          scale="xs"
                          intent="primary"
                          icon={<CheckOutlined />}
                          onClick={async () => {
                            await controller.requestCompletion(task.id);
                          }}
                          className="!h-6 !text-[11px] !bg-[#007A78] hover:!bg-[#006361] !text-white"
                        >
                          Gửi duyệt nghiệm thu
                        </Button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          Chờ cán bộ nộp hồ sơ & gửi duyệt
                        </span>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </Drawer>
  );
}
