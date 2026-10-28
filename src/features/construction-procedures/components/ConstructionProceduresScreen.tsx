"use client";

import React, { useEffect, useMemo, useState } from "react";
import { App } from "antd";
import {
  AlertFilled,
  BranchesOutlined,
  CheckCircleFilled,
  CheckOutlined,
  CloseOutlined,
  HistoryOutlined,
  HourglassOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { Button, Input, Modal, Select, Tag, toast } from "@/components/ui";
import { INITIAL_PROCEDURE_PROJECTS } from "../constants/procedure-mock-data";
import {
  getTemplateSteps,
  loadCustomProfiles,
  type CustomProcedureProfile,
} from "../constants/procedure-templates";
import {
  getDepartmentStaff,
  isDirectorUser,
  isLeadOfDepartment,
  isSameDepartment,
  DEPARTMENT_PROCEDURE_TEMPLATES,
} from "../constants/procedure-department-templates";
import type {
  DepartmentProcedureStatus,
  DirectorApprovalStatus,
  ProcedureDocument,
  ProcedureFilterStatus,
  ProcedureHistoryLog,
  ProcedureStep,
  ProcedureViewMode,
  ProjectProcedureData,
} from "../types/procedure.types";
import ProcedureFilterToolbar from "./ProcedureFilterToolbar";
import ProcedureStepList from "./ProcedureStepList";
import CompleteStepModal from "./CompleteStepModal";
import ProcedureHistoryPanel from "./ProcedureHistoryPanel";
import ProcedureLibraryTab from "./ProcedureLibraryTab";
import ProcedureStageProgressChart from "./ProcedureStageProgressChart";
import { getWorkSteps } from "../utils/procedure-rules";
import { PROCEDURE_PROJECTS_STORAGE_KEY } from "../utils/project-procedure-storage";
import ProcedureStepDetailDrawer, { type ProcedureStepInfoPatch } from "./ProcedureStepDetailDrawer";
import SkipStepModal from "./SkipStepModal";
import StepConfigModal from "./StepConfigModal";
import { useAuth } from "@/features/auth";
import { useProjectStore } from "@/stores/project.store";
import { canUserDo, getUserEffectivePermissions, hasMatrixPermission } from "@/access-control";

const PROCEDURE_MAPPINGS_STORAGE_KEY = "cipm_project_procedures_map_v6";
// Nhật ký chỉnh sửa danh mục quy trình (tab "Quy trình")
const PROCEDURE_LIBRARY_HISTORY_STORAGE_KEY = "cipm_procedure_library_history";

/**
 * Quyết định nghiệm thu / yêu cầu rà soát của BGĐ gắn theo mã giai đoạn (I, II...).
 * Khi bộ bước của một giai đoạn thay đổi (đổi quy trình, thêm / xóa bước) thì quyết định cũ không còn đúng → bỏ đi.
 */
function pruneStageApprovals(
  approvals: ProjectProcedureData["stageApprovals"],
  oldSteps: ProcedureStep[],
  newSteps: ProcedureStep[],
): ProjectProcedureData["stageApprovals"] {
  if (!approvals) return approvals;
  const stepIdsOf = (steps: ProcedureStep[], group: string) =>
    steps
      .filter((s) => s.groupCode === group)
      .map((s) => s.id)
      .sort()
      .join("|");
  return Object.fromEntries(
    Object.entries(approvals).filter(
      ([group]) => stepIdsOf(oldSteps, group) !== "" && stepIdsOf(oldSteps, group) === stepIdsOf(newSteps, group),
    ),
  );
}

export default function ConstructionProceduresScreen() {
  const { user } = useAuth();
  const sharedProjects = useProjectStore((s) => s.projects);

  // 1. Quản lý trạng thái dữ liệu quy trình các dự án
  const [projectsData, setProjectsData] = useState<ProjectProcedureData[]>(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("cipm_procedure_projects_data");
        localStorage.removeItem("cipm_project_procedures_map");
        localStorage.removeItem("cipm_procedure_projects_data_v2");
        localStorage.removeItem("cipm_project_procedures_map_v2");
        localStorage.removeItem("cipm_procedure_projects_data_v3");
        localStorage.removeItem("cipm_project_procedures_map_v3");
        localStorage.removeItem("cipm_procedure_projects_data_v4");
        localStorage.removeItem("cipm_project_procedures_map_v4");
        localStorage.removeItem("cipm_procedure_projects_data_v5");
        localStorage.removeItem("cipm_project_procedures_map_v5");
        localStorage.removeItem("cipm_custom_procedure_profiles");
        const saved = localStorage.getItem(PROCEDURE_PROJECTS_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error("Error loading procedure projects data", e);
      }
    }
    return INITIAL_PROCEDURE_PROJECTS;
  });
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    return INITIAL_PROCEDURE_PROJECTS[0]?.projectId || "";
  });

  // Tự động lưu dữ liệu quy trình vào localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(PROCEDURE_PROJECTS_STORAGE_KEY, JSON.stringify(projectsData));
      } catch (e) {
        console.error("Failed to save procedure projects data", e);
      }
    }
  }, [projectsData]);

  // Đồng bộ với các dự án mới tạo từ store dùng chung
  const mergedProjectsData = useMemo<ProjectProcedureData[]>(() => {
    const projectsDataMap = new Map<string, ProjectProcedureData>();
    projectsData.forEach((p) => {
      if (p.projectId) projectsDataMap.set(p.projectId, p);
      if (p.projectCode) projectsDataMap.set(p.projectCode, p);
    });

    if (!sharedProjects || sharedProjects.length === 0) {
      return projectsData;
    }

    const merged = sharedProjects.map((sp): ProjectProcedureData => {
      const existing = projectsDataMap.get(sp.id) || (sp.code ? projectsDataMap.get(sp.code) : undefined);
      if (existing) {
        // Giữ trọn vẹn danh sách bước thủ tục đã cấu hình và lưu
        const currentSteps = existing.steps || [];
        const stepDepts = Array.from(
          new Set(currentSteps.map((s) => s.department).filter(Boolean) as string[])
        );
        return {
          ...existing,
          projectId: sp.id,
          projectCode: sp.code,
          projectName: sp.name,
          projectType: sp.type,
          totalInvestment: sp.totalInvestment,
          managerName: sp.managerName,
          supervisorName: sp.supervisorName,
          startDate: sp.startDate,
          expectedFinishDate: sp.endDatePlanned || sp.startDate,
          departments:
            sp.departments && sp.departments.length > 0
              ? sp.departments
              : existing.departments && existing.departments.length > 0
              ? existing.departments
              : stepDepts.length > 0
              ? stepDepts
              : ["Tổ Giám sát – Kỹ thuật"],
          departmentStatuses: existing.departmentStatuses || {},
          directorApproval: existing.directorApproval || { status: "PENDING" },
          stageApprovals: existing.stageApprovals || {},
          steps: currentSteps,
          history: existing.history || [],
        };
      }
      return {
        projectId: sp.id,
        projectCode: sp.code,
        projectName: sp.name,
        projectType: sp.type,
        totalInvestment: sp.totalInvestment,
        managerName: sp.managerName,
        supervisorName: sp.supervisorName,
        startDate: sp.startDate,
        expectedFinishDate: sp.endDatePlanned || sp.startDate,
        departments:
          sp.departments && sp.departments.length > 0
            ? sp.departments
            : ["Tổ Giám sát – Kỹ thuật"],
        departmentStatuses: {},
        directorApproval: { status: "PENDING" },
        stageApprovals: {},
        // Dự án mới chưa có quy trình: chờ chọn quy trình khi cấu hình
        steps: [],
        history: [],
      };
    });

    // Giữ lại các dự án mẫu nếu sharedProjects chưa có
    projectsData.forEach((p) => {
      if (!merged.some((m) => m.projectId === p.projectId || m.projectCode === p.projectCode)) {
        merged.push(p);
      }
    });

    return merged;
  }, [projectsData, sharedProjects]);

  // Lấy dữ liệu dự án đang chọn
  const currentProject = useMemo(() => {
    if (selectedProjectId) {
      const found = mergedProjectsData.find((p) => p.projectId === selectedProjectId);
      if (found) return found;
    }
    return mergedProjectsData[0];
  }, [mergedProjectsData, selectedProjectId]);

  // Đảm bảo selectedProjectId luôn khớp với currentProject
  useEffect(() => {
    if (!selectedProjectId && currentProject?.projectId) {
      setSelectedProjectId(currentProject.projectId);
    }
  }, [selectedProjectId, currentProject]);

  // Phân quyền theo nghiệp vụ chuyên biệt dựa trên Ma trận phân quyền
  const permissions = getUserEffectivePermissions(user);
  const userName = (user?.displayName || user?.name || "").trim().toLowerCase();
  const operatorName = user?.displayName || user?.name || "Cán bộ quản lý";
  const operatorRole = user?.roleName || "Cán bộ Ban QLDA";

  const isDirector = isDirectorUser(user);
  const userDept = user?.department;
  const isLeadOfUserDept = Boolean(userDept && isLeadOfDepartment(user, userDept));

  const isProjectAssignee = Boolean(
    currentProject &&
      userName &&
      (currentProject.managerName?.toLowerCase() === userName ||
        currentProject.supervisorName?.toLowerCase() === userName)
  );

  const canViewProcedure =
    canUserDo(user, "m3_construction_procedures", "view") ||
    hasMatrixPermission(user, "m3.view");

  const canApproveProcedure =
    canUserDo(user, "m3_construction_procedures", "approve") ||
    hasMatrixPermission(user, "m3.approve_step");

  const canUpdateProcedure =
    canUserDo(user, "m3_construction_procedures", "input") ||
    hasMatrixPermission(user, "m3.update_step");

  const canConfigureProcedure =
    canUserDo(user, "m3_construction_procedures", "configure") ||
    hasMatrixPermission(user, "m3.config_template") ||
    canUpdateProcedure;

  // Quản lý quy trình được áp dụng cho từng dự án
  const [projectProcedures, setProjectProcedures] = useState<Record<string, string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(PROCEDURE_MAPPINGS_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error("Error loading procedure mappings", e);
      }
    }
    return {};
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(PROCEDURE_MAPPINGS_STORAGE_KEY, JSON.stringify(projectProcedures));
      } catch (e) {
        console.error("Failed to save project procedures mapping", e);
      }
    }
  }, [projectProcedures]);

  const [customProfiles, setCustomProfiles] = useState<CustomProcedureProfile[]>([]);

  // Đọc lại quy trình tự tạo (sau khi thêm / sửa / xóa trong hộp Cấu hình quy trình)
  const refreshProcedureProfiles = () => setCustomProfiles(loadCustomProfiles());

  useEffect(() => {
    refreshProcedureProfiles();
  }, []);

  const allProcedureProfiles = useMemo(() => {
    const customAsProfiles = customProfiles.map((cp) => ({
      id: cp.id,
      name: cp.name,
      shortName: cp.name,
      description: `Quy trình tùy chỉnh (${cp.steps.length} bước)`,
      stepCount: cp.steps.length,
      badge: `${cp.steps.length} bước`,
      tagColor: "purple" as const,
      isSystem: false,
      createSteps: () => cp.steps,
    }));
    // Quy trình thủ tục ĐTXD theo dự thảo + quy trình tùy chỉnh đã lưu
    const draftProfiles = Object.values(DEPARTMENT_PROCEDURE_TEMPLATES).map((tpl) => ({
      id: tpl.id,
      name: tpl.name,
      shortName: tpl.shortName,
      description: tpl.description,
      stepCount: getTemplateSteps(tpl).length,
      badge: tpl.badge,
      tagColor: tpl.tagColor === "red" ? ("slate" as const) : tpl.tagColor,
      isSystem: true,
      createSteps: () => getTemplateSteps(tpl),
    }));
    return [...draftProfiles, ...customAsProfiles];
  }, [customProfiles]);

  const selectedProcedureId =
    (currentProject && projectProcedures[currentProject.projectId]) || "";

  const handleSelectProcedure = (procedureId: string) => {
    if (!currentProject) return;
    const target = allProcedureProfiles.find((p) => p.id === procedureId);
    if (!target) return;

    setProjectProcedures((prev) => ({
      ...prev,
      [selectedProjectId]: procedureId,
    }));

    const newSteps = target.createSteps();
    const newLog: ProcedureHistoryLog = {
      id: `LOG-${Date.now()}`,
      stepId: newSteps[0]?.id || "PROC-CHANGE",
      stepCode: "QUY-TRINH",
      stepName: target.name,
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      performedBy: operatorName,
      role: operatorRole,
      action: "TOGGLE_STEP",
      actionLabel: "Đổi quy trình áp dụng",
      details: `Chuyển đổi sang áp dụng "${target.name}" (${target.stepCount} bước) cho dự án.`,
    };

    updateCurrentProjectState(newSteps, [newLog]);
  };

  // 2. Bộ lọc & chế độ xem
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<ProcedureFilterStatus>("ALL");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<ProcedureViewMode>("tree");

  // 3. Quản lý các Modal nghiệp vụ
  const [detailStep, setDetailStep] = useState<ProcedureStep | null>(null);
  const [activeStepForComplete, setActiveStepForComplete] =
    useState<ProcedureStep | null>(null);
  const [activeStepForSkip, setActiveStepForSkip] =
    useState<ProcedureStep | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const { modal } = App.useApp();
  // 2 tab trên cùng: danh mục quy trình / lịch sử thay đổi
  const [screenTab, setScreenTab] = useState<"procedures" | "history">("procedures");
  /** Đang xem trang chi tiết một quy trình (chiếm cả màn hình, ẩn thanh tab) */
  const [libraryDetailOpen, setLibraryDetailOpen] = useState(false);
  const [libraryHistory, setLibraryHistory] = useState<ProcedureHistoryLog[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(PROCEDURE_LIBRARY_HISTORY_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Lưu quy trình ở tab "Quy trình": ghi nhật ký + thông báo
  const handleSaveLibraryProcedure = (profileId: string, profileName: string, steps: ProcedureStep[]) => {
    const log: ProcedureHistoryLog = {
      id: `LOG-${Date.now()}`,
      stepId: profileId,
      stepCode: "QUY-TRINH",
      stepName: profileName,
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      performedBy: operatorName,
      role: operatorRole,
      action: "TOGGLE_STEP",
      actionLabel: "Cập nhật quy trình",
      details: `Lưu quy trình "${profileName}" (${steps.length} bước).`,
    };
    setLibraryHistory((prev) => {
      const next = [log, ...prev];
      try {
        localStorage.setItem(PROCEDURE_LIBRARY_HISTORY_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error("Failed to save procedure library history", e);
      }
      return next;
    });
    refreshProcedureProfiles();
    toast.success("Đã lưu quy trình", `Đã lưu quy trình "${profileName}" (${steps.length} bước).`);
  };

  // Lịch sử gộp: chỉnh sửa danh mục quy trình + thao tác trên thủ tục các dự án
  const historyProjects = useMemo<ProjectProcedureData[]>(
    () => [
      {
        projectId: "PROCEDURE-LIBRARY",
        projectCode: "QT",
        projectName: "Danh mục quy trình",
        projectType: "",
        totalInvestment: 0,
        managerName: "",
        supervisorName: "",
        startDate: "",
        expectedFinishDate: "",
        steps: [],
        history: libraryHistory,
      },
      ...mergedProjectsData,
    ],
    [libraryHistory, mergedProjectsData],
  );
  const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState<boolean>(false);
  const [isDirectorRejectModalOpen, setIsDirectorRejectModalOpen] = useState<boolean>(false);
  const [directorRejectReason, setDirectorRejectReason] = useState<string>("");
  const [directorRejectDept, setDirectorRejectDept] = useState<string>("ALL");
  const [directorRejectStageKey, setDirectorRejectStageKey] = useState<string>("");
  const [directorRejectStageTitle, setDirectorRejectStageTitle] = useState<string>("");

  // Đồng bộ trạng thái/phân công bước thủ tục sang Store nhân sự (Screen 5)
  const syncStepToPersonnelStore = (step: ProcedureStep, customStatus?: "DONE" | "IN_PROGRESS") => {
    if (!currentProject) return;
    try {
      if (typeof window !== "undefined") {
        const STORAGE_KEY = "cipm_personnel_test_flow_v9";
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed.assignments)) {
            const taskId = `AS-${currentProject.projectId}-${step.code}`;
            const existingIdx = parsed.assignments.findIndex(
              (a: any) => a.id === taskId || (a.projectId === currentProject.projectId && a.stepCode === step.code)
            );
            const teamId = (step.department || "").includes("Giám sát")
              ? "GSKT"
              : (step.department || "").includes("Kế hoạch")
              ? "KHKT"
              : (step.department || "").includes("Đấu thầu")
              ? "DT"
              : (step.department || "").includes("Bồi thường") || (step.department || "").includes("GPMB")
              ? "BT"
              : "HCTH";
            const taskStatus = customStatus || (step.status === "COMPLETED" ? "DONE" : "IN_PROGRESS");
            const assignmentObj = {
              id: taskId,
              title: step.name,
              projectId: currentProject.projectId,
              stepCode: step.code,
              assigneeId: step.assignedToId || undefined,
              teamId,
              assignedBy: step.assignedBy || `${operatorName} (Tổ trưởng)`,
              assignedAt: step.assignedAt || new Date().toISOString().slice(0, 10),
              dueDate: step.endDatePlanned || "2026-12-31",
              status: taskStatus,
              priority: step.type === "MANDATORY" ? "HIGH" : "NORMAL",
              assignmentLevel: "TASK_MEMBER",
            };
            if (existingIdx >= 0) {
              parsed.assignments[existingIdx] = {
                ...parsed.assignments[existingIdx],
                ...assignmentObj,
              };
            } else if (step.assignedToId) {
              parsed.assignments.push(assignmentObj);
            }
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          }
        }
      }
    } catch (e) {
      console.error("Failed to sync step to personnel store", e);
    }
  };

  // Tiện ích cập nhật dự án hiện tại và thêm Log vĩnh viễn (Quy tắc 11)
  const updateCurrentProjectState = (
    newSteps: ProcedureStep[],
    newLogs: ProcedureHistoryLog[] = [],
    extraData?: Partial<ProjectProcedureData>
  ) => {
    if (!currentProject) return;
    setProjectsData((prev) => {
      const targetId = currentProject.projectId;
      const targetCode = currentProject.projectCode;
      const exists = prev.some((p) => p.projectId === targetId || (targetCode && p.projectId === targetCode));
      let next: ProjectProcedureData[];
      if (!exists) {
        next = [
          ...prev,
          {
            ...currentProject,
            ...extraData,
            stageApprovals:
              extraData?.stageApprovals ??
              pruneStageApprovals(currentProject.stageApprovals, currentProject.steps || [], newSteps),
            steps: newSteps,
            history: [...newLogs, ...(currentProject.history || [])],
          },
        ];
      } else {
        next = prev.map((proj) => {
          if (proj.projectId === targetId || (targetCode && proj.projectId === targetCode)) {
            return {
              ...proj,
              ...extraData,
              // Quyết định nghiệm thu truyền vào thì dùng luôn; còn lại bỏ quyết định của giai đoạn đã đổi bước
              stageApprovals:
                extraData?.stageApprovals ?? pruneStageApprovals(proj.stageApprovals, proj.steps || [], newSteps),
              steps: newSteps,
              history: [...newLogs, ...(proj.history || [])],
            };
          }
          return proj;
        });
      }
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(PROCEDURE_PROJECTS_STORAGE_KEY, JSON.stringify(next));
        } catch (e) {
          console.error("Failed to sync procedure data to storage", e);
        }
      }
      return next;
    });
  };

  // Danh sách các phòng ban tham gia dự án (chỉ lấy đúng các phòng ban được phân bổ trong dự án)
  // + các phòng ban đã có bước trong quy trình (VD: áp dụng quy trình mẫu của tổ khác) để lọc vẫn xem được
  const projectDepartments = useMemo(() => {
    const assigned = currentProject?.departments || [];
    const fromSteps = (currentProject?.steps || [])
      .map((s) => s.department)
      .filter((dept): dept is string => Boolean(dept));
    return [...assigned, ...fromSteps].filter(
      (dept, index, all) => all.findIndex((other) => isSameDepartment(other, dept)) === index,
    );
  }, [currentProject]);

  // Đảm bảo departmentFilter luôn chọn một phòng ban cụ thể trong project (bỏ hoàn toàn "ALL")
  useEffect(() => {
    if (projectDepartments.length > 0) {
      if (
        !departmentFilter ||
        departmentFilter === "ALL" ||
        !projectDepartments.some((dept) => isSameDepartment(dept, departmentFilter))
      ) {
        const defaultDept =
          userDept && projectDepartments.includes(userDept)
            ? userDept
            : projectDepartments[0];
        setDepartmentFilter(defaultDept);
      }
    } else {
      setDepartmentFilter("");
    }
  }, [departmentFilter, projectDepartments, userDept]);

  // Kiểm tra tiến độ hoàn thành các bước của phòng ban hiện tại của Lead
  const userDeptSteps = useMemo(() => {
    if (!currentProject?.steps || !userDept) return [];
    return getWorkSteps(currentProject.steps).filter(
      (s) => isSameDepartment(s.department, userDept) && s.isEnabled
    );
  }, [currentProject?.steps, userDept]);

  const allStepsInDeptDone = useMemo(() => {
    return (
      userDeptSteps.length > 0 &&
      userDeptSteps.every((s) => s.status === "COMPLETED" || s.status === "SKIPPED")
    );
  }, [userDeptSteps]);

  const isDeptCompletedByLead = Boolean(
    userDept && currentProject?.departmentStatuses?.[userDept]?.isCompletedByLead
  );

  // Danh sách các phòng ban đã được Tổ trưởng/Lead xác nhận hoàn thành
  const completedDepartments = useMemo(() => {
    if (!projectDepartments || projectDepartments.length === 0) return [];
    const statuses = currentProject?.departmentStatuses || {};
    return projectDepartments.filter((dept) => statuses[dept]?.isCompletedByLead);
  }, [projectDepartments, currentProject?.departmentStatuses]);

  const hasAnyDepartmentCompleted = completedDepartments.length > 0;

  // Kiểm tra điều kiện phê duyệt của Ban Giám đốc (Tất cả phòng ban đều hoàn thành)
  const allDepartmentsCompleted = useMemo(() => {
    if (!projectDepartments || projectDepartments.length === 0) return false;
    return completedDepartments.length === projectDepartments.length;
  }, [projectDepartments, completedDepartments]);

  const directorApprovalStatus =
    currentProject?.directorApproval?.status || "PENDING";

  // Danh sách các bước hiển thị sau khi lọc theo phòng ban (phân biệt độc lập từng tổ)
  const displayedSteps = useMemo(() => {
    if (!currentProject?.steps) return [];
    if (!departmentFilter) {
      return currentProject.steps;
    }
    // Bước chưa gán phòng ban (thêm từ "Cấu hình quy trình" chung của dự án) là bước chung → hiện ở mọi phòng ban
    return currentProject.steps.filter((s) => !s.department || isSameDepartment(s.department, departmentFilter));
  }, [currentProject?.steps, departmentFilter]);

  // Thao tác: Bắt đầu bước
  const handleStartStep = (stepId: string) => {
    if (!currentProject) return;
    const today = new Date().toISOString().slice(0, 10);
    const step = currentProject.steps.find((s) => s.id === stepId);
    if (!step) return;

    const newSteps = currentProject.steps.map((s) => {
      if (s.id === stepId) {
        return {
          ...s,
          status: "IN_PROGRESS" as const,
          actualStartDate: today,
        };
      }
      return s;
    });

    const newLog: ProcedureHistoryLog = {
      id: `LOG-${Date.now()}`,
      stepId: step.id,
      stepCode: step.code,
      stepName: step.name,
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      performedBy: operatorName,
      role: operatorRole,
      action: "START_STEP",
      actionLabel: "Khởi động bước",
      previousStatus: step.status,
      newStatus: "IN_PROGRESS",
      details: `Bắt đầu triển khai các công việc thuộc bước [${step.code}] ${step.name}.`,
    };

    updateCurrentProjectState(newSteps, [newLog]);
  };

  // Thao tác: Thành viên nộp hoặc Hoàn thành bước (Quy tắc 10: Ràng buộc hồ sơ)
  const handleConfirmComplete = (
    stepId: string,
    completionData: {
      actualEndDate: string;
      notes?: string;
      newDocument?: ProcedureDocument;
    }
  ) => {
    if (!currentProject) return;
    const step = currentProject.steps.find((s) => s.id === stepId);
    if (!step) return;

    const updatedAttachments = [...step.attachments];
    if (completionData.newDocument) {
      updatedAttachments.push(completionData.newDocument);
    }

    const isStepLead = Boolean(step.department && isLeadOfDepartment(user, step.department));
    // Bước đã bị từ chối khi nộp lại luôn phải chờ người có quyền xác nhận lại (kể cả lãnh đạo tự nộp)
    const isResubmission = step.submissionStatus === "REJECTED";
    const autoApprove = (isStepLead || canApproveProcedure) && !isResubmission;

    const newSteps = currentProject.steps.map((s) => {
      if (s.id === stepId) {
        if (autoApprove) {
          return {
            ...s,
            status: "COMPLETED" as const,
            submissionStatus: "APPROVED" as const,
            approvedBy: operatorName,
            approvedAt: completionData.actualEndDate,
            actualStartDate: s.actualStartDate || completionData.actualEndDate,
            actualEndDate: completionData.actualEndDate,
            attachments: updatedAttachments,
            notes: completionData.notes || s.notes,
          };
        }

        return {
          ...s,
          status: "IN_PROGRESS" as const,
          submissionStatus: "SUBMITTED" as const,
          submittedBy: operatorName,
          submittedAt: completionData.actualEndDate,
          submissionNote: completionData.notes || s.submissionNote,
          actualStartDate: s.actualStartDate || completionData.actualEndDate,
          actualEndDate: completionData.actualEndDate,
          attachments: updatedAttachments,
          notes: completionData.notes || s.notes,
        };
      }
      return s;
    });

    const isMemberSubmit = !autoApprove;
    const newLog: ProcedureHistoryLog = {
      id: `LOG-${Date.now()}`,
      stepId: step.id,
      stepCode: step.code,
      stepName: step.name,
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      performedBy: operatorName,
      role: operatorRole,
      action: isMemberSubmit ? "START_STEP" : "COMPLETE_STEP",
      actionLabel: isResubmission ? "Nộp lại sau khi bị từ chối" : isMemberSubmit ? "Xác nhận nộp duyệt" : "Hoàn thành bước",
      previousStatus: step.status,
      newStatus: isMemberSubmit ? "IN_PROGRESS" : "COMPLETED",
      documentReference:
        completionData.newDocument?.documentCode ||
        step.attachments[0]?.documentCode,
      details: isResubmission
        ? `${operatorName} đã chỉnh sửa theo ý kiến và nộp lại bước [${step.code}] ${step.name}, chờ người có quyền xác nhận.`
        : isMemberSubmit
        ? `Thành viên ${operatorName} đã hoàn thành công việc và gửi xác nhận nộp bước [${step.code}] ${step.name} chờ Tổ trưởng duyệt.`
        : `Xác nhận hoàn thành bước [${step.code}] ${step.name} ngày ${completionData.actualEndDate}. Đã kiểm tra đầy đủ hồ sơ văn bản đính kèm.`,
    };

    updateCurrentProjectState(newSteps, [newLog]);

    if (detailStep && detailStep.id === stepId) {
      const updated = newSteps.find((s) => s.id === stepId);
      if (updated) {
        setDetailStep(updated);
      }
    }

    if (isMemberSubmit) {
      toast.success(
        isResubmission ? "Đã nộp lại" : "Đã gửi xác nhận hoàn thành",
        isResubmission
          ? `Đã nộp lại bước [${step.code}] ${step.name}, chờ xác nhận.`
          : `Đã nộp kết quả thực hiện bước [${step.code}] ${step.name} cho Tổ trưởng phê duyệt.`
      );
    } else {
      toast.success(
        "Hoàn thành bước",
        `Bước [${step.code}] ${step.name} đã được phê duyệt hoàn thành!`
      );
    }
  };

  // Thao tác: Bỏ qua bước (Quy tắc 7: Bắt buộc lý do bằng văn bản)
  const handleConfirmSkip = (
    stepId: string,
    skipData: {
      reason: string;
      skipDocumentCode: string;
      skipIssuer: string;
    }
  ) => {
    if (!currentProject) return;
    const step = currentProject.steps.find((s) => s.id === stepId);
    if (!step) return;

    // Chỉ bước điều kiện mới được bỏ qua (kể cả đã nộp / đã duyệt); bước bắt buộc thì không
    if (step.type !== "CONDITIONAL") {
      toast.warning("Không thể bỏ qua bước", "Bước bắt buộc không được bỏ qua.");
      return;
    }

    const skipDoc: ProcedureDocument = {
      id: `DOC-SKIP-${Date.now()}`,
      documentCode: skipData.skipDocumentCode,
      title: `Văn bản căn cứ bỏ qua bước: ${skipData.reason.slice(0, 50)}...`,
      issuer: skipData.skipIssuer,
      issueDate: new Date().toISOString().slice(0, 10),
      fileName: `${skipData.skipDocumentCode.replace(/[\/\\:]/g, "-")}.pdf`,
      fileSize: "1.1 MB",
      uploadedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      uploadedBy: operatorName,
      fileType: "pdf",
    };

    const newSteps = currentProject.steps.map((s) => {
      if (s.id === stepId) {
        return {
          ...s,
          status: "SKIPPED" as const,
          submissionStatus: undefined,
          skipReason: skipData.reason,
          skipDocumentCode: skipData.skipDocumentCode,
          skipIssuer: skipData.skipIssuer,
          attachments: [skipDoc, ...s.attachments],
        };
      }
      return s;
    });

    const newLog: ProcedureHistoryLog = {
      id: `LOG-${Date.now()}`,
      stepId: step.id,
      stepCode: step.code,
      stepName: step.name,
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      performedBy: operatorName,
      role: operatorRole,
      action: "SKIP_STEP",
      actionLabel: "Đánh dấu Bỏ qua (Quy tắc 7)",
      previousStatus: step.status,
      newStatus: "SKIPPED",
      reason: skipData.reason,
      skipDocumentCode: skipData.skipDocumentCode,
      details: `Đánh dấu bỏ qua bước [${step.code}] ${step.name} căn cứ theo Văn bản ${skipData.skipDocumentCode} của ${skipData.skipIssuer}. Lý do: ${skipData.reason}`,
    };

    updateCurrentProjectState(newSteps, [newLog]);
    toast.success(
      "Đã ghi nhận bỏ qua bước",
      `Bước [${step.code}] ${step.name} đã được đánh dấu bỏ qua theo Quy tắc 7.`
    );
  };

  // Thao tác: Lead giao việc cho thành viên
  const handleAssignMember = (stepId: string, memberName: string) => {
    if (!currentProject) return;
    const step = currentProject.steps.find((s) => s.id === stepId);
    if (!step) return;

    const staffList = getDepartmentStaff(step.department || currentProject.departments?.[0] || "");
    const memberObj = staffList.find((s) => s.name === memberName);
    const today = new Date().toISOString().slice(0, 10);
    const newSteps = currentProject.steps.map((s) => {
      if (s.id === stepId) {
        return {
          ...s,
          assignedTo: memberName,
          assignedToId: memberObj?.id,
          assignedBy: operatorName,
          assignedAt: today,
        };
      }
      return s;
    });

    const newLog: ProcedureHistoryLog = {
      id: `LOG-${Date.now()}`,
      stepId: step.id,
      stepCode: step.code,
      stepName: step.name,
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      performedBy: operatorName,
      role: operatorRole,
      action: "START_STEP",
      actionLabel: "Phân công người thực hiện",
      details: `Phân công cán bộ ${memberName} phụ trách thực hiện bước [${step.code}] ${step.name}.`,
    };

    updateCurrentProjectState(newSteps, [newLog]);

    const updatedStep = newSteps.find((s) => s.id === stepId);
    if (updatedStep) {
      syncStepToPersonnelStore(updatedStep, "IN_PROGRESS");
    }

    if (detailStep && detailStep.id === stepId) {
      setDetailStep({
        ...detailStep,
        assignedTo: memberName,
        assignedToId: memberObj?.id,
        assignedBy: operatorName,
        assignedAt: today,
      });
    }

    toast.success("Phân công nhiệm vụ", `Đã giao bước [${step.code}] cho ${memberName}!`);
  };

  // Thao tác: Lead duyệt hoàn thành bước
  const handleApproveStep = (stepId: string) => {
    if (!currentProject) return;
    const step = currentProject.steps.find((s) => s.id === stepId);
    if (!step) return;

    const today = new Date().toISOString().slice(0, 10);
    const newSteps = currentProject.steps.map((s) => {
      if (s.id === stepId) {
        return {
          ...s,
          status: "COMPLETED" as const,
          submissionStatus: "APPROVED" as const,
          approvedBy: operatorName,
          approvedAt: today,
          actualEndDate: s.actualEndDate || today,
        };
      }
      return s;
    });

    const newLog: ProcedureHistoryLog = {
      id: `LOG-${Date.now()}`,
      stepId: step.id,
      stepCode: step.code,
      stepName: step.name,
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      performedBy: operatorName,
      role: operatorRole,
      action: "COMPLETE_STEP",
      actionLabel: "Tổ trưởng duyệt bước",
      previousStatus: step.status,
      newStatus: "COMPLETED",
      details: `Tổ trưởng ${operatorName} đã phê duyệt hoàn thành bước [${step.code}] ${step.name} của nhân sự ${step.assignedTo || "cán bộ"}.`,
    };

    updateCurrentProjectState(newSteps, [newLog]);

    const approvedStep = newSteps.find((s) => s.id === stepId);
    if (approvedStep) {
      syncStepToPersonnelStore(approvedStep, "DONE");
    }

    if (detailStep && detailStep.id === stepId) {
      setDetailStep({
        ...detailStep,
        status: "COMPLETED",
        submissionStatus: "APPROVED",
        approvedBy: operatorName,
        approvedAt: today,
      });
    }

    toast.success("Đã phê duyệt", `Tổ trưởng đã duyệt hoàn thành bước [${step.code}] ${step.name}!`);
  };

  // Thao tác: Lead từ chối bước (yêu cầu sửa đổi)
  const handleRejectStep = (stepId: string, reason: string) => {
    if (!currentProject) return;
    const step = currentProject.steps.find((s) => s.id === stepId);
    if (!step) return;

    const newSteps = currentProject.steps.map((s) => {
      if (s.id === stepId) {
        return {
          ...s,
          status: "IN_PROGRESS" as const,
          submissionStatus: "REJECTED" as const,
          rejectionReason: reason,
        };
      }
      return s;
    });

    // Giai đoạn chứa bước bị từ chối không còn được coi là đã duyệt → khi nộp lại sẽ phải duyệt lại giai đoạn
    const remainingStageApprovals = Object.fromEntries(
      Object.entries(currentProject.stageApprovals || {}).filter(
        ([key]) => key !== step.groupCode && key !== step.groupTitle,
      ),
    );

    const newLog: ProcedureHistoryLog = {
      id: `LOG-${Date.now()}`,
      stepId: step.id,
      stepCode: step.code,
      stepName: step.name,
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      performedBy: operatorName,
      role: operatorRole,
      action: "START_STEP",
      actionLabel: "Từ chối kết quả bước",
      previousStatus: step.status,
      newStatus: "IN_PROGRESS",
      reason,
      details: `${operatorName} (${operatorRole}) từ chối kết quả bước [${step.code}] ${step.name}, trả về để thực hiện lại.`,
    };

    updateCurrentProjectState(newSteps, [newLog], { stageApprovals: remainingStageApprovals });

    const rejectedStep = newSteps.find((s) => s.id === stepId);
    if (rejectedStep) {
      syncStepToPersonnelStore(rejectedStep, "IN_PROGRESS");
    }

    if (detailStep && detailStep.id === stepId) {
      setDetailStep({
        ...detailStep,
        status: "IN_PROGRESS",
        submissionStatus: "REJECTED",
        rejectionReason: reason,
      });
    }

    toast.warning("Đã từ chối duyệt", `Yêu cầu chỉnh sửa bước [${step.code}] đã gửi cho nhân sự thực hiện.`);
  };


  // Thao tác: Lead xác nhận hoàn thành toàn bộ quy trình của phòng ban
  const handleConfirmDepartmentComplete = (deptName: string) => {
    if (!currentProject) return;

    const deptSteps = getWorkSteps(currentProject.steps).filter(
      (s) => isSameDepartment(s.department, deptName) && s.isEnabled
    );
    const incomplete = deptSteps.filter(
      (s) => s.status !== "COMPLETED" && s.status !== "SKIPPED"
    );

    if (incomplete.length > 0) {
      toast.error(
        "Chưa hoàn thành",
        `Phòng ban còn ${incomplete.length} bước chưa hoàn tất. Vui lòng hoàn thành tất cả các bước trước khi xác nhận!`
      );
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const updatedStatuses: Record<string, DepartmentProcedureStatus> = {
      ...(currentProject.departmentStatuses || {}),
      [deptName]: {
        department: deptName,
        isCompletedByLead: true,
        confirmedBy: operatorName,
        confirmedAt: today,
      },
    };

    const newLog: ProcedureHistoryLog = {
      id: `LOG-${Date.now()}`,
      stepId: "DEPT-COMPLETE",
      stepCode: "HOAN-THANH-PB",
      stepName: `Xác nhận hoàn thành ${deptName}`,
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      performedBy: operatorName,
      role: operatorRole,
      action: "COMPLETE_STEP",
      actionLabel: "Xác nhận hoàn thành phòng ban",
      details: `Tổ trưởng ${operatorName} đã xác nhận hoàn thành toàn bộ các bước thủ tục chuyên môn của ${deptName}.`,
    };

    updateCurrentProjectState(currentProject.steps, [newLog], {
      departmentStatuses: updatedStatuses,
    });

    toast.success(
      "Xác nhận hoàn thành",
      `Tổ trưởng đã xác nhận hoàn thành toàn bộ quy trình của ${deptName}!`
    );
  };

  // Thao tác: Lead duyệt giai đoạn
  const handleLeadApproveStage = (stageCode: string, stageTitle: string) => {
    if (!currentProject) return;
    const today = new Date().toISOString().slice(0, 10);

    const newSteps = currentProject.steps.map((s) => {
      const inThisStage = s.groupCode === stageCode || s.groupTitle === stageTitle;
      if (inThisStage && (s.submissionStatus === "SUBMITTED" || (s.status !== "COMPLETED" && s.status !== "SKIPPED"))) {
        return {
          ...s,
          status: "COMPLETED" as const,
          submissionStatus: "APPROVED" as const,
          approvedBy: operatorName,
          approvedAt: today,
          actualEndDate: s.actualEndDate || today,
        };
      }
      return s;
    });

    const targetDept = userDept || "Tổ chuyên môn";
    const updatedStatuses: Record<string, DepartmentProcedureStatus> = {
      ...(currentProject.departmentStatuses || {}),
      [targetDept]: {
        department: targetDept,
        isCompletedByLead: true,
        confirmedBy: operatorName,
        confirmedAt: today,
        note: `Tổ trưởng đã duyệt giai đoạn [${stageTitle}]`,
      },
    };

    const newLog: ProcedureHistoryLog = {
      id: `LOG-${Date.now()}`,
      stepId: `LEAD-APPROVE-${stageCode}`,
      stepCode: "LEAD-DUYET",
      stepName: `Tổ trưởng duyệt giai đoạn: ${stageTitle}`,
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      performedBy: operatorName,
      role: operatorRole,
      action: "COMPLETE_STEP",
      actionLabel: "Tổ trưởng duyệt giai đoạn",
      details: `Tổ trưởng ${operatorName} (${targetDept}) đã phê duyệt hoàn thành giai đoạn [${stageTitle}].`,
    };

    updateCurrentProjectState(newSteps, [newLog], {
      departmentStatuses: updatedStatuses,
    });

    toast.success(
      "Tổ trưởng đã duyệt",
      `Đã xác nhận hoàn thành giai đoạn [${stageTitle}]!`
    );
  };

  // Thao tác: Lead từ chối giai đoạn
  const handleLeadRejectStage = (stageCode: string, stageTitle: string, reason: string) => {
    if (!currentProject) return;

    const newSteps = currentProject.steps.map((s) => {
      const inThisStage = s.groupCode === stageCode || s.groupTitle === stageTitle;
      if (inThisStage) {
        return {
          ...s,
          status: "IN_PROGRESS" as const,
          submissionStatus: "REJECTED" as const,
          rejectionReason: reason,
        };
      }
      return s;
    });

    const targetDept = userDept || "Tổ chuyên môn";
    const updatedStatuses: Record<string, DepartmentProcedureStatus> = {
      ...(currentProject.departmentStatuses || {}),
      [targetDept]: {
        department: targetDept,
        isCompletedByLead: false,
        note: `Tổ trưởng từ chối giai đoạn: ${reason}`,
      },
    };

    const newLog: ProcedureHistoryLog = {
      id: `LOG-${Date.now()}`,
      stepId: `LEAD-REJECT-${stageCode}`,
      stepCode: "LEAD-TU-CHOI",
      stepName: `Tổ trưởng từ chối giai đoạn: ${stageTitle}`,
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      performedBy: operatorName,
      role: operatorRole,
      action: "START_STEP",
      actionLabel: "Tổ trưởng từ chối duyệt",
      details: `Tổ trưởng ${operatorName} (${targetDept}) đã từ chối giai đoạn [${stageTitle}]. Lý do: ${reason}`,
    };

    updateCurrentProjectState(newSteps, [newLog], {
      departmentStatuses: updatedStatuses,
    });

    toast.warning(
      "Đã từ chối giai đoạn",
      `Yêu cầu chỉnh sửa giai đoạn [${stageTitle}] đã được gửi lại cho các nhân sự phụ trách.`
    );
  };

  // Thao tác: Ban Giám đốc duyệt giai đoạn / quy trình dự án
  const handleDirectorApprove = (stageCode?: string, stageTitle?: string) => {
    if (!currentProject) return;
    const today = new Date().toISOString().slice(0, 10);

    const updatedApproval: DirectorApprovalStatus = {
      status: "APPROVED",
      approvedBy: operatorName,
      approvedAt: today,
      note: stageTitle ? `Đã nghiệm thu giai đoạn: ${stageTitle}` : undefined,
    };

    let updatedStageApprovals = { ...(currentProject.stageApprovals || {}) };
    if (stageCode || stageTitle) {
      const stageObj = {
        status: "APPROVED" as const,
        decidedBy: operatorName,
        decidedAt: today,
        note: `Đã nghiệm thu giai đoạn: ${stageTitle || stageCode}`,
      };
      if (stageCode) updatedStageApprovals[stageCode] = stageObj;
      if (stageTitle) updatedStageApprovals[stageTitle] = stageObj;
    }

    const isAll = allDepartmentsCompleted;
    const newLog: ProcedureHistoryLog = {
      id: `LOG-${Date.now()}`,
      stepId: stageCode ? `DIRECTOR-APPROVE-${stageCode}` : "DIRECTOR-APPROVE",
      stepCode: "BGĐ-DUYET",
      stepName: stageTitle
        ? `Nghiệm thu giai đoạn: ${stageTitle}`
        : isAll
        ? "Nghiệm thu toàn bộ quy trình dự án"
        : `Nghiệm thu quy trình phòng ban (${completedDepartments.join(", ")})`,
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      performedBy: operatorName,
      role: operatorRole,
      action: "COMPLETE_STEP",
      actionLabel: "Giám đốc phê duyệt",
      details: stageTitle
        ? `Ban Giám đốc (${operatorName}) đã phê duyệt nghiệm thu giai đoạn [${stageTitle}] của dự án ${currentProject.projectName}.`
        : isAll
        ? `Ban Giám đốc (${operatorName}) đã chính thức phê duyệt nghiệm thu toàn bộ quy trình thủ tục XDCB của dự án ${currentProject.projectName}.`
        : `Ban Giám đốc (${operatorName}) đã phê duyệt nghiệm thu tiến độ các phòng ban hoàn thành (${completedDepartments.join(", ")}) của dự án ${currentProject.projectName}.`,
    };

    // Duyệt giai đoạn: các bước đang chờ duyệt (VD vừa nộp lại) trong giai đoạn cũng được duyệt hoàn thành
    const stageSteps = currentProject.steps.map((s) => {
      const inStage = Boolean(stageCode || stageTitle) && (s.groupCode === stageCode || s.groupTitle === stageTitle);
      if (inStage && s.submissionStatus === "SUBMITTED") {
        return {
          ...s,
          status: "COMPLETED" as const,
          submissionStatus: "APPROVED" as const,
          approvedBy: operatorName,
          approvedAt: today,
          actualEndDate: s.actualEndDate || today,
        };
      }
      return s;
    });

    updateCurrentProjectState(stageSteps, [newLog], {
      directorApproval: updatedApproval,
      stageApprovals: updatedStageApprovals,
    });

    toast.success(
      "Ban Giám đốc đã phê duyệt",
      stageTitle
        ? `Đã phê duyệt nghiệm thu [${stageTitle}] thành công!`
        : isAll
        ? `Đã phê duyệt nghiệm thu toàn bộ quy trình thủ tục XDCB của dự án thành công!`
        : `Đã phê duyệt nghiệm thu tiến độ các phòng ban (${completedDepartments.join(", ")})!`
    );
  };

  // Thao tác: Ban Giám đốc từ chối duyệt quy trình dự án hoặc giai đoạn/phòng ban cụ thể
  const handleDirectorReject = (
    reason: string,
    targetDept: string = "ALL",
    stageKey?: string,
    stageTitle?: string
  ) => {
    if (!currentProject) return;
    const today = new Date().toISOString().slice(0, 10);

    const updatedApproval: DirectorApprovalStatus = {
      status: "REJECTED",
      rejectedBy: operatorName,
      rejectedAt: today,
      rejectionReason: stageTitle ? `[${stageTitle}]: ${reason}` : targetDept !== "ALL" ? `[${targetDept}]: ${reason}` : reason,
    };

    let updatedStageApprovals = { ...(currentProject.stageApprovals || {}) };
    if (stageKey || stageTitle) {
      const rejectObj = {
        status: "REJECTED" as const,
        decidedBy: operatorName,
        decidedAt: today,
        rejectionReason: reason,
        note: `Yêu cầu rà soát: ${reason}`,
      };
      if (stageKey) updatedStageApprovals[stageKey] = rejectObj;
      if (stageTitle) updatedStageApprovals[stageTitle] = rejectObj;
    }

    // Reset trạng thái xác nhận của phòng ban bị từ chối để Lead có thể chỉnh sửa và nộp lại
    const updatedStatuses = { ...(currentProject.departmentStatuses || {}) };
    if (targetDept !== "ALL" && updatedStatuses[targetDept]) {
      updatedStatuses[targetDept] = {
        ...updatedStatuses[targetDept],
        isCompletedByLead: false,
        note: `Ban Giám đốc yêu cầu chỉnh sửa: ${reason}`,
      };
    } else {
      for (const dept of completedDepartments) {
        if (updatedStatuses[dept]) {
          updatedStatuses[dept] = {
            ...updatedStatuses[dept],
            isCompletedByLead: false,
            note: `Ban Giám đốc yêu cầu chỉnh sửa: ${reason}`,
          };
        }
      }
    }

    const newLog: ProcedureHistoryLog = {
      id: `LOG-${Date.now()}`,
      stepId: stageKey ? `DIRECTOR-REJECT-${stageKey}` : "DIRECTOR-REJECT",
      stepCode: "BGĐ-TU-CHOI",
      stepName: stageTitle
        ? `Từ chối nghiệm thu giai đoạn: ${stageTitle}`
        : targetDept !== "ALL"
        ? `Từ chối nghiệm thu ${targetDept}`
        : "Từ chối nghiệm thu quy trình",
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      performedBy: operatorName,
      role: operatorRole,
      action: "START_STEP",
      actionLabel: "Giám đốc từ chối phê duyệt",
      details: stageTitle
        ? `Ban Giám đốc (${operatorName}) đã từ chối phê duyệt giai đoạn [${stageTitle}]. Lý do: ${reason}`
        : `Ban Giám đốc (${operatorName}) đã từ chối phê duyệt ${targetDept !== "ALL" ? targetDept : "toàn bộ quy trình"}. Lý do: ${reason}`,
    };

    updateCurrentProjectState(currentProject.steps, [newLog], {
      directorApproval: updatedApproval,
      departmentStatuses: updatedStatuses,
      stageApprovals: updatedStageApprovals,
    });

    setIsDirectorRejectModalOpen(false);
    setDirectorRejectReason("");
    setDirectorRejectDept("ALL");
    setDirectorRejectStageKey("");
    setDirectorRejectStageTitle("");
    toast.warning(
      "Ban Giám đốc từ chối duyệt",
      stageTitle
        ? `Đã gửi thông báo từ chối nghiệm thu giai đoạn [${stageTitle}] đến phòng ban phụ trách.`
        : `Đã gửi thông báo từ chối và yêu cầu bổ sung đến phòng ban phụ trách.`
    );
  };

  // Thao tác: Cấu hình quy trình (dành cho quản trị)
  const handleSaveConfig = (
    updatedSteps: ProcedureStep[],
    profileId?: string
  ) => {
    if (profileId) {
      setProjectProcedures((prev) => ({
        ...prev,
        [selectedProjectId]: profileId,
      }));
    }

    const targetProfile = allProcedureProfiles.find((p) => p.id === profileId);
    const profileName = targetProfile?.name || "Quy trình đã cấu hình";

    const newLog: ProcedureHistoryLog = {
      id: `LOG-${Date.now()}`,
      stepId: "ALL",
      stepCode: "CONFIG",
      stepName: profileName,
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      performedBy: operatorName,
      role: operatorRole,
      action: "TOGGLE_STEP",
      actionLabel: "Cập nhật cấu hình quy trình",
      details: `Cập nhật cấu hình các bước và thời gian thực hiện (${updatedSteps.length} bước) cho dự án.`,
    };

    updateCurrentProjectState(updatedSteps, [newLog]);
    refreshProcedureProfiles();

    // Phòng ban đang lọc không có bước nào của cấu hình vừa lưu → chuyển sang phòng ban có bước để thấy ngay
    const hasStepsInFilter = updatedSteps.some(
      (s) => !s.department || !departmentFilter || isSameDepartment(s.department, departmentFilter),
    );
    if (!hasStepsInFilter) {
      const firstDept = updatedSteps.find((s) => s.department)?.department;
      if (firstDept) setDepartmentFilter(firstDept);
    }
    toast.success("Cấu hình quy trình", "Đã lưu cấu hình quy trình dự án thành công!");
  };

  // Bấm "Lưu thay đổi" trong drawer chi tiết bước: lưu các trường đã sửa, ghi lịch sử "cũ → mới"
  const handleUpdateStepInfo = (stepId: string, patch: ProcedureStepInfoPatch) => {
    if (!currentProject) return;
    const step = currentProject.steps.find((s) => s.id === stepId);
    if (!step) return;

    const updatedStep: ProcedureStep = { ...step, ...patch };
    const newSteps = currentProject.steps.map((s) => (s.id === stepId ? updatedStep : s));

    const typeLabel = (t?: string) => (t === "MANDATORY" ? "Bắt buộc" : t === "CONDITIONAL" ? "Điều kiện" : "");
    const fmt = (iso?: string) => (iso ? iso.split("-").reverse().join("/") : "Trống");
    const changes = [
      patch.name !== undefined && patch.name !== step.name ? `Tên bước: ${step.name} → ${patch.name}` : null,
      patch.type !== undefined && patch.type !== step.type ? `Phân loại: ${typeLabel(step.type)} → ${typeLabel(patch.type)}` : null,
      "startDatePlanned" in patch && patch.startDatePlanned !== step.startDatePlanned
        ? `Bắt đầu kế hoạch: ${fmt(step.startDatePlanned)} → ${fmt(patch.startDatePlanned)}`
        : null,
      "endDatePlanned" in patch && patch.endDatePlanned !== step.endDatePlanned
        ? `Hạn kế hoạch: ${fmt(step.endDatePlanned)} → ${fmt(patch.endDatePlanned)}`
        : null,
    ].filter(Boolean);
    if (changes.length === 0) return;

    const newLog: ProcedureHistoryLog = {
      id: `LOG-${Date.now()}`,
      stepId: step.id,
      stepCode: step.code,
      stepName: updatedStep.name,
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      performedBy: operatorName,
      role: operatorRole,
      action: "CONFIG_DURATION",
      actionLabel: "Cập nhật thông tin bước",
      details: changes.join("; "),
    };

    updateCurrentProjectState(newSteps, [newLog]);
    if (detailStep && detailStep.id === stepId) setDetailStep(updatedStep);
    toast.success("Đã lưu thay đổi", `Đã lưu ${changes.length} thay đổi của bước [${step.code}].`);
  };

  // Thao tác: Thêm văn bản mới
  const handleAddDocument = (stepId: string, doc: ProcedureDocument) => {
    if (!currentProject) return;
    const step = currentProject.steps.find((s) => s.id === stepId);
    if (!step) return;

    const newSteps = currentProject.steps.map((s) => {
      if (s.id === stepId) {
        return {
          ...s,
          attachments: [doc, ...s.attachments],
        };
      }
      return s;
    });

    const newLog: ProcedureHistoryLog = {
      id: `LOG-${Date.now()}`,
      stepId: step.id,
      stepCode: step.code,
      stepName: step.name,
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      performedBy: operatorName,
      role: operatorRole,
      action: "ADD_DOCUMENT",
      actionLabel: "Thêm văn bản pháp lý",
      documentReference: doc.documentCode,
      details: `Đính kèm văn bản số [${doc.documentCode}] ${doc.title} do ${doc.issuer} ban hành.`,
    };

    updateCurrentProjectState(newSteps, [newLog]);

    if (detailStep && detailStep.id === stepId) {
      setDetailStep({
        ...detailStep,
        attachments: [doc, ...detailStep.attachments],
      });
    }
  };

  // Thao tác: Gỡ bỏ văn bản đính kèm
  const handleDeleteDocument = (stepId: string, docId: string) => {
    if (!currentProject) return;
    const step = currentProject.steps.find((s) => s.id === stepId);
    if (!step) return;

    const newSteps = currentProject.steps.map((s) => {
      if (s.id === stepId) {
        return {
          ...s,
          attachments: s.attachments.filter((d) => d.id !== docId),
        };
      }
      return s;
    });

    const newLog: ProcedureHistoryLog = {
      id: `LOG-${Date.now()}`,
      stepId: step.id,
      stepCode: step.code,
      stepName: step.name,
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      performedBy: operatorName,
      role: operatorRole,
      action: "REMOVE_DOCUMENT",
      actionLabel: "Gỡ bỏ văn bản pháp lý",
      details: `Đã gỡ bỏ văn bản khỏi bước [${step.code}].`,
    };

    updateCurrentProjectState(newSteps, [newLog]);

    if (detailStep && detailStep.id === stepId) {
      setDetailStep({
        ...detailStep,
        attachments: detailStep.attachments.filter((d) => d.id !== docId),
      });
    }

    toast.success("Xóa tài liệu", "Đã xóa tài liệu đính kèm.");
  };

  // ---- Mọi nút thao tác trên bước / giai đoạn đều hỏi xác nhận trước khi thực hiện ----
  const stepLabel = (stepId: string) => {
    const st = currentProject?.steps.find((s) => s.id === stepId);
    return st ? `[${st.code}] ${st.name}` : "";
  };
  const askConfirm = (title: string, content: React.ReactNode, okText: string, onOk: () => void) =>
    modal.confirm({
      centered: true,
      width: 460,
      title,
      content: <div className="text-xs leading-relaxed text-slate-600">{content}</div>,
      okText,
      cancelText: "Hủy",
      okButtonProps: { className: "!bg-[#DC2626] !border-[#DC2626] hover:!bg-[#B91C1C]" },
      onOk,
    });

  const confirmStartStep = (stepId: string) =>
    askConfirm(
      "Bắt đầu thực hiện bước?",
      <>
        Bắt đầu thực hiện bước <strong className="text-slate-800">{stepLabel(stepId)}</strong>?
      </>,
      "Bắt đầu",
      () => handleStartStep(stepId),
    );

  const confirmCompleteStep = (stepId: string) => {
    const isResubmit = currentProject?.steps.find((s) => s.id === stepId)?.submissionStatus === "REJECTED";
    askConfirm(
      isResubmit ? "Nộp lại bước?" : "Xác nhận hoàn thành bước?",
      <>
        {isResubmit ? "Nộp lại kết quả bước " : "Xác nhận đã hoàn thành bước "}
        <strong className="text-slate-800">{stepLabel(stepId)}</strong>?
      </>,
      isResubmit ? "Nộp lại" : "Xác nhận",
      () => handleConfirmComplete(stepId, { actualEndDate: new Date().toISOString().slice(0, 10) }),
    );
  };

  const confirmApproveStep = (stepId: string) =>
    askConfirm(
      "Duyệt bước?",
      <>
        Duyệt hoàn thành bước <strong className="text-slate-800">{stepLabel(stepId)}</strong>?
      </>,
      "Duyệt",
      () => handleApproveStep(stepId),
    );

  const confirmLeadApproveStage = (stageCode: string, stageTitle: string) =>
    askConfirm(
      "Xác nhận hoàn thành giai đoạn?",
      <>
        Xác nhận hoàn thành giai đoạn <strong className="text-slate-800">{stageTitle || stageCode}</strong>? Các bước đang
        chờ duyệt trong giai đoạn sẽ được duyệt hoàn thành.
      </>,
      "Xác nhận",
      () => handleLeadApproveStage(stageCode, stageTitle),
    );

  const confirmDirectorApproveStage = (stageCode: string, stageTitle: string) =>
    askConfirm(
      "Duyệt giai đoạn?",
      <>
        Duyệt giai đoạn <strong className="text-slate-800">{stageTitle || stageCode}</strong>? Các bước đang chờ duyệt
        trong giai đoạn cũng sẽ được duyệt hoàn thành.
      </>,
      "Duyệt",
      () => handleDirectorApprove(stageCode, stageTitle),
    );

  return (
    <section className="w-full max-w-[2560px] mx-auto space-y-3">
      {/* Tab nhỏ gọn: rộng vừa chữ, icon cùng hàng với chữ (đồng bộ các phân hệ); ẩn khi đang xem chi tiết quy trình */}
      {!libraryDetailOpen && (
      <div role="tablist" className="inline-flex gap-1 rounded-lg border border-slate-200 bg-slate-100/70 p-0.5">
        {(
          [
            { key: "procedures", icon: <BranchesOutlined />, label: "Quy trình" },
            { key: "history", icon: <HistoryOutlined />, label: "Lịch sử thay đổi" },
          ] as const
        ).map((tab) => {
          const active = screenTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setScreenTab(tab.key)}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors ${
                active ? "bg-white font-semibold text-slate-900 shadow-xs" : "font-medium text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className={active ? "text-[#DC2626]" : "text-slate-400"}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>
      )}

      {screenTab === "history" ? (
        <ProcedureHistoryPanel projects={historyProjects} />
      ) : !canConfigureProcedure ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-2xs">
          <p className="m-0 text-sm font-semibold text-slate-700">Bạn chưa có quyền cấu hình quy trình</p>
          <p className="m-0 mt-1 text-xs text-slate-400">Liên hệ quản trị để được cấp quyền cấu hình quy trình thủ tục.</p>
        </div>
      ) : (
        <ProcedureLibraryTab
          actorName={operatorName}
          onSaved={handleSaveLibraryProcedure}
          onDetailChange={setLibraryDetailOpen}
        />
      )}

      {/* Giao diện theo dõi thủ tục theo từng dự án (tạm ẩn khi thử giao diện danh mục quy trình) */}
      {false && (
        <>
          {/* 2. Banner Thông báo cho Lead nếu phòng ban đã xong hết bước nhưng chưa xác nhận */}
          <ProcedureFilterToolbar
            projects={mergedProjectsData}
            selectedProjectId={selectedProjectId}
            onSelectProject={setSelectedProjectId}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            departmentFilter={departmentFilter}
            onDepartmentFilterChange={setDepartmentFilter}
            availableDepartments={projectDepartments}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onOpenStepConfig={() => setIsConfigOpen(true)}
            onOpenAddDeptProcedure={() => setIsAddDeptModalOpen(true)}
            userDepartment={userDept}
            isLeadOfDept={isLeadOfUserDept}
            canConfirmDeptComplete={allStepsInDeptDone && !isDeptCompletedByLead}
            isDeptCompletedByLead={isDeptCompletedByLead}
            onConfirmDeptComplete={() => userDept && handleConfirmDepartmentComplete(userDept)}
            procedureProfiles={allProcedureProfiles}
            selectedProcedureId={selectedProcedureId}
            onSelectProcedure={handleSelectProcedure}
            canUpdateProcedure={canUpdateProcedure}
            canConfigureProcedure={canConfigureProcedure}
          />

          {/* 4. Danh sách các bước thủ tục */}
          <div className="pt-2 sm:pt-3">
            {!currentProject ? (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-2xs">
                <p className="text-sm font-semibold text-slate-700 m-0">Chưa có dự án nào trong hệ thống</p>
                <p className="text-xs text-slate-400 mt-1 mb-0">Vui lòng tạo dự án mới tại phân hệ Quản lý dự án để theo dõi quy trình thủ tục</p>
              </div>
            ) : viewMode === "chart" && displayedSteps.length > 0 ? (
              // Biểu đồ tiến độ: mỗi giai đoạn (I, II...) đã làm tới đâu
              <ProcedureStageProgressChart steps={displayedSteps} />
            ) : (
              <ProcedureStepList
                steps={displayedSteps}
                appliedProcedureName={allProcedureProfiles.find((p) => p.id === selectedProcedureId)?.name}
                searchTerm={searchTerm}
                statusFilter={statusFilter}
                viewMode={viewMode}
                onStartStep={confirmStartStep}
                onOpenCompleteModal={(step) => setActiveStepForComplete(step)}
                onConfirmCompleteStep={confirmCompleteStep}
                onOpenSkipModal={(step) => setActiveStepForSkip(step)}
                onOpenDetailStep={(step) => setDetailStep(step)}
                canUpdateProcedure={canUpdateProcedure}
                canConfigureProcedure={canConfigureProcedure}
                canApproveProcedure={canApproveProcedure}
                onOpenStepConfig={() => setIsConfigOpen(true)}
                onOpenAddDeptProcedure={() => setIsAddDeptModalOpen(true)}
                isLeadOfDept={isLeadOfUserDept}
                userDepartment={userDept}
                isDirector={canApproveProcedure}
                isDeptCompletedByLead={isDeptCompletedByLead}
                onAssignMember={handleAssignMember}
                onApproveStep={confirmApproveStep}
                onRejectStep={handleRejectStep}
                onLeadApproveStage={confirmLeadApproveStage}
                onLeadRejectStage={handleLeadRejectStage}
                stageApprovals={currentProject?.stageApprovals}
                onDirectorApproveStage={confirmDirectorApproveStage}
                onDirectorRejectStage={(stageCode, stageTitle) => {
                  setDirectorRejectStageKey(stageCode);
                  setDirectorRejectStageTitle(stageTitle);
                  setDirectorRejectDept(departmentFilter || "ALL");
                  setDirectorRejectReason(`Yêu cầu rà soát và hoàn thiện lại giai đoạn [${stageTitle}]`);
                  setIsDirectorRejectModalOpen(true);
                }}
              />
            )}
          </div>
        </>
      )}

      {/* 5. Modal Hoàn thành bước (Quy tắc 10) */}
      <CompleteStepModal
        open={Boolean(activeStepForComplete)}
        step={activeStepForComplete}
        onClose={() => setActiveStepForComplete(null)}
        onConfirmComplete={handleConfirmComplete}
      />

      {/* 6. Modal Bỏ qua bước (Quy tắc 7) */}
      <SkipStepModal
        open={Boolean(activeStepForSkip)}
        step={activeStepForSkip}
        onClose={() => setActiveStepForSkip(null)}
        onConfirmSkip={handleConfirmSkip}
      />

      {/* 7. Modal Cấu hình Bước Điều Kiện (BRD 4.3.1) */}
      {isConfigOpen && canConfigureProcedure && (
        <StepConfigModal
          open
          steps={currentProject?.steps || []}
          currentProcedureId={selectedProcedureId}
          projectName={currentProject?.projectName || "Dự án"}
          onClose={() => {
            setIsConfigOpen(false);
            refreshProcedureProfiles();
          }}
          onSaveConfig={handleSaveConfig}
        />
      )}

      {/* 10. Drawer Chi tiết bước thủ tục */}
      <ProcedureStepDetailDrawer
        step={detailStep}
        onUpdateStep={handleUpdateStepInfo}
        allSteps={currentProject?.steps || []}
        projectName={currentProject?.projectName || ""}
        open={Boolean(detailStep)}
        onClose={() => setDetailStep(null)}
        onStartStep={confirmStartStep}
        onOpenCompleteModal={(step) => {
          setDetailStep(null);
          setActiveStepForComplete(step);
        }}
        onConfirmCompleteStep={confirmCompleteStep}
        onOpenSkipModal={(step) => {
          setDetailStep(null);
          setActiveStepForSkip(step);
        }}
        canUpdateProcedure={canUpdateProcedure}
        onAssignMember={handleAssignMember}
        onApproveStep={confirmApproveStep}
        onRejectStep={handleRejectStep}
        onAddDocument={handleAddDocument}
        onDeleteDocument={handleDeleteDocument}
      />

      {/* 11. Modal Thêm / Cấu hình quy trình chuyên môn của Phòng ban (Dành cho Lead) */}
      {isAddDeptModalOpen && currentProject && (() => {
        const targetDept =
          departmentFilter && projectDepartments.includes(departmentFilter)
            ? departmentFilter
            : userDept && projectDepartments.includes(userDept)
            ? userDept
            : projectDepartments[0] || "Tổ Giám sát – Kỹ thuật";

        const deptSteps = (currentProject.steps || []).filter(
          (s) => isSameDepartment(s.department, targetDept)
        );

        return (
          <StepConfigModal
            open
            steps={deptSteps}
            currentProcedureId={selectedProcedureId}
            departmentTitle={targetDept}
            projectName={currentProject?.projectName || ""}
            onClose={() => {
              setIsAddDeptModalOpen(false);
              refreshProcedureProfiles();
            }}
            onSaveConfig={async (updatedSteps, profileId) => {
              if (!currentProject) return;
              const currentDepts = currentProject.departments || [];
              const updatedDepts = !currentDepts.some((d) => isSameDepartment(d, targetDept))
                ? [...currentDepts, targetDept]
                : currentDepts;
              const updatedStatuses: Record<string, DepartmentProcedureStatus> = {
                ...(currentProject.departmentStatuses || {}),
                [targetDept]: {
                  department: targetDept,
                  isCompletedByLead: false,
                },
              };

              const newLog: ProcedureHistoryLog = {
                id: `LOG-${Date.now()}`,
                stepId: "DEPT-CONFIG",
                stepCode: "THIET-LAP",
                stepName: `Quy trình ${targetDept}`,
                timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
                performedBy: operatorName,
                role: operatorRole,
                action: "TOGGLE_STEP",
                actionLabel: "Cấu hình quy trình phòng ban",
                details: `Tổ trưởng ${operatorName} đã cập nhật cấu hình quy trình (${updatedSteps.length} bước) cho ${targetDept}.`,
              };

              if (profileId) {
                setProjectProcedures((prev) => ({
                  ...prev,
                  [selectedProjectId]: profileId,
                }));
              }

              // Giữ lại các bước của các phòng ban khác trong cùng dự án (loại trừ đúng targetDept)
              const otherDeptsSteps = (currentProject.steps || []).filter(
                (s) => s.department && !isSameDepartment(s.department, targetDept)
              );
              // Gán chặt department và responsibleUnit cho các bước của targetDept
              const myDeptSteps = updatedSteps.map((s) => ({
                ...s,
                department: targetDept,
                responsibleUnit: s.responsibleUnit && s.responsibleUnit !== "Chủ đầu tư" ? s.responsibleUnit : targetDept,
              }));
              const finalAllSteps = [...otherDeptsSteps, ...myDeptSteps];

              updateCurrentProjectState(finalAllSteps, [newLog], {
                departments: updatedDepts,
                departmentStatuses: updatedStatuses,
              });

              // Đồng bộ các bước được giao cho nhân sự vào mockPersonnelRepository để phản ánh ngay trên Sơ đồ nhân sự (Screen 5)
              try {
                if (typeof window !== "undefined") {
                  const STORAGE_KEY = "cipm_personnel_test_flow_v9";
                  const stored = window.localStorage.getItem(STORAGE_KEY);
                  if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed.assignments)) {
                      const assignedSteps = myDeptSteps.filter((s) => Boolean(s.assignedToId));
                      for (const step of assignedSteps) {
                        const taskId = `AS-${currentProject.projectId}-${step.code}`;
                        const existingIdx = parsed.assignments.findIndex(
                          (a: any) => a.id === taskId || (a.projectId === currentProject.projectId && a.stepCode === step.code)
                        );
                        const teamId = (step.department || targetDept || "").includes("Giám sát")
                          ? "GSKT"
                          : (step.department || targetDept || "").includes("Kế hoạch")
                          ? "KHKT"
                          : (step.department || targetDept || "").includes("Đấu thầu")
                          ? "DT"
                          : (step.department || targetDept || "").includes("Bồi thường") || (step.department || targetDept || "").includes("GPMB")
                          ? "BT"
                          : "HCTH";
                        const assignmentObj = {
                          id: taskId,
                          title: step.name,
                          projectId: currentProject.projectId,
                          stepCode: step.code,
                          assigneeId: step.assignedToId,
                          teamId,
                          assignedBy: `${operatorName} (Tổ trưởng)`,
                          assignedAt: new Date().toISOString().slice(0, 10),
                          dueDate: "2026-12-31",
                          status: step.status === "COMPLETED" ? "DONE" : "IN_PROGRESS",
                          priority: step.type === "MANDATORY" ? "HIGH" : "NORMAL",
                          assignmentLevel: "TASK_MEMBER",
                        };
                        if (existingIdx >= 0) {
                          parsed.assignments[existingIdx] = {
                            ...parsed.assignments[existingIdx],
                            ...assignmentObj,
                          };
                        } else {
                          parsed.assignments.push(assignmentObj);
                        }
                      }
                      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
                    }
                  }
                }
              } catch (e) {
                console.error("Failed to sync department procedure assignments to personnel store", e);
              }

              setIsAddDeptModalOpen(false);
              toast.success(
                "Cấu hình quy trình",
                `Đã cập nhật quy trình cho ${targetDept} (${updatedSteps.length} bước) thành công!`
              );
            }}
          />
        );
      })()}

      {/* 12. Modal Ban Giám đốc Từ chối nghiệm thu */}
      <Modal
        open={isDirectorRejectModalOpen}
        title={
          directorRejectStageTitle
            ? `Ban Giám đốc từ chối nghiệm thu giai đoạn [${directorRejectStageTitle}]`
            : "Ban Giám đốc từ chối nghiệm thu quy trình"
        }
        onCancel={() => {
          setIsDirectorRejectModalOpen(false);
          setDirectorRejectStageKey("");
          setDirectorRejectStageTitle("");
        }}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              intent="outline"
              scale="sm"
              onClick={() => {
                setIsDirectorRejectModalOpen(false);
                setDirectorRejectStageKey("");
                setDirectorRejectStageTitle("");
              }}
            >
              Hủy
            </Button>
            <Button
              intent="primary"
              scale="sm"
              className="!bg-rose-600 hover:!bg-rose-700 !border-rose-600 text-white"
              onClick={() => {
                if (!directorRejectReason.trim()) return;
                handleDirectorReject(
                  directorRejectReason.trim(),
                  directorRejectDept,
                  directorRejectStageKey,
                  directorRejectStageTitle
                );
              }}
              disabled={!directorRejectReason.trim()}
            >
              Xác nhận từ chối
            </Button>
          </div>
        }
      >
        <div className="space-y-3 py-2 text-xs">
          {completedDepartments.length > 0 && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Phòng ban cần trả về yêu cầu chỉnh sửa:
              </label>
              <Select
                className="w-full text-xs"
                value={directorRejectDept}
                onChange={(val: any) => setDirectorRejectDept(String(val))}
                options={[
                  { value: "ALL", label: "Tất cả các phòng ban đã xác nhận" },
                  ...completedDepartments.map((dept) => ({
                    value: dept,
                    label: dept,
                  })),
                ]}
              />
            </div>
          )}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nhận xét / Lý do yêu cầu các phòng ban rà soát và bổ sung: <span className="text-rose-500">*</span>
            </label>
            <Input.TextArea
              rows={3}
              placeholder="Nhập lý do từ chối hoặc yêu cầu bổ sung hồ sơ nghiệm thu..."
              value={directorRejectReason}
              onChange={(e) => setDirectorRejectReason(e.target.value)}
              className="text-xs"
            />
          </div>
        </div>
      </Modal>
    </section>
  );
}
