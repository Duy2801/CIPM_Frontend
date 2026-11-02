"use client";

import { useEffect, useRef } from "react";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { Button, InputNumber, Select, Tooltip } from "@/components/ui";
import { ACTION_COL, ASSIGNEE_COL, DATE_COL, EMAIL_COL } from "../constants/step-table";
import { FLOATING_LAYER_SELECTOR } from "../hooks/useStepRowEdit";
import type { ProcedureStep } from "../types/procedure.types";
import { getStepDays } from "../utils/step-duration";

const showStaffName = ({ value }: { value: string | number }) => String(value);

export const ICON_BUTTON_CLASS = "!h-7 !w-7 !p-0 shadow-2xs";

export function StepAssigneeSelect({
  value,
  options,
  onChange,
  placeholder = "— Phân công —",
  allowClear = true,
}: {
  value?: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
  allowClear?: boolean;
}) {
  return (
    <Select
      value={value || undefined}
      onChange={(val) => onChange((val as string | undefined) || "")}
      size="small"
      className="w-full text-xs"
      placeholder={placeholder}
      allowClear={allowClear}
      showSearch
      optionFilterProp="label"
      options={options}
      labelRender={showStaffName}
    />
  );
}

export function StepEmailCell({ email }: { email?: string }) {
  return (
    <div className={`${EMAIL_COL} truncate pl-2 text-xs ${email ? "text-slate-600" : "text-slate-300"}`} title={email}>
      {email ?? "—"}
    </div>
  );
}

export function StepDuration({ step, onEdit }: { step: ProcedureStep; onEdit: () => void }) {
  const days = getStepDays(step);
  return (
    <div className={`${DATE_COL} hidden sm:block text-center text-xs font-medium text-slate-700`}>
      <span
        className="cursor-text rounded px-1 hover:bg-white hover:ring-1 hover:ring-slate-200"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
      >
        {days ? `${days} ngày` : step.durationMargin || <span className="text-slate-300 select-none">—</span>}
      </span>
    </div>
  );
}

export function StepDurationInput({ days, onChange }: { days: string; onChange: (value: string) => void }) {
  return (
    <div className={`${DATE_COL} hidden sm:flex items-center justify-center gap-1.5 text-xs text-slate-500`} onClick={(e) => e.stopPropagation()}>
      <InputNumber
        size="small"
        min={1}
        precision={0}
        controls={false}
        value={days ? Number(days) : null}
        onChange={(value) => onChange(value == null ? "" : String(value))}
        aria-label="Số ngày"
        className="!w-12 text-xs [&_input]:!text-center"
      />
      <span>ngày</span>
    </div>
  );
}

export function RowSaveCancel({ onSave, onCancel, saveTitle }: { onSave: () => void; onCancel: () => void; saveTitle: string }) {
  return (
    <>
      <Tooltip title={`${saveTitle} (Enter)`}>
        <Button
          intent="primary"
          rounded="sm"
          icon={<CheckOutlined className="text-xs" />}
          onClick={onSave}
          aria-label={saveTitle}
          className={ICON_BUTTON_CLASS}
        />
      </Tooltip>
      <Tooltip title="Bỏ (Esc)">
        <Button
          intent="outline"
          rounded="sm"
          icon={<CloseOutlined className="text-xs" />}
          onClick={onCancel}
          aria-label="Bỏ"
          className={`${ICON_BUTTON_CLASS} !text-slate-500`}
        />
      </Tooltip>
    </>
  );
}

export function InlineRowActions({ hasValue, onSave, onCancel }: { hasValue: boolean; onSave: () => void; onCancel: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const latest = useRef({ hasValue, onSave, onCancel });
  useEffect(() => {
    latest.current = { hasValue, onSave, onCancel };
  });
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const row = ref.current?.parentElement;
      const target = e.target as Element | null;
      if (!row || !target || row.contains(target) || target.closest(FLOATING_LAYER_SELECTOR)) return;
      if (latest.current.hasValue) latest.current.onSave();
      else latest.current.onCancel();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);
  return (
    <div ref={ref} className={`${ACTION_COL} flex items-center justify-center gap-1.5`} onClick={(e) => e.stopPropagation()}>
      <RowSaveCancel saveTitle="Thêm bước" onSave={onSave} onCancel={onCancel} />
    </div>
  );
}

export function StepAssigneeCells({
  value,
  options,
  email,
  onChange,
}: {
  value?: string;
  options: { value: string; label: string }[];
  email?: string;
  onChange: (value: string) => void;
}) {
  return (
    <>
      <div className={ASSIGNEE_COL}>
        <StepAssigneeSelect value={value} options={options} onChange={onChange} />
      </div>
      <StepEmailCell email={email} />
    </>
  );
}
