"use client";

import { DeleteOutlined, EditOutlined, InfoCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Input, Select, Tag, Tooltip } from "@/components/ui";
import { ACTION_COL, ASSIGNEE_COL, STEP_TYPE_OPTIONS, TYPE_COL } from "../constants/step-table";
import type { StepRowEdit } from "../hooks/useStepRowEdit";
import type { StepStaff } from "../hooks/useStepStaff";
import type { StepFlowProps } from "../hooks/useStepTree";
import type { ProcedureStep, StepType } from "../types/procedure.types";
import StepFlowCell from "./StepFlowCell";
import {
  ICON_BUTTON_CLASS,
  RowSaveCancel,
  StepAssigneeSelect,
  StepDuration,
  StepDurationInput,
  StepEmailCell,
} from "./StepTableCells";

interface StepTableRowProps {
  step: ProcedureStep;
  flow: StepFlowProps;
  edit: StepRowEdit;
  staff: StepStaff;
  isAddingChild: boolean;
  onToggleExpanded: () => void;
  onAddChild: () => void;
  onRemove: () => void;
}

export default function StepTableRow({
  step,
  flow,
  edit,
  staff,
  isAddingChild,
  onToggleExpanded,
  onAddChild,
  onRemove,
}: StepTableRowProps) {
  const isSubStep = flow.depth > 0;
  const isEditing = edit.editingStepId === step.id;
  const hasChildren = flow.childCount > 0;
  const editOnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditing) edit.start(step);
  };

  const rowTone = isEditing
    ? "bg-red-50/70 border-l-[3px] border-l-[#DC2626] ring-1 ring-inset ring-red-200"
    : isAddingChild
      ? "bg-red-50/60 border-l-[3px] border-l-[#DC2626]"
      : isSubStep
        ? "bg-slate-50/40 hover:bg-slate-50 border-l-[3px] border-l-transparent"
        : "hover:bg-slate-50 border-l-[3px] border-l-transparent";

  return (
    <div
      ref={isEditing ? edit.rowRef : undefined}
      onClick={hasChildren ? onToggleExpanded : undefined}
      className={`group flex items-center gap-3 px-3.5 py-2.5 transition-colors ${hasChildren ? "cursor-pointer" : ""} ${rowTone}`}
    >
      <StepFlowCell {...flow} code={step.code} onToggle={onToggleExpanded} />

      <div className="min-w-0 flex-1 pr-2">
        {isEditing ? (
          <div onClick={(e) => e.stopPropagation()}>
            <Input
              autoFocus={!edit.focusAssignee}
              value={edit.draft.name}
              onChange={(e) => edit.updateDraft({ name: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") edit.save();
                if (e.key === "Escape") edit.cancel();
              }}
              placeholder="Tên bước (nhấn Enter để lưu)..."
              className={`h-7 text-xs bg-white w-full ${
                edit.error ? "border-rose-500 ring-1 ring-rose-200" : "border-red-300 focus:border-[#DC2626]"
              }`}
            />
            {edit.error && <div className="mt-0.5 text-[11px] text-rose-600">{edit.error}</div>}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span
              className={`min-w-0 cursor-text rounded leading-snug line-clamp-2 hover:bg-white hover:ring-1 hover:ring-slate-200 text-xs ${
                isSubStep ? "font-medium text-slate-700" : "font-bold text-slate-900"
              }`}
              title={step.name}
              onClick={editOnClick}
            >
              {step.name}
            </span>
            {step.notes && (
              <Tooltip title={<span className="whitespace-pre-line">{step.notes}</span>} placement="topLeft">
                <InfoCircleOutlined className="text-slate-400 hover:text-slate-600 text-xs cursor-help shrink-0" />
              </Tooltip>
            )}
            {isAddingChild && (
              <span className="text-[10px] font-semibold text-[#DC2626] bg-red-100/80 px-1.5 rounded shrink-0">
                Đang thêm bước con
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-x-3 text-[11px] text-slate-400 md:hidden mt-0.5">
          <span className="text-[#DC2626] font-medium">{step.durationMargin}</span>
        </div>
      </div>

      <div
        className={ASSIGNEE_COL}
        onClick={(e) => {
          e.stopPropagation();
          if (!isEditing) edit.start(step, true);
        }}
      >
        <StepAssigneeSelect
          value={isEditing ? edit.draft.assignedTo : step.assignedTo}
          placeholder="— Chọn cán bộ —"
          allowClear={isEditing}
          options={staff.staffOptions}
          onChange={(assignedTo) => edit.updateDraft({ assignedTo })}
        />
      </div>
      <StepEmailCell email={staff.emailOf(isEditing ? edit.draft.assignedTo : step.assignedTo)} />

      {isEditing ? (
        <StepDurationInput days={edit.draft.days} onChange={(days) => edit.updateDraft({ days })} />
      ) : (
        <StepDuration step={step} onEdit={() => edit.start(step)} />
      )}

      <div className={`${TYPE_COL} flex items-center justify-center`}>
        {isEditing ? (
          <div onClick={(e) => e.stopPropagation()}>
            <Select
              value={edit.draft.type}
              onChange={(type) => edit.updateDraft({ type: type as StepType })}
              size="small"
              className="w-24 text-xs"
              options={STEP_TYPE_OPTIONS}
            />
          </div>
        ) : (
          <span className="cursor-pointer" onClick={editOnClick}>
            {step.type === "MANDATORY" ? (
              <Tooltip title="Bước bắt buộc (luôn áp dụng)">
                <Tag intent="brand" scale="sm">
                  Bắt buộc
                </Tag>
              </Tooltip>
            ) : (
              <Tag intent="warning" scale="sm">
                Nếu có
              </Tag>
            )}
          </span>
        )}
      </div>

      <div className={`${ACTION_COL} flex items-center justify-center gap-1.5`} onClick={(e) => e.stopPropagation()}>
        {isEditing ? (
          <RowSaveCancel saveTitle="Lưu thay đổi" onSave={edit.save} onCancel={edit.cancel} />
        ) : (
          <>
            <Tooltip title={isAddingChild ? "Đang mở thêm bước con (nhấn để đóng)" : `Thêm bước con cho [${step.code}]`}>
              <Button
                rounded="sm"
                icon={<PlusOutlined className="text-xs" />}
                onClick={onAddChild}
                aria-label={`Thêm bước con cho ${step.code}`}
                className={`${ICON_BUTTON_CLASS} ${
                  isAddingChild
                    ? "!border-[#DC2626] !bg-[#DC2626] !text-white ring-2 ring-red-200"
                    : "!border-red-200 !bg-red-50 !text-[#DC2626] hover:!border-[#DC2626] hover:!bg-[#DC2626] hover:!text-white"
                }`}
              />
            </Tooltip>
            <Tooltip title={`Sửa bước [${step.code}]`}>
              <Button
                intent="outline"
                rounded="sm"
                icon={<EditOutlined className="text-xs" />}
                onClick={() => edit.start(step)}
                aria-label={`Sửa bước ${step.code}`}
                className={`${ICON_BUTTON_CLASS} !text-slate-500`}
              />
            </Tooltip>
            <Tooltip title={`Xóa bước [${step.code}]`}>
              <Button
                intent="outline"
                rounded="sm"
                icon={<DeleteOutlined className="text-xs" />}
                onClick={onRemove}
                aria-label={`Xóa bước ${step.code}`}
                className={`${ICON_BUTTON_CLASS} !text-slate-400 hover:!border-rose-300 hover:!bg-rose-50 hover:!text-rose-600`}
              />
            </Tooltip>
          </>
        )}
      </div>
    </div>
  );
}
