"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApartmentOutlined,
  CrownOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  ScheduleOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Button, Card, Flex, Spin, Tabs, Text, Title } from "@/components/ui";
import {
  ModuleTabLabel,
  ReasonModal,
} from "@/components/workspace";
import { PERSONNEL_TAB_LABELS } from "../constants/personnel-labels";
import { usePersonnelAssignment } from "../hooks/usePersonnelAssignment";
import type {
  Assignment,
  AssignmentFilter,
  PersonnelProject,
  PersonnelTabKey,
  TeamId,
} from "../types/personnel.types";
import AccountsTab from "./AccountsTab";
import AssignmentDetailDrawer from "./AssignmentDetailDrawer";
import AssignmentModal from "./AssignmentModal";
import AssignmentTab from "./AssignmentTab";
import OrganizationTab from "./OrganizationTab";
import ProjectLeadershipModal from "./ProjectLeadershipModal";
import ProjectTeamTab from "./ProjectTeamTab";

type ModalState =
  | { mode: "closed" }
  | {
      mode: "create";
      defaultProjectId?: string;
      initialLevel?: "PHASE_LEAD" | "TASK_MEMBER";
      defaultStage?: string;
      parentAssignmentId?: string;
      initialTeamId?: TeamId;
    }
  | { mode: "edit"; assignment: Assignment };

export default function PersonnelAssignmentScreen() {
  const router = useRouter();
  const controller = usePersonnelAssignment();
  const { permissions } = controller;

  const [activeTab, setActiveTab] = useState<PersonnelTabKey | null>(null);
  const [filter, setFilter] = useState<AssignmentFilter>("ALL");
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });
  const [leadershipModalOpen, setLeadershipModalOpen] = useState(false);
  const [leadershipProject, setLeadershipProject] = useState<PersonnelProject | undefined>();
  const [lockTargetId, setLockTargetId] = useState<string>();
  const [detailAssignmentId, setDetailAssignmentId] = useState<string>();

  const currentStaff = useMemo(() => {
    if (!controller.currentUser) return undefined;
    const name = (controller.currentUser.displayName || controller.currentUser.name || "").trim().toLowerCase();
    const email = (controller.currentUser.email || "").trim().toLowerCase();
    return controller.data.staff.find(
      (s) =>
        s.id === controller.currentUser?.id ||
        (email && s.email?.toLowerCase() === email) ||
        (name && s.name.toLowerCase() === name)
    );
  }, [controller.currentUser, controller.data.staff]);

  if (controller.loading) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center">
        <Spin size="large" description="Đang tải dữ liệu nhân sự..." />
      </section>
    );
  }

  // Chặn truy cập nếu không có quyền truy cập M5 (Ban Giám đốc hoặc Người có quyền chủ dự án)
  if (!permissions.canAccessModule) {
    return (
      <Flex layout="center" className="min-h-[calc(100vh-140px)] px-4">
        <Card surface="workspace" className="w-full max-w-[560px] text-center border-rose-200 shadow-md">
          <Flex vertical align="center" gap={14}>
            <Flex
              align="center"
              justify="center"
              className="h-14 w-14 rounded-full bg-rose-50 text-rose-600 text-2xl"
            >
              <LockOutlined />
            </Flex>
            <Flex vertical align="center" gap={8}>
              <Title level={4} className="!m-0 text-slate-800">
                Không có quyền truy cập phân hệ Nhân sự & Phân công
              </Title>
              <Text type="secondary" className="text-sm">
                Theo quy định, phân hệ <strong>M5 – Nhân sự và Phân công</strong> dành cho <strong>Ban Giám đốc</strong> (phân công dự án) và <strong>Người có quyền chủ dự án</strong> (phân công nhiệm vụ nhân viên). Các vai trò khác không có quyền truy cập.
              </Text>
              <div className="mt-2 text-xs text-slate-500 bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200">
                Tài khoản hiện tại: <strong className="text-slate-800">{controller.currentUser?.displayName ?? controller.currentUser?.name}</strong> · Vai trò: <strong className="text-slate-800">{controller.currentUser?.roleName ?? controller.currentUser?.role ?? "Khách"}</strong>
              </div>
            </Flex>
            <Button intent="primary" onClick={() => router.push("/dashboard")}>
              Quay về Bảng điều khiển
            </Button>
          </Flex>
        </Card>
      </Flex>
    );
  }

  const modalError = controller.feedback?.type === "error" ? controller.feedback.text : undefined;
  const lockTarget = controller.data.staff.find((person) => person.id === lockTargetId);

  const openModal = (state: ModalState) => {
    controller.clearFeedback();
    setModal(state);
  };

  const handleOpenLeadershipModal = (project?: PersonnelProject) => {
    controller.clearFeedback();
    setLeadershipProject(project);
    setLeadershipModalOpen(true);
  };

  const hasMultipleRoles = Boolean(
    permissions.actingProjectIds &&
    permissions.actingProjectIds.length > 0 &&
    permissions.memberProjectIds &&
    permissions.memberProjectIds.length > 0
  );

  const isLead = Boolean(permissions.isTeamLeader || permissions.isProjectLeader);

  const defaultTabKey: PersonnelTabKey =
    permissions.isTeamLeader
      ? "team-tasks"
      : permissions.isProjectLeader
      ? "project-tasks"
      : permissions.defaultTab;
  const currentTab = activeTab ?? defaultTabKey;

  const assignmentTabTitle =
    permissions.canAssignProjectLeaders && !permissions.canAssignStaffTasks
      ? "Phân công dự án"
      : "Nhiệm vụ của tôi";

  const projectTeamTabTitle = permissions.isMember || hasMultipleRoles || permissions.isTeamLeader
    ? "Tổ công tác & Dự án tham gia"
    : PERSONNEL_TAB_LABELS["project-team"];

  const tabItems = [
    {
      key: "assignments" as const,
      label: (
        <ModuleTabLabel
          icon={<ScheduleOutlined />}
          text={assignmentTabTitle}
        />
      ),
      children: (
        <AssignmentTab
          controller={controller}
          filter={filter}
          onFilterChange={setFilter}
          selectedProjectId={selectedProjectId}
          onSelectProjectChange={setSelectedProjectId}
          onAssignLeadership={handleOpenLeadershipModal}
          onCreate={(defaultProjectId, initialLevel, defaultStage, parentAssignmentId, initialTeamId) =>
            openModal({ mode: "create", defaultProjectId, initialLevel, defaultStage, parentAssignmentId, initialTeamId })
          }
          onEdit={(assignment) => openModal({ mode: "edit", assignment })}
          onOpenDetail={(assignment) => setDetailAssignmentId(assignment.id)}
          viewScope={
            permissions.canAssignProjectLeaders && !permissions.canAssignStaffTasks
              ? undefined
              : "MY_TASKS"
          }
        />
      ),
    },
    ...(permissions.isProjectLeader
      ? [
          {
            key: "project-tasks" as const,
            label: (
              <ModuleTabLabel
                icon={<CrownOutlined />}
                text="Giao việc dự án (CNDA)"
              />
            ),
            children: (
              <AssignmentTab
                controller={controller}
                filter={filter}
                onFilterChange={setFilter}
                selectedProjectId={selectedProjectId}
                onSelectProjectChange={setSelectedProjectId}
                onAssignLeadership={handleOpenLeadershipModal}
                onCreate={(defaultProjectId, initialLevel, defaultStage, parentAssignmentId, initialTeamId) =>
                  openModal({ mode: "create", defaultProjectId, initialLevel, defaultStage, parentAssignmentId, initialTeamId })
                }
                onEdit={(assignment) => openModal({ mode: "edit", assignment })}
                onOpenDetail={(assignment) => setDetailAssignmentId(assignment.id)}
                viewScope="PROJECT_LEAD"
              />
            ),
          },
        ]
      : []),
    ...(permissions.isTeamLeader
      ? [
          {
            key: "team-tasks" as const,
            label: (
              <ModuleTabLabel
                icon={<TeamOutlined />}
                text="Giao việc tổ & Phê duyệt"
              />
            ),
            children: (
              <AssignmentTab
                controller={controller}
                filter={filter}
                onFilterChange={setFilter}
                selectedProjectId={selectedProjectId}
                onSelectProjectChange={setSelectedProjectId}
                onAssignLeadership={handleOpenLeadershipModal}
                onCreate={(defaultProjectId, initialLevel, defaultStage, parentAssignmentId, initialTeamId) =>
                  openModal({ mode: "create", defaultProjectId, initialLevel, defaultStage, parentAssignmentId, initialTeamId })
                }
                onEdit={(assignment) => openModal({ mode: "edit", assignment })}
                onOpenDetail={(assignment) => setDetailAssignmentId(assignment.id)}
                viewScope="TEAM_LEAD"
              />
            ),
          },
        ]
      : []),
    {
      key: "project-team" as const,
      label: (
        <ModuleTabLabel
          icon={<TeamOutlined />}
          text={projectTeamTabTitle}
        />
      ),
      children: (
        <ProjectTeamTab
          controller={controller}
          onCreateTask={(defaultProjectId) =>
            openModal({ mode: "create", defaultProjectId })
          }
        />
      ),
    },
    ...(permissions.canManageOrganization
      ? [
          {
            key: "organization" as const,
            label: (
              <ModuleTabLabel
                icon={<ApartmentOutlined />}
                text={PERSONNEL_TAB_LABELS.organization}
              />
            ),
            children: <OrganizationTab controller={controller} />,
          },
        ]
      : []),
    ...(permissions.canManageAccounts
      ? [
          {
            key: "accounts" as const,
            label: (
              <ModuleTabLabel
                icon={<SafetyCertificateOutlined />}
                text={PERSONNEL_TAB_LABELS.accounts}
              />
            ),
            children: (
              <AccountsTab
                controller={controller}
                onLockAccount={(person) => setLockTargetId(person.id)}
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-4">

      <section id="personnel-tabs" className="scroll-mt-4">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-100/80 p-1.5 shadow-2xs">
          {tabItems.map((item) => {
            const isActive = currentTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key as PersonnelTabKey)}
                className={`relative flex items-center gap-2.5 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer select-none ${
                  isActive
                    ? "bg-[#007A78] text-white shadow-sm font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                <span className={`text-base leading-none transition-colors ${isActive ? "text-white" : "text-slate-500"}`}>
                  {item.key === "assignments" ? (
                    <ScheduleOutlined />
                  ) : item.key === "project-tasks" ? (
                    <CrownOutlined />
                  ) : item.key === "team-tasks" ? (
                    <TeamOutlined />
                  ) : item.key === "project-team" ? (
                    <ApartmentOutlined />
                  ) : item.key === "organization" ? (
                    <ApartmentOutlined />
                  ) : (
                    <SafetyCertificateOutlined />
                  )}
                </span>
                <span className="whitespace-nowrap tracking-wide">
                  {item.key === "assignments"
                    ? assignmentTabTitle
                    : item.key === "project-tasks"
                    ? "Giao việc dự án (CNDA)"
                    : item.key === "team-tasks"
                    ? "Giao việc tổ & Phê duyệt"
                    : item.key === "project-team"
                    ? projectTeamTabTitle
                    : item.key === "organization"
                    ? PERSONNEL_TAB_LABELS.organization
                    : PERSONNEL_TAB_LABELS.accounts}
                </span>
              </button>
            );
          })}
        </div>

        {/* Nội dung tab đang hiển thị */}
        <div>
          {tabItems.find((item) => item.key === currentTab)?.children}
        </div>
      </section>

      {/* Modal Giám đốc phân công lãnh đạo dự án */}
      {leadershipModalOpen && (
        <ProjectLeadershipModal
          data={controller.data}
          project={leadershipProject}
          errorText={modalError}
          onClose={() => {
            setLeadershipModalOpen(false);
            setLeadershipProject(undefined);
          }}
          onSubmit={controller.assignProjectLeaders}
        />
      )}

      {/* Modal Phân công nhiệm vụ theo cấp bậc (CNDA -> Tổ trưởng & Tổ trưởng -> Thành viên) */}
      {modal.mode !== "closed" && (
        <AssignmentModal
          data={controller.data}
          defaultProjectId={modal.mode === "create" ? modal.defaultProjectId : undefined}
          allowedProjectIds={permissions.actingProjectIds}
          initialLevel={modal.mode === "create" ? modal.initialLevel : undefined}
          initialTeamId={modal.mode === "create" ? modal.initialTeamId : undefined}
          defaultStage={modal.mode === "create" ? modal.defaultStage : undefined}
          defaultParentAssignmentId={modal.mode === "create" ? modal.parentAssignmentId : undefined}
          editing={modal.mode === "edit" ? modal.assignment : undefined}
          errorText={modalError}
          onClose={() => setModal({ mode: "closed" })}
          onCreate={controller.createAssignment}
          onUpdate={controller.updateAssignment}
          currentStaffId={currentStaff?.id || controller.currentUser?.id}
          isProjectLeader={permissions.isProjectLeader}
          isTeamLeader={permissions.isTeamLeader}
          leadingTeamId={permissions.leadingTeamId}
        />
      )}

      {lockTarget && (
        <ReasonModal
          open
          title={`Khóa tài khoản của ${lockTarget.name}`}
          summary={
            <>
              {lockTarget.title} ·{" "}
              {controller.data.teams.find((team) => team.id === lockTarget.teamId)?.name}
            </>
          }
          label="Lý do khóa tài khoản"
          placeholder="Ví dụ: Nghỉ phép dài hạn đến 30/10/2026, chuyển công tác..."
          confirmText="Khóa tài khoản"
          onClose={() => setLockTargetId(undefined)}
          onConfirm={(reason) => controller.lockAccount(lockTarget.id, reason)}
        />
      )}

      {detailAssignmentId &&
        controller.data.assignments.find((a) => a.id === detailAssignmentId) && (
          <AssignmentDetailDrawer
            assignment={
              controller.data.assignments.find((a) => a.id === detailAssignmentId)!
            }
            controller={controller}
            onClose={() => setDetailAssignmentId(undefined)}
            onComplete={(assignment) => {
              controller.completeAssignment(assignment.id);
            }}
          />
        )}
    </div>
  );
}
