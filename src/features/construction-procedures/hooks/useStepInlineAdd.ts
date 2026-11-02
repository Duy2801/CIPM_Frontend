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
import type { StepStaff } from "./useStepStaff";

export interface NewStepDraft {
  code: string;
  name: string;
  assignee: string;
  days: string;
  type: StepType;
  error: string;
}

const EMPTY_DRAFT: NewStepDraft = { code: "", name: "", assignee: "", days: "", type: "MANDATORY", error: "" };

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

  const updateMain = (patch: Partial<NewStepDraft>) =>
    setMainDraft((d) => ({ ...d, ...patch, ...("name" in patch ? { error: "" } : {}) }));

  const saveMain = () => {
    if (!mainDraft.name.trim()) {
      setMainDraft((d) => ({ ...d, error: "Vui lòng nhập tên bước chính" }));
      return;
    }
    confirmChange(
      "Thêm bước chính?",
      `Thêm bước [${mainDraft.code}] "${mainDraft.name.trim()}" vào quy trình.`,
      () => {
        setSteps(insertStepHierarchically(steps, build(steps, null, mainDraft)));
        setIsAddingMain(false);
        setMainDraft((d) => ({ ...d, name: "", error: "" }));
      },
      () => {
        setIsAddingMain(false);
        setMainDraft((d) => ({ ...d, name: "", error: "" }));
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

  const updateSub = (patch: Partial<NewStepDraft>) =>
    setSubDraft((d) => ({ ...d, ...patch, ...("name" in patch ? { error: "" } : {}) }));

  const saveSub = (keepOpen = false) => {
    if (!activeParent) return;
    if (!subDraft.name.trim()) {
      setSubDraft((d) => ({ ...d, error: "Vui lòng nhập tên bước con" }));
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
          setSubDraft((d) => ({ ...d, name: "", error: "", assignee: "", code: getNextSubCode(parentCode, updated) }));
        } else {
          setActiveParent(null);
          setSubDraft((d) => ({ ...d, name: "", error: "", assignee: "" }));
        }
      },
      () => {
        setActiveParent(null);
        setSubDraft((d) => ({ ...d, name: "", error: "", assignee: "" }));
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
    closeAll,
    hasPendingMain: isAddingMain && !!mainDraft.name.trim(),
  };
}

export type StepInlineAdd = ReturnType<typeof useStepInlineAdd>;
