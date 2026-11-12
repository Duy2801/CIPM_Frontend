"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { canUserDo, hasMatrixPermission } from "@/access-control";
import { useAuth } from "@/features/auth";
import type { Permission } from "@/types/auth";
import { isLeadOfDepartment } from "@/features/construction-procedures/constants/procedure-department-templates";
import { MY_TASK_COLUMN_ORDER, MY_TASK_COLUMNS, REVIEWER_ONLY_TABS, type MyTaskColumn } from "../constants/my-task-tabs";
import { getMyTaskData, getStepHistory } from "../services/my-tasks.api";
import { refOfTask, taskKey, type MyTaskData, type TaskRef } from "../utils/my-task-data";
import { hasIncident, hasStartedWork, isMine, matchesSearch, type MyTaskItem } from "../utils/my-tasks";
import { useMyTaskStore } from "./useMyTaskStore";

export const PROXY_PERMISSION = "procedure:proxy_step" as Permission;

export const myTaskKeys = {
  all: ["my-tasks"] as const,
  data: (userKey: string) => [...myTaskKeys.all, "data", userKey] as const,
  history: (ref: TaskRef) => [...myTaskKeys.all, "history", ref.projectId, ref.stepId] as const,
};

const EMPTY_DATA: MyTaskData = {
  projects: [],
  tasks: new Map(),
  groups: { accept: [], todo: [], returned: [], submitted: [], done: [], incident: [], review: [], approved: [], rejected: [] },
  others: [],
  projectOptions: [],
};

export function useMyTaskIdentity() {
  const { user } = useAuth();
  return useMemo(() => {
    const me = { id: user?.id, name: user?.displayName || user?.name || "" };
    const canApproveAll =
      canUserDo(user, "m3_construction_procedures", "approve") || hasMatrixPermission(user, "m3.approve_step");
    return {
      me,
      actor: { name: me.name || "Cán bộ", role: user?.roleName || "Cán bộ Ban QLDA" },
      isReviewer: canApproveAll || isLeadOfDepartment(user),
      canProxy: (user?.permissions ?? []).includes(PROXY_PERMISSION),
      canReview: (department: string) => canApproveAll || isLeadOfDepartment(user, department),
      userKey: `${user?.id ?? ""}|${me.name}|${user?.role ?? ""}|${(user?.permissions ?? []).length}`,
    };
  }, [user]);
}

export function useMyTaskData(): MyTaskData {
  const { me, canReview, canProxy, userKey } = useMyTaskIdentity();
  const { data } = useQuery({
    queryKey: [...myTaskKeys.data(userKey), canProxy],
    queryFn: () => getMyTaskData(me, canReview, canProxy),
  });
  return data ?? EMPTY_DATA;
}

export function useMyTask(ref: TaskRef | null | undefined) {
  const { tasks } = useMyTaskData();
  return ref ? (tasks.get(taskKey(ref)) ?? null) : null;
}

export function useMyTaskHistory(ref: TaskRef) {
  return useQuery({ queryKey: myTaskKeys.history(ref), queryFn: () => getStepHistory(ref) });
}

export function useMyTaskAccess(ref: TaskRef | null | undefined) {
  const { groups } = useMyTaskData();
  const { me, canReview, canProxy } = useMyTaskIdentity();
  const task = useMyTask(ref);
  if (!task) {
    return {
      isProxy: false,
      canSubmit: false,
      canReview: false,
      canAccept: false,
      canReportIncident: false,
      canResolveIncident: false,
      canDecline: false,
      canGiveBack: false,
    };
  }
  const key = taskKey(refOfTask(task));
  const inGroup = (tab: keyof typeof groups) => groups[tab].some((t) => taskKey(refOfTask(t)) === key);
  const working = task.flow === "IN_PROGRESS" || task.flow === "RETURNED";
  const mine = isMine(task.step, me);
  const incident = hasIncident(task.step);
  const isProxy = !mine && canProxy && Boolean(task.step.assignedTo || task.step.assignedToId);
  const started = hasStartedWork(task.step);
  return {
    isProxy,
    canSubmit:
      task.reached && working && !incident && ((mine && !inGroup("accept")) || (isProxy && (started || task.flow === "RETURNED"))),
    canReview: task.flow === "AWAITING_APPROVAL" && inGroup("review"),
    canAccept:
      task.reached && (inGroup("accept") || (isProxy && task.flow === "IN_PROGRESS" && !started && !incident)),
    canReportIncident:
      !["COMPLETED", "SKIPPED", "DISABLED"].includes(task.flow) &&
      (mine || isProxy || canReview(task.reviewDepartment)) &&
      !incident,
    canResolveIncident: incident && canReview(task.reviewDepartment),
    canDecline: working && mine && !incident,
    canGiveBack: task.flow === "AWAITING_APPROVAL" && mine,
  };
}

export type MyTaskAccess = ReturnType<typeof useMyTaskAccess>;

export function useMyTaskColumns() {
  const { groups, others, projectOptions } = useMyTaskData();
  const { isReviewer } = useMyTaskIdentity();
  const keyword = useMyTaskStore((s) => s.keyword);
  const procedure = useMyTaskStore((s) => s.procedure);

  return useMemo(() => {
    const build = (col: MyTaskColumn): MyTaskItem[] => {
      const seen = new Set<string>();
      const kinds = MY_TASK_COLUMNS[col].kinds;
      const mine: MyTaskItem[] = kinds
        .filter((k) => isReviewer || !REVIEWER_ONLY_TABS.includes(k))
        .flatMap((kind) =>
          groups[kind]
            .filter((task) => matchesSearch(task, keyword))
            .flatMap((task) => {
              const key = taskKey(refOfTask(task));
              if (seen.has(key)) return [];
              seen.add(key);
              return [{ kind, task }];
            }),
        );
      const shared = others
        .filter((o) => kinds.includes(o.kind) && matchesSearch(o.task, keyword) && !seen.has(taskKey(refOfTask(o.task))))
        .map((o) => ({ ...o, readonly: !o.proxy }));
      const items = [...mine, ...shared];
      return col === "accept"
        ? items.sort(
            (a, b) =>
              Number(b.task.reached) - Number(a.task.reached) ||
              a.task.projectName.localeCompare(b.task.projectName) ||
              a.task.step.order - b.task.step.order,
          )
        : items;
    };
    const columns = Object.fromEntries(MY_TASK_COLUMN_ORDER.map((col) => [col, build(col)])) as Record<
      MyTaskColumn,
      MyTaskItem[]
    >;

    const query = keyword.trim().toLowerCase();
    const matchedProjects = projectOptions.filter(
      (p) => p.name.toLowerCase() !== query && (!query || `${p.name} ${p.code}`.toLowerCase().includes(query)),
    );
    const selectedProject = projectOptions.find((p) => p.name.toLowerCase() === query);
    const procedureOptions = selectedProject
      ? [
          ...new Set(
            Object.values(columns)
              .flat()
              .filter((it) => it.task.projectId === selectedProject.id)
              .map((it) => it.task.procedureName),
          ),
        ].sort((a, b) => a.localeCompare(b, "vi"))
      : [];
    const activeProcedure = procedure && procedureOptions.includes(procedure) ? procedure : undefined;
    const shown = activeProcedure
      ? (Object.fromEntries(
          MY_TASK_COLUMN_ORDER.map((col) => [col, columns[col].filter((it) => it.task.procedureName === activeProcedure)]),
        ) as Record<MyTaskColumn, MyTaskItem[]>)
      : columns;

    const mineOf = (col: MyTaskColumn) => shown[col].filter((it) => !it.readonly && !it.proxy);
    return {
      columns: shown,
      segments: MY_TASK_COLUMN_ORDER.map((col) => ({
        key: col,
        label: MY_TASK_COLUMNS[col].label,
        count: mineOf(col).length,
        color: MY_TASK_COLUMNS[col].color,
      })),
      projectCount: new Set(MY_TASK_COLUMN_ORDER.flatMap(mineOf).map((it) => it.task.projectId)).size,
      matchedProjects,
      procedureOptions,
      activeProcedure,
    };
  }, [groups, others, projectOptions, isReviewer, keyword, procedure]);
}
