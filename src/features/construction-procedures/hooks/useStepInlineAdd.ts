"use client";

import { useState } from "react";
import type { ProcedureStep, StepType } from "../types/procedure.types";
import {
  buildNewStep,
  getNextParentCode,
  getNextSubCode,
  insertStepHierarchically,
  isDescendantOf,
} from "../utils/step-tree";
import { missingFieldsMessage, missingStepFields, type StepRequiredField } from "../utils/step-validation";
import type { StepStaff } from "./useStepStaff";

export interface NewStepDraft {
  code: string;
  name: string;
  assignee: string;
  /** Người giám sát (không bắt buộc) */
  supervisor: string;
  days: string;
  type: StepType;
  error: string;
  /** Ô bắt buộc còn trống (chỉ có sau khi bấm thêm) */
  missing: StepRequiredField[];
}

const EMPTY_DRAFT: NewStepDraft = { code: "", name: "", assignee: "", supervisor: "", days: "", type: "MANDATORY", error: "", missing: [] };

/** Đã báo thiếu thì kiểm tra lại mỗi lần nhập, ô nào đủ thì bỏ tô đỏ */
const patchDraft = (d: NewStepDraft, patch: Partial<NewStepDraft>): NewStepDraft => {
  const next = { ...d, ...patch };
  if (!d.error) return next;
  const missing = missingStepFields(next);
  return { ...next, missing, error: missing.length ? missingFieldsMessage(missing) : "" };
};

/** Trả về bản nháp kèm lỗi nếu còn thiếu thông tin, null nếu đã đủ */
const withMissing = (d: NewStepDraft): NewStepDraft | null => {
  const missing = missingStepFields(d);
  return missing.length ? { ...d, missing, error: missingFieldsMessage(missing) } : null;
};

const CLEARED = { name: "", assignee: "", supervisor: "", days: "", error: "", missing: [] as StepRequiredField[] };

interface UseStepInlineAddOptions {
  steps: ProcedureStep[];
  setSteps: (steps: ProcedureStep[]) => void;
  staff: StepStaff;
  confirmChange: (title: string, content: string, onOk: () => void, onCancel?: () => void) => void;
  expandTo: (code: string) => void;
}

export function useStepInlineAdd({ steps, setSteps, staff, confirmChange, expandTo }: UseStepInlineAddOptions) {
  const [isAddingMain, setIsAddingMain] = useState(false);
  const [mainDraft, setMainDraft] = useState<NewStepDraft>(EMPTY_DRAFT);
  const [activeParent, setActiveParent] = useState<string | null>(null);
  const [subDraft, setSubDraft] = useState<NewStepDraft>(EMPTY_DRAFT);

  const build = (list: ProcedureStep[], parentCode: string | null, draft: NewStepDraft) =>
    buildNewStep(list, parentCode, {
      code: draft.code,
      name: draft.name,
      type: draft.type,
      days: draft.days,
      assignedTo: draft.assignee,
      assignedToId: staff.staffIdOf(draft.assignee),
      supervisor: draft.supervisor,
      supervisorId: staff.staffIdOf(draft.supervisor),
    });

  const toggleMain = () => {
    if (isAddingMain) {
      setIsAddingMain(false);
      return;
    }
    setIsAddingMain(true);
    setMainDraft({ ...EMPTY_DRAFT, code: getNextParentCode(steps) });
    setActiveParent(null);
  };

  const closeMain = () => setIsAddingMain(false);

  const updateMain = (patch: Partial<NewStepDraft>) => setMainDraft((d) => patchDraft(d, patch));

  const saveMain = () => {
    const invalid = withMissing(mainDraft);
    if (invalid) {
      setMainDraft(invalid);
      return;
    }
    confirmChange(
      "Thêm bước chính?",
      `Thêm bước [${mainDraft.code}] "${mainDraft.name.trim()}" vào quy trình.`,
      () => {
        setSteps(insertStepHierarchically(steps, build(steps, null, mainDraft)));
        setIsAddingMain(false);
        setMainDraft((d) => ({ ...d, ...CLEARED }));
      },
      () => {
        setIsAddingMain(false);
        setMainDraft((d) => ({ ...d, ...CLEARED }));
      },
    );
  };

  const toggleSub = (parentCode: string) => {
    if (activeParent === parentCode) {
      setActiveParent(null);
      return;
    }
    expandTo(parentCode);
    setActiveParent(parentCode);
    setSubDraft({ ...EMPTY_DRAFT, code: getNextSubCode(parentCode, steps) });
  };

  const closeSub = () => setActiveParent(null);

  const updateSub = (patch: Partial<NewStepDraft>) => setSubDraft((d) => patchDraft(d, patch));

  const saveSub = (keepOpen = false) => {
    if (!activeParent) return;
    const invalid = withMissing(subDraft);
    if (invalid) {
      setSubDraft(invalid);
      return;
    }
    const parentCode = activeParent;
    confirmChange(
      "Thêm bước con?",
      `Thêm bước [${subDraft.code}] "${subDraft.name.trim()}" vào bước [${parentCode}].`,
      () => {
        const updated = insertStepHierarchically(steps, build(steps, parentCode, subDraft), parentCode);
        setSteps(updated);
        if (keepOpen) {
          setSubDraft((d) => ({ ...d, ...CLEARED, code: getNextSubCode(parentCode, updated) }));
        } else {
          setActiveParent(null);
          setSubDraft((d) => ({ ...d, ...CLEARED }));
        }
      },
      () => {
        setActiveParent(null);
        setSubDraft((d) => ({ ...d, ...CLEARED }));
      },
    );
  };

  const onStepRemoved = (code: string) => {
    if (activeParent && (activeParent === code || isDescendantOf(activeParent, code))) setActiveParent(null);
  };

  const withPending = (list: ProcedureStep[]): ProcedureStep[] => {
    let pending = list;
    if (isAddingMain && mainDraft.name.trim()) pending = insertStepHierarchically(pending, build(pending, null, mainDraft));
    if (activeParent && subDraft.name.trim())
      pending = insertStepHierarchically(pending, build(pending, activeParent, subDraft), activeParent);
    return pending;
  };

  /** Bước con đang nhập (chưa lưu) đã có số ngày: đưa vào để số ngày bước cha nhảy ngay khi gõ */
  const withDraftDays = (list: ProcedureStep[]): ProcedureStep[] =>
    activeParent && Number(subDraft.days) > 0
      ? insertStepHierarchically(list, build(list, activeParent, subDraft), activeParent)
      : list;

  const closeAll = () => {
    setIsAddingMain(false);
    setMainDraft((d) => ({ ...d, name: "" }));
    setActiveParent(null);
    setSubDraft((d) => ({ ...d, name: "" }));
  };

  return {
    isAddingMain,
    mainDraft,
    toggleMain,
    closeMain,
    updateMain,
    saveMain,
    activeParent,
    subDraft,
    toggleSub,
    closeSub,
    updateSub,
    saveSub,
    onStepRemoved,
    withPending,
    withDraftDays,
    closeAll,
    hasPendingMain: isAddingMain && !!mainDraft.name.trim(),
  };
}

export type StepInlineAdd = ReturnType<typeof useStepInlineAdd>;
