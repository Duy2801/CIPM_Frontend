"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertFilled,
  CheckCircleFilled,
  CheckOutlined,
  CloseOutlined,
  HourglassOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { Button, Input, Modal, Select, Tag, toast } from "@/components/ui";
import { INITIAL_PROCEDURE_PROJECTS, createBaseSteps } from "../constants/procedure-mock-data";
import {
  BUILTIN_PROCEDURE_TEMPLATES,
  loadCustomProfiles,
  type CustomProcedureProfile,
} from "../constants/procedure-templates";
import {
  getDepartmentStaff,
  isDirectorUser,
  isLeadOfDepartment,
  isSameDepartment,
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
import DocumentManagerModal from "./DocumentManagerModal";
import ProcedureAuditLogModal from "./ProcedureAuditLogModal";
import ProcedureStepDetailDrawer from "./ProcedureStepDetailDrawer";
import SkipStepModal from "./SkipStepModal";
import StepConfigModal from "./StepConfigModal";
import { useAuth } from "@/features/auth";
import { useProjectStore } from "@/stores/project.store";
import { canUserDo, getUserEffectivePermissions, hasMatrixPermission } from "@/access-control";

const PROCEDURE_PROJECTS_STORAGE_KEY = "cipm_procedure_projects_data_v5";
const PROCEDURE_MAPPINGS_STORAGE_KEY = "cipm_project_procedures_map_v5";

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
          steps: currentSteps.length > 0 ? currentSteps : createBaseSteps(),
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
        steps: createBaseSteps(),
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
    return {
      "PRJ-001": "standard-16",
      "PRJ-002": "standard-16",
      "PRJ-003": "bcktkt-11",
    };
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

  useEffect(() => {
    setCustomProfiles(loadCustomProfiles());
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
    return [...BUILTIN_PROCEDURE_TEMPLATES, ...customAsProfiles];
  }, [customProfiles]);

  const selectedProcedureId =
    (currentProject && projectProcedures[currentProject.projectId]) ||
    "standard-16";

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
  const [activeStepForDocs, setActiveStepForDocs] =
    useState<ProcedureStep | null>(null);
  const [docsOriginStep, setDocsOriginStep] = useState<ProcedureStep | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState<boolean>(false);
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
  const projectDepartments = useMemo(() => {
    return currentProject?.departments || [];
  }, [currentProject]);

  // Đảm bảo departmentFilter luôn chọn một phòng ban cụ thể trong project (bỏ hoàn toàn "ALL")
  useEffect(() => {
    if (projectDepartments.length > 0) {
      if (!departmentFilter || departmentFilter === "ALL" || !projectDepartments.includes(departmentFilter)) {
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
    return currentProject.steps.filter(
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
    return currentProject.steps.filter((s) => isSameDepartment(s.department, departmentFilter));
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

    const newSteps = currentProject.steps.map((s) => {
      if (s.id === stepId) {
        if (isStepLead || canApproveProcedure) {
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

    const isMemberSubmit = !isStepLead && !canApproveProcedure;
    const newLog: ProcedureHistoryLog = {
      id: `LOG-${Date.now()}`,
      stepId: step.id,
      stepCode: step.code,
      stepName: step.name,
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      performedBy: operatorName,
      role: operatorRole,
      action: isMemberSubmit ? "START_STEP" : "COMPLETE_STEP",
      actionLabel: isMemberSubmit ? "Xác nhận nộp duyệt" : "Hoàn thành bước",
      previousStatus: step.status,
      newStatus: isMemberSubmit ? "IN_PROGRESS" : "COMPLETED",
      documentReference:
        completionData.newDocument?.documentCode ||
        step.attachments[0]?.documentCode,
      details: isMemberSubmit
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
        "Đã gửi xác nhận hoàn thành",
        `Đã nộp kết quả thực hiện bước [${step.code}] ${step.name} cho Tổ trưởng phê duyệt.`
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

    if (step.submissionStatus === "SUBMITTED" || step.submissionStatus === "APPROVED") {
      toast.warning(
        "Không thể bỏ qua bước",
        "Bước này đã có nhân sự nộp kết quả thực hiện, vui lòng xem xét phê duyệt hoặc từ chối thay vì bỏ qua!"
      );
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

    const newLog: ProcedureHistoryLog = {
      id: `LOG-${Date.now()}`,
      stepId: step.id,
      stepCode: step.code,
      stepName: step.name,
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      performedBy: operatorName,
      role: operatorRole,
      action: "START_STEP",
      actionLabel: "Tổ trưởng từ chối duyệt",
      details: `Tổ trưởng ${operatorName} từ chối phê duyệt bước [${step.code}] ${step.name}. Lý do: ${reason}`,
    };

    updateCurrentProjectState(newSteps, [newLog]);

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

    const deptSteps = currentProject.steps.filter(
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

    updateCurrentProjectState(currentProject.steps, [newLog], {
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
    setCustomProfiles(loadCustomProfiles());
    toast.success("Cấu hình quy trình", "Đã lưu cấu hình quy trình dự án thành công!");
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

    if (activeStepForDocs && activeStepForDocs.id === stepId) {
      setActiveStepForDocs({
        ...activeStepForDocs,
        attachments: [doc, ...activeStepForDocs.attachments],
      });
    }

    if (detailStep && detailStep.id === stepId) {
      setDetailStep({
        ...detailStep,
        attachments: [doc, ...detailStep.attachments],
      });
    }

    if (docsOriginStep && docsOriginStep.id === stepId) {
      setDocsOriginStep({
        ...docsOriginStep,
        attachments: [doc, ...docsOriginStep.attachments],
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

    if (activeStepForDocs && activeStepForDocs.id === stepId) {
      setActiveStepForDocs({
        ...activeStepForDocs,
        attachments: activeStepForDocs.attachments.filter((d) => d.id !== docId),
      });
    }

    toast.success("Xóa tài liệu", "Đã xóa tài liệu đính kèm.");
  };

  return (
    <section className="w-full max-w-[2560px] mx-auto space-y-3">
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
        onOpenAuditLog={() => setIsAuditLogOpen(true)}
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
        ) : (
          <ProcedureStepList
            steps={displayedSteps}
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            viewMode={viewMode}
            onStartStep={handleStartStep}
            onOpenCompleteModal={(step) => setActiveStepForComplete(step)}
            onConfirmCompleteStep={(stepId) => {
              handleConfirmComplete(stepId, {
                actualEndDate: new Date().toISOString().slice(0, 10),
              });
            }}
            onOpenSkipModal={(step) => setActiveStepForSkip(step)}
            onOpenDocsModal={(step) => setActiveStepForDocs(step)}
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
            onApproveStep={handleApproveStep}
            onRejectStep={handleRejectStep}
            onLeadApproveStage={handleLeadApproveStage}
            onLeadRejectStage={handleLeadRejectStage}
            stageApprovals={currentProject?.stageApprovals}
            onDirectorApproveStage={(stageCode, stageTitle) => handleDirectorApprove(stageCode, stageTitle)}
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
          steps={currentProject?.steps || createBaseSteps()}
          currentProcedureId={selectedProcedureId}
          projectName={currentProject?.projectName || "Dự án"}
          onClose={() => setIsConfigOpen(false)}
          onSaveConfig={handleSaveConfig}
        />
      )}

      {/* 8. Drawer Quản lý Hồ sơ Văn bản (Quy tắc 10) */}
      <DocumentManagerModal
        open={Boolean(activeStepForDocs)}
        step={activeStepForDocs}
        onClose={() => {
          setActiveStepForDocs(null);
          setDocsOriginStep(null);
        }}
        onBackToDetail={
          docsOriginStep && currentProject
            ? () => {
                const refreshed =
                  currentProject.steps.find((s) => s.id === docsOriginStep.id) ||
                  docsOriginStep;
                setActiveStepForDocs(null);
                setDetailStep(refreshed);
                setDocsOriginStep(null);
              }
            : undefined
        }
        onAddDocument={handleAddDocument}
      />

      {/* 9. Modal Nhật ký Kiểm toán Lưu vết Vĩnh viễn (Quy tắc 11) */}
      <ProcedureAuditLogModal
        open={isAuditLogOpen}
        onClose={() => setIsAuditLogOpen(false)}
        history={currentProject?.history || []}
        steps={currentProject?.steps || []}
        projectName={currentProject?.projectName || ""}
      />

      {/* 10. Drawer Chi tiết bước thủ tục */}
      <ProcedureStepDetailDrawer
        step={detailStep}
        allSteps={currentProject?.steps || []}
        projectName={currentProject?.projectName || ""}
        open={Boolean(detailStep)}
        onClose={() => setDetailStep(null)}
        onStartStep={handleStartStep}
        onOpenCompleteModal={(step) => {
          setDetailStep(null);
          setActiveStepForComplete(step);
        }}
        onConfirmCompleteStep={(stepId: string) => {
          handleConfirmComplete(stepId, {
            actualEndDate: new Date().toISOString().slice(0, 10),
          });
        }}
        onOpenSkipModal={(step) => {
          setDetailStep(null);
          setActiveStepForSkip(step);
        }}
        onOpenDocsModal={(step) => {
          setDocsOriginStep(step);
          setDetailStep(null);
          setActiveStepForDocs(step);
        }}
        canUpdateProcedure={canUpdateProcedure}
        onAssignMember={handleAssignMember}
        onApproveStep={handleApproveStep}
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
            onClose={() => setIsAddDeptModalOpen(false)}
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
