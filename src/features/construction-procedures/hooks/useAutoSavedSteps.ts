"use client";

import { useEffect, useRef, useState } from "react";
import type { ProcedureStep, StepChange } from "../types/procedure.types";
import { saveProcedureSteps } from "../utils/procedure-library";
import { diffSteps } from "../utils/step-diff";
import { withParentRollups } from "../utils/step-duration";

const AUTO_SAVE_DELAY_MS = 500;

interface UseAutoSavedStepsOptions {
  procedureId?: string;
  onAutoSave?: (steps: ProcedureStep[], changes: StepChange[]) => void;
}

export function useAutoSavedSteps(steps: ProcedureStep[], { procedureId, onAutoSave }: UseAutoSavedStepsOptions) {
  const [localSteps, setLocalSteps] = useState<ProcedureStep[]>(steps);
  const [autoSavedAt, setAutoSavedAt] = useState<Date | null>(null);
  const savedStepsRef = useRef<ProcedureStep[]>(withParentRollups(steps));
  const lastSavedJsonRef = useRef<string | null>(null);

  useEffect(() => {
    savedStepsRef.current = withParentRollups(steps);
    if (lastSavedJsonRef.current !== JSON.stringify(steps)) setLocalSteps(steps);
    lastSavedJsonRef.current = null;
  }, [steps]);

  useEffect(() => {
    if (!procedureId) return;
    const timer = setTimeout(() => {
      const finalSteps = withParentRollups(localSteps);
      if (JSON.stringify(finalSteps) === JSON.stringify(savedStepsRef.current)) return;
      const changes = diffSteps(savedStepsRef.current, finalSteps);
      saveProcedureSteps(procedureId, finalSteps);
      savedStepsRef.current = finalSteps;
      lastSavedJsonRef.current = JSON.stringify(finalSteps);
      setAutoSavedAt(new Date());
      onAutoSave?.(finalSteps, changes);
    }, AUTO_SAVE_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSteps, procedureId]);

  return { localSteps, setLocalSteps, autoSavedAt };
}
