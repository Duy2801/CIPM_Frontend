"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { useProjectDisbursements } from "../../../hooks/useProjectDisbursements";
import { useProjectMutations } from "../../../hooks/useProjectMutations";
import type { DisbursementKind } from "@/shared/projects_works/utils/project-disbursement";
import DisbursementCategoryBar from "./DisbursementCategoryBar";
import DisbursementCategorySummary from "./DisbursementCategorySummary";
import DisbursementEntryTable from "./DisbursementEntryTable";
import DisbursementFormDrawer from "./DisbursementFormDrawer";
import DisbursementOverview from "./DisbursementOverview";
import DisbursementRecordDrawer from "./DisbursementRecordDrawer";

type FormState = { kind: DisbursementKind; category: string };

export default function ProjectDisbursementTab({ projectId }: { projectId: string }) {
  const { project, isBackend, summary } = useProjectDisbursements(projectId);
  const { setDisbursedAmount } = useProjectMutations();

  const [activeTab, setActiveTab] = useState<string>();
  const [form, setForm] = useState<FormState>();
  const [viewingId, setViewingId] = useState<string>();

  const categories = summary.byCategory;
  const current =
    categories.find((c) => c.category === activeTab) ?? categories.find((c) => c.count > 0) ?? categories[0];

  const disbursedAmount = project?.disbursedAmount ?? 0;
  useEffect(() => {
    if (!isBackend && project && disbursedAmount !== summary.total) setDisbursedAmount(projectId, summary.total);
  }, [isBackend, project, disbursedAmount, summary.total, projectId, setDisbursedAmount]);

  if (!project) return null;

  return (
    <div className="flex flex-col gap-3">
      <DisbursementOverview projectId={projectId} onSelect={setActiveTab} />

      <Card surface="workspace" padding="none" rounded="lg" className="overflow-hidden border border-slate-200/80 shadow-xs">
        <DisbursementCategoryBar
          projectId={projectId}
          activeCategory={current?.category}
          onChange={setActiveTab}
          onOpenForm={(kind, category) => setForm({ kind, category })}
        />

        {current && (
          <>
            <DisbursementCategorySummary projectId={projectId} category={current.category} className="mx-4 mt-4" />
            <div className="mt-4">
              <DisbursementEntryTable projectId={projectId} category={current.category} onView={setViewingId} />
            </div>
          </>
        )}

        {viewingId && (
          <DisbursementRecordDrawer projectId={projectId} entryId={viewingId} onClose={() => setViewingId(undefined)} />
        )}

        {form && (
          <DisbursementFormDrawer
            projectId={projectId}
            kind={form.kind}
            initialCategory={form.category}
            onClose={() => setForm(undefined)}
            onSaved={(category) => {
              setActiveTab(category);
              setForm(undefined);
            }}
          />
        )}
      </Card>
    </div>
  );
}
