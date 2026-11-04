"use client";

import { useEffect, useRef, useState } from "react";
import type { ProcedureStep, StepType } from "../types/procedure.types";
import { buildDurationFields, getStepDays } from "../utils/step-duration";
import { missingFieldsMessage, missingStepFields, type StepRequiredField } from "../utils/step-validation";
import type { StepStaff } from "./useStepStaff";

export const FLOATING_LAYER_SELECTOR = "[class*='ant-select-dropdown'], .ant-modal-root, .ant-modal-wrap";

export interface StepEditDraft {
  name: string;
  type: StepType;
  days: string;
  assignedTo: string;
  supervisor: string;
}

interface UseStepRowEditOptions {
  steps: ProcedureStep[];
  staff: StepStaff;
  confirmChange: (title: string, content: string, onOk: () => void, onCancel?: () => void) => void;
  onUpdate: (stepId: string, updates: Partial<ProcedureStep>) => void;
  onStart?: () => void;
}

export function useStepRowEdit({ steps, staff, confirmChange, onUpdate, onStart }: UseStepRowEditOptions) {
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [draft, setDraft] = useState<StepEditDraft>({
    name: "",
    type: "MANDATORY",
    days: "",
    assignedTo: "",
    supervisor: "",
  });
  const [daysTouched, setDaysTouched] = useState(false);
  const [error, setError] = useState("");
  const [missing, setMissing] = useState<StepRequiredField[]>([]);
  const [focusAssignee, setFocusAssignee] = useState(false);

  const start = (step: ProcedureStep, toAssignee = false) => {
    onStart?.();
    setEditingStepId(step.id);
    setFocusAssignee(toAssignee);
    const days = getStepDays(step);
    setDraft({
      name: step.name,
      type: step.type,
      days: days ? String(days) : "",
      assignedTo: step.assignedTo || "",
      supervisor: step.supervisor || "",
    });
    setDaysTouched(false);
    setError("");
    setMissing([]);
  };

  const cancel = () => {
    setEditingStepId(null);
    setError("");
    setMissing([]);
  };

  /** Bước có bước con thì số ngày tính từ bước con, không bắt nhập */
  const findMissing = (d: StepEditDraft, id: string | null = editingStepId) => {
    const code = steps.find((s) => s.id === id)?.code;
    const hasChildren = !!code && steps.some((s) => s.code.startsWith(`${code}.`));
    return missingStepFields({ name: d.name, assignee: d.assignedTo, days: d.days }, !hasChildren);
  };

  const apply = () => {
    if (!editingStepId) return;
    const name = draft.name.trim();
    const current = steps.find((s) => s.id === editingStepId);
    onUpdate(editingStepId, {
      name,
      ...(current && !current.code.includes(".") ? { groupTitle: name } : {}),
      type: draft.type,
      ...(daysTouched ? buildDurationFields(draft.days) : {}),
      ...((current?.assignedTo || "") !== draft.assignedTo ? staff.buildAssignment(draft.assignedTo || undefined) : {}),
      ...((current?.supervisor || "") !== draft.supervisor
        ? { supervisor: draft.supervisor || undefined, supervisorId: staff.staffIdOf(draft.supervisor) }
        : {}),
      ...(draft.type === "MANDATORY" && current && !current.isEnabled
        ? { isEnabled: true, status: current.status === "DISABLED" ? "NOT_STARTED" : current.status }
        : {}),
    });
    const editedId = editingStepId;
    setEditingStepId((cur) => (cur === editedId ? null : cur));
    setError("");
    setMissing([]);
  };

  const save = () => {
    if (!editingStepId) return;
    const name = draft.name.trim();
    const lacking = findMissing(draft);
    if (lacking.length) {
      setMissing(lacking);
      setError(missingFieldsMessage(lacking));
      return;
    }
    const current = steps.find((s) => s.id === editingStepId);
    const unchanged =
      !!current &&
      current.name === name &&
      current.type === draft.type &&
      (current.assignedTo || "") === draft.assignedTo &&
      (current.supervisor || "") === draft.supervisor &&
      !daysTouched;
    if (unchanged) {
      cancel();
      return;
    }
    confirmChange("Lưu thay đổi?", `Cập nhật bước [${current?.code ?? ""}] "${name}".`, apply, cancel);
  };

  const updateDraft = (patch: Partial<StepEditDraft>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    if ("days" in patch) setDaysTouched(true);
    if (error) {
      const lacking = findMissing(next);
      setMissing(lacking);
      setError(lacking.length ? missingFieldsMessage(lacking) : "");
    }
  };

  const rowRef = useRef<HTMLDivElement>(null);
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  useEffect(() => {
    if (!editingStepId) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (!target || rowRef.current?.contains(target) || target.closest(FLOATING_LAYER_SELECTOR)) return;
      saveRef.current();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [editingStepId]);

  return { editingStepId, draft, error, missing, focusAssignee, rowRef, start, cancel, save, updateDraft };
}

export type StepRowEdit = ReturnType<typeof useStepRowEdit>;
