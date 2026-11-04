"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/features/auth";
import { canUserDo, hasMatrixPermission } from "@/access-control";
import { useProjectStore } from "@/stores/project.store";
import { isLeadOfDepartment } from "@/features/construction-procedures/constants/procedure-department-templates";
import {
  loadProcedureProjects,
  saveProjectProcedure,
} from "@/features/construction-procedures/utils/project-procedure-storage";
import type {
  ProcedureDocument,
  ProjectProcedureData,
} from "@/features/construction-procedures/types/procedure.types";
import { hasBackendSession } from "@/features/personnel-assignment/services/backend";
import { ensureMyTasksDemo, resetMyTasksDemo } from "../utils/my-tasks-demo";
import { getAppliedDepartments, getProcedureProgress } from "@/features/projects_works/utils/project-procedure-flow";
import {
  acceptTask,
  addTaskDocuments,
  classifyOtherTask,
  handBackTask,
  reportTaskIncident,
  resolveTaskIncident,
  approveTask,
  removeTaskDocument,
  saveTaskNote,
  collectTasks,
  groupTasks,
  matchesSearch,
  rejectTask,
  submitTask,
  type HandbackMode,
  type MyTask,
  type MyTaskTab,
} from "../utils/my-tasks";

export const ALL_PROJECTS = "ALL";

/** Màn "Việc cần xử lý": việc của người đang đăng nhập trên mọi dự án, kèm thao tác nộp / duyệt / từ chối */
export function useMyTasks() {
  const { user } = useAuth();
  const updateProject = useProjectStore((s) => s.updateProject);
  const me = useMemo(
    () => ({ id: user?.id, name: user?.displayName || user?.name || "" }),
    [user?.id, user?.displayName, user?.name],
  );
  const actor = { name: me.name || "Cán bộ", role: user?.roleName || "Cán bộ Ban QLDA" };

  const [projects, setProjects] = useState<ProjectProcedureData[]>(() => {
    // Tài khoản thử nghiệm: nạp 2 dự án demo giao việc cho người đang đăng nhập
    ensureMyTasksDemo(me.name);
    return loadProcedureProjects();
  });
  const isDemo = !hasBackendSession();
  const [projectId, setProjectId] = useState<string>(ALL_PROJECTS);
  const [keyword, setKeyword] = useState("");

  // Duyệt bước: quyền duyệt M3 (mọi phòng ban) hoặc Tổ trưởng của phòng ban đó
  const canApproveAll =
    canUserDo(user, "m3_construction_procedures", "approve") || hasMatrixPermission(user, "m3.approve_step");
  const canReview = (department: string) => canApproveAll || isLeadOfDepartment(user, department);
  const isReviewer = canApproveAll || isLeadOfDepartment(user);

  const today = new Date().toISOString().slice(0, 10);
  const allTasks = useMemo(() => collectTasks(projects, today), [projects, today]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allGroups = useMemo(() => groupTasks(allTasks, projects, me, canReview), [allTasks, projects, me, isReviewer]);

  /** Dự án có việc liên quan tới người này (để chọn trong ô "Dự án") */
  const projectOptions = useMemo(() => {
    const related = new Map<string, { id: string; code: string; name: string; count: number }>();
    for (const list of Object.values(allGroups)) {
      for (const task of list) {
        const entry = related.get(task.projectId) ?? { id: task.projectId, code: task.projectCode, name: task.projectName, count: 0 };
        entry.count += 1;
        related.set(task.projectId, entry);
      }
    }
    return [...related.values()].sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [allGroups]);

  const groups = useMemo(() => {
    const filter = (list: MyTask[]) =>
      list.filter((t) => (projectId === ALL_PROJECTS || t.projectId === projectId) && matchesSearch(t, keyword));
    return Object.fromEntries(
      Object.entries(allGroups).map(([tab, list]) => [tab, filter(list)]),
    ) as Record<MyTaskTab, MyTask[]>;
  }, [allGroups, projectId, keyword]);

  /** Việc của người khác (không thuộc nhóm nào của mình) — hiện mờ trên bảng để biết tiến độ chung */
  const others = useMemo(() => {
    const mine = new Set(Object.values(allGroups).flat().map((t) => `${t.projectId}:${t.step.id}`));
    return allTasks.flatMap((task) => {
      if (mine.has(`${task.projectId}:${task.step.id}`)) return [];
      if (projectId !== ALL_PROJECTS && task.projectId !== projectId) return [];
      if (!matchesSearch(task, keyword)) return [];
      const kind = classifyOtherTask(task);
      return kind ? [{ kind, task }] : [];
    });
  }, [allGroups, allTasks, projectId, keyword]);

  /** Tìm việc theo dự án + mã bước (lấy bản mới nhất để mở chi tiết) */
  const findTask = (projectIdOfLog: string, stepId: string) =>
    allTasks.find((t) => t.projectId === projectIdOfLog && t.step.id === stepId);

  /** Ghi quy trình của dự án + cập nhật phần trăm hoàn thành ở danh sách dự án */
  const persist = (next: ProjectProcedureData) => {
    saveProjectProcedure(next);
    setProjects((prev) => prev.map((p) => (p.projectId === next.projectId ? next : p)));
    const departments = getAppliedDepartments(next.departmentStatuses, next.steps);
    updateProject(next.projectId, {
      actualProgress: getProcedureProgress(departments, next.steps, next.stageApprovals),
    });
  };
  const run = (task: MyTask, change: (data: ProjectProcedureData) => ProjectProcedureData) => {
    // Đọc lại bản mới nhất (có thể vừa sửa ở tab khác) trước khi ghi
    const latest = loadProcedureProjects().find((p) => p.projectId === task.projectId);
    if (!latest) return false;
    persist(change(latest));
    return true;
  };

  return {
    user,
    me,
    isReviewer,
    projectId,
    setProjectId,
    keyword,
    setKeyword,
    projectOptions,
    groups,
    others,
    findTask,
    /** Tải lại dữ liệu (vd. sau khi sửa ở trang dự án) */
    reload: () => setProjects(loadProcedureProjects()),
    isDemo,
    /** Ghi lại dữ liệu demo từ đầu (bỏ các thao tác đã làm trên dự án demo) */
    resetDemo: () => {
      resetMyTasksDemo(me.name);
      setProjects(loadProcedureProjects());
    },
    /**
     * Nộp ngay bằng ghi chú + hồ sơ đã lưu trên bước (không mở form).
     * Đọc bản mới nhất (ghi chú vừa tự lưu khi rời ô) để kiểm tra có nội dung chưa.
     */
    submitNow: (task: MyTask): "ok" | "empty" | "notfound" => {
      const latest = loadProcedureProjects().find((p) => p.projectId === task.projectId);
      const step = latest?.steps.find((s) => s.id === task.step.id);
      if (!latest || !step) return "notfound";
      if (!step.submissionNote?.trim() && step.attachments.length === 0) return "empty";
      persist(submitTask(latest, step.id, {}, actor));
      return "ok";
    },
    saveNote: (task: MyTask, note: string) => run(task, (data) => saveTaskNote(data, task.step.id, note)),
    addDocuments: (task: MyTask, documents: ProcedureDocument[]) =>
      run(task, (data) => addTaskDocuments(data, task.step.id, documents, actor)),
    removeDocument: (task: MyTask, documentId: string) =>
      run(task, (data) => removeTaskDocument(data, task.step.id, documentId, actor)),
    approve: (task: MyTask) => run(task, (data) => approveTask(data, task.step.id, actor)),
    reject: (task: MyTask, reason: string) => run(task, (data) => rejectTask(data, task.step.id, reason, actor)),
    accept: (task: MyTask) => run(task, (data) => acceptTask(data, task.step.id, actor)),
    reportIncident: (task: MyTask, reason: string) =>
      run(task, (data) => reportTaskIncident(data, task.step.id, reason, actor)),
    resolveIncident: (task: MyTask) => run(task, (data) => resolveTaskIncident(data, task.step.id, actor)),
    handBack: (task: MyTask, mode: HandbackMode, reason: string) =>
      run(task, (data) => handBackTask(data, task.step.id, mode, reason, actor)),
    canReview,
  };
}

export type MyTasksController = ReturnType<typeof useMyTasks>;
