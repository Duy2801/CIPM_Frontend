"use client";

import { useState } from "react";
import { toast } from "@/components/ui";
import type { ProcedureStep } from "../types/procedure.types";
import {
  createProcedure,
  deleteProcedure,
  getProcedureDepartmentOptions,
  loadProcedureLibrary,
  markProcedureUpdated,
} from "../utils/procedure-library";
import CreateProcedurePage from "./CreateProcedurePage";
import ProcedureListView from "./ProcedureListView";
import ProcedurePageHeader from "./ProcedurePageHeader";
import StepConfigModal from "./StepConfigModal";

interface ProcedureLibraryTabProps {
  /** Người đang thao tác (ghi vào "Người tạo" / "Cập nhật bởi") */
  actorName: string;
  /** Đã bấm "Lưu quy trình" (ghi lịch sử, thông báo) */
  onSaved: (profileId: string, profileName: string, steps: ProcedureStep[]) => void;
  /** Mở / đóng trang con (chi tiết, thêm mới) — màn hình ẩn thanh tab khi đang ở trang con */
  onDetailChange?: (open: boolean) => void;
}

/** Danh sách | chi tiết một quy trình | thêm quy trình mới */
type LibraryView = { kind: "list" } | { kind: "detail"; id: string } | { kind: "create" };

/** Tab "Quy trình": danh sách quy trình → trang chi tiết các bước / trang thêm quy trình mới */
export default function ProcedureLibraryTab({ actorName, onSaved, onDetailChange }: ProcedureLibraryTabProps) {
  const [procedures, setProcedures] = useState(loadProcedureLibrary);
  const [view, setView] = useState<LibraryView>({ kind: "list" });

  const reload = () => setProcedures(loadProcedureLibrary());

  const goTo = (next: LibraryView) => {
    setView(next);
    onDetailChange?.(next.kind !== "list");
  };

  const backToList = () => {
    reload();
    goTo({ kind: "list" });
  };

  if (view.kind === "create") {
    return (
      <CreateProcedurePage
        departmentOptions={getProcedureDepartmentOptions()}
        onBack={backToList}
        onCreate={({ name, department, steps }) => {
          createProcedure({ name, department, steps, createdBy: actorName });
          backToList();
          toast.success("Đã tạo quy trình mới", `Đã lưu quy trình "${name}" (${steps.length} bước).`);
        }}
      />
    );
  }

  const opened = view.kind === "detail" ? procedures.find((p) => p.id === view.id) : undefined;

  if (opened) {
    return (
      <div className="space-y-3">
        <ProcedurePageHeader
          title={
            <>
              Chi tiết quy trình <span className="text-[#DC2626]">{opened.name}</span>
            </>
          }
          subtitle={[opened.department, `${opened.steps.length} bước`].filter(Boolean).join(" · ")}
          onBack={backToList}
        />

        <StepConfigModal
          // Mỗi quy trình một bảng riêng: đổi quy trình là dựng lại từ đầu
          key={opened.id}
          open
          variant="page"
          steps={opened.steps}
          currentProcedureId={opened.id}
          onBack={backToList}
          onClose={() => {}}
          onSaveConfig={(steps, profileId) => {
            if (profileId) markProcedureUpdated(profileId, actorName);
            reload();
            if (profileId) onSaved(profileId, opened.name, steps);
          }}
        />
      </div>
    );
  }

  return (
    <ProcedureListView
      procedures={procedures}
      onOpen={(id) => goTo({ kind: "detail", id })}
      onCreate={() => goTo({ kind: "create" })}
      onDelete={(procedure) => {
        deleteProcedure(procedure.id);
        reload();
        toast.info("Đã xóa quy trình", `Đã xóa quy trình "${procedure.name}" khỏi danh sách.`);
      }}
    />
  );
}
