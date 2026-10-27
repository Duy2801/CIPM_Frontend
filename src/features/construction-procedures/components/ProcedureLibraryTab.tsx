"use client";

import { useState } from "react";
import { toast } from "@/components/ui";
import type { ProcedureStep } from "../types/procedure.types";
import {
  createProcedure,
  deleteProcedure,
  getProcedureDepartmentOptions,
  getProcedureSteps,
  loadProcedureLibrary,
  markProcedureUpdated,
} from "../utils/procedure-library";
import CreateProcedureModal from "./CreateProcedureModal";
import ProcedureListView from "./ProcedureListView";
import StepConfigModal from "./StepConfigModal";

interface ProcedureLibraryTabProps {
  /** Người đang thao tác (ghi vào "Người tạo" / "Cập nhật bởi") */
  actorName: string;
  /** Đã bấm "Lưu quy trình" (ghi lịch sử, thông báo) */
  onSaved: (profileId: string, profileName: string, steps: ProcedureStep[]) => void;
}

/** Tab "Quy trình": danh sách quy trình → bấm "Chi tiết" để xem và chỉnh các bước ngay trên trang */
export default function ProcedureLibraryTab({ actorName, onSaved }: ProcedureLibraryTabProps) {
  const [procedures, setProcedures] = useState(loadProcedureLibrary);
  const [openId, setOpenId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const reload = () => setProcedures(loadProcedureLibrary());
  const opened = openId ? procedures.find((p) => p.id === openId) : undefined;

  if (opened) {
    return (
      <StepConfigModal
        // Mỗi quy trình một bảng riêng: đổi quy trình là dựng lại từ đầu
        key={opened.id}
        open
        variant="page"
        steps={opened.steps}
        currentProcedureId={opened.id}
        onBack={() => {
          reload();
          setOpenId(null);
        }}
        onClose={() => {}}
        onSaveConfig={(steps, profileId) => {
          if (profileId) markProcedureUpdated(profileId, actorName);
          reload();
          if (profileId) onSaved(profileId, opened.name, steps);
        }}
      />
    );
  }

  return (
    <>
      <ProcedureListView
        procedures={procedures}
        onOpen={setOpenId}
        onCreate={() => setCreateOpen(true)}
        onDelete={(procedure) => {
          deleteProcedure(procedure.id);
          reload();
          toast.info("Đã xóa quy trình", `Đã xóa quy trình "${procedure.name}" khỏi danh sách.`);
        }}
      />

      {createOpen && (
        <CreateProcedureModal
          sourceOptions={procedures.map((p) => ({
            value: p.id,
            label: `${p.name}${p.department ? ` (${p.department})` : ""} · ${p.steps.length} bước`,
          }))}
          departmentOptions={getProcedureDepartmentOptions()}
          creatorName={actorName}
          onClose={() => setCreateOpen(false)}
          onCreate={({ name, department, copyFromId }) => {
            const steps = copyFromId ? getProcedureSteps(copyFromId) : [];
            const created = createProcedure({ name, department, steps, createdBy: actorName });
            setCreateOpen(false);
            reload();
            // Tạo xong mở ngay để thêm bước
            setOpenId(created.id);
            toast.success("Đã tạo quy trình mới", `Đã lưu quy trình "${name}" (${steps.length} bước).`);
          }}
        />
      )}
    </>
  );
}
