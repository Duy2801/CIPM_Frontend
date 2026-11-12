"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { InlineEditField } from "@/components/workspace";
import StaffFormAddOption from "@/features/personnel-assignment/components/StaffFormAddOption";
import { cn } from "@/utils/cn";
import { formatDateVi } from "@/utils/date";
import { formatMoneyString } from "@/utils/format-money";
import { FUNDING_SOURCE_OPTIONS, PERSONNEL_OPTIONS } from "../../constants/project-enums";
import type { ProcedureDraft } from "../../hooks/useProcedureDraft";
import type { ProjectInfoDraft } from "../../hooks/useProjectInfoDraft";
import type { FundingSourceType, ProjectItem, ProjectNature } from "../../types/project.types";
import {
  DROPDOWN_LIST_HEIGHT,
  FUNDING_STORAGE_KEY,
  loadCustomOptions,
  sameText,
  saveCustomOptions,
} from "../../utils/custom-options";
import { FIELD_LABELS, NATURE_LABELS, parseMoney, validateMoney } from "../../utils/project-detail-fields";
import ProjectProcedurePicker from "../shared/ProjectProcedurePicker";
import WorkTypeSelect from "../shared/WorkTypeSelect";
import ProjectInfoFieldGroup from "./ProjectInfoFieldGroup";
import { ProjectDocumentsSection } from "./ProjectDocumentsSection";

const PERSONNEL_SELECT_OPTIONS = PERSONNEL_OPTIONS.map((p) => ({ value: p.name, label: `${p.name} (${p.role})` }));
const NATURE_SELECT_OPTIONS = (Object.keys(NATURE_LABELS) as ProjectNature[]).map((n) => ({ value: n, label: NATURE_LABELS[n] }));

const personName = (name: string) => (name === "Chưa phân công" ? "Chờ BQL phân công (M5)" : name || "—");

export default function ProjectInfoTab({
  project,
  info,
  procedures,
  canEditProcedures,
}: {
  project: ProjectItem;
  info: ProjectInfoDraft;
  procedures: ProcedureDraft;
  canEditProcedures: boolean;
}) {
  const { view, isChanged, saver } = info;
  const [customFunding, setCustomFunding] = useState(() => loadCustomOptions(FUNDING_STORAGE_KEY));
  const fundingOptions = [...FUNDING_SOURCE_OPTIONS, ...customFunding].map((f) => ({ value: f, label: f }));

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
              editor={{ kind: "select", options: NATURE_SELECT_OPTIONS }}
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

          <ProjectInfoFieldGroup title="Vốn đầu tư" cols="even2">
            <InlineEditField
              label={FIELD_LABELS.fundingSource}
              changed={isChanged("fundingSource")}
              value={view.fundingSource}
              display={view.fundingSource}
              editor={{
                kind: "select",
                options: fundingOptions,
                listHeight: DROPDOWN_LIST_HEIGHT,
                renderAddOption: (pick) => (
                  <StaffFormAddOption
                    placeholder="Nhập nguồn vốn mới..."
                    isDuplicate={(name) => fundingOptions.some((o) => sameText(o.label, name))}
                    onAdd={async (name) => {
                      const label = name.trim();
                      setCustomFunding((prev) => saveCustomOptions(FUNDING_STORAGE_KEY, [...prev, label]));
                      pick(label);
                      return true;
                    }}
                  />
                ),
              }}
              onSave={saver("fundingSource", (v) => v as FundingSourceType)}
            />
            <InlineEditField
              label={FIELD_LABELS.totalInvestment}
              changed={isChanged("totalInvestment")}
              value={String(view.totalInvestment || 0)}
              display={`${formatMoneyString(view.totalInvestment || 0)} VNĐ`}
              editor={{ kind: "text", placeholder: "Số tiền (VNĐ)" }}
              validate={validateMoney}
              onSave={saver("totalInvestment", parseMoney)}
            />
          </ProjectInfoFieldGroup>

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
