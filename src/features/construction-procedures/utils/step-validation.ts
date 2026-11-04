export type StepRequiredField = "name" | "assignee" | "days";

const FIELD_LABELS: Record<StepRequiredField, string> = {
  name: "tên bước",
  assignee: "người thực hiện",
  days: "số ngày",
};

/**
 * Các ô bắt buộc còn trống của một bước.
 * `needsDays = false` cho bước có bước con (số ngày tính từ bước con, không nhập tay).
 */
export function missingStepFields(
  draft: { name: string; assignee: string; days: string },
  needsDays = true,
): StepRequiredField[] {
  const missing: StepRequiredField[] = [];
  if (!draft.name.trim()) missing.push("name");
  if (!draft.assignee) missing.push("assignee");
  if (needsDays && !(Number(draft.days) > 0)) missing.push("days");
  return missing;
}

export const missingFieldsMessage = (missing: StepRequiredField[]) =>
  `Vui lòng nhập đủ: ${missing.map((f) => FIELD_LABELS[f]).join(", ")}`;
