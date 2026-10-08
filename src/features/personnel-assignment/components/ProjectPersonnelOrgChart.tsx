"use client";

import React, { useMemo, useState } from "react";
import {
  ApartmentOutlined,
  BankOutlined,
  DownOutlined,
  FilePdfOutlined,
  RightOutlined,
  SafetyCertificateOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from "@ant-design/icons";
import { Avatar, Tag, Tooltip } from "@/components/ui";
import { getInitials } from "@/utils/initials";
import {
  normalizeStageGroup,
  PROJECT_STAGE_META,
} from "../constants/personnel-labels";
import type {
  Assignment,
  PersonnelDataset,
  PersonnelProject,
  Staff,
  Team,
  TeamId,
} from "../types/personnel.types";

export interface ProjectPersonnelOrgChartProps {
  project: PersonnelProject;
  data: PersonnelDataset;
  currentStaffId?: string;
  onOpenTaskDetail?: (assignment: Assignment) => void;
  onCreateTask?: (
    projectId: string,
    initialLevel?: "PHASE_LEAD" | "TASK_MEMBER",
    defaultStage?: string,
    parentAssignmentId?: string,
    initialTeamId?: TeamId
  ) => void;
}

interface PhaseMemberNode {
  staff: Staff;
  team?: Team;
  roleType: "ASSIGNEE" | "MEMBER";
  tasks: Assignment[];
  isMe: boolean;
}

interface PhaseLeadNode {
  stageKey: string;
  stageName: string;
  stageLabel: string;
  stageColor: string;
  stageTagColor: string;
  team?: Team;
  leadStaff?: Staff;
  phaseAssignment?: Assignment;
  members: PhaseMemberNode[];
  allTasks: Assignment[];
  isLeadMe: boolean;
}

export default function ProjectPersonnelOrgChart({
  project,
  data,
  currentStaffId,
  onOpenTaskDetail,
}: ProjectPersonnelOrgChartProps) {
  // Thu gọn / Mở rộng các nhánh giai đoạn
  const [collapsedStages, setCollapsedStages] = useState<Record<string, boolean>>({});

  // Kéo chuột cuộn mượt mà (Mouse drag pan)
  const treeContainerRef = React.useRef<HTMLDivElement>(null);
  const diagramRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [scrollTopState, setScrollTopState] = useState(0);

  // Điều khiển thu phóng (Zoom)
  const [zoom, setZoom] = useState<number>(1);

  // Chế độ hiển thị: Ngang (horizontal) hoặc Dọc (vertical)
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">("horizontal");

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest(".task-leaf-node") ||
      target.closest("input") ||
      target.closest(".ant-select") ||
      target.closest(".org-chart-toolbar")
    ) {
      return;
    }
    if (!treeContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - treeContainerRef.current.offsetLeft);
    setStartY(e.pageY - treeContainerRef.current.offsetTop);
    setScrollLeftState(treeContainerRef.current.scrollLeft);
    setScrollTopState(treeContainerRef.current.scrollTop);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !treeContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - treeContainerRef.current.offsetLeft;
    const y = e.pageY - treeContainerRef.current.offsetTop;
    const walkX = (x - startX) * 1.5;
    const walkY = (y - startY) * 1.5;
    treeContainerRef.current.scrollLeft = scrollLeftState - walkX;
    treeContainerRef.current.scrollTop = scrollTopState - walkY;
  };

  // Tham chiếu người dùng đã chủ động tùy chỉnh zoom
  const isManualZoomRef = React.useRef(false);

  const handleZoomIn = () => {
    isManualZoomRef.current = true;
    setZoom((prev) => Math.min(Math.round((prev + 0.1) * 10) / 10, 1.0));
  };

  const handleZoomOut = () => {
    isManualZoomRef.current = true;
    setZoom((prev) => Math.max(Math.round((prev - 0.1) * 10) / 10, 0.4));
  };

  const handleResetZoom = () => {
    isManualZoomRef.current = true;
    setZoom(1);
    if (treeContainerRef.current) {
      treeContainerRef.current.scrollLeft = 0;
      treeContainerRef.current.scrollTop = 0;
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        handleZoomIn();
      } else {
        handleZoomOut();
      }
    }
  };

  // 0. Ban Giám đốc BQL (Tầng cao nhất: Giao dự án & Ủy quyền điều hành)
  const directorStaff = useMemo(() => {
    return (
      data.staff.find((s) => s.id === "ST-001") ||
      data.staff.find((s) => s.roleCode === "ADMIN") ||
      data.staff.find((s) => s.title.toLowerCase().includes("giám đốc")) ||
      data.staff[0]
    );
  }, [data.staff]);

  // 1. Quản lý dự án (Project Manager / CNDA / Quyền CNDA)
  const cndaStaffId = project.actingDirectorId || project.mainExecutorId;
  const cndaStaff = useMemo(() => {
    return data.staff.find((s) => s.id === cndaStaffId);
  }, [cndaStaffId, data.staff]);

  const isCndaActing = Boolean(project.actingDirectorId && project.actingDirectorId === cndaStaffId);

  // 2. Cán bộ giám sát chính (Main Supervisor)
  const supervisorStaff = useMemo(() => {
    return data.staff.find((s) => s.id === project.mainSupervisorId);
  }, [project.mainSupervisorId, data.staff]);

  // 3. Phân tích các nhiệm vụ thuộc dự án này
  const projectAssignments = useMemo(() => {
    return data.assignments.filter((a) => a.projectId === project.id);
  }, [project.id, data.assignments]);

  // 4. Xây dựng danh sách Giai đoạn & Lead tổ (Level 2) và Thành viên do Lead chọn (Level 3)
  const phaseLeadNodes = useMemo<PhaseLeadNode[]>(() => {
    // Thu thập các giai đoạn xuất hiện trong dự án
    const phaseAssignments = projectAssignments.filter(
      (a) => a.assignmentLevel === "PHASE_LEAD" || a.assignedByRole === "PROJECT_LEAD"
    );

    // Tập hợp các stage keys
    const stageKeyMap = new Map<string, { phaseAssignment?: Assignment; tasks: Assignment[] }>();

    // Đưa các phase lead assignments vào trước
    phaseAssignments.forEach((pa) => {
      const stageKey = normalizeStageGroup(pa.stage, pa.stepCode) || "VI";
      if (!stageKeyMap.has(stageKey)) {
        stageKeyMap.set(stageKey, { phaseAssignment: pa, tasks: [] });
      } else {
        const existing = stageKeyMap.get(stageKey)!;
        if (!existing.phaseAssignment) existing.phaseAssignment = pa;
      }
    });

    // Gom các tasks chi tiết vào các stage tương ứng
    projectAssignments.forEach((a) => {
      // Bỏ qua chính phase assignment nếu đã xếp
      const stageKey = normalizeStageGroup(a.stage, a.stepCode) || "VI";
      if (!stageKeyMap.has(stageKey)) {
        stageKeyMap.set(stageKey, { phaseAssignment: undefined, tasks: [a] });
      } else {
        const item = stageKeyMap.get(stageKey)!;
        if (item.phaseAssignment?.id !== a.id) {
          item.tasks.push(a);
        }
      }
    });

    const result: PhaseLeadNode[] = [];

    stageKeyMap.forEach(({ phaseAssignment, tasks }, stageKey) => {
      const meta = PROJECT_STAGE_META[stageKey] || {
        label: `Giai đoạn ${stageKey}`,
        fullName: phaseAssignment?.stepName || phaseAssignment?.title || "Giai đoạn thực hiện",
        tagColor: "#0284c7",
        color: "blue",
      };

      // Xác định Tổ chuyên môn phụ trách giai đoạn
      let teamId: TeamId | undefined = phaseAssignment?.teamId;
      if (!teamId && tasks.length > 0) {
        teamId = tasks.find((t) => t.teamId)?.teamId;
      }
      if (!teamId) {
        // Dự đoán theo giai đoạn: IV -> Bồi thường, VI -> GSKT, VII -> HCTH/GSKT
        teamId = stageKey === "IV" ? "BT" : stageKey === "VII" ? "HCTH" : "GSKT";
      }

      const team = data.teams.find((t) => t.id === teamId);

      // Xác định Lead tổ phụ trách giai đoạn
      let leadStaffId = phaseAssignment?.teamLeaderId || phaseAssignment?.assigneeId;
      if (!leadStaffId && team?.leaderId) {
        leadStaffId = team.leaderId;
      }
      // Nếu không có, tìm người có title Tổ trưởng trong team
      if (!leadStaffId && team) {
        const found = data.staff.find(
          (s) => s.teamId === team.id && s.title.toLowerCase().includes("tổ trưởng")
        );
        if (found) leadStaffId = found.id;
      }
      // Fallback supervisor
      if (!leadStaffId && supervisorStaff?.title.toLowerCase().includes("tổ trưởng")) {
        leadStaffId = supervisorStaff.id;
      }

      const leadStaff = data.staff.find((s) => s.id === leadStaffId);

      // Xây dựng danh sách cán bộ thực hiện do Lead phân công trong giai đoạn này (Level 3 - mỗi nhiệm vụ đúng 01 cán bộ)
      const memberMap = new Map<string, { role: "ASSIGNEE" | "MEMBER"; tasks: Assignment[] }>();

      // Duyệt qua tất cả tasks trong giai đoạn này (Lead giao cho đúng 01 người thực hiện duy nhất)
      tasks.forEach((t) => {
        if (t.assigneeId) {
          if (!memberMap.has(t.assigneeId)) {
            memberMap.set(t.assigneeId, { role: "ASSIGNEE", tasks: [t] });
          } else {
            const m = memberMap.get(t.assigneeId)!;
            m.role = "ASSIGNEE";
            m.tasks.push(t);
          }
        }
      });

      // Nếu có cán bộ trong teamMembers thuộc cùng tổ mà chưa có việc, cũng đưa vào nếu là giai đoạn chính
      (project.teamMembers || []).forEach((tmId) => {
        const staffObj = data.staff.find((s) => s.id === tmId);
        if (
          staffObj &&
          staffObj.teamId === teamId &&
          staffObj.id !== leadStaffId &&
          staffObj.id !== cndaStaffId &&
          !memberMap.has(tmId)
        ) {
          // Chỉ thêm vào nếu giai đoạn này là giai đoạn chủ đạo
          if (tasks.length === 0 || stageKeyMap.size === 1) {
            memberMap.set(tmId, { role: "MEMBER", tasks: [] });
          }
        }
      });

      const memberNodes: PhaseMemberNode[] = [];
      memberMap.forEach(({ role, tasks: memberTasks }, sId) => {
        const staffObj = data.staff.find((s) => s.id === sId);
        if (staffObj) {
          memberNodes.push({
            staff: staffObj,
            team: data.teams.find((t) => t.id === staffObj.teamId),
            roleType: role,
            tasks: memberTasks,
            isMe: staffObj.id === currentStaffId,
          });
        }
      });

      // Sắp xếp: Bạn lên đầu, có việc lên trước
      memberNodes.sort((a, b) => {
        if (a.isMe && !b.isMe) return -1;
        if (!a.isMe && b.isMe) return 1;
        if (a.roleType === "ASSIGNEE" && b.roleType !== "ASSIGNEE") return -1;
        if (a.roleType !== "ASSIGNEE" && b.roleType === "ASSIGNEE") return 1;
        return b.tasks.length - a.tasks.length;
      });

      const isLeadMe = Boolean(leadStaff && leadStaff.id === currentStaffId);

      result.push({
        stageKey,
        stageName: meta.fullName,
        stageLabel: meta.label,
        stageColor: meta.color,
        stageTagColor: meta.tagColor,
        team,
        leadStaff,
        phaseAssignment,
        members: memberNodes,
        allTasks: tasks,
        isLeadMe,
      });
    });

    // Sắp xếp theo thứ tự La Mã I -> VII
    const romanOrder = ["I", "II", "III", "IV", "V", "VI", "VII"];
    result.sort((a, b) => {
      const idxA = romanOrder.indexOf(a.stageKey);
      const idxB = romanOrder.indexOf(b.stageKey);
      return (idxA >= 0 ? idxA : 99) - (idxB >= 0 ? idxB : 99);
    });

    return result;
  }, [
    projectAssignments,
    project,
    data.teams,
    data.staff,
    supervisorStaff,
    cndaStaffId,
    currentStaffId,
  ]);

  const filteredPhaseNodes = phaseLeadNodes;

  const fitToView = React.useCallback((minimumZoom = 0.65) => {
    const container = treeContainerRef.current;
    const diagram = diagramRef.current;
    if (!container || !diagram) return;

    const currentZoom = Number.parseFloat(window.getComputedStyle(diagram).zoom) || 1;
    const bounds = diagram.getBoundingClientRect();
    const naturalWidth = bounds.width / currentZoom;
    const naturalHeight = bounds.height / currentZoom;
    if (!naturalWidth || !naturalHeight) return;

    const availableWidth = Math.max(container.clientWidth - 48, 1);
    const availableHeight = Math.max(container.clientHeight - 80, 1);

    const widthRatio = availableWidth / naturalWidth;
    const heightRatio = availableHeight / naturalHeight;

    // Ở chế độ Dọc (vertical), sơ đồ phát triển theo chiều dọc và cuộn trang tự nhiên.
    // Nếu chiều rộng và chiều cao cơ bản vừa vặn, ưu tiên hiển thị chuẩn 100% (1.0).
    const fittedZoom = orientation === "vertical"
      ? Math.max(minimumZoom, Math.min(1.0, widthRatio, heightRatio >= 0.85 ? 1.0 : Math.max(0.85, heightRatio)))
      : Math.max(minimumZoom, Math.min(1.0, widthRatio, heightRatio));

    setZoom(Math.round(fittedZoom * 100) / 100);
    container.scrollTo({ left: 0, top: 0, behavior: "instant" });
  }, [orientation]);

  React.useLayoutEffect(() => {
    isManualZoomRef.current = false;
    fitToView();
  }, [fitToView, filteredPhaseNodes, collapsedStages, orientation, project.id]);

  React.useEffect(() => {
    const container = treeContainerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      if (!isManualZoomRef.current) {
        fitToView();
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [fitToView]);

  // Thao tác thu gọn / mở rộng
  const toggleStageCollapse = (stageKey: string) => {
    setCollapsedStages((prev) => ({
      ...prev,
      [stageKey]: !prev[stageKey],
    }));
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    phaseLeadNodes.forEach((p) => {
      next[p.stageKey] = true;
    });
    setCollapsedStages(next);
  };

  const expandAll = () => {
    setCollapsedStages({});
  };

  return (
    <div className="flex-1 min-h-[600px] flex flex-col">
      {/* ── BẢN ĐỒ CÂY PHÂN CẤP NHÂN SỰ HÀNG NGANG (HORIZONTAL TREE) ─────────────── */}
      <div className="relative flex-1 min-h-[560px] flex flex-col">
        {/* Khung sơ đồ */}
        <div
          ref={treeContainerRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onWheel={handleWheel}
          className={`flex-1 min-h-[540px] overflow-auto select-none relative ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          style={{ scrollBehavior: isDragging ? "auto" : "smooth" }}
        >
          {filteredPhaseNodes.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs w-full">
              Chưa có giai đoạn hoặc cán bộ nào trong sơ đồ.
            </div>
          ) : (
            <div className="flex flex-col w-max min-w-full min-h-full items-center justify-center py-4 px-6 gap-2.5">
              {orientation === "horizontal" ? (
                <div
                  ref={diagramRef}
                  style={{
                    zoom: zoom,
                  }}
                  className="inline-flex items-center min-w-max py-2 px-2 gap-0"
                >
                {/* ════════════════════════════════════════════════════════════════
                    CỘT 1: BAN GIÁM ĐỐC BQL ĐTXD (CẤP QUYẾT ĐỊNH & GIAO DỰ ÁN)
                   ════════════════════════════════════════════════════════════════ */}
                <div className="flex flex-col items-center justify-center shrink-0">
                  <div className="w-[230px] min-w-[230px] min-h-[62px] flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white border-2 border-indigo-200 shadow-xs hover:border-indigo-400 transition-all">
                    <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                      <BankOutlined />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-xs text-slate-900 truncate" title={directorStaff?.name}>
                          {directorStaff?.name || "Huỳnh Thái Hải"}
                        </span>
                        <Tag color="indigo" className="!text-[9px] !m-0 !px-1 font-bold shrink-0">
                          BGD
                        </Tag>
                        {directorStaff?.id === currentStaffId && (
                          <Tag color="success" className="!text-[9px] !m-0 !px-1 font-bold shrink-0">
                            Bạn
                          </Tag>
                        )}
                      </div>
                      <div className="text-[11px] text-indigo-900 font-medium mt-0.5 truncate">
                        Giám đốc Ban Quản lý ĐTXD
                      </div>
                    </div>
                  </div>
                </div>

                {/* Đường nối ngang từ BGD sang CNDA */}
                <div className="w-8 h-[2px] bg-slate-300 shrink-0 relative">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 absolute -top-[3px] -right-1 ring-2 ring-white" />
                </div>

                {/* ════════════════════════════════════════════════════════════════
                    CỘT 2: ĐIỀU HÀNH DỰ ÁN (CNDA & NGƯỜI GIÁM SÁT CHÍNH)
                   ════════════════════════════════════════════════════════════════ */}
                <div className="flex flex-col gap-2.5 justify-center shrink-0">
                  {/* Node Chủ nhiệm dự án (CNDA) */}
                  <div className="w-[230px] min-w-[230px] min-h-[62px] flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white border-2 border-teal-300 shadow-xs hover:border-teal-500 transition-all">
                    <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                      <ApartmentOutlined />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-xs text-slate-900 truncate" title={cndaStaff?.name}>
                          {cndaStaff?.name || "Chưa giao CNDA"}
                        </span>
                        <Tag color="cyan" className="!text-[9px] !m-0 !px-1 font-bold shrink-0">
                          {isCndaActing ? "Quyền CNDA" : "CNDA"}
                        </Tag>
                        {cndaStaff?.id === currentStaffId && (
                          <Tag color="success" className="!text-[9px] !m-0 !px-1 font-bold shrink-0">
                            Bạn
                          </Tag>
                        )}
                      </div>
                      <div className="text-[11px] text-teal-800 font-medium mt-0.5 truncate">
                        Chủ nhiệm DA · {phaseLeadNodes.length} giai đoạn
                      </div>
                    </div>
                  </div>

                  {/* Node Giám sát chính nếu có */}
                  {supervisorStaff && supervisorStaff.id !== cndaStaffId && (
                    <div className="w-[230px] min-w-[230px] flex items-center justify-between px-3 py-1.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <SafetyCertificateOutlined className="text-blue-600 shrink-0 text-sm" />
                        <span className="font-bold text-slate-800 text-xs truncate" title={supervisorStaff.name}>
                          {supervisorStaff.name}
                        </span>
                        <span className="text-[10px] text-blue-700 font-medium shrink-0">(Giám sát)</span>
                      </div>
                      {supervisorStaff.id === currentStaffId && (
                        <Tag color="success" className="!text-[9px] !m-0 !px-1 font-bold shrink-0">
                          Bạn
                        </Tag>
                      )}
                    </div>
                  )}
                </div>

                {/* Đường nối ngang từ CNDA sang các nhánh Giai đoạn */}
                <div className="w-8 h-[2px] bg-slate-300 shrink-0 relative">
                  <div className="w-2 h-2 rounded-full bg-teal-600 absolute -top-[3px] -right-1 ring-2 ring-white" />
                </div>

              {/* ════════════════════════════════════════════════════════════════
                  CỘT 3 & 4: CÁC GIAI ĐOẠN (LEAD TỔ) ➔ CÁN BỘ THỰC HIỆN ➔ NHIỆM VỤ
                 ════════════════════════════════════════════════════════════════ */}
              <div className={`flex flex-col relative shrink-0 ${
                filteredPhaseNodes.length <= 2 ? "gap-10" : filteredPhaseNodes.length <= 4 ? "gap-6" : "gap-3"
              }`}>
                {/* Đường bus dọc kết nối các nhánh Giai đoạn nếu có nhiều hơn 1 giai đoạn */}
                {filteredPhaseNodes.length > 1 && (
                  <div
                    className="absolute left-0 w-[2px] bg-slate-300"
                    style={{
                      top: "26px",
                      bottom: "26px",
                    }}
                  />
                )}

                {filteredPhaseNodes.map((phaseNode) => {
                  const isCollapsed = Boolean(collapsedStages[phaseNode.stageKey]);

                  return (
                    <div key={phaseNode.stageKey} className="flex items-center gap-0 relative">
                      {/* Đường nối ngang từ bus dọc vào node Giai đoạn */}
                      {filteredPhaseNodes.length > 1 && (
                        <div className="w-6 h-[2px] bg-slate-300 shrink-0" />
                      )}

                      {/* ────────────────────────────────────────────────────
                          NODE GIAI ĐOẠN & LEAD TỔ
                         ──────────────────────────────────────────────────── */}
                      <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white border border-purple-200 shadow-2xs hover:border-purple-400 transition-all min-w-[195px] shrink-0">
                        <div
                          className="w-7 h-7 rounded-lg text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs"
                          style={{ backgroundColor: phaseNode.stageTagColor }}
                        >
                          {phaseNode.stageKey}
                        </div>

                        <div className="min-w-0 flex-1 text-left">
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className="font-bold text-xs truncate max-w-[130px]"
                              style={{ color: phaseNode.stageTagColor }}
                              title={phaseNode.stageName}
                            >
                              {phaseNode.stageLabel}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleStageCollapse(phaseNode.stageKey)}
                              className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer shrink-0"
                              title={isCollapsed ? "Mở rộng" : "Thu gọn"}
                            >
                              {isCollapsed ? (
                                <RightOutlined className="text-[10px]" />
                              ) : (
                                <DownOutlined className="text-[10px]" />
                              )}
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                            <span className="font-semibold text-slate-800 truncate max-w-[100px]">
                              {phaseNode.leadStaff?.name || "Chưa có Lead"}
                            </span>
                            <Tag color="purple" className="!text-[8px] !m-0 !px-1 shrink-0">
                              Lead tổ
                            </Tag>
                            {phaseNode.isLeadMe && (
                              <Tag color="success" className="!text-[8px] !m-0 !px-1 font-bold shrink-0">
                                Bạn
                              </Tag>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ────────────────────────────────────────────────────
                          CÁC NHÁNH CÁN BỘ THỰC HIỆN & NHIỆM VỤ CỤ THỂ
                         ──────────────────────────────────────────────────── */}
                      {!isCollapsed && (
                        <div className="flex items-center gap-0">
                          {/* Đường nối ngang từ Giai đoạn sang danh sách Cán bộ */}
                          <div className="w-6 h-[2px] bg-purple-300 shrink-0 relative">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 absolute -top-[2px] -right-1" />
                          </div>

                          {phaseNode.members.length === 0 ? (
                            <div className="px-3 py-1.5 rounded-lg bg-white border border-dashed border-slate-200 text-[11px] text-slate-400 italic shrink-0">
                              Chưa phân công cán bộ cho giai đoạn này
                            </div>
                          ) : (
                            <div className={`flex flex-col relative shrink-0 ${
                              phaseNode.members.length > 3 ? "gap-2" : "gap-3"
                            }`}>
                              {/* Đường bus dọc kết nối các cán bộ nếu có nhiều hơn 1 cán bộ */}
                              {phaseNode.members.length > 1 && (
                                <div
                                  className="absolute left-0 w-[2px] bg-purple-200"
                                  style={{
                                    top: "16px",
                                    bottom: "16px",
                                  }}
                                />
                              )}

                              {phaseNode.members.map((memberNode) => (
                                <div
                                  key={memberNode.staff.id}
                                  className="flex items-center gap-0 relative"
                                >
                                  {/* Đường nối ngang từ bus dọc vào node cán bộ */}
                                  {phaseNode.members.length > 1 && (
                                    <div className="w-5 h-[2px] bg-purple-200 shrink-0" />
                                  )}

                                  {/* Node Cán bộ thực hiện (1 người duy nhất) */}
                                  <div
                                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs shadow-2xs shrink-0 ${
                                      memberNode.isMe
                                        ? "bg-teal-50 border-teal-300 ring-1 ring-teal-200"
                                        : "bg-white border-slate-200 hover:border-slate-300"
                                    }`}
                                  >
                                    <Avatar
                                      size={22}
                                      className={`shrink-0 font-bold text-[9px] ${
                                        memberNode.isMe
                                          ? "!bg-teal-700 !text-white"
                                          : "!bg-slate-700 !text-white"
                                      }`}
                                    >
                                      {getInitials(memberNode.staff.name)}
                                    </Avatar>

                                    <div className="text-left">
                                      <div className="flex items-center gap-1">
                                        <span className="font-semibold text-slate-800 text-[11px]">
                                          {memberNode.staff.name}
                                        </span>
                                        {memberNode.isMe && (
                                          <Tag color="success" className="!text-[8px] !m-0 !px-1 font-bold">
                                            Bạn
                                          </Tag>
                                        )}
                                      </div>
                                    </div>

                                    <Tag color="cyan" className="!text-[8px] !m-0 !px-1 font-semibold">
                                      {memberNode.tasks.length} việc
                                    </Tag>
                                  </div>

                                  {/* ────────────────────────────────────────────────
                                      NHÁNH NHIỆM VỤ CỤ THỂ CỦA CÁN BỘ ĐÓ
                                     ──────────────────────────────────────────────── */}
                                  {memberNode.tasks.length > 0 ? (
                                    <div className="flex items-center gap-1.5 ml-2">
                                      <div className="w-4 h-[2px] bg-slate-300 shrink-0" />
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        {memberNode.tasks.map((task) => (
                                          <div
                                            key={task.id}
                                            onClick={() => onOpenTaskDetail?.(task)}
                                            className="task-leaf-node flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white hover:bg-teal-50/70 border border-slate-200 hover:border-teal-300 cursor-pointer text-[11px] transition-all shadow-2xs shrink-0 group max-w-[260px]"
                                            title={`Bấm để xem: ${task.title}`}
                                          >
                                            <div
                                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                task.status === "DONE"
                                                  ? "bg-emerald-500"
                                                  : task.status === "PENDING_APPROVAL"
                                                  ? "bg-amber-500"
                                                  : "bg-blue-500"
                                              }`}
                                            />
                                            <span className="font-medium text-slate-700 group-hover:text-teal-900 truncate">
                                              {task.title}
                                            </span>
                                            <Tag
                                              className="!text-[8px] !m-0 !px-1 shrink-0 font-normal"
                                              color={
                                                task.status === "DONE"
                                                  ? "success"
                                                  : task.status === "PENDING_APPROVAL"
                                                  ? "warning"
                                                  : "processing"
                                              }
                                            >
                                              {task.status === "DONE"
                                                ? "Xong"
                                                : task.status === "PENDING_APPROVAL"
                                                ? "Chờ duyệt"
                                                : "Đang làm"}
                                            </Tag>
                                            {task.submissions && task.submissions.length > 0 && (
                                              <span className="text-[9px] text-rose-600 font-medium shrink-0 flex items-center gap-0.5">
                                                <FilePdfOutlined />
                                                {task.submissions.length}
                                              </span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-[10px] text-slate-400 italic pl-3 shrink-0">
                                      (Chưa giao việc cụ thể)
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                </div>
              </div>
            ) : (
              /* ════════════════════════════════════════════════════════════════
                  CHẾ ĐỘ DỌC: PHÂN CẤP TỪ TRÊN XUỐNG DƯỚI (VERTICAL TREE)
                 ════════════════════════════════════════════════════════════════ */
              <div
                ref={diagramRef}
                style={{
                  zoom: zoom,
                }}
                className="inline-flex flex-col items-center min-w-max py-2 px-6 gap-0"
              >
                {/* ────────────────────────────────────────────────────────────
                    TẦNG 1: BAN GIÁM ĐỐC BQL ĐTXD
                   ──────────────────────────────────────────────────────────── */}
                <div className="flex flex-col items-center justify-center shrink-0">
                  <div className="w-[230px] min-w-[230px] min-h-[62px] flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white border-2 border-indigo-200 shadow-xs hover:border-indigo-400 transition-all">
                    <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                      <BankOutlined />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-xs text-slate-900 truncate" title={directorStaff?.name}>
                          {directorStaff?.name || "Huỳnh Thái Hải"}
                        </span>
                        <Tag color="indigo" className="!text-[9px] !m-0 !px-1 font-bold shrink-0">
                          BGD
                        </Tag>
                        {directorStaff?.id === currentStaffId && (
                          <Tag color="success" className="!text-[9px] !m-0 !px-1 font-bold shrink-0">
                            Bạn
                          </Tag>
                        )}
                      </div>
                      <div className="text-[11px] text-indigo-900 font-medium mt-0.5 truncate">
                        Giám đốc Ban Quản lý ĐTXD
                      </div>
                    </div>
                  </div>
                </div>

                {/* Đường nối dọc từ BGD xuống CNDA */}
                <div className="w-[2px] h-6 bg-slate-300 relative shrink-0">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 absolute -bottom-1 -left-[3px] ring-2 ring-white" />
                </div>

                {/* ────────────────────────────────────────────────────────────
                    TẦNG 2: ĐIỀU HÀNH DỰ ÁN (CNDA & GIÁM SÁT)
                   ──────────────────────────────────────────────────────────── */}
                <div className="flex items-center justify-center gap-3 shrink-0">
                  {/* Node Chủ nhiệm dự án (CNDA) */}
                  <div className="w-[230px] min-w-[230px] min-h-[62px] flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white border-2 border-teal-300 shadow-xs hover:border-teal-500 transition-all">
                    <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                      <ApartmentOutlined />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-xs text-slate-900 truncate" title={cndaStaff?.name}>
                          {cndaStaff?.name || "Chưa giao CNDA"}
                        </span>
                        <Tag color="cyan" className="!text-[9px] !m-0 !px-1 font-bold shrink-0">
                          {isCndaActing ? "Quyền CNDA" : "CNDA"}
                        </Tag>
                        {cndaStaff?.id === currentStaffId && (
                          <Tag color="success" className="!text-[9px] !m-0 !px-1 font-bold shrink-0">
                            Bạn
                          </Tag>
                        )}
                      </div>
                      <div className="text-[11px] text-teal-800 font-medium mt-0.5 truncate">
                        Chủ nhiệm DA · {phaseLeadNodes.length} giai đoạn
                      </div>
                    </div>
                  </div>

                  {/* Node Giám sát chính nếu có */}
                  {supervisorStaff && supervisorStaff.id !== cndaStaffId && (
                    <div className="w-[220px] min-w-[220px] min-h-[62px] flex items-center justify-between px-3.5 py-2 rounded-xl bg-blue-50/80 border border-blue-200 text-xs shadow-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                          <SafetyCertificateOutlined />
                        </div>
                        <div className="text-left min-w-0">
                          <div className="font-bold text-slate-800 text-xs truncate" title={supervisorStaff.name}>
                            {supervisorStaff.name}
                          </div>
                          <div className="text-[10px] text-blue-700 font-medium mt-0.5">
                            Cán bộ giám sát chính
                          </div>
                        </div>
                      </div>
                      {supervisorStaff.id === currentStaffId && (
                        <Tag color="success" className="!text-[9px] !m-0 !px-1 font-bold shrink-0">
                          Bạn
                        </Tag>
                      )}
                    </div>
                  )}
                </div>

                {/* Đường nối dọc từ CNDA xuống các nhánh Giai đoạn */}
                <div className="w-[2px] h-6 bg-slate-300 relative shrink-0">
                  <div className="w-2 h-2 rounded-full bg-teal-600 absolute -bottom-1 -left-[3px] ring-2 ring-white" />
                </div>

                {/* ────────────────────────────────────────────────────────────
                    TẦNG 3: CÁC GIAI ĐOẠN ➔ THÀNH VIÊN ➔ NHIỆM VỤ THEO CỘT
                   ──────────────────────────────────────────────────────────── */}
                <div className="flex items-start justify-center relative shrink-0">
                  {filteredPhaseNodes.map((phaseNode, idx) => {
                    const isCollapsed = Boolean(collapsedStages[phaseNode.stageKey]);

                    return (
                      <div key={phaseNode.stageKey} className="flex flex-col items-center relative px-3">
                        {/* Nhánh bus ngang kết nối */}
                        {filteredPhaseNodes.length > 1 && (
                          <>
                            {idx > 0 && (
                              <div className="absolute top-0 left-0 right-1/2 h-[2px] bg-slate-300" />
                            )}
                            {idx < filteredPhaseNodes.length - 1 && (
                              <div className="absolute top-0 left-1/2 right-0 h-[2px] bg-slate-300" />
                            )}
                            <div className="w-[2px] h-4 bg-slate-300 shrink-0" />
                          </>
                        )}

                        {/* Node Giai đoạn & Lead tổ */}
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-purple-200 shadow-2xs hover:border-purple-400 transition-all min-w-[210px] max-w-[230px] shrink-0">
                          <div
                            className="w-7 h-7 rounded-lg text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs"
                            style={{ backgroundColor: phaseNode.stageTagColor }}
                          >
                            {phaseNode.stageKey}
                          </div>

                          <div className="min-w-0 flex-1 text-left">
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className="font-bold text-xs truncate max-w-[130px]"
                                style={{ color: phaseNode.stageTagColor }}
                                title={phaseNode.stageName}
                              >
                                {phaseNode.stageLabel}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleStageCollapse(phaseNode.stageKey)}
                                className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer shrink-0"
                                title={isCollapsed ? "Mở rộng" : "Thu gọn"}
                              >
                                {isCollapsed ? (
                                  <RightOutlined className="text-[10px]" />
                                ) : (
                                  <DownOutlined className="text-[10px]" />
                                )}
                              </button>
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                              <span className="font-semibold text-slate-800 truncate max-w-[100px]">
                                {phaseNode.leadStaff?.name || "Chưa có Lead"}
                              </span>
                              <Tag color="purple" className="!text-[8px] !m-0 !px-1 shrink-0">
                                Lead tổ
                              </Tag>
                              {phaseNode.isLeadMe && (
                                <Tag color="success" className="!text-[8px] !m-0 !px-1 font-bold shrink-0">
                                  Bạn
                                </Tag>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Các thành viên & nhiệm vụ dưới giai đoạn */}
                        {!isCollapsed && (
                          <div className="flex flex-col items-center w-full">
                            {/* Đường nối dọc xuống thành viên */}
                            <div className="w-[2px] h-4 bg-purple-300 relative shrink-0">
                              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 absolute -bottom-1 -left-[2px]" />
                            </div>

                            {phaseNode.members.length === 0 ? (
                              <div className="px-3 py-1.5 rounded-lg bg-white border border-dashed border-slate-200 text-[11px] text-slate-400 italic shrink-0">
                                Chưa phân công cán bộ
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2.5 items-center shrink-0 w-full min-w-[230px]">
                                {phaseNode.members.map((memberNode) => (
                                  <div
                                    key={memberNode.staff.id}
                                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-slate-50/70 border border-slate-200/90 shadow-2xs w-full"
                                  >
                                    {/* Thẻ Cán bộ */}
                                    <div
                                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs shadow-2xs w-full ${
                                        memberNode.isMe
                                          ? "bg-teal-50 border-teal-300 ring-1 ring-teal-200"
                                          : "bg-white border-slate-200"
                                      }`}
                                    >
                                      <Avatar
                                        size={20}
                                        className={`shrink-0 font-bold text-[9px] ${
                                          memberNode.isMe ? "!bg-teal-700 !text-white" : "!bg-slate-700 !text-white"
                                        }`}
                                      >
                                        {getInitials(memberNode.staff.name)}
                                      </Avatar>
                                      <span className="font-semibold text-slate-800 text-[11px] truncate flex-1 text-left">
                                        {memberNode.staff.name}
                                      </span>
                                      {memberNode.isMe && (
                                        <Tag color="success" className="!text-[8px] !m-0 !px-1 font-bold">
                                          Bạn
                                        </Tag>
                                      )}
                                      <Tag color="cyan" className="!text-[8px] !m-0 !px-1 font-semibold">
                                        {memberNode.tasks.length} việc
                                      </Tag>
                                    </div>

                                    {/* Danh sách nhiệm vụ */}
                                    {memberNode.tasks.length > 0 && (
                                      <div className="flex flex-col gap-1 w-full pl-2 border-l-2 border-slate-200">
                                        {memberNode.tasks.map((task) => (
                                          <div
                                            key={task.id}
                                            onClick={() => onOpenTaskDetail?.(task)}
                                            className="task-leaf-node flex items-center justify-between gap-1.5 px-2 py-1 rounded bg-white hover:bg-teal-50/80 border border-slate-200 hover:border-teal-300 cursor-pointer text-[10px] transition-all shadow-2xs group w-full"
                                            title={`Bấm để xem: ${task.title}`}
                                          >
                                            <div className="flex items-center gap-1 min-w-0">
                                              <div
                                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                  task.status === "DONE"
                                                    ? "bg-emerald-500"
                                                    : task.status === "PENDING_APPROVAL"
                                                    ? "bg-amber-500"
                                                    : "bg-blue-500"
                                                }`}
                                              />
                                              <span className="font-medium text-slate-700 group-hover:text-teal-900 truncate">
                                                {task.title}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                              <Tag
                                                className="!text-[8px] !m-0 !px-1 font-normal"
                                                color={
                                                  task.status === "DONE"
                                                    ? "success"
                                                    : task.status === "PENDING_APPROVAL"
                                                    ? "warning"
                                                    : "processing"
                                                }
                                              >
                                                {task.status === "DONE"
                                                  ? "Xong"
                                                  : task.status === "PENDING_APPROVAL"
                                                  ? "Chờ duyệt"
                                                  : "Đang làm"}
                                              </Tag>
                                              {task.submissions && task.submissions.length > 0 && (
                                                <span className="text-[9px] text-rose-600 font-medium flex items-center gap-0.5">
                                                  <FilePdfOutlined />
                                                  {task.submissions.length}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cụm nút phóng to / thu nhỏ & chuyển chế độ Ngang / Dọc nằm ngay sát dưới sơ đồ */}
            <div className="org-chart-toolbar inline-flex items-center gap-1.5 bg-white border border-slate-200/90 rounded-lg p-0.5 shadow-2xs select-none">
              {/* Nhóm phóng to / thu nhỏ */}
              <div className="flex items-center gap-0.5">
                <Tooltip title="Thu nhỏ (Ctrl + Cuộn chuột xuống)">
                  <button
                    type="button"
                    disabled={zoom <= 0.4}
                    onClick={handleZoomOut}
                    className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
                      zoom <= 0.4
                        ? "text-slate-300 cursor-not-allowed"
                        : "hover:bg-slate-100 text-slate-600 cursor-pointer"
                    }`}
                  >
                    <ZoomOutOutlined className="text-[11px]" />
                  </button>
                </Tooltip>

                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="text-[11px] font-semibold text-slate-700 hover:text-teal-700 px-1.5 py-0.5 rounded hover:bg-slate-100 cursor-pointer transition-colors min-w-[38px] text-center"
                  title="Đặt lại tỉ lệ 100%"
                >
                  {Math.round(zoom * 100)}%
                </button>

                <Tooltip title={zoom >= 1 ? "Đã đạt tối đa 100%" : "Phóng to (Ctrl + Cuộn chuột lên)"}>
                  <button
                    type="button"
                    disabled={zoom >= 1}
                    onClick={handleZoomIn}
                    className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
                      zoom >= 1
                        ? "text-slate-300 cursor-not-allowed"
                        : "hover:bg-slate-100 text-slate-600 cursor-pointer"
                    }`}
                  >
                    <ZoomInOutlined className="text-[11px]" />
                  </button>
                </Tooltip>
              </div>

              <div className="w-[1px] h-3.5 bg-slate-200" />

              {/* Chuyển chế độ Ngang / Dọc */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-md gap-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    isManualZoomRef.current = false;
                    setOrientation("horizontal");
                  }}
                  className={`px-2 py-0.5 rounded font-semibold cursor-pointer transition-all ${
                    orientation === "horizontal"
                      ? "bg-white text-teal-800 shadow-2xs"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                  title="Sơ đồ cây theo chiều ngang (Trái sang Phải)"
                >
                  Ngang
                </button>
                <button
                  type="button"
                  onClick={() => {
                    isManualZoomRef.current = false;
                    setOrientation("vertical");
                  }}
                  className={`px-2 py-0.5 rounded font-semibold cursor-pointer transition-all ${
                    orientation === "vertical"
                      ? "bg-white text-teal-800 shadow-2xs"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                  title="Sơ đồ cây theo chiều dọc (Trên xuống Dưới)"
                >
                  Dọc
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}
