/**
 * components/workspace — Khối giao diện dùng chung cho các màn hình phân hệ nghiệp vụ
 *
 * Mỗi phân hệ có cùng bố cục: Header + bộ lọc → KPI → "Việc của bạn" theo vai trò → Tabs.
 * Nhờ đó người dùng chuyển giữa các phân hệ vẫn thấy quen thuộc.
 */

export { default as ModuleHeader } from "./ModuleHeader";
export { default as KpiCardGrid } from "./KpiCardGrid";
export { default as RoleWorkspacePanel } from "./RoleWorkspacePanel";
export { default as SectionIntro } from "./SectionIntro";
export { default as FilterChip } from "./FilterChip";
export { default as FeedbackBar } from "./FeedbackBar";
export { default as StepTrack } from "./StepTrack";
export { default as ModuleTabLabel } from "./ModuleTabLabel";
export { default as ReasonModal } from "./ReasonModal";
export { useActionFeedback } from "./useActionFeedback";
export type { ActionFeedback } from "./useActionFeedback";
export { sortWorkspaceTasks } from "./workspace.types";
export type {
  KpiItem,
  KpiTone,
  WorkspaceRoleProfile,
  WorkspaceStep,
  WorkspaceTask,
  WorkspaceTaskTone,
} from "./workspace.types";
