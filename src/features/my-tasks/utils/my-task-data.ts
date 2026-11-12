import type { ProjectProcedureData } from "../../construction-procedures/types/procedure.types.ts";
import {
  classifyOtherTask,
  collectTasks,
  groupTasks,
  type MyTask,
  type MyTaskTab,
  type TaskIdentity,
} from "./my-tasks.ts";

export interface TaskRef {
  projectId: string;
  stepId: string;
}

export interface MyTaskProjectOption {
  id: string;
  code: string;
  name: string;
  count: number;
}

export interface MyTaskData {
  projects: ProjectProcedureData[];
  tasks: Map<string, MyTask>;
  groups: Record<MyTaskTab, MyTask[]>;
  others: { kind: MyTaskTab; task: MyTask; proxy?: boolean }[];
  projectOptions: MyTaskProjectOption[];
}

export interface ProjectOwner {
  id?: string;
  name?: string;
}

export const taskKey = ({ projectId, stepId }: TaskRef) => `${projectId}:${stepId}`;
export const refOfTask = (task: MyTask): TaskRef => ({ projectId: task.projectId, stepId: task.step.id });

const norm = (value?: string) => (value ?? "").trim().toLowerCase();

export function buildMyTaskData(
  projects: ProjectProcedureData[],
  input: {
    today: string;
    me: TaskIdentity;
    canReview: (department: string) => boolean;
    ownerOf: (projectId: string) => ProjectOwner | undefined;
    reached?: ReadonlySet<string>;
    canProxy?: boolean;
  },
): MyTaskData {
  const all = collectTasks(projects, input.today, input.reached);
  const groups = groupTasks(all, projects, input.me, input.canReview);

  const projectOptions = new Map<string, MyTaskProjectOption>();
  for (const task of Object.values(groups).flat()) {
    const entry = projectOptions.get(task.projectId) ?? {
      id: task.projectId,
      code: task.projectCode,
      name: task.projectName,
      count: 0,
    };
    entry.count += 1;
    projectOptions.set(task.projectId, entry);
  }

  const isOwner = (projectId: string, fallbackName: string) => {
    const owner = input.ownerOf(projectId);
    if (input.me.id && owner?.id) return owner.id === input.me.id;
    const myName = norm(input.me.name);
    return Boolean(myName) && norm(owner?.name ?? fallbackName) === myName;
  };
  const owned = new Set(projects.filter((p) => isOwner(p.projectId, p.managerName)).map((p) => p.projectId));
  const mine = new Set(Object.values(groups).flat().map((t) => taskKey(refOfTask(t))));
  const others = all.flatMap((task) => {
    if (mine.has(taskKey(refOfTask(task)))) return [];
    if (!owned.has(task.projectId) && !input.canProxy) return [];
    const kind = classifyOtherTask(task);
    return kind ? [{ kind, task, proxy: input.canProxy }] : [];
  });
  if (input.canProxy) {
    for (const { task } of others) {
      if (projectOptions.has(task.projectId)) continue;
      projectOptions.set(task.projectId, { id: task.projectId, code: task.projectCode, name: task.projectName, count: 0 });
    }
  }

  return {
    projects,
    tasks: new Map(all.map((task) => [taskKey(refOfTask(task)), task])),
    groups,
    others,
    projectOptions: [...projectOptions.values()].sort((a, b) => a.name.localeCompare(b.name, "vi")),
  };
}
