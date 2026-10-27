"use client";

import { useState } from "react";
import {
  getTemplateSteps,
  loadCustomProfiles,
  loadHiddenTemplateIds,
} from "../constants/procedure-templates";
import { DEPARTMENT_PROCEDURE_TEMPLATES } from "../constants/procedure-department-templates";
import type { ProcedureStep } from "../types/procedure.types";
import StepConfigModal from "./StepConfigModal";

interface ProcedureLibraryTabProps {
  /** Đã bấm "Lưu quy trình" (ghi lịch sử, thông báo) */
  onSaved: (profileId: string, profileName: string, steps: ProcedureStep[]) => void;
}

/** Quy trình mở sẵn khi vào trang: quy trình mẫu đầu tiên chưa bị xóa, không thì quy trình tự tạo đầu tiên */
function getInitialProcedure(): { id: string; steps: ProcedureStep[] } {
  const hidden = loadHiddenTemplateIds();
  const template = Object.values(DEPARTMENT_PROCEDURE_TEMPLATES).find((tpl) => !hidden.includes(tpl.id));
  if (template) return { id: template.id, steps: getTemplateSteps(template) };
  const custom = loadCustomProfiles()[0];
  return custom ? { id: custom.id, steps: custom.steps } : { id: "", steps: [] };
}

/** Tab "Quy trình": danh mục quy trình thủ tục, xem và chỉnh bước ngay trên trang */
export default function ProcedureLibraryTab({ onSaved }: ProcedureLibraryTabProps) {
  // Giữ cố định giá trị ban đầu để bảng không bị nạp lại sau mỗi lần vẽ
  const [initial] = useState(getInitialProcedure);

  const profileName = (profileId: string) =>
    Object.values(DEPARTMENT_PROCEDURE_TEMPLATES).find((tpl) => tpl.id === profileId)?.name ||
    loadCustomProfiles().find((p) => p.id === profileId)?.name ||
    "Quy trình";

  return (
    <StepConfigModal
      open
      variant="page"
      steps={initial.steps}
      currentProcedureId={initial.id}
      onClose={() => {}}
      onSaveConfig={(steps, profileId) => {
        if (profileId) onSaved(profileId, profileName(profileId), steps);
      }}
    />
  );
}
