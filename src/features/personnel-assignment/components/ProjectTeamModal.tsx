"use client";

import { useMemo, useState } from "react";
import {
  ClockCircleOutlined,
  CrownOutlined,
  DeleteOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UserDeleteOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { App } from "antd";
import { Avatar, Button, Drawer, Modal, Select, Tag, Text, Tooltip } from "@/components/ui";
import { cn } from "@/utils/cn";
import { getInitials } from "@/utils/initials";
import type { PersonnelDataset, PersonnelProject, Staff } from "../types/personnel.types";

interface ProjectTeamModalProps {
  project: PersonnelProject;
  data: PersonnelDataset;
  isManager: boolean; // GĐ, PGĐ hoặc Quyền CNDA của dự án này
  canManageRole: boolean; // Chỉ GĐ hoặc PGĐ mới có quyền cấp/thu hồi role
  onClose: () => void;
  onAddMember: (projectId: string, staffId: string) => Promise<boolean>;
  onRemoveMember: (projectId: string, staffId: string) => Promise<boolean>;
  onRevokeRole: (projectId: string) => void;
  onOpenGrantModal: (project: PersonnelProject) => void;
  onUrgeMember?: (staff: Staff, project: PersonnelProject) => void;
}

export default function ProjectTeamModal({
  project,
  data,
  isManager,
  canManageRole,
  onClose,
  onAddMember,
  onRemoveMember,
  onRevokeRole,
  onOpenGrantModal,
  onUrgeMember,
}: ProjectTeamModalProps) {
  const { modal } = App.useApp();
  const [selectedStaffToAdd, setSelectedStaffToAdd] = useState<string | undefined>(undefined);
  const [adding, setAdding] = useState(false);

  const teamMemberIds = project.teamMembers || [];

  // Lấy danh sách thành viên hiện tại
  const members = useMemo(() => {
    return teamMemberIds
      .map((id) => data.staff.find((s) => s.id === id))
      .filter((s): s is Staff => Boolean(s));
  }, [teamMemberIds, data.staff]);

  // Cán bộ chưa có trong dự án để thêm vào
  const availableStaffOptions = useMemo(() => {
    const existingSet = new Set(teamMemberIds);
    return data.teams.map((team) => ({
      label: team.name,
      options: data.staff
        .filter((person) => !existingSet.has(person.id) && person.accountActive)
        .map((person) => ({
          value: person.id,
          label: `${person.name} – ${person.title} (${person.employment})`,
        })),
    }));
  }, [teamMemberIds, data.staff, data.teams]);

  const handleAdd = async () => {
    if (!selectedStaffToAdd) return;
    setAdding(true);
    try {
      const ok = await onAddMember(project.id, selectedStaffToAdd);
      if (ok) {
        setSelectedStaffToAdd(undefined);
      }
    } finally {
      setAdding(false);
    }
  };

  const confirmRemove = (person: Staff) => {
    modal.confirm({
      width: 460,
      centered: true,
      icon: null,
      title: null,
      className:
        "[&_.ant-modal-content]:!rounded-2xl [&_.ant-modal-content]:!p-6 [&_.ant-modal-content]:!shadow-xl",
      content: (
        <div className="space-y-3.5">
          <div className="flex items-start gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-lg shadow-xs">
              <UserDeleteOutlined />
            </span>
            <div className="pt-0.5">
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                Rút cán bộ khỏi tổ công tác?
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Xác nhận đưa nhân sự ra khỏi danh sách tổ công tác dự án
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-xs text-slate-700 leading-relaxed">
            Xác nhận đưa cán bộ <strong className="text-slate-900">{person.name}</strong> ra khỏi Tổ công tác của dự án <strong className="text-[#0F4C81]">{project.code} · {project.name}</strong>.
          </div>
        </div>
      ),
      okText: "Rút khỏi dự án",
      okButtonProps: {
        className:
          "!h-9 !px-5 !rounded-lg !font-semibold !bg-rose-600 hover:!bg-rose-700 !border-rose-600 !text-white !shadow-xs",
      },
      cancelText: "Đóng",
      cancelButtonProps: {
        className:
          "!h-9 !px-4 !rounded-lg !font-medium !text-slate-700 !border-slate-300 hover:!bg-slate-50",
      },
      onOk: () => onRemoveMember(project.id, person.id),
    });
  };

  const isCndaRevoked = Boolean(project.cndaRevoked);
  const mainExec = project.mainExecutorId
    ? data.staff.find((s) => s.id === project.mainExecutorId)
    : undefined;
  const cndaStaffId = project.actingDirectorId || (!isCndaRevoked ? project.mainExecutorId : undefined);
  const actingDirector = cndaStaffId
    ? data.staff.find((s) => s.id === cndaStaffId)
    : undefined;

  return (
    <Drawer
      open
      width="min(680px, 100vw)"
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#0F4C81] border border-blue-100">
            <TeamOutlined className="text-lg" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <Text className="text-base font-bold text-[#102A43]">
                Tổ công tác dự án
              </Text>
              <Tag color="cyan" className="m-0 text-xs font-semibold">
                {members.length} thành viên
              </Tag>
            </div>
            <Text className="block text-xs font-normal text-slate-500">
              {project.code} · {project.name}
            </Text>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between px-1 py-1">
          <Text className="text-xs text-slate-500">
            {isManager
              ? "Bạn có toàn quyền thêm bớt thành viên và phân công giai đoạn cho dự án này."
              : "Chỉ Quyền Chủ nhiệm DA và Ban Giám đốc mới có quyền điều chỉnh thành viên."}
          </Text>
          <Button intent="outline" scale="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      }
    >
      {/* Khung thông tin Quyền Chủ nhiệm dự án */}
      <div
        className={cn(
          "mb-4 rounded-xl border p-4",
          isCndaRevoked
            ? "border-rose-200 bg-rose-50/60"
            : actingDirector
            ? "border-teal-200 bg-teal-50/60"
            : "border-slate-200 bg-slate-50/60"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full text-white font-bold text-sm shadow-sm",
                isCndaRevoked
                  ? "bg-rose-500"
                  : actingDirector
                  ? "bg-teal-600"
                  : "bg-slate-400"
              )}
            >
              <CrownOutlined />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <Text className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Quyền Chủ nhiệm dự án (CNDA)
                </Text>
                {isCndaRevoked ? (
                  <Tag color="error" className="m-0 text-[11px] font-semibold">
                    Đã thu hồi quyền điều hành
                  </Tag>
                ) : actingDirector ? (
                  <Tag color="cyan" className="m-0 text-[11px] font-semibold">
                    Đang hiệu lực
                  </Tag>
                ) : (
                  <Tag color="default" className="m-0 text-[11px]">
                    Chưa bổ nhiệm
                  </Tag>
                )}
              </div>
              {isCndaRevoked && mainExec ? (
                <div>
                  <Text className="block text-[14px] font-bold text-slate-900 mt-0.5">
                    {mainExec.name}
                  </Text>
                  <Text className="block text-xs text-rose-700">
                    {mainExec.title} · Quyền điều hành đã bị Ban Giám đốc thu hồi. Cán bộ chỉ còn đảm nhiệm kỹ thuật chuyên môn.
                  </Text>
                </div>
              ) : actingDirector ? (
                <div>
                  <Text className="block text-[14px] font-bold text-slate-900 mt-0.5">
                    {actingDirector.name}
                  </Text>
                  <Text className="block text-xs text-slate-600">
                    {actingDirector.title} · {project.actingDirectorAssignedBy ? `Cấp bởi: ${project.actingDirectorAssignedBy}` : "Người thực hiện chính"}
                    {project.actingDirectorAssignedAt && ` (${project.actingDirectorAssignedAt})`}
                  </Text>
                  {project.actingDirectorNote && (
                    <Text className="mt-1 block text-[11px] italic text-slate-600 bg-white/70 p-2 rounded border border-teal-100">
                      &ldquo;{project.actingDirectorNote}&rdquo;
                    </Text>
                  )}
                </div>
              ) : (
                <Text className="block text-xs text-slate-500 mt-0.5">
                  Dự án này chưa được phân công Người thực hiện chính (Chủ nhiệm dự án).
                </Text>
              )}
            </div>
          </div>

          {/* Nút hành động cấp / thu hồi dành cho BGD */}
          {canManageRole && (
            <div className="shrink-0">
              {actingDirector ? (
                <Button
                  intent="outline"
                  scale="compact"
                  icon={<UserDeleteOutlined />}
                  className="!border-rose-300 !text-rose-700 hover:!bg-rose-50"
                  onClick={() => onRevokeRole(project.id)}
                >
                  Thu hồi quyền CNDA
                </Button>
              ) : isCndaRevoked && mainExec ? (
                <Button
                  intent="outline"
                  scale="compact"
                  icon={<CrownOutlined />}
                  className="!border-teal-300 !text-teal-700 hover:!bg-teal-50"
                  onClick={() => onOpenGrantModal(project)}
                >
                  Cấp lại quyền CNDA
                </Button>
              ) : (
                <Button
                  intent="primary"
                  scale="compact"
                  icon={<CrownOutlined />}
                  onClick={() => onOpenGrantModal(project)}
                >
                  Cấp Role Quyền CNDA
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Khung Thêm thành viên mới vào dự án (chỉ Quyền CNDA hoặc BGD có quyền) */}
      {isManager && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
          <Text className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
            Thêm cán bộ vào Tổ công tác dự án
          </Text>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Select
                placeholder="Chọn cán bộ từ danh mục nhân sự..."
                showSearch={{ optionFilterProp: "label" }}
                value={selectedStaffToAdd}
                onChange={setSelectedStaffToAdd}
                options={availableStaffOptions}
                className="w-full"
              />
            </div>
            <Button
              intent="primary"
              scale="sm"
              icon={<PlusOutlined />}
              disabled={!selectedStaffToAdd}
              loading={adding}
              onClick={handleAdd}
            >
              Thêm vào dự án
            </Button>
          </div>
        </div>
      )}

      {/* Danh sách thành viên trong dự án */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
          <Text className="text-xs font-bold uppercase tracking-wide text-slate-600">
            Danh sách cán bộ trong Tổ công tác ({members.length})
          </Text>
          <Text className="text-[11px] text-slate-400">
            Có quyền được giao nhiệm vụ theo các giai đoạn
          </Text>
        </div>

        <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
          {members.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 italic">
              Chưa có thành viên nào trong tổ công tác. Vui lòng thêm cán bộ ở trên.
            </div>
          ) : (
            members.map((person) => {
              const isActingDir = person.id === project.actingDirectorId;
              const isMainSupervisor = person.id === project.mainSupervisorId;
              const isMainExecutor = person.id === project.mainExecutorId;

              // Đếm số nhiệm vụ của người này trong dự án
              const taskCount = data.assignments.filter(
                (a) => a.projectId === project.id && (a.assigneeId === person.id || a.coAssigneeIds?.includes(person.id))
              ).length;

              const team = data.teams.find((t) => t.id === person.teamId);

              return (
                <div
                  key={person.id}
                  className="flex items-center justify-between p-3 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar variant="brand" shape="circle" size={36}>
                      {getInitials(person.name)}
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Text className="text-[13px] font-bold text-slate-800">
                          {person.name}
                        </Text>
                        {isActingDir && (
                          <Tag color="purple" className="m-0 text-[10px] font-bold py-0.5">
                            <CrownOutlined /> Quyền CNDA
                          </Tag>
                        )}
                        {isMainExecutor && !isActingDir && (
                          <Tag color="blue" className="m-0 text-[10px] py-0.5">
                            Chủ nhiệm DA
                          </Tag>
                        )}
                        {isMainSupervisor && (
                          <Tag color="green" className="m-0 text-[10px] py-0.5">
                            Giám sát chính
                          </Tag>
                        )}
                      </div>
                      <Text className="block text-xs text-slate-500">
                        {person.title} · {team?.name} · {person.phone}
                      </Text>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                      {taskCount} việc
                    </span>

                    {/* Nút Đôn đốc thành viên */}
                    {isManager && onUrgeMember && (
                      <Tooltip title={`Gửi chỉ đạo đôn đốc tiến độ đến ${person.name}`}>
                        <Button
                          intent="outline"
                          scale="compact"
                          icon={<ClockCircleOutlined />}
                          className="!text-rose-600 !border-rose-200 hover:!bg-rose-50 text-[11px] h-7 px-2"
                          onClick={() => onUrgeMember(person, project)}
                        >
                          Đôn đốc
                        </Button>
                      </Tooltip>
                    )}

                    {/* Nút xóa thành viên (trừ Quyền CNDA) */}
                    {isManager && !isActingDir && (
                      <Tooltip title="Rút cán bộ khỏi dự án">
                        <Button
                          type="text"
                          danger
                          scale="compact"
                          icon={<DeleteOutlined className="text-rose-500" />}
                          onClick={() => confirmRemove(person)}
                        />
                      </Tooltip>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Drawer>
  );
}
