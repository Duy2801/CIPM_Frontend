"use client";

import { useMemo, useState } from "react";
import type { ProcedureStep } from "@/shared/construction-procedures/types/procedure.types";
import { getParentCode } from "@/shared/construction-procedures/utils/step-dependencies";
import { getAncestorCodes, getStepDepth } from "../utils/step-tree";

export interface StepFlowProps {
  depth: number;
  incoming: boolean;
  fromParent: boolean;
  outgoing: boolean;
  passLevels: number[];
  childCount: number;
  expanded: boolean;
}

export function useStepTree(steps: ProcedureStep[]) {
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(() => new Set());

  const toggleExpanded = (code: string) =>
    setExpandedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  const expandTo = (code: string) => setExpandedCodes((prev) => new Set([...prev, ...getAncestorCodes(code), code]));

  const visibleSteps = useMemo(
    () => steps.filter((s) => getAncestorCodes(s.code).every((code) => expandedCodes.has(code))),
    [steps, expandedCodes],
  );

  const links = useMemo(() => {
    const codes = new Set(steps.map((s) => s.code));
    const prev = new Map<string, ProcedureStep>();
    const next = new Map<string, ProcedureStep>();
    const lastByParent = new Map<string, ProcedureStep>();
    const childCount = new Map<string, number>();
    for (const s of steps) {
      const parent = getParentCode(s.code) ?? "";
      const before = lastByParent.get(parent);
      if (before) {
        prev.set(s.code, before);
        next.set(before.code, s);
      }
      lastByParent.set(parent, s);
      if (parent) childCount.set(parent, (childCount.get(parent) ?? 0) + 1);
    }
    return { codes, prev, next, childCount };
  }, [steps]);

  const getFlowProps = (step: ProcedureStep): StepFlowProps => {
    const parent = getParentCode(step.code);
    const prevStep = links.prev.get(step.code);
    const childCount = links.childCount.get(step.code) ?? 0;
    const expanded = expandedCodes.has(step.code);
    return {
      depth: getStepDepth(step.code),
      incoming: !!prevStep,
      fromParent: !prevStep && !!parent && links.codes.has(parent),
      outgoing: links.next.has(step.code) || (expanded && childCount > 0),
      passLevels: getAncestorCodes(step.code).flatMap((code, level) => (links.next.has(code) ? [level] : [])),
      childCount,
      expanded,
    };
  };

  return {
    visibleSteps,
    getFlowProps,
    toggleExpanded,
    expandTo,
  };
}

export type StepTree = ReturnType<typeof useStepTree>;
