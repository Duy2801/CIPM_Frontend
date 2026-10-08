import { addDays, todayIso } from "../../../utils/date.ts";
import { normalizeStageGroup } from "../constants/personnel-labels.ts";
import { PERSONNEL_MOCK_DATA } from "../constants/personnel-mock-data.ts";
import type { Assignment, PersonnelDataset, ProjectDocumentSubmission, Staff } from "../types/personnel.types";
import { validateAssignment } from "../utils/personnel-rules.ts";
import type { PersonnelRepository } from "./personnel.repository.ts";

const clone = <T,>(value: T): T => structuredClone(value);
const STORAGE_KEY = "cipm_personnel_test_flow_v3";

function loadDataset(): PersonnelDataset {
  if (typeof window === "undefined") return clone(PERSONNEL_MOCK_DATA);
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem("cipm_personnel_test_flow_v2");
    if (stored) {
      const parsed: PersonnelDataset = JSON.parse(stored);
      if (
        Array.isArray(parsed.teams) &&
        Array.isArray(parsed.staff) &&
        Array.isArray(parsed.projects) &&
        Array.isArray(parsed.assignments)
      ) {
        // Khử trùng lặp assignments:
        // 1. Khử trùng lặp theo ID
        // 2. Với PHASE_LEAD: Mỗi dự án + giai đoạn (chuẩn hóa I..VII) chỉ có tối đa 1 phân công PHASE_LEAD
        // 3. Với TASK_MEMBER: Mỗi dự án + bước + người thực hiện chỉ có 1 phân công
        const seenIds = new Set<string>();
        const seenPhaseLeads = new Map<string, string>(); // key: `${projectId}_${normalizedStage}` -> assignment.id
        const seenTaskMembers = new Set<string>(); // key: `${projectId}_${stepCode}_${assigneeId}`
        const parentIdRemap = new Map<string, string>(); // duplicatePhaseId -> keptPhaseId
        const deduplicatedAssignments: Assignment[] = [];

        for (const item of parsed.assignments) {
          if (!item.id || seenIds.has(item.id)) {
            continue;
          }

          if (item.assignmentLevel === "PHASE_LEAD" || (!item.assignmentLevel && !item.stepCode && item.stage)) {
            const normStage = normalizeStageGroup(item.stage, item.stepCode);
            const phaseKey = `${item.projectId}_${normStage}`;
            const existingPhaseId = seenPhaseLeads.get(phaseKey);
            if (existingPhaseId) {
              // Giai đoạn này đã có trong dự án -> Bỏ bản sao trùng và remap bước con trỏ vào existingPhaseId
              parentIdRemap.set(item.id, existingPhaseId);
              continue;
            }
            seenPhaseLeads.set(phaseKey, item.id);
            seenIds.add(item.id);
            deduplicatedAssignments.push(item);
          } else if (item.assignmentLevel === "TASK_MEMBER" && item.stepCode && item.assigneeId) {
            const taskKey = `${item.projectId}_${item.stepCode}_${item.assigneeId}`;
            if (seenTaskMembers.has(taskKey)) {
              continue;
            }
            seenTaskMembers.add(taskKey);
            seenIds.add(item.id);
            deduplicatedAssignments.push(item);
          } else {
            seenIds.add(item.id);
            deduplicatedAssignments.push(item);
          }
        }

        // Remap parentAssignmentId cho các bước con nếu giai đoạn cha trùng lặp bị loại bỏ
        deduplicatedAssignments.forEach((item) => {
          if (item.parentAssignmentId && parentIdRemap.has(item.parentAssignmentId)) {
            item.parentAssignmentId = parentIdRemap.get(item.parentAssignmentId);
          }
        });

        parsed.assignments = deduplicatedAssignments;

        // Đảm bảo bước con AS-DEMO-TASK-001 ở trạng thái PENDING_APPROVAL kèm hồ sơ nộp để kiểm thử luồng duyệt của Lead tổ
        const task001 = parsed.assignments.find((a) => a.id === "AS-DEMO-TASK-001" || a.stepCode === "VI.1");
        if (task001 && (!task001.submissions || task001.submissions.length === 0 || task001.status === "TODO")) {
          task001.status = "PENDING_APPROVAL";
          task001.confirmRequestedAt = todayIso();
          task001.submissions = [
            {
              id: "SUB-DEMO-001",
              documentCode: "BB-NT-VL-001",
              title: "Biên bản kiểm tra và kết quả thí nghiệm vật liệu đá, thép, bê tông đầu vào",
              fileName: "BienBan_KiemTra_VatLieuDauVao_KeBien.pdf",
              fileSize: "3.8 MB",
              submittedAt: todayIso() + " 09:30",
              submittedByStaffId: task001.assigneeId || "ST-006",
              submittedByName: "Trần Quốc Việt",
              leadApprovalStatus: "PENDING_LEAD",
              fileType: "pdf",
            },
            {
              id: "SUB-DEMO-002",
              documentCode: "KQ-TN-002",
              title: "Phiếu kết quả thí nghiệm nén mẫu bê tông R28",
              fileName: "KetQua_ThiNghiem_MauBeTong_R28.pdf",
              fileSize: "1.5 MB",
              submittedAt: todayIso() + " 09:35",
              submittedByStaffId: task001.assigneeId || "ST-006",
              submittedByName: "Trần Quốc Việt",
              leadApprovalStatus: "PENDING_LEAD",
              fileType: "pdf",
            },
          ];
        }

        // Bổ sung các bước con VI.2 và VI.3 nếu chưa có trong bộ nhớ
        ["AS-DEMO-TASK-002", "AS-DEMO-TASK-003"].forEach((taskId) => {
          if (!parsed.assignments.some((a) => a.id === taskId)) {
            const baselineTask = PERSONNEL_MOCK_DATA.assignments.find((a) => a.id === taskId);
            if (baselineTask) parsed.assignments.push(clone(baselineTask));
          }
        });

        // Dữ liệu cũ đánh dấu bước con DONE ngay khi tổ trưởng duyệt.
        // Đưa các bước đó về hàng chờ CNDA nếu giai đoạn cha chưa hoàn thành.
        parsed.assignments.forEach((item) => {
          if (item.parentAssignmentId && item.status === "DONE" && !item.approvalStage) {
            const parent = parsed.assignments.find((candidate) => candidate.id === item.parentAssignmentId);
            if (parent?.status !== "DONE") {
              item.status = "PENDING_APPROVAL";
              item.approvalStage = "LEAD_APPROVED";
              item.completedAt = undefined;
            }
          }
        });

        // Đồng bộ startDate, endDate và assignedAt cho projects từ mock baseline nếu chưa có
        parsed.projects?.forEach((proj) => {
          const baseline = PERSONNEL_MOCK_DATA.projects.find((p) => p.id === proj.id);
          if (baseline) {
            if (!proj.startDate) proj.startDate = baseline.startDate;
            if (!proj.endDate) proj.endDate = baseline.endDate;
            if (!proj.assignedAt && baseline.assignedAt) proj.assignedAt = baseline.assignedAt;
            if (!proj.mainExecutorId && baseline.mainExecutorId) proj.mainExecutorId = baseline.mainExecutorId;
            if (!proj.mainSupervisorId && baseline.mainSupervisorId) proj.mainSupervisorId = baseline.mainSupervisorId;
            if (!proj.directorApprovalStatus && baseline.directorApprovalStatus) {
              proj.directorApprovalStatus = baseline.directorApprovalStatus;
              proj.directorSubmittedAt = baseline.directorSubmittedAt;
              proj.directorSubmittedBy = baseline.directorSubmittedBy;
              proj.directorTargetRole = baseline.directorTargetRole;
              proj.directorTargetStaffName = baseline.directorTargetStaffName;
              proj.directorSubmissionNote = baseline.directorSubmissionNote;
            }
          }
        });

        return parsed;
      }
    }
  } catch {
    // Dữ liệu thử cũ không hợp lệ: bắt đầu từ bộ dữ liệu trống đã cấu hình.
  }
  return clone(PERSONNEL_MOCK_DATA);
}

export function createMockPersonnelRepository(): PersonnelRepository {
  const dataset = loadDataset();

  const persistDataset = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dataset));
    }
  };

  const findAssignment = (id: string): Assignment => {
    const assignment = dataset.assignments.find((item) => item.id === id);
    if (!assignment) throw new Error("Không tìm thấy nhiệm vụ.");
    return assignment;
  };

  const repository: PersonnelRepository = {
    async getDataset() {
      return clone(dataset);
    },

    async assignProjectLeaders(input) {
      const project = dataset.projects.find((p) => p.id === input.projectId);
      if (!project) throw new Error("Không tìm thấy dự án.");
      if (!input.mainExecutorId) throw new Error("Vui lòng chọn Người thực hiện chính.");
      if (!input.mainSupervisorId) throw new Error("Vui lòng chọn Người giám sát chính.");

      project.mainExecutorId = input.mainExecutorId;
      project.mainSupervisorId = input.mainSupervisorId;
      project.assignedAt = todayIso();
      project.cndaRevoked = false;
      if (!project.startDate) project.startDate = todayIso();
      if (!project.endDate) project.endDate = "2026-12-31";
      if (input.note !== undefined) {
        project.note = input.note;
      }
      if (input.grantActingDirector || input.actingDirectorId) {
        // Chỉ cấp Quyền CNDA cho chính Người thực hiện chính
        project.actingDirectorId = input.mainExecutorId;
        project.actingDirectorAssignedAt = todayIso();
        project.actingDirectorAssignedBy = "Ban Giám đốc";
        project.actingDirectorNote =
          input.actingDirectorNote ||
          "Ủy quyền toàn quyền phân công nhân sự, quản lý tổ công tác và đôn đốc dự án.";
      }
      if (!project.teamMembers) project.teamMembers = [];
      [input.mainExecutorId, input.mainSupervisorId, project.actingDirectorId].filter(Boolean).forEach((id) => {
        if (!project.teamMembers!.includes(id!)) {
          project.teamMembers!.push(id!);
        }
      });
      return clone(project);
    },

    async grantActingDirector(input) {
      const project = dataset.projects.find((p) => p.id === input.projectId);
      if (!project) throw new Error("Không tìm thấy dự án.");
      if (!project.mainExecutorId) {
        throw new Error(
          "Dự án này chưa có Người thực hiện chính. Cần phân công Người thực hiện chính trước khi cấp role Quyền Chủ nhiệm dự án."
        );
      }
      if (project.mainExecutorId !== input.staffId) {
        throw new Error(
          "Theo quy định, chỉ có Người thực hiện chính của dự án mới được cấp role Quyền Chủ nhiệm dự án."
        );
      }
      const staff = dataset.staff.find((s) => s.id === input.staffId);
      if (!staff) throw new Error("Không tìm thấy cán bộ.");

      project.actingDirectorId = input.staffId;
      project.actingDirectorAssignedAt = todayIso();
      project.actingDirectorAssignedBy = input.assignedBy || "Ban Giám đốc";
      project.actingDirectorNote =
        input.note ||
        "Được cấp role Quyền Chủ nhiệm dự án – có toàn quyền phân công nhân sự, bổ nhiệm thành viên tổ công tác và đôn đốc thành viên trong dự án này.";

      project.cndaRevoked = false;

      if (!project.teamMembers) project.teamMembers = [];
      if (!project.teamMembers.includes(input.staffId)) {
        project.teamMembers.push(input.staffId);
      }
      return clone(project);
    },

    async revokeActingDirector(projectId) {
      const project = dataset.projects.find((p) => p.id === projectId);
      if (!project) throw new Error("Không tìm thấy dự án.");
      delete project.actingDirectorId;
      delete project.actingDirectorAssignedAt;
      delete project.actingDirectorAssignedBy;
      delete project.actingDirectorNote;
      project.cndaRevoked = true;
      return clone(project);
    },

    async updateProjectPermissions(projectId, grantedPermissions) {
      const project = dataset.projects.find((p) => p.id === projectId);
      if (!project) throw new Error("Không tìm thấy dự án.");
      project.grantedPermissions = [...grantedPermissions];
      return clone(project);
    },

    async addProjectMember(projectId, staffId) {
      const project = dataset.projects.find((p) => p.id === projectId);
      if (!project) throw new Error("Không tìm thấy dự án.");
      const staff = dataset.staff.find((s) => s.id === staffId);
      if (!staff) throw new Error("Không tìm thấy cán bộ.");

      if (!project.teamMembers) project.teamMembers = [];
      if (!project.teamMembers.includes(staffId)) {
        project.teamMembers.push(staffId);
      }
      return clone(project);
    },

    async addProjectMembers(projectId, staffIds) {
      const project = dataset.projects.find((p) => p.id === projectId);
      if (!project) throw new Error("Không tìm thấy dự án.");

      if (!project.teamMembers) project.teamMembers = [];
      for (const staffId of staffIds) {
        if (!project.teamMembers.includes(staffId)) {
          project.teamMembers.push(staffId);
        }
      }
      return clone(project);
    },

    async removeProjectMember(projectId, staffId) {
      const project = dataset.projects.find((p) => p.id === projectId);
      if (!project) throw new Error("Không tìm thấy dự án.");
      if (project.actingDirectorId === staffId) {
        throw new Error("Không thể xóa Quyền Chủ nhiệm dự án khỏi tổ công tác. Vui lòng thu hồi vai trò trước.");
      }
      if (project.teamMembers) {
        project.teamMembers = project.teamMembers.filter((id) => id !== staffId);
      }
      return clone(project);
    },

    async createAssignment(input, actor) {
      const error = validateAssignment(input, dataset.staff, todayIso());
      if (error) throw new Error(error);

      // Ngăn chặn tạo trùng lặp giai đoạn cấp PHASE_LEAD cho cùng một dự án
      if (input.assignmentLevel === "PHASE_LEAD") {
        const normStage = normalizeStageGroup(input.stage);
        const existingPhase = dataset.assignments.find(
          (a) =>
            a.projectId === input.projectId &&
            (a.assignmentLevel === "PHASE_LEAD" || (!a.assignmentLevel && !a.stepCode && Boolean(a.stage))) &&
            normalizeStageGroup(a.stage, a.stepCode) === normStage
        );
        if (existingPhase) {
          const assigneeName = dataset.staff.find((s) => s.id === existingPhase.assigneeId)?.name || "Tổ trưởng";
          throw new Error(
            `Giai đoạn này đã được phân công trong dự án (cho ${assigneeName}). Vui lòng chỉnh sửa phân công đã có thay vì giao trùng lặp.`
          );
        }
      }

      // Ngăn chặn tạo trùng lặp bước con cấp TASK_MEMBER cho cùng cán bộ
      if (input.assignmentLevel === "TASK_MEMBER" && input.stepCode && input.assigneeId) {
        const existingTask = dataset.assignments.find(
          (a) =>
            a.projectId === input.projectId &&
            a.assignmentLevel === "TASK_MEMBER" &&
            a.stepCode === input.stepCode &&
            a.assigneeId === input.assigneeId
        );
        if (existingTask) {
          throw new Error(`Bước ${input.stepCode} đã được phân công cho cán bộ này trong dự án.`);
        }
      }

      if (input.assignmentLevel === "TASK_MEMBER") {
        const parent = dataset.assignments.find((item) => item.id === input.parentAssignmentId);
        if (!parent || parent.status === "DONE" || parent.assignmentLevel !== "PHASE_LEAD" || parent.projectId !== input.projectId || parent.stage !== input.stage || parent.teamId !== input.teamId) {
          throw new Error("Bước con phải thuộc giai đoạn đã giao cho đúng tổ trong dự án.");
        }
      }
      const assignment: Assignment = {
        priority: input.priority || "NORMAL",
        dueDate: input.dueDate || addDays(todayIso(), 30),
        ...input,
        id: `AS-${Date.now()}`,
        title: input.title.trim(),
        assignedBy: actor,
        assignedAt: todayIso(),
        status: "TODO",
      };
      dataset.assignments = [assignment, ...dataset.assignments];

      // Tự động bổ sung người thực hiện và cán bộ phối hợp vào tổ công tác dự án nếu chưa có
      if (input.projectId && input.assigneeId) {
        const project = dataset.projects.find((p) => p.id === input.projectId);
        if (project) {
          if (!project.teamMembers) project.teamMembers = [];
          if (!project.teamMembers.includes(input.assigneeId)) {
            project.teamMembers.push(input.assigneeId);
          }
          if (input.coAssigneeIds) {
            for (const coId of input.coAssigneeIds) {
              if (!project.teamMembers.includes(coId)) {
                project.teamMembers.push(coId);
              }
            }
          }
        }
      }

      return clone(assignment);
    },

    async updateAssignment(id, input) {
      const assignment = findAssignment(id);
      if (assignment.status === "DONE") throw new Error("Nhiệm vụ đã hoàn thành, không thể sửa.");
      const error = validateAssignment(input, dataset.staff, todayIso());
      if (error) throw new Error(error);
      if (input.assignmentLevel === "TASK_MEMBER") {
        const parent = dataset.assignments.find((item) => item.id === input.parentAssignmentId);
        if (!parent || parent.status === "DONE" || parent.assignmentLevel !== "PHASE_LEAD" || parent.projectId !== input.projectId || parent.stage !== input.stage || parent.teamId !== input.teamId) {
          throw new Error("Bước con phải thuộc giai đoạn đã giao cho đúng tổ trong dự án.");
        }
      }
      Object.assign(assignment, { ...input, title: input.title.trim() });

      // Tự động bổ sung người thực hiện và cán bộ phối hợp vào tổ công tác dự án nếu chưa có
      if (input.projectId && input.assigneeId) {
        const project = dataset.projects.find((p) => p.id === input.projectId);
        if (project) {
          if (!project.teamMembers) project.teamMembers = [];
          if (!project.teamMembers.includes(input.assigneeId)) {
            project.teamMembers.push(input.assigneeId);
          }
          if (input.coAssigneeIds) {
            for (const coId of input.coAssigneeIds) {
              if (!project.teamMembers.includes(coId)) {
                project.teamMembers.push(coId);
              }
            }
          }
        }
      }

      return clone(assignment);
    },

    async deleteAssignment(id) {
      const idx = dataset.assignments.findIndex((a) => a.id === id);
      if (idx === -1) throw new Error("Không tìm thấy nhiệm vụ.");
      if (dataset.assignments[idx].status === "PENDING_APPROVAL" || dataset.assignments[idx].status === "DONE" || dataset.assignments[idx].approvalStage) {
        throw new Error("Không thể xóa nhiệm vụ đang duyệt hoặc đã hoàn thành.");
      }
      if (dataset.assignments.some((item) => item.parentAssignmentId === id)) {
        throw new Error("Cần xử lý các bước con trước khi xóa giai đoạn.");
      }
      dataset.assignments.splice(idx, 1);
      return true;
    },

    async startAssignment(id) {
      const assignment = findAssignment(id);
      if (assignment.status !== "TODO") return clone(assignment);
      Object.assign(assignment, {
        status: "IN_PROGRESS",
      });
      return clone(assignment);
    },

    async completeAssignment(id, submission) {
      const assignment = findAssignment(id);
      if (assignment.assignmentLevel === "PHASE_LEAD" || assignment.parentAssignmentId) {
        throw new Error("Giai đoạn và bước con cần đi qua quy trình duyệt trước khi hoàn thành.");
      }
      if (assignment.status === "DONE") throw new Error("Nhiệm vụ đã hoàn thành trước đó.");
      if (!assignment.assigneeId) throw new Error("Nhiệm vụ chưa giao người thực hiện.");

      if (submission) {
        if (!assignment.submissions) assignment.submissions = [];
        const newSub: ProjectDocumentSubmission = {
          id: `SUB-${Date.now().toString().slice(-4)}`,
          documentCode: submission.documentCode || `BC-HT-${Date.now().toString().slice(-3)}`,
          title: submission.title || "Hồ sơ nghiệm thu hoàn thành",
          fileName: submission.fileName || "BienBan_NghiemThu_HoanThanh.pdf",
          fileSize: submission.fileSize || "2.5 MB",
          submittedAt: todayIso() + " 10:00",
          submittedByStaffId: assignment.assigneeId,
          submittedByName: dataset.staff.find((s) => s.id === assignment.assigneeId)?.name || "Cán bộ phụ trách",
          leadApprovalStatus: "LEAD_APPROVED",
          fileType: submission.fileType || "pdf",
          leadApprovedAt: todayIso() + " 10:30",
          leadApprovedBy: assignment.assignedBy || "Chủ nhiệm dự án",
          leadFeedbackNote: submission.leadFeedbackNote || "Đã kiểm tra hồ sơ đạt yêu cầu, nghiệm thu hoàn thành.",
        };
        assignment.submissions.push(newSub);
      }

      Object.assign(assignment, { status: "DONE", completedAt: todayIso() });
      return clone(assignment);
    },

    async acceptAssignment(id, note) {
      const assignment = findAssignment(id);
      if (assignment.status === "DONE") throw new Error("Nhiệm vụ đã hoàn thành trước đó.");
      if (assignment.status !== "PENDING_APPROVAL" && !assignment.rejectionNote) {
        throw new Error("Nhiệm vụ chưa được gửi duyệt.");
      }
      if (assignment.assignmentLevel === "TASK_MEMBER" && assignment.parentAssignmentId) {
        if (assignment.approvalStage === "PROJECT_APPROVED") throw new Error("Bước này đã được CNDA duyệt.");
        if (!assignment.approvalStage) {
          assignment.submissions?.forEach((submission) => {
            if (submission.leadApprovalStatus === "PENDING_LEAD" || submission.leadApprovalStatus === "LEAD_REJECTED") {
              submission.leadApprovalStatus = "LEAD_APPROVED";
              submission.leadApprovedAt = todayIso();
              submission.leadApprovedBy = assignment.assignedBy;
              if (note) submission.leadFeedbackNote = note;
            }
          });
        }
        assignment.approvalStage = assignment.approvalStage === "LEAD_APPROVED"
          ? "PROJECT_APPROVED"
          : "LEAD_APPROVED";
        assignment.status = "PENDING_APPROVAL";
        assignment.rejectionNote = undefined;
        return clone(assignment);
      }
      if (assignment.assignmentLevel === "PHASE_LEAD") {
        const children = dataset.assignments.filter((item) => item.parentAssignmentId === id);
        if (!children.length || children.some((item) => item.approvalStage !== "PROJECT_APPROVED")) {
          throw new Error("CNDA cần duyệt tất cả bước con trước khi xác nhận hoàn thành giai đoạn.");
        }
        children.forEach((item) => Object.assign(item, {
          status: "DONE", completedAt: todayIso(), rejectionNote: undefined,
        }));
      }
      if (assignment.submissions) {
        assignment.submissions.forEach((s) => {
          if (s.leadApprovalStatus === "PENDING_LEAD") {
            s.leadApprovalStatus = "LEAD_APPROVED";
            s.leadApprovedAt = todayIso();
            s.leadApprovedBy = assignment.assignedBy || "Chủ nhiệm dự án";
            if (note) s.leadFeedbackNote = note;
          }
        });
      }
      Object.assign(assignment, {
        status: "DONE",
        completedAt: todayIso(),
        rejectionNote: undefined,
      });
      return clone(assignment);
    },

    async undoAcceptAssignment(id) {
      const assignment = findAssignment(id);
      if (assignment.status === "DONE" && !assignment.parentAssignmentId) {
        throw new Error("Giai đoạn đã hoàn thành toàn bộ, không thể hoàn tác.");
      }
      assignment.approvalStage = undefined;
      assignment.status = "PENDING_APPROVAL";
      assignment.rejectionNote = undefined;
      if (assignment.submissions) {
        assignment.submissions.forEach((s) => {
          s.leadApprovalStatus = "PENDING_LEAD";
          s.leadApprovedAt = undefined;
          s.leadApprovedBy = undefined;
          s.leadFeedbackNote = undefined;
        });
      }
      return clone(assignment);
    },

    async rejectAssignment(id, reason) {
      const assignment = findAssignment(id);
      if (!reason?.trim()) throw new Error("Vui lòng nhập lý do từ chối / yêu cầu chỉnh sửa.");
      if (assignment.status !== "PENDING_APPROVAL") throw new Error("Nhiệm vụ chưa được gửi duyệt.");
      if (assignment.approvalStage === "PROJECT_APPROVED") throw new Error("Bước này đã được CNDA duyệt.");
      const returnedByProjectLead = assignment.parentAssignmentId && assignment.approvalStage === "LEAD_APPROVED";
      if (assignment.submissions) {
        assignment.submissions.forEach((s) => {
          if (s.leadApprovalStatus === "PENDING_LEAD") {
            s.leadApprovalStatus = "LEAD_REJECTED";
            s.leadApprovedAt = todayIso();
            s.leadApprovedBy = assignment.assignedBy || "Chủ nhiệm dự án";
            s.leadFeedbackNote = reason.trim();
          }
        });
      }
      Object.assign(assignment, {
        status: "IN_PROGRESS",
        rejectionNote: reason.trim(),
        approvalStage: returnedByProjectLead ? "RETURNED_TO_LEAD" : undefined,
        confirmRequestedAt: undefined,
      });
      return clone(assignment);
    },

    async returnToMember(id) {
      const assignment = findAssignment(id);
      if (assignment.approvalStage !== "RETURNED_TO_LEAD") {
        throw new Error("Bước này không có yêu cầu trả lại từ CNDA.");
      }
      assignment.approvalStage = undefined;
      return clone(assignment);
    },

    async requestCompletion(id, submission) {
      const assignment = findAssignment(id);
      if (assignment.status === "DONE") throw new Error("Nhiệm vụ đã hoàn thành trước đó.");
      if (assignment.status === "PENDING_APPROVAL") throw new Error("Nhiệm vụ đang chờ duyệt.");
      if (assignment.approvalStage === "RETURNED_TO_LEAD") throw new Error("Chờ tổ trưởng chuyển lại bước này cho thành viên chỉnh sửa.");
      if (!assignment.assigneeId) throw new Error("Nhiệm vụ chưa giao người thực hiện.");
      if (assignment.assignmentLevel === "PHASE_LEAD") {
        const children = dataset.assignments.filter((item) => item.parentAssignmentId === id);
        if (!children.length || children.some((item) => item.approvalStage !== "PROJECT_APPROVED")) {
          throw new Error("Cần giao bước con và được CNDA duyệt tất cả bước con trước khi gửi duyệt giai đoạn.");
        }
      }

      if (submission) {
        if (!assignment.submissions) assignment.submissions = [];
        const newSub: ProjectDocumentSubmission = {
          id: `SUB-${Date.now().toString().slice(-4)}`,
          documentCode: submission.documentCode || `BC-HT-${Date.now().toString().slice(-3)}`,
          title: submission.title || "Hồ sơ xác nhận hoàn thành nhiệm vụ",
          fileName: submission.fileName || "BienBan_NghiemThu_HoanThanh.pdf",
          fileSize: submission.fileSize || "2.5 MB",
          submittedAt: todayIso() + " 10:00",
          submittedByStaffId: assignment.assigneeId,
          submittedByName: dataset.staff.find((s) => s.id === assignment.assigneeId)?.name || "Cán bộ phụ trách",
          leadApprovalStatus: "PENDING_LEAD",
          fileType: submission.fileType || "pdf",
          leadFeedbackNote: submission.leadFeedbackNote,
        };
        assignment.submissions.push(newSub);
      }

      Object.assign(assignment, {
        status: "PENDING_APPROVAL",
        confirmRequestedAt: todayIso(),
      });
      return clone(assignment);
    },

    async addAssignmentSubmission(assignmentId, submission) {
      const assignment = findAssignment(assignmentId);
      if (assignment.approvalStage === "RETURNED_TO_LEAD") throw new Error("Chờ tổ trưởng chuyển lại bước này cho thành viên chỉnh sửa.");
      if (!assignment.submissions) assignment.submissions = [];
      const newSub: ProjectDocumentSubmission = {
        id: `SUB-${Date.now().toString().slice(-4)}`,
        documentCode: submission.documentCode || `TL-${Date.now().toString().slice(-3)}`,
        title: submission.title || "Tài liệu đính kèm nhiệm vụ",
        fileName: submission.fileName || "TaiLieu_DinhKem.pdf",
        fileSize: submission.fileSize || "2.4 MB",
        submittedAt: todayIso() + " 09:30",
        submittedByStaffId: assignment.assigneeId || "ST-001",
        submittedByName: dataset.staff.find((s) => s.id === assignment.assigneeId)?.name || "Cán bộ thực hiện",
        leadApprovalStatus: submission.leadApprovalStatus || "PENDING_LEAD",
        fileType: submission.fileType || "pdf",
        leadFeedbackNote: submission.leadFeedbackNote,
      };
      assignment.submissions.push(newSub);
      return clone(assignment);
    },

    async addAssignmentSubmissions(assignmentId, submissions) {
      const assignment = findAssignment(assignmentId);
      if (assignment.approvalStage === "RETURNED_TO_LEAD") throw new Error("Chờ tổ trưởng chuyển lại bước này cho thành viên chỉnh sửa.");
      if (!assignment.submissions) assignment.submissions = [];
      submissions.forEach((submission, idx) => {
        const newSub: ProjectDocumentSubmission = {
          id: `SUB-${Date.now().toString().slice(-4)}-${idx + 1}`,
          documentCode: submission.documentCode || `TL-${Date.now().toString().slice(-3)}-${idx + 1}`,
          title: submission.title || "Tài liệu đính kèm nhiệm vụ",
          fileName: submission.fileName || "TaiLieu_DinhKem.pdf",
          fileSize: submission.fileSize || "2.4 MB",
          submittedAt: submission.submittedAt || todayIso() + " 09:30",
          submittedByStaffId: assignment.assigneeId || "ST-001",
          submittedByName: dataset.staff.find((s) => s.id === assignment.assigneeId)?.name || "Cán bộ thực hiện",
          leadApprovalStatus: submission.leadApprovalStatus || "PENDING_LEAD",
          fileType: submission.fileType || "pdf",
          leadFeedbackNote: submission.leadFeedbackNote,
        };
        assignment.submissions!.push(newSub);
      });
      return clone(assignment);
    },

    async removeAssignmentSubmission(assignmentId, submissionId) {
      const assignment = findAssignment(assignmentId);
      if (assignment.approvalStage === "RETURNED_TO_LEAD") throw new Error("Chờ tổ trưởng chuyển lại bước này cho thành viên chỉnh sửa.");
      if (assignment.submissions) {
        assignment.submissions = assignment.submissions.filter((s) => s.id !== submissionId);
      }
      return clone(assignment);
    },

    async setAccountActive(staffId, active, reason) {
      const person = dataset.staff.find((item) => item.id === staffId);
      if (!person) throw new Error("Không tìm thấy cán bộ.");
      if (person.roleCode === "ADMIN" && !active) throw new Error("Không thể khóa tài khoản quản trị hệ thống.");
      if (!active && !reason?.trim()) throw new Error("Vui lòng nhập lý do khóa tài khoản.");
      Object.assign(person, { accountActive: active, lockReason: active ? undefined : reason?.trim() });
      return clone(person);
    },

    async createStaff(input) {
      if (!input.name?.trim()) throw new Error("Vui lòng nhập họ và tên cán bộ.");
      if (!input.teamId) throw new Error("Vui lòng chọn tổ / bộ phận.");
      if (!input.roleCode) throw new Error("Vui lòng chọn vai trò hệ thống.");

      const nextNum = dataset.staff.length + 1;
      const staffId = `ST-${String(nextNum).padStart(3, "0")}`;
      const newStaff: Staff = {
        id: staffId,
        name: input.name.trim(),
        citizenId: input.citizenId?.trim(),
        title: input.title.trim() || "Chuyên viên",
        teamId: input.teamId,
        roleCode: input.roleCode,
        employment: input.employment || "Viên chức",
        phone: input.phone.trim() || "Chưa cập nhật",
        email: input.email.trim() || `${staffId.toLowerCase()}@hatien.gov.vn`,
        accountActive: input.accountActive !== false,
      };

      dataset.staff = [...dataset.staff, newStaff];

      if (input.isLeader) {
        const team = dataset.teams.find((t) => t.id === input.teamId);
        if (team) {
          team.leaderId = newStaff.id;
        }
      }

      return clone(newStaff);
    },

    async updateStaff(staffId, input) {
      const person = dataset.staff.find((s) => s.id === staffId);
      if (!person) throw new Error("Không tìm thấy cán bộ.");

      if (input.name !== undefined && !input.name.trim()) {
        throw new Error("Họ và tên cán bộ không được để trống.");
      }

      if (input.name !== undefined) person.name = input.name.trim();
      if (input.citizenId !== undefined) person.citizenId = input.citizenId.trim();
      if (input.title !== undefined) person.title = input.title.trim();
      if (input.teamId !== undefined) person.teamId = input.teamId;
      if (input.roleCode !== undefined) person.roleCode = input.roleCode;
      if (input.employment !== undefined) person.employment = input.employment;
      if (input.phone !== undefined) person.phone = input.phone.trim();
      if (input.email !== undefined) person.email = input.email.trim();
      if (input.accountActive !== undefined) person.accountActive = input.accountActive;
      if (input.permissions !== undefined) person.permissions = input.permissions;
      if (input.revokedPermissions !== undefined) person.revokedPermissions = input.revokedPermissions;

      if (input.isLeader !== undefined) {
        const targetTeamId = input.teamId || person.teamId;
        const team = dataset.teams.find((t) => t.id === targetTeamId);
        if (team) {
          if (input.isLeader) {
            team.leaderId = person.id;
          } else if (team.leaderId === person.id) {
            team.leaderId = "";
          }
        }
      }

      return clone(person);
    },

    async urgeMember(input) {
      if (!input.projectId) throw new Error("Vui lòng chọn dự án.");
      if (!input.staffId) throw new Error("Vui lòng chọn cán bộ cần đôn đốc.");
      if (!input.note?.trim()) throw new Error("Vui lòng nhập nội dung đôn đốc.");

      let targetAssignment: Assignment | undefined;

      if (input.assignmentId) {
        targetAssignment = dataset.assignments.find((a) => a.id === input.assignmentId);
      }

      if (!targetAssignment) {
        // Tìm nhiệm vụ đang thực hiện gần nhất của cán bộ này trong dự án
        targetAssignment = dataset.assignments.find(
          (a) =>
            a.projectId === input.projectId &&
            (a.assigneeId === input.staffId || a.coAssigneeIds?.includes(input.staffId)) &&
            a.status !== "DONE"
        );
      }

      if (!targetAssignment) {
        // Nếu chưa có nhiệm vụ nào, tạo một nhiệm vụ đôn đốc tiến độ
        targetAssignment = {
          id: `AS-URGE-${Date.now()}`,
          title: `Đôn đốc tiến độ: ${input.note.trim()}`,
          projectId: input.projectId,
          stage: "CONSTRUCTION",
          assigneeId: input.staffId,
          assignedBy: input.urgedBy,
          assignedAt: todayIso(),
          dueDate: addDays(todayIso(), 3),
          status: "IN_PROGRESS",
          priority: "HIGH",
          note: input.note.trim(),
          urgeCount: 1,
          lastUrgedAt: todayIso(),
          lastUrgedBy: input.urgedBy,
          lastUrgedNote: input.note.trim(),
        };
        dataset.assignments = [targetAssignment, ...dataset.assignments];
      } else {
        targetAssignment.urgeCount = (targetAssignment.urgeCount || 0) + 1;
        targetAssignment.lastUrgedAt = todayIso();
        targetAssignment.lastUrgedBy = input.urgedBy;
        targetAssignment.lastUrgedNote = input.note.trim();
        targetAssignment.priority = "HIGH"; // Tự động nâng ưu tiên khi đôn đốc
      }

      return clone(targetAssignment);
    },

    async reviewLeadSubmission({ assignmentId, submissionId, approved, leadName, feedbackNote }) {
      const assignment = findAssignment(assignmentId);
      if (!assignment.submissions) assignment.submissions = [];
      const sub = assignment.submissions.find((s) => s.id === submissionId);
      if (!sub) throw new Error("Không tìm thấy hồ sơ nộp.");
      sub.leadApprovalStatus = approved ? "LEAD_APPROVED" : "LEAD_REJECTED";
      sub.leadApprovedAt = todayIso();
      sub.leadApprovedBy = leadName;
      if (feedbackNote) sub.leadFeedbackNote = feedbackNote;
      return clone(assignment);
    },

    async submitProjectToDirector(params) {
      const project = dataset.projects.find((p) => p.id === params.projectId);
      if (!project) throw new Error("Không tìm thấy dự án.");
      project.directorApprovalStatus = "PENDING";
      project.directorSubmittedAt = todayIso();
      project.directorSubmittedBy = params.submittedBy || "Chủ nhiệm dự án";
      project.directorTargetRole = params.targetRole;
      project.directorTargetStaffName = params.targetStaffName;
      project.directorSubmissionNote = params.note;
      return clone(project);
    },

    async reviewProjectDirector(params) {
      const project = dataset.projects.find((p) => p.id === params.projectId);
      if (!project) throw new Error("Không tìm thấy dự án.");
      if (params.approved) {
        project.directorApprovalStatus = "APPROVED";
        project.status = "Đã hoàn thành";
      } else {
        project.directorApprovalStatus = "REJECTED";
      }
      project.directorReviewedAt = todayIso();
      project.directorReviewedBy = params.reviewedBy || "Ban Giám đốc";
      project.directorReviewNote = params.note;
      return clone(project);
    },
  };

  return new Proxy(repository, {
    get(target, property, receiver) {
      const method = Reflect.get(target, property, receiver);
      if (property === "getDataset" || typeof method !== "function") return method;
      return async (...args: unknown[]) => {
        const result = await method(...args);
        persistDataset();
        return result;
      };
    },
  });
}

export const mockPersonnelRepository = createMockPersonnelRepository();
