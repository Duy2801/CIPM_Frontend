"use client";

import { Card } from "@/components/ui";
import { InlineEditField } from "@/components/workspace";
import { cn } from "@/utils/cn";
import { formatDateVi } from "@/utils/date";
import { PERSONNEL_SELECT_OPTIONS, PROJECT_NATURE_OPTIONS } from "../../constants/project-enums";
import type { ProcedureDraft } from "../../hooks/useProcedureDraft";
import { useProject } from "../../hooks/useProjectList";
import type { ProjectInfoDraft } from "../../hooks/useProjectInfoDraft";
import type { FundingSourceType, ProjectNature } from "../../types/project.types";
import { toFundingSources, type FundingLine } from "../../utils/create-project-form";
import { projectFundingBudgets } from "../../utils/project-disbursement";
import { FIELD_LABELS, NATURE_LABELS } from "../../utils/project-detail-fields";
import FundingSourceRows from "../shared/FundingSourceRows";
import ProjectProcedurePicker from "../shared/ProjectProcedurePicker";
import WorkTypeSelect from "../shared/WorkTypeSelect";
import ProjectInfoFieldGroup from "./ProjectInfoFieldGroup";
import { ProjectDocumentsSection } from "./ProjectDocumentsSection";

const personName = (name: string) => (name === "Chưa phân công" ? "Chờ BQL phân công (M5)" : name || "—");

export default function ProjectInfoTab({
  projectId,
  info,
  procedures,
  canEditProcedures,
}: {
  projectId: string;
  info: ProjectInfoDraft;
  procedures: ProcedureDraft;
  canEditProcedures: boolean;
}) {
  const project = useProject(projectId);
  const { view, isChanged, saver } = info;
  const fundingLines: FundingLine[] = projectFundingBudgets(view).map((b, i) => ({
    id: `FUND-${i}`,
    source: b.source as FundingSourceType,
    amount: b.amount,
  }));

  const changeFundings = (lines: FundingLine[]) => {
    const next = toFundingSources(lines);
    if (!project) return;
    const unchanged = JSON.stringify(next) === JSON.stringify(projectFundingBudgets(project));
    info.setField("fundingSources", unchanged ? project.fundingSources : next);
    info.setField(
      "fundingSource",
      unchanged ? project.fundingSource : ((next.map((f) => f.source).join(", ") || project.fundingSource) as FundingSourceType),
    );
    info.setField("totalInvestment", unchanged ? project.totalInvestment : next.reduce((sum, f) => sum + f.amount, 0));
  };

  if (!project) return null;

  return (
    <div className="flex flex-col gap-3">
      <Card surface="workspace" padding="none" rounded="lg" className="border border-slate-200/80 shadow-xs">
        <div className="space-y-4 p-4">
          <ProjectInfoFieldGroup title="Thông tin chung" cols="even3">
            <InlineEditField
              label={FIELD_LABELS.name}
              changed={isChanged("name")}
              value={view.name}
              display={view.name}
              editor={{ kind: "text", placeholder: "Tên công trình" }}
              onSave={saver("name", (v) => v)}
            />
            <InlineEditField
              label={FIELD_LABELS.nature}
              changed={isChanged("nature")}
              value={view.nature ?? ""}
              display={view.nature ? NATURE_LABELS[view.nature] : "—"}
              editor={{ kind: "select", options: PROJECT_NATURE_OPTIONS }}
              onSave={saver("nature", (v) => v as ProjectNature)}
            />
            <InlineEditField
              label={FIELD_LABELS.location}
              changed={isChanged("location")}
              value={view.location ?? ""}
              display={view.location || "TP. Hà Tiên"}
              editor={{ kind: "text", placeholder: "Phường / xã" }}
              onSave={saver("location", (v) => v)}
            />
          </ProjectInfoFieldGroup>

          <section>
            <h3 className="m-0 mb-3 border-b border-slate-100 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-[#DC2626]">
              Vốn đầu tư
            </h3>
            <FundingSourceRows
              value={fundingLines}
              disabled={!info.canEdit}
              highlighted={isChanged("fundingSources") || isChanged("totalInvestment")}
              onChange={changeFundings}
            />
          </section>

          <ProjectInfoFieldGroup title="Nhân sự & thời gian" cols={2}>
            <InlineEditField
              label={FIELD_LABELS.managerName}
              changed={isChanged("managerName")}
              value={view.managerName}
              display={personName(view.managerName)}
              editor={{ kind: "select", options: PERSONNEL_SELECT_OPTIONS }}
              onSave={saver("managerName", (v) => v)}
            />
            <InlineEditField
              label={FIELD_LABELS.supervisorName}
              changed={isChanged("supervisorName")}
              value={view.supervisorName}
              display={personName(view.supervisorName)}
              editor={{ kind: "select", options: PERSONNEL_SELECT_OPTIONS }}
              onSave={saver("supervisorName", (v) => v)}
            />
            <InlineEditField
              label={FIELD_LABELS.startDate}
              changed={isChanged("startDate")}
              value={view.startDate}
              display={view.startDate ? formatDateVi(view.startDate) : "—"}
              editor={{ kind: "date" }}
              validate={(next) =>
                view.endDatePlanned && next > view.endDatePlanned ? "Ngày bắt đầu không được sau ngày kết thúc." : undefined
              }
              onSave={saver("startDate", (v) => v)}
            />
            <InlineEditField
              label={FIELD_LABELS.endDatePlanned}
              changed={isChanged("endDatePlanned")}
              value={view.endDatePlanned}
              display={view.endDatePlanned ? formatDateVi(view.endDatePlanned) : "—"}
              editor={{ kind: "date" }}
              validate={(next) => (view.startDate && next <= view.startDate ? "Ngày kết thúc phải sau ngày bắt đầu." : undefined)}
              onSave={saver("endDatePlanned", (v) => v)}
            />
            {project.actualEndDate && (
              <div>
                <span className="text-[11px] font-medium text-slate-500">Hoàn thành thực tế</span>
                <div className="mt-0.5 text-xs font-semibold text-slate-900">{formatDateVi(project.actualEndDate)}</div>
              </div>
            )}
          </ProjectInfoFieldGroup>

          <ProjectProcedurePicker
            library={procedures.pickable}
            procedures={procedures.shown}
            tabLabels={procedures.shownLabels}
            onTabLabelChange={procedures.changeLabel}
            appliedNames={procedures.appliedNames}
            onToggle={procedures.toggle}
            onUncheckMany={procedures.uncheckMany}
            disabled={!canEditProcedures}
            leading={{
              label: FIELD_LABELS.type,
              control: (
                <WorkTypeSelect
                  value={view.type}
                  disabled={!info.canEdit}
                  onChange={(v) => info.setField("type", v)}
                  className={cn(
                    isChanged("type") && "[&_.ant-select-selector]:!border-amber-400 [&_.ant-select-selector]:!bg-amber-50/60",
                  )}
                />
              ),
            }}
          />
        </div>
      </Card>

      <Card surface="workspace" padding="none" rounded="lg" className="border-0 shadow-xs">
        <ProjectDocumentsSection project={project} />
      </Card>
    </div>
  );
}
