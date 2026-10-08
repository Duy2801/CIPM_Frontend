import type { WorkspaceRoleProfile, WorkspaceTask } from "../../../components/workspace/workspace.types.ts";

export type TeamId = "BGD" | "GSKT" | "HCTH" | "BT";
export type Employment = "Viên chức" | "Hợp đồng";
export type AssignmentStatus = "TODO" | "IN_PROGRESS" | "PENDING_APPROVAL" | "DONE";
export type AssignmentPriority = "HIGH" | "NORMAL";

export interface Team {
  id: TeamId;
  name: string;
  description: string;
  leaderId: string;
}

export interface Staff {
  id: string;
  name: string;
  title: string;
  /** Số CCCD / Căn cước công dân (12 số) */
  citizenId?: string;
  teamId: TeamId;
  /** Vai trò trên hệ thống, quyết định quyền truy cập các phân hệ */
  roleCode: string;
  employment: Employment;
  phone: string;
  email: string;
  accountActive: boolean;
  lockReason?: string;
  /** Danh sách các quyền hạn được cấp thêm (Granted Permissions) */
  permissions?: string[];
  /** Danh sách các quyền hạn bị thu hồi (Revoked Permissions) */
  revokedPermissions?: string[];
}

export interface PersonnelProject {
  id: string;
  code: string;
  name: string;
  /** Tình trạng dự án: Đang thi công, Chuẩn bị ĐT, Bồi thường GPMB, Đã hoàn thành,... */
  status?: string;
  /** Thời gian bắt đầu thực hiện dự án (YYYY-MM-DD) */
  startDate?: string;
  /** Thời gian hoàn thành dự án (YYYY-MM-DD) */
  endDate?: string;
  /** Người thực hiện chính do Giám đốc phân công (1 người duy nhất) */
  mainExecutorId?: string;
  /** Người giám sát chính do Giám đốc phân công (1 người duy nhất) */
  mainSupervisorId?: string;
  /** Ngày Giám đốc giao phân công */
  assignedAt?: string;
  note?: string;
  /** ID cán bộ được cấp role "Quyền Chủ nhiệm dự án" */
  actingDirectorId?: string;
  /** Ngày cấp role Quyền Chủ nhiệm dự án */
  actingDirectorAssignedAt?: string;
  /** Người cấp role (GĐ hoặc PGĐ) */
  actingDirectorAssignedBy?: string;
  /** Ghi chú phạm vi ủy quyền */
  actingDirectorNote?: string;
  /** Đánh dấu quyền Chủ nhiệm dự án đã bị thu hồi */
  cndaRevoked?: boolean;
  /** Danh sách ID thành viên tổ công tác dự án */
  teamMembers?: string[];
  /** Danh sách quyền ủy quyền được cấp cho cán bộ trên dự án này (ProjectPermissionGrant) */
  grantedPermissions?: string[];
  /** Trạng thái trình Ban Giám đốc phê duyệt kết thúc/nghiệm thu toàn bộ dự án */
  directorApprovalStatus?: "PENDING" | "APPROVED" | "REJECTED";
  /** Thời điểm CNDA trình Ban Giám đốc */
  directorSubmittedAt?: string;
  /** Tên cán bộ CNDA trình */
  directorSubmittedBy?: string;
  /** Lãnh đạo được trình: Giám đốc hoặc Phó Giám đốc */
  directorTargetRole?: "GIAM_DOC" | "PHO_GIAM_DOC";
  /** Cán bộ lãnh đạo đích danh được trình */
  directorTargetStaffName?: string;
  /** Nội dung tờ trình của CNDA */
  directorSubmissionNote?: string;
  /** Thời điểm Ban Giám đốc phê duyệt/từ chối */
  directorReviewedAt?: string;
  /** Người duyệt/từ chối (GĐ / PGĐ) */
  directorReviewedBy?: string;
  /** Ý kiến chỉ đạo / Lý do từ chối của Ban Giám đốc */
  directorReviewNote?: string;
}

export interface ProjectDocumentSubmission {
  id: string;
  documentCode: string;
  title: string;
  fileName: string;
  fileSize: string;
  submittedAt: string;
  submittedByStaffId: string;
  submittedByName: string;
  leadApprovalStatus: "PENDING_LEAD" | "LEAD_APPROVED" | "LEAD_REJECTED";
  leadApprovedAt?: string;
  leadApprovedBy?: string;
  leadFeedbackNote?: string;
  fileType?: "pdf" | "doc" | "docx" | "xlsx";
}

export interface Assignment {
  id: string;
  title: string;
  projectId: string;
  /** Giai đoạn dự án: PREPARATION, DESIGN, COMPENSATION, BIDDING, CONSTRUCTION, INSPECTION, SETTLEMENT */
  stage?: string;
  /** Mã bước thủ tục liên kết (ví dụ: VI.1, IV.1, ...) */
  stepCode?: string;
  stepName?: string;
  /** Người thực hiện chính của giai đoạn (chỉ 1 người duy nhất) */
  assigneeId?: string;
  /** Danh sách cán bộ phối hợp thực hiện cùng giai đoạn (có thể nhiều người) */
  coAssigneeIds?: string[];
  assignedBy: string;
  assignedAt: string;
  dueDate: string;
  status: AssignmentStatus;
  priority: AssignmentPriority;
  completedAt?: string;
  note?: string;
  /** Ghi chú lý do từ chối nếu bị trả lại */
  rejectionNote?: string;
  /** Thời điểm cán bộ gửi yêu cầu xác nhận hoàn thành */
  confirmRequestedAt?: string;
  /** Số lần được đôn đốc tiến độ */
  urgeCount?: number;
  /** Thời điểm đôn đốc gần nhất */
  lastUrgedAt?: string;
  /** Người thực hiện đôn đốc gần nhất */
  lastUrgedBy?: string;
  /** Nội dung nhắc nhở / chỉ đạo đôn đốc */
  lastUrgedNote?: string;
  /** Ý kiến nhận xét, thẩm tra hoặc lý do phê duyệt của Tổ trưởng chuyên môn */
  leadFeedbackNote?: string;
  leadApprovedBy?: string;
  leadApprovedAt?: string;
  /** Danh sách tài liệu thành viên nộp cho nhiệm vụ này (qua phê duyệt của Lead) */
  submissions?: ProjectDocumentSubmission[];
  /** Tổ chuyên môn đảm nhiệm giai đoạn / nhiệm vụ */
  teamId?: TeamId;
  /** ID Tổ trưởng quản lý (Lead tổ) */
  teamLeaderId?: string;
  /** Cấp phân công: PHASE_LEAD (CNDA giao Tổ trưởng) | TASK_MEMBER (Tổ trưởng giao Thành viên) */
  assignmentLevel?: "PHASE_LEAD" | "TASK_MEMBER";
  /** ID nhiệm vụ giai đoạn cha nếu là nhiệm vụ chi tiết của thành viên */
  parentAssignmentId?: string;
  /** Bước duyệt của nhiệm vụ con: tổ trưởng duyệt, rồi CNDA duyệt; chỉ hoàn thành khi giai đoạn cha được chốt. */
  approvalStage?: "LEAD_APPROVED" | "PROJECT_APPROVED" | "RETURNED_TO_LEAD";
  /** ID cán bộ thực hiện giao việc */
  assignedByStaffId?: string;
  /** Vai trò người giao việc */
  assignedByRole?: "PROJECT_LEAD" | "TEAM_LEAD" | "ADMIN";
}

export interface PersonnelDataset {
  teams: Team[];
  staff: Staff[];
  projects: PersonnelProject[];
  assignments: Assignment[];
}

export interface AssignmentInput {
  title: string;
  projectId: string;
  stage?: string;
  /** Mã bước thủ tục liên kết (ví dụ: VI.1, IV.1, ...) */
  stepCode?: string;
  stepName?: string;
  /** Người thực hiện chính (1 người duy nhất) */
  assigneeId: string;
  /** Cán bộ phối hợp (nhiều người) */
  coAssigneeIds?: string[];
  dueDate?: string;
  priority?: AssignmentPriority;
  note?: string;
  /** Tổ chuyên môn */
  teamId?: TeamId;
  /** ID Tổ trưởng quản lý (Lead tổ) */
  teamLeaderId?: string;
  /** Cấp phân công: PHASE_LEAD | TASK_MEMBER */
  assignmentLevel?: "PHASE_LEAD" | "TASK_MEMBER";
  /** ID nhiệm vụ cha */
  parentAssignmentId?: string;
  /** ID người giao việc */
  assignedByStaffId?: string;
  /** Vai trò người giao việc */
  assignedByRole?: "PROJECT_LEAD" | "TEAM_LEAD" | "ADMIN";
}

export interface ProjectLeadershipInput {
  projectId: string;
  mainExecutorId: string;
  mainSupervisorId: string;
  note?: string;
  grantActingDirector?: boolean;
  actingDirectorId?: string;
  actingDirectorNote?: string;
}

export interface GrantActingDirectorInput {
  projectId: string;
  staffId: string;
  assignedBy: string;
  note?: string;
}

export interface UrgeMemberInput {
  assignmentId?: string;
  projectId: string;
  staffId: string;
  urgedBy: string;
  note: string;
  urgencyLevel?: "NORMAL" | "HIGH" | "URGENT";
}

export interface StaffInput {
  name: string;
  title: string;
  /** Số CCCD / Căn cước công dân (12 số) */
  citizenId?: string;
  teamId: TeamId;
  roleCode: string;
  employment: Employment;
  phone: string;
  email: string;
  username?: string;
  password?: string;
  accountActive?: boolean;
  isLeader?: boolean;
  note?: string;
  permissions?: string[];
  revokedPermissions?: string[];
}

export type PersonnelTabKey = "assignments" | "project-tasks" | "team-tasks" | "project-team" | "organization" | "accounts";

export type AssignmentFilter = "ALL" | "OVERDUE" | "DUE_SOON" | "PENDING_APPROVAL" | "IN_PROGRESS" | "DONE" | "UNASSIGNED";

export interface PersonnelRolePermissions extends WorkspaceRoleProfile {
  roleCode: string;
  canExport: boolean;
  /** Chỉ Giám đốc (GĐ), Phó Giám đốc (PGĐ) và Quyền Chủ nhiệm DA mới có quyền truy cập M5 */
  canAccessModule: boolean;
  /** Phân công Người thực hiện chính & Người giám sát chính cho dự án (GĐ & PGĐ) */
  canAssignProjectLeaders: boolean;
  /** Cấp role Quyền Chủ nhiệm dự án (chỉ GĐ & PGĐ) */
  canGrantRole: boolean;
  /** Thu hồi role Quyền Chủ nhiệm dự án (chỉ GĐ & PGĐ) */
  canRevokeRole: boolean;
  /** Giao việc theo từng giai đoạn dự án / Phân công nhân viên */
  canAssign: boolean;
  /** Phân công nhiệm vụ nhân viên (chỉ Người có quyền chủ dự án) */
  canAssignStaffTasks: boolean;
  /** Là người có quyền chủ dự án */
  isProjectLeader?: boolean;
  /** Thêm/bớt và quản lý thành viên tổ công tác dự án */
  canManageTeamMembers: boolean;
  /** Quyền đôn đốc thành viên trong dự án */
  canUrgeMembers: boolean;
  /** Xem và quản lý cơ cấu tổ chức (chỉ Giám đốc & Phó Giám đốc) */
  canManageOrganization: boolean;
  /** Khóa / mở tài khoản hệ thống (chỉ Giám đốc – quản trị hệ thống) */
  canManageAccounts: boolean;
  defaultTab: PersonnelTabKey;
  actingProjectIds?: string[];
  /** Là cán bộ / thành viên tham gia tổ công tác dự án */
  isMember?: boolean;
  /** Danh sách các dự án mà cán bộ tham gia (thành viên hoặc có nhiệm vụ) */
  memberProjectIds?: string[];
  /** Là Tổ trưởng / Phụ trách tổ chuyên môn (Lead tổ) */
  isTeamLeader?: boolean;
  /** ID tổ chuyên môn do cán bộ này làm Tổ trưởng */
  leadingTeamId?: TeamId;
  /** Tên tổ chuyên môn do cán bộ này làm Tổ trưởng */
  leadingTeamName?: string;
}

export type PersonnelTask = WorkspaceTask<PersonnelTabKey> & { filter?: AssignmentFilter };
