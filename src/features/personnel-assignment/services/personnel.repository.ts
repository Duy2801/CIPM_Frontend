import type {
  Assignment,
  AssignmentInput,
  GrantActingDirectorInput,
  PersonnelDataset,
  PersonnelProject,
  ProjectDocumentSubmission,
  ProjectLeadershipInput,
  Staff,
  StaffInput,
  UrgeMemberInput,
} from "../types/personnel.types";

/** Ranh giới dữ liệu M5 – backend chỉ cần cung cấp implementation cùng interface */
export interface PersonnelRepository {
  getDataset(): Promise<PersonnelDataset>;
  assignProjectLeaders(input: ProjectLeadershipInput): Promise<PersonnelProject>;
  grantActingDirector(input: GrantActingDirectorInput): Promise<PersonnelProject>;
  revokeActingDirector(projectId: string): Promise<PersonnelProject>;
  addProjectMember(projectId: string, staffId: string): Promise<PersonnelProject>;
  addProjectMembers(projectId: string, staffIds: string[]): Promise<PersonnelProject>;
  removeProjectMember(projectId: string, staffId: string): Promise<PersonnelProject>;
  createAssignment(input: AssignmentInput, actor: string): Promise<Assignment>;
  updateAssignment(id: string, input: AssignmentInput): Promise<Assignment>;
  deleteAssignment(id: string): Promise<boolean>;
  startAssignment(id: string): Promise<Assignment>;
  completeAssignment(id: string, submission?: Partial<ProjectDocumentSubmission>): Promise<Assignment>;
  acceptAssignment(id: string, note?: string): Promise<Assignment>;
  undoAcceptAssignment(id: string): Promise<Assignment>;
  rejectAssignment(id: string, reason: string): Promise<Assignment>;
  returnToMember(id: string): Promise<Assignment>;
  requestCompletion(id: string, submission?: Partial<ProjectDocumentSubmission>): Promise<Assignment>;
  addAssignmentSubmission(assignmentId: string, submission: Partial<ProjectDocumentSubmission>): Promise<Assignment>;
  addAssignmentSubmissions(assignmentId: string, submissions: Partial<ProjectDocumentSubmission>[]): Promise<Assignment>;
  removeAssignmentSubmission(assignmentId: string, submissionId: string): Promise<Assignment>;
  setAccountActive(staffId: string, active: boolean, reason?: string): Promise<Staff>;
  createStaff(input: StaffInput): Promise<Staff>;
  updateStaff(staffId: string, input: Partial<StaffInput>): Promise<Staff>;
  updateProjectPermissions(projectId: string, grantedPermissions: string[]): Promise<PersonnelProject>;
  urgeMember(input: UrgeMemberInput): Promise<Assignment>;
  reviewLeadSubmission(params: {
    assignmentId: string;
    submissionId: string;
    approved: boolean;
    leadName: string;
    feedbackNote?: string;
  }): Promise<Assignment>;
  submitProjectToDirector(params: {
    projectId: string;
    targetRole: "GIAM_DOC" | "PHO_GIAM_DOC";
    targetStaffName?: string;
    note?: string;
    submittedBy?: string;
  }): Promise<PersonnelProject>;
  reviewProjectDirector(params: {
    projectId: string;
    approved: boolean;
    note?: string;
    reviewedBy?: string;
  }): Promise<PersonnelProject>;
}
