"use client";

import React, { useMemo, useState } from "react";
import {
  ApartmentOutlined,
  AppstoreOutlined,
  AuditOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  CloseCircleFilled,
  DeleteOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FilterOutlined,
  PlusOutlined,
  ProjectOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  TeamOutlined,
  UploadOutlined,
  UserAddOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Drawer,
  Flex,
  Input,
  Modal,
  Pagination,
  Row,
  Select,
  Table,
  Tabs,
  Tag,
  Text,
  Tooltip,
} from "@/components/ui";
import type { ColumnsType } from "@/components/ui";
import { SectionIntro } from "@/components/workspace";
import type { PersonnelController } from "../hooks/usePersonnelAssignment";
import type {
  Assignment,
  AssignmentInput,
  PersonnelProject,
  ProjectDocumentSubmission,
  Staff,
} from "../types/personnel.types";
import AddMemberDrawer from "./AddMemberDrawer";
import AssignmentDetailDrawer from "./AssignmentDetailDrawer";
import AssignmentModal from "./AssignmentModal";
import ProjectPersonnelOrgChart from "./ProjectPersonnelOrgChart";

interface ProjectTeamTabProps {
  controller: PersonnelController;
  onCreateTask?: (projectId?: string) => void;
}

export default function ProjectTeamTab({ controller, onCreateTask }: ProjectTeamTabProps) {
  const { data, currentUser, permissions } = controller;

  // 1. Nhận diện danh tính người đăng nhập
  const currentStaff = useMemo(() => {
    if (!currentUser) return undefined;
    const name = (currentUser.displayName || currentUser.name || "").trim().toLowerCase();
    const email = (currentUser.email || "").trim().toLowerCase();
    return data.staff.find(
      (s) => s.id === currentUser.id || s.email.toLowerCase() === email || s.name.toLowerCase() === name
    );
  }, [currentUser, data.staff]);

  const currentStaffId = currentStaff?.id;
  const currentTeamId = currentStaff?.teamId;

  // Kiểm tra Ban Giám đốc (Giám đốc, Phó Giám đốc)
  const isLeadership = useMemo(() => {
    return currentUser?.role === "ADMIN" || currentUser?.role === "DEPUTY_DIRECTOR";
  }, [currentUser]);

  // Kiểm tra xem người đăng nhập có phải là Lead (Tổ trưởng chuyên môn) hay không
  // Không tính Ban Giám đốc là Lead tổ chuyên môn
  const isLead = useMemo(() => {
    if (!currentStaff || isLeadership) return false;
    // Kiểm tra xem cán bộ có phải leaderId của Team chuyên môn nào không (trừ BGD)
    return data.teams.some((t) => t.id !== "BGD" && t.leaderId === currentStaff.id) || 
      (currentStaff.title.toLowerCase().includes("tổ trưởng") && currentStaff.teamId !== "BGD");
  }, [currentStaff, isLeadership, data.teams]);

  // Tổ mà Lead đang phụ trách
  const leadTeam = useMemo(() => {
    if (!currentStaff || isLeadership) return undefined;
    return data.teams.find((t) => t.id !== "BGD" && t.leaderId === currentStaff.id) || 
      (currentTeamId !== "BGD" ? data.teams.find((t) => t.id === currentTeamId) : undefined);
  }, [currentStaff, isLeadership, data.teams, currentTeamId]);

  // Lọc danh sách dự án liên quan đến người đang xem:
  // - Ban Giám đốc: Thấy toàn bộ danh sách dự án
  // - Lead: Thấy các dự án mình tham gia + các dự án có thành viên thuộc tổ của mình tham gia
  // - Cán bộ thông thường: Chỉ thấy các dự án mình là thành viên, hoặc là CNDA, hoặc là người giám sát
  const visibleProjects = useMemo(() => {
    if (isLeadership) {
      return data.projects;
    }

    const myId = currentStaffId;
    const teamMemberIds = leadTeam
      ? new Set(data.staff.filter((s) => s.teamId === leadTeam.id).map((s) => s.id))
      : new Set<string>();

    return data.projects.filter((proj) => {
      // 1. Mình là CNDA hoặc Người giám sát
      if (myId && (proj.mainExecutorId === myId || proj.mainSupervisorId === myId || proj.actingDirectorId === myId)) {
        return true;
      }

      // 2. Mình là thành viên trong tổ công tác dự án
      if (myId && (proj.teamMembers || []).includes(myId)) {
        return true;
      }

      // 3. Mình có nhiệm vụ được giao trong dự án này (1 cán bộ thực hiện duy nhất)
      if (
        myId &&
        data.assignments.some(
          (a) => a.projectId === proj.id && a.assigneeId === myId
        )
      ) {
        return true;
      }

      // 4. Nếu là Lead: Dự án có thành viên thuộc tổ của mình tham gia (trong teamMembers hoặc có nhiệm vụ)
      if (isLead && teamMemberIds.size > 0) {
        const hasTeamMemberInProj = (proj.teamMembers || []).some((mId) => teamMemberIds.has(mId));
        if (hasTeamMemberInProj) return true;

        const hasTaskForTeamMember = data.assignments.some(
          (a) => a.projectId === proj.id && a.assigneeId && teamMemberIds.has(a.assigneeId)
        );
        if (hasTaskForTeamMember) return true;
      }

      return false;
    });
  }, [isLeadership, data.projects, currentStaffId, leadTeam, isLead, data.staff, data.assignments]);

  // 2. Dự án đang chọn
  const PROJECT_PAGE_SIZE = 5;
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [projectSearch, setProjectSearch] = useState("");
  const [projectPage, setProjectPage] = useState(1);

  // Danh sách dự án sau khi lọc tìm kiếm
  const filteredProjects = useMemo(() => {
    const q = projectSearch.trim().toLowerCase();
    if (!q) return visibleProjects;
    return visibleProjects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q)
    );
  }, [visibleProjects, projectSearch]);

  const totalProjectPages = Math.max(1, Math.ceil(filteredProjects.length / PROJECT_PAGE_SIZE));
  const safeProjectPage = Math.min(Math.max(1, projectPage), totalProjectPages);

  // Danh sách dự án phân trang (5 dự án mỗi trang)
  const paginatedProjects = useMemo(() => {
    const start = (safeProjectPage - 1) * PROJECT_PAGE_SIZE;
    return filteredProjects.slice(start, start + PROJECT_PAGE_SIZE);
  }, [filteredProjects, safeProjectPage]);

  // Tự động chọn dự án đầu tiên hợp lệ khi danh sách dự án liên quan thay đổi
  const activeProject = useMemo(() => {
    if (selectedProjectId) {
      const found = visibleProjects.find((p) => p.id === selectedProjectId);
      if (found) return found;
    }
    return visibleProjects[0] || data.projects[0];
  }, [visibleProjects, selectedProjectId, data.projects]);

  // Kiểm tra quyền Người thực hiện chính: CHỈ khi là Người thực hiện chính (CNDA) của dự án này
  // (Ban Giám đốc hoặc Lead vào xem thì không phải là CNDA của dự án)
  const isMainExecutorOfActiveProject = useMemo(() => {
    if (!activeProject || !currentStaffId) return false;
    return activeProject.mainExecutorId === currentStaffId || activeProject.actingDirectorId === currentStaffId;
  }, [activeProject, currentStaffId]);

  // 3. State cho Modal Thêm thành viên
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [selectedStaffToAdd, setSelectedStaffToAdd] = useState<string | undefined>(undefined);

  // Drawer xem chi tiết nhiệm vụ khi click vào cây
  const [detailAssignment, setDetailAssignment] = useState<Assignment | null>(null);

  // 5. State cho Modal Giao việc giai đoạn
  const [taskModalOpen, setTaskModalOpen] = useState(false);


  // Thành viên trong dự án đang chọn
  const activeProjectMembers = useMemo(() => {
    if (!activeProject) return [];
    const memberIds = activeProject.teamMembers || [];
    // Đảm bảo có cả mainExecutor và supervisor nếu chưa có
    const allIds = Array.from(new Set([...memberIds, activeProject.mainExecutorId, activeProject.mainSupervisorId].filter(Boolean))) as string[];
    return allIds.map((id) => data.staff.find((s) => s.id === id)).filter((s): s is Staff => Boolean(s));
  }, [activeProject, data.staff]);

  const mainExecutorStaff = useMemo(() => {
    if (!activeProject?.mainExecutorId) return undefined;
    return data.staff.find((s) => s.id === activeProject.mainExecutorId);
  }, [activeProject, data.staff]);

  const mainSupervisorStaff = useMemo(() => {
    if (!activeProject?.mainSupervisorId) return undefined;
    return data.staff.find((s) => s.id === activeProject.mainSupervisorId);
  }, [activeProject, data.staff]);

  // Các cán bộ chưa có trong dự án để thêm vào
  const availableStaffToAdd = useMemo(() => {
    if (!activeProject) return [];
    const existing = new Set(activeProjectMembers.map((m) => m.id));
    return data.staff.filter((s) => !existing.has(s.id) && s.accountActive);
  }, [activeProject, activeProjectMembers, data.staff]);

  // Các nhiệm vụ của dự án đang chọn
  const projectAssignments = useMemo(() => {
    if (!activeProject) return [];
    return data.assignments.filter((a) => a.projectId === activeProject.id);
  }, [data.assignments, activeProject]);



  return (
    <div className="space-y-4">
      {/* 2. Bố cục 2 cột: Cột trái chọn dự án / bao quát của Lead - Cột phải chi tiết nhân sự & duyệt tài liệu */}
      <Row gutter={[16, 16]} className="!flex items-stretch min-h-[720px]">
        {/* CỘT TRÁI: Danh sách dự án */}
        <Col xs={24} lg={7} className="!flex flex-col">
          {/* Card chọn dự án */}
          <Card
            title={
              <Flex justify="between" align="center">
                <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <ProjectOutlined className="text-teal-600" />
                  Danh mục Dự án
                </span>
                {isLeadership && (
                  <Tag color="gold" className="!text-[10px] !m-0 font-semibold">
                    Xem toàn cơ quan
                  </Tag>
                )}
              </Flex>
            }
            surface="workspace"
            padding="compact"
            className="shadow-sm h-full min-h-[720px] !flex-1 !flex flex-col [&_.ant-card-body]:!flex-1 [&_.ant-card-body]:!flex [&_.ant-card-body]:!flex-col [&_.ant-card-body]:!overflow-hidden"
          >
            <div className="mb-3 shrink-0">
              <Input
                prefix={<SearchOutlined className="text-slate-400" />}
                placeholder="Tìm dự án..."
                value={projectSearch}
                onChange={(e) => {
                  setProjectSearch(e.target.value);
                  setProjectPage(1);
                }}
                allowClear
                className="text-xs"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 min-h-[480px]">
              {filteredProjects.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  {visibleProjects.length === 0
                    ? "Chưa có dự án nào liên quan đến bạn"
                    : "Không tìm thấy dự án phù hợp"}
                </div>
              ) : (
                paginatedProjects.map((proj) => {
                  const isSelected = proj.id === activeProject.id;
                  const isMyProject = proj.mainExecutorId === currentStaffId || proj.actingDirectorId === currentStaffId;

                  return (
                    <div
                      key={proj.id}
                      onClick={() => setSelectedProjectId(proj.id)}
                      className={`p-2.5 rounded-lg cursor-pointer transition-all border ${
                        isSelected
                          ? "bg-teal-50/80 border-teal-300 shadow-2xs"
                          : "hover:bg-slate-50 border-transparent"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-600">
                          {proj.code}
                        </span>
                        <div className="flex items-center gap-1">
                          {isMyProject && (
                            <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.2 rounded">
                              Phụ trách
                            </span>
                          )}
                          <Tag className="!text-[10px] !m-0 !px-1.5">{proj.status || "Đang thi công"}</Tag>
                        </div>
                      </div>
                      <div className="text-xs font-bold text-slate-800 mt-1 line-clamp-2 leading-snug">
                        {proj.name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex justify-between items-center">
                        <span>CNDA: <strong className="text-slate-700">{data.staff.find((s) => s.id === proj.mainExecutorId)?.name || "Chưa giao"}</strong></span>
                        <span>{proj.teamMembers?.length || 0} thành viên</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {filteredProjects.length > PROJECT_PAGE_SIZE && (
              <div className="pt-2.5 mt-2 border-t border-slate-100 flex flex-col items-center gap-1 shrink-0">
                <Pagination
                  size="small"
                  current={safeProjectPage}
                  pageSize={PROJECT_PAGE_SIZE}
                  total={filteredProjects.length}
                  onChange={(page) => setProjectPage(page)}
                  showSizeChanger={false}
                  className="!m-0"
                />
                <Text className="text-[11px] text-slate-400">
                  Hiển thị {(safeProjectPage - 1) * PROJECT_PAGE_SIZE + 1} -{" "}
                  {Math.min(safeProjectPage * PROJECT_PAGE_SIZE, filteredProjects.length)} trong tổng số{" "}
                  {filteredProjects.length} dự án
                </Text>
              </div>
            )}
          </Card>
        </Col>

        {/* CỘT PHẢI: Thành viên tổ công tác & Duyệt tài liệu */}
        <Col xs={24} lg={17} className="!flex flex-col">
          {/* Card Dự án đang chọn */}
          <Card
            surface="workspace"
            padding="compact"
            className="shadow-sm h-full min-h-[720px] !flex-1 !flex flex-col [&_.ant-card-body]:!flex-1 [&_.ant-card-body]:!flex [&_.ant-card-body]:!flex-col"
          >
            {/* Thanh thông tin dự án */}
            <div className="pb-3 border-b border-slate-100">
              <div className="flex justify-between items-start gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-teal-700 font-semibold">{activeProject.code}</span>
                    <Tag className="!text-[10px] !m-0 !px-1.5">{activeProject.status || "Đang thi công"}</Tag>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 m-0 mt-0.5 leading-tight">
                    {activeProject.name}
                  </h3>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-2.5 flex-wrap">
                    <span>Người thực hiện chính: <strong className="text-slate-800">{mainExecutorStaff?.name || "—"}</strong></span>
                    <span>·</span>
                    <span>Người giám sát: <strong className="text-slate-800">{mainSupervisorStaff?.name || "—"}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hiển thị trực tiếp Cây sơ đồ nhân sự thực hiện */}
            <div className="pt-2 flex-1 min-h-[620px] flex flex-col">
              <ProjectPersonnelOrgChart
                project={activeProject}
                data={data}
                currentStaffId={currentStaffId}
                onOpenTaskDetail={(assignment) => setDetailAssignment(assignment)}
                onCreateTask={
                  onCreateTask
                    ? (pId, initLevel, dStage, pAssId, tId) => onCreateTask(pId)
                    : undefined
                }
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* 3. Drawer Thêm thành viên vào tổ công tác */}
      {addMemberModalOpen && activeProject && (
        <AddMemberDrawer
          open={addMemberModalOpen}
          project={activeProject}
          data={data}
          currentStaffName={currentStaff?.name}
          onClose={() => setAddMemberModalOpen(false)}
          onSubmit={async (staffIds) => {
            await controller.addProjectMembers(activeProject.id, staffIds);
            return true;
          }}
        />
      )}


      {/* 5. Modal Giao việc giai đoạn */}
      {taskModalOpen && (
        <AssignmentModal
          data={data}
          defaultProjectId={activeProject.id}
          allowedProjectIds={[activeProject.id]}
          onClose={() => setTaskModalOpen(false)}
          onCreate={async (input: AssignmentInput) => {
            const success = await controller.createAssignment(input);
            if (success) {
              setTaskModalOpen(false);
            }
            return success;
          }}
          onUpdate={async (id: string, input: AssignmentInput) => {
            const success = await controller.updateAssignment(id, input);
            if (success) {
              setTaskModalOpen(false);
            }
            return success;
          }}
          currentStaffId={currentStaffId || controller.currentUser?.id}
          isProjectLeader={controller.permissions.isProjectLeader}
          isTeamLeader={isLead || controller.permissions.isTeamLeader}
          leadingTeamId={leadTeam?.id || controller.permissions.leadingTeamId}
        />
      )}



      {/* 7. Drawer Chi tiết nhiệm vụ khi click vào công việc trên sơ đồ cây */}
      {detailAssignment && (
        <AssignmentDetailDrawer
          assignment={detailAssignment}
          controller={controller}
          onClose={() => setDetailAssignment(null)}
          onComplete={(completed) => {
            controller.completeAssignment(completed.id);
            setDetailAssignment(null);
          }}
        />
      )}
    </div>
  );
}
