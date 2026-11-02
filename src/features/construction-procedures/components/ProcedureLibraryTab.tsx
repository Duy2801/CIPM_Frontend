"use client";

import { useState } from "react";
import { toast } from "@/components/ui";
import type { StepChange } from "../types/procedure.types";
import {
  createProcedure,
  loadProcedureLibrary,
  markProcedureUpdated,
  setProcedureEnabled,
} from "../utils/procedure-library";
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

export default function ProcedureLibraryTab({
  actorName,
  canApprove,
  onAutoSaved,
  onSubPageChange,
}: ProcedureLibraryTabProps) {
  const [procedures, setProcedures] = useState(loadProcedureLibrary);
  const [view, setView] = useState<LibraryView>({ kind: "list" });

  const reload = () => setProcedures(loadProcedureLibrary());

  const goTo = (next: LibraryView) => {
    setView(next);
    onSubPageChange?.(next.kind !== "list");
  };

  const backToList = () => {
    reload();
    goTo({ kind: "list" });
  };

  if (view.kind === "create") {
    return (
      <CreateProcedurePage
        onBack={backToList}
        onCreate={({ name, category, version, steps }) => {
          createProcedure({ name, category, version, steps, createdBy: actorName });
          backToList();
          toast.success("Đã tạo quy trình mới", `Đã lưu quy trình "${name}" (${steps.length} bước).`);
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
          markProcedureUpdated(opened.id, actorName);
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
      onToggle={(procedure, enabled) => {
        setProcedureEnabled(procedure.id, enabled);
        reload();
        toast.info(
          enabled ? "Đã bật quy trình" : "Đã ngưng quy trình",
          `Quy trình "${procedure.name}" ${enabled ? "đã được bật lại" : "đã chuyển sang Đã ngưng"}.`,
        );
      }}
    />
  );
}
