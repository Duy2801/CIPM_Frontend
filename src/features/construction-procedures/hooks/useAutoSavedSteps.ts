"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "@/components/ui";
import { useAuth } from "@/features/auth";
import { hasBackendSession } from "@/features/personnel-assignment/services/backend";
import { toStepInput } from "../services/procedure.mapper";
import { saveProcedureSteps } from "../services/procedure.service";
import type { ProcedureStep, StepChange } from "../types/procedure.types";
import { diffSteps } from "../utils/step-diff";
import { withParentRollups } from "../utils/step-duration";

const AUTO_SAVE_DELAY_MS = 500;

interface UseAutoSavedStepsOptions {
  procedureId?: string;
  onAutoSave?: (steps: ProcedureStep[], changes: StepChange[]) => void;
}

/**
 * Nội dung cần lưu của danh sách bước. Tài khoản thật: chỉ các trường backend lưu (bỏ trường chỉ có trên màn hình),
 * để dữ liệu trả về từ backend không bị coi là "có thay đổi" và tự lưu lặp lại.
 */
const saveKey = (steps: ProcedureStep[]) =>
  JSON.stringify(hasBackendSession() ? steps.map(toStepInput) : steps);

/** Bước mới do backend cấp mã thật: gắn mã đó vào bước trên màn hình (khớp theo mã bước) */
function adoptSavedIds(steps: ProcedureStep[], saved: ProcedureStep[]): ProcedureStep[] {
  const idByCode = new Map(saved.map((s) => [s.code, s.id]));
  let changed = false;
  const next = steps.map((s) => {
    const id = idByCode.get(s.code);
    if (!id || id === s.id) return s;
    changed = true;
    return { ...s, id };
  });
  return changed ? next : steps;
}

export function useAutoSavedSteps(steps: ProcedureStep[], { procedureId, onAutoSave }: UseAutoSavedStepsOptions) {
  const { user } = useAuth();
  const actorName = user?.displayName || user?.name || "Cán bộ quản lý";
  const [localSteps, setLocalSteps] = useState<ProcedureStep[]>(steps);
  const [autoSavedAt, setAutoSavedAt] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const savedStepsRef = useRef<ProcedureStep[]>(withParentRollups(steps));
  const lastSavedKeyRef = useRef<string | null>(null);

  // Dữ liệu từ ngoài đổi (mở quy trình khác, tải lại): nhận vào, trừ khi đó chính là bản vừa lưu
  useEffect(() => {
    if (lastSavedKeyRef.current === saveKey(steps)) {
      lastSavedKeyRef.current = null;
      return;
    }
    savedStepsRef.current = withParentRollups(steps);
    setLocalSteps(steps);
  }, [steps]);

  useEffect(() => {
    if (!procedureId) return;
    const timer = setTimeout(async () => {
      const finalSteps = withParentRollups(localSteps);
      const previous = savedStepsRef.current;
      if (saveKey(finalSteps) === saveKey(previous)) return;
      const changes = diffSteps(previous, finalSteps);
      savedStepsRef.current = finalSteps;
      setSaving(true);
      try {
        const saved = await saveProcedureSteps(procedureId, finalSteps, actorName);
        const withIds = adoptSavedIds(finalSteps, saved);
        savedStepsRef.current = withIds;
        lastSavedKeyRef.current = saveKey(saved);
        if (withIds !== finalSteps) setLocalSteps((prev) => adoptSavedIds(prev, saved));
        setAutoSavedAt(new Date());
        onAutoSave?.(saved, changes);
      } catch (error) {
        // Lưu lỗi: giữ nguyên trên màn hình, lần sửa tiếp theo sẽ lưu lại
        savedStepsRef.current = previous;
        toast.error("Chưa lưu được các bước", error instanceof Error ? error.message : "Vui lòng thử lại.");
      } finally {
        setSaving(false);
      }
    }, AUTO_SAVE_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSteps, procedureId]);

  /** Còn phần sửa chưa kịp tự lưu */
  const hasPendingChanges = () => saveKey(withParentRollups(localSteps)) !== saveKey(savedStepsRef.current);

  /** Nhận danh sách bước backend vừa lưu bằng thao tác riêng (vd. đổi lượt 2.4): giữ trường chỉ có trên màn hình */
  const acceptSaved = (saved: ProcedureStep[], changes: StepChange[]) => {
    const byId = new Map(localSteps.map((s) => [s.id, s]));
    const merged = saved.map((s) => ({ ...byId.get(s.id), ...s }));
    savedStepsRef.current = withParentRollups(merged);
    lastSavedKeyRef.current = saveKey(saved);
    setLocalSteps(merged);
    setAutoSavedAt(new Date());
    onAutoSave?.(saved, changes);
  };

  return { localSteps, setLocalSteps, autoSavedAt, saving, hasPendingChanges, acceptSaved };
}
