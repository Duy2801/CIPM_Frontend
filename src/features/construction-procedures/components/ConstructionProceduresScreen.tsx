"use client";

import React, { useMemo, useState } from "react";
import { INITIAL_PROCEDURE_PROJECTS } from "../constants/procedure-mock-data";
import {
  BUILTIN_PROCEDURE_TEMPLATES,
  loadCustomProfiles,
  type CustomProcedureProfile,
} from "../constants/procedure-templates";
import type {
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
import { toast } from "@/components/ui";

export default function ConstructionProceduresScreen() {
  const { user } = useAuth();

  // 1. Quản lý trạng thái dữ liệu quy trình các dự án
  const [projectsData, setProjectsData] = useState<ProjectProcedureData[]>(
    INITIAL_PROCEDURE_PROJECTS
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string>("PRJ-001");

  // Lấy dữ liệu dự án đang chọn
  const currentProject = useMemo(() => {
    return (
      projectsData.find((p) => p.projectId === selectedProjectId) ||
      projectsData[0]
    );
  }, [projectsData, selectedProjectId]);

  // Phân quyền chặt chẽ:
  // Chỉ NGƯỜI THỰC HIỆN CHÍNH của dự án này HOẶC BAN GIÁM ĐỐC (Admin, Phó GĐ) mới có quyền Bắt đầu, Hoàn thành, Bỏ qua.
  // Các tài khoản khác dù có quyền xem hay nhập liệu thông thường cũng sẽ bị ẩn các nút này nếu không phụ trách dự án.
  const permissions = user?.permissions ?? [];
  const userName = (user?.displayName || user?.name || "").trim().toLowerCase();
  const userRole = (user?.role || "").toUpperCase();

  const isProjectAssignee = Boolean(
    currentProject &&
      userName &&
      (currentProject.managerName?.toLowerCase() === userName ||
       currentProject.supervisorName?.toLowerCase() === userName)
  );

  const isDirectorate =
    userRole === "ADMIN" ||
    userRole === "DEPUTY_DIRECTOR" ||
    permissions.includes("m3_construction_procedures:approve");

  const canUpdateProcedure =
    (isProjectAssignee || isDirectorate) &&
    (permissions.includes("m3_construction_procedures:input") ||
     permissions.includes("m3_construction_procedures:approve"));

  const canConfigureProcedure =
    isDirectorate &&
    (permissions.includes("m3_construction_procedures:configure") ||
     permissions.includes("m3_construction_procedures:approve"));

  const operatorName = user?.displayName || user?.name || "Cán bộ quản lý";
  const operatorRole = user?.roleName || "Cán bộ Ban QLDA";

  // Quản lý quy trình được áp dụng cho từng dự án
  const [projectProcedures, setProjectProcedures] = useState<Record<string, string>>({
    "PRJ-001": "standard-16",
    "PRJ-002": "standard-16",
    "PRJ-003": "bcktkt-11",
  });

  const [customProfiles, setCustomProfiles] = useState<CustomProcedureProfile[]>([]);

  React.useEffect(() => {
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
    projectProcedures[selectedProjectId] || "standard-16";

  const handleSelectProcedure = (procedureId: string) => {
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

  // Tính toán KPIs thời gian thực
  // Tiện ích cập nhật dự án hiện tại và thêm Log vĩnh viễn (Quy tắc 11)
  const updateCurrentProjectState = (
    newSteps: ProcedureStep[],
    newLogs: ProcedureHistoryLog[] = []
  ) => {
    setProjectsData((prev) =>
      prev.map((proj) => {
        if (proj.projectId === currentProject.projectId) {
          return {
            ...proj,
            steps: newSteps,
            history: [...newLogs, ...proj.history],
          };
        }
        return proj;
      })
    );
  };

  // Thao tác: Bắt đầu bước
  const handleStartStep = (stepId: string) => {
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

  // Thao tác: Hoàn thành bước (Quy tắc 10: Ràng buộc hồ sơ)
  const handleConfirmComplete = (
    stepId: string,
    completionData: {
      actualEndDate: string;
      notes?: string;
      newDocument?: ProcedureDocument;
    }
  ) => {
    const step = currentProject.steps.find((s) => s.id === stepId);
    if (!step) return;

    const updatedAttachments = [...step.attachments];
    if (completionData.newDocument) {
      updatedAttachments.push(completionData.newDocument);
    }

    const newSteps = currentProject.steps.map((s) => {
      if (s.id === stepId) {
        return {
          ...s,
          status: "COMPLETED" as const,
          actualStartDate: s.actualStartDate || completionData.actualEndDate,
          actualEndDate: completionData.actualEndDate,
          attachments: updatedAttachments,
          notes: completionData.notes || s.notes,
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
      actionLabel: "Hoàn thành bước",
      previousStatus: step.status,
      newStatus: "COMPLETED",
      documentReference:
        completionData.newDocument?.documentCode ||
        step.attachments[0]?.documentCode,
      details: `Xác nhận hoàn thành bước [${step.code}] ${step.name} ngày ${completionData.actualEndDate}. Đã kiểm tra đầy đủ hồ sơ văn bản đính kèm theo Quy tắc 10.`,
    };

    updateCurrentProjectState(newSteps, [newLog]);
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
    const step = currentProject.steps.find((s) => s.id === stepId);
    if (!step) return;

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

  // Thao tác: Cấu hình quy trình (Bật/Tắt, Thêm bước, Đổi quy trình)
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

    // Đồng bộ với activeStepForDocs nếu đang mở
    if (activeStepForDocs && activeStepForDocs.id === stepId) {
      setActiveStepForDocs({
        ...activeStepForDocs,
        attachments: [doc, ...activeStepForDocs.attachments],
      });
    }

    // Đồng bộ với detailStep nếu đang mở
    if (detailStep && detailStep.id === stepId) {
      setDetailStep({
        ...detailStep,
        attachments: [doc, ...detailStep.attachments],
      });
    }

    // Đồng bộ với docsOriginStep nếu có
    if (docsOriginStep && docsOriginStep.id === stepId) {
      setDocsOriginStep({
        ...docsOriginStep,
        attachments: [doc, ...docsOriginStep.attachments],
      });
    }
  };

  // Nhảy tới bước khi bấm trên Alert Banner
  return (
    <section className="mx-auto max-w-[1600px] space-y-3">
      {/* 2. Banner Cảnh Báo Đỏ & Vàng Khẩn Cấp (Quy tắc 8 & 9) */}
      {/* 3. Toolbar: Bộ lọc, Chuyển đổi Dự án, Chọn Quy trình, Tìm kiếm & Chế độ xem */}
      <ProcedureFilterToolbar
        projects={projectsData}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenAuditLog={() => setIsAuditLogOpen(true)}
        onOpenStepConfig={() => setIsConfigOpen(true)}
        procedureProfiles={allProcedureProfiles}
        selectedProcedureId={selectedProcedureId}
        onSelectProcedure={handleSelectProcedure}
        canUpdateProcedure={canConfigureProcedure}
      />

      {/* 4. Danh sách các bước thủ tục */}
      <div className="pt-2 sm:pt-3">
        <ProcedureStepList
          steps={currentProject.steps}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          viewMode={viewMode}
          onStartStep={handleStartStep}
          onOpenCompleteModal={(step) => setActiveStepForComplete(step)}
          onOpenSkipModal={(step) => setActiveStepForSkip(step)}
          onOpenDocsModal={(step) => setActiveStepForDocs(step)}
          onOpenDetailStep={(step) => setDetailStep(step)}
          canUpdateProcedure={canUpdateProcedure}
        />
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
          steps={currentProject.steps}
          currentProcedureId={selectedProcedureId}
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
          docsOriginStep
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
        history={currentProject.history}
        steps={currentProject.steps}
        projectName={currentProject.projectName}
      />

      {/* 10. Drawer Chi tiết bước thủ tục (theo chuẩn Tài chính quyết toán) */}
      <ProcedureStepDetailDrawer
        step={detailStep}
        allSteps={currentProject.steps}
        projectName={currentProject.projectName}
        open={Boolean(detailStep)}
        onClose={() => setDetailStep(null)}
        onStartStep={handleStartStep}
        onOpenCompleteModal={(step) => {
          setDetailStep(null);
          setActiveStepForComplete(step);
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
      />
    </section>
  );
}
