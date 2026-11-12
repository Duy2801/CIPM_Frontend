"use client";

import { useState } from "react";
import { useProcedureLibrary } from "@/features/construction-procedures/hooks/useProcedureLibrary";
import type { ProcedureLibraryItem } from "@/features/construction-procedures/utils/procedure-library";
import { procedureTarget } from "../utils/procedure-target";
import type { ProjectProcedureController } from "./useProjectProcedure";

export function useProcedureDraft(procedure: ProjectProcedureController) {
  const { appliedDepartments, departmentStatus } = procedure;
  const { procedures: library } = useProcedureLibrary();

  const applied = Object.fromEntries(
    appliedDepartments.flatMap((dept) => {
      const id = departmentStatus(dept)?.procedureId;
      return id ? [[dept, id]] : [];
    }),
  ) as Record<string, string>;
  const pickable = library.filter((p) => p.enabled || Object.values(applied).includes(p.id));
  const savedLabels: Record<string, string> = Object.fromEntries(
    appliedDepartments.flatMap((dept) => {
      const st = departmentStatus(dept);
      return st?.procedureId && st.tabLabel ? [[st.procedureId, st.tabLabel]] : [];
    }),
  );
  const appliedNames = Object.fromEntries(
    appliedDepartments.flatMap((dept) => {
      const st = departmentStatus(dept);
      return st?.procedureId ? [[st.procedureId, st.procedureName ?? dept]] : [];
    }),
  );

  const [procDraft, setProcDraft] = useState<Record<string, string> | null>(null);
  const [labelDraft, setLabelDraft] = useState<Record<string, string>>({});
  const shown = procDraft ?? applied;
  const shownLabels = { ...savedLabels, ...labelDraft };

  const toggle = (item: ProcedureLibraryItem, checked: boolean) => {
    const rest = Object.fromEntries(Object.entries(shown).filter(([, id]) => id !== item.id));
    setProcDraft(checked ? { ...rest, [procedureTarget(item, rest)]: item.id } : rest);
  };

  const uncheckMany = (items: ProcedureLibraryItem[]) => {
    const ids = new Set(items.map((p) => p.id));
    setProcDraft(Object.fromEntries(Object.entries(shown).filter(([, id]) => !ids.has(id))));
    setLabelDraft((prev) => Object.fromEntries(Object.entries(prev).filter(([id]) => !ids.has(id))));
  };

  const changeLabel = (procedureId: string, label: string) =>
    setLabelDraft((prev) => {
      const next = { ...prev, [procedureId]: label.trim() };
      if ((savedLabels[procedureId] ?? "") === label.trim()) delete next[procedureId];
      return next;
    });

  const appliedIds = new Set(Object.values(applied));
  const shownIds = new Set(Object.values(shown));
  const removed = Object.entries(applied).filter(([, id]) => !shownIds.has(id));
  const added = Object.values(shown).filter((id) => !appliedIds.has(id));
  const renamed = Object.entries(labelDraft).filter(([id]) => shownIds.has(id));
  const changeCount = removed.length + added.length + renamed.length;

  const nameOf = (id: string) =>
    library.find((p) => p.id === id)?.name ??
    Object.values(procedure.data.departmentStatuses ?? {}).find((st) => st.procedureId === id)?.procedureName ??
    "Quy trình";

  const save = () => {
    const occupied: Record<string, string> = Object.fromEntries(Object.entries(applied).filter(([, id]) => shownIds.has(id)));
    const add = added.flatMap((id) => {
      const item = library.find((p) => p.id === id);
      if (!item) return [];
      const department = procedureTarget(item, occupied);
      occupied[department] = id;
      return [{ department, procedure: item }];
    });
    const keyOf = Object.fromEntries(Object.entries(occupied).map(([dept, id]) => [id, dept]));
    procedure.saveProcedureChanges({
      remove: removed.map(([dept]) => dept),
      add,
      labels: Object.fromEntries(renamed.flatMap(([id, label]) => (keyOf[id] ? [[keyOf[id], label]] : []))),
    });
  };

  return {
    pickable,
    shown,
    shownLabels,
    savedLabels,
    appliedNames,
    toggle,
    uncheckMany,
    changeLabel,
    added,
    removed,
    renamed,
    changeCount,
    nameOf,
    save,
    reset: () => {
      setProcDraft(null);
      setLabelDraft({});
    },
  };
}

export type ProcedureDraft = ReturnType<typeof useProcedureDraft>;
