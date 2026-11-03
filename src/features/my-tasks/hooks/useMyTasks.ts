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
import type { ProcedureDocument, ProjectProcedureData } from "@/features/construction-procedures/types/procedure.types";
import { getAppliedDepartments, getProcedureProgress } from "@/features/projects_works/utils/project-procedure-flow";
import {
  approveTask,
  collectTasks,
  groupTasks,
  matchesSearch,
  rejectTask,
  submitTask,
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

  const [projects, setProjects] = useState<ProjectProcedureData[]>(() => loadProcedureProjects());
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
    /** Tải lại dữ liệu (vd. sau khi sửa ở trang dự án) */
    reload: () => setProjects(loadProcedureProjects()),
    submit: (task: MyTask, input: { note?: string; documents?: ProcedureDocument[] }) =>
      run(task, (data) => submitTask(data, task.step.id, input, actor)),
    approve: (task: MyTask) => run(task, (data) => approveTask(data, task.step.id, actor)),
    reject: (task: MyTask, reason: string) => run(task, (data) => rejectTask(data, task.step.id, reason, actor)),
  };
}

export type MyTasksController = ReturnType<typeof useMyTasks>;
