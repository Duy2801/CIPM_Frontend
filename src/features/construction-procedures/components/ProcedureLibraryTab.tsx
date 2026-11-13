"use client";

import { useState } from "react";
import { toast } from "@/components/ui";
import { useProcedureLibrary } from "@/shared/construction-procedures/hooks/useProcedureLibrary";
import { createProcedure, toggleProcedure } from "@/shared/construction-procedures/services/procedure.service";
import type { StepChange } from "@/shared/construction-procedures/types/procedure.types";
import CreateProcedurePage from "./CreateProcedurePage";
import ProcedureDetailPage from "./ProcedureDetailPage";
import ProcedureListView from "./ProcedureListView";

interface ProcedureLibraryTabProps {
  actorName: string;
  canApprove: boolean;
  onAutoSaved: (procedureId: string, procedureName: string, changes: StepChange[]) => void;
  onSubPageChange?: (open: boolean) => void;
}

type LibraryView = { kind: "list" } | { kind: "detail"; id: string } | { kind: "create" };

const errorText = (error: unknown) => (error instanceof Error ? error.message : "Không thể hoàn tất thao tác, vui lòng thử lại.");

export default function ProcedureLibraryTab({
  actorName,
  canApprove,
  onAutoSaved,
  onSubPageChange,
}: ProcedureLibraryTabProps) {
  const { procedures, reload, refresh } = useProcedureLibrary();
  const [view, setView] = useState<LibraryView>({ kind: "list" });

  const goTo = (next: LibraryView) => {
    setView(next);
    onSubPageChange?.(next.kind !== "list");
  };

  const backToList = () => {
    goTo({ kind: "list" });
    void refresh();
  };

  if (view.kind === "create") {
    return (
      <CreateProcedurePage
        onBack={backToList}
        onCreate={async ({ name, category, version, steps }) => {
          try {
            await createProcedure({ name, category, version, steps, createdBy: actorName });
            backToList();
            toast.success("Đã tạo quy trình mới", `Đã lưu quy trình "${name}" (${steps.length} bước).`);
          } catch (error) {
            toast.error("Không tạo được quy trình", errorText(error));
          }
        }}
      />
    );
  }

  const opened = view.kind === "detail" ? procedures.find((p) => p.id === view.id) : undefined;

  if (opened) {
    return (
      <ProcedureDetailPage
        procedure={opened}
        actorName={actorName}
        canApprove={canApprove}
        onBack={backToList}
        onChanged={reload}
        onAutoSave={(_steps, changes) => {
          reload();
          onAutoSaved(opened.id, opened.name, changes);
        }}
      />
    );
  }

  return (
    <ProcedureListView
      procedures={procedures}
      onOpen={(id) => goTo({ kind: "detail", id })}
      onCreate={() => goTo({ kind: "create" })}
      onToggle={async (procedure, enabled) => {
        try {
          await toggleProcedure(procedure.id, enabled);
          reload();
          toast.info(
            enabled ? "Đã bật quy trình" : "Đã ngưng quy trình",
            `Quy trình "${procedure.name}" ${enabled ? "đã được bật lại" : "đã chuyển sang Đã ngưng"}.`,
          );
        } catch (error) {
          toast.error("Không đổi được trạng thái quy trình", errorText(error));
        }
      }}
    />
  );
}
