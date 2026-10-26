import type { CustomFieldDefinition, CustomFieldTarget } from "../types/custom-fields.types";

const STORAGE_KEY_PREFIX = "cipm_custom_fields_";
const CHANGE_EVENT_NAME = "cipm-custom-fields-changed";

export const DEFAULT_STAFF_CUSTOM_FIELDS: CustomFieldDefinition[] = [];

export const DEFAULT_TEAM_CUSTOM_FIELDS: CustomFieldDefinition[] = [];

const LEGACY_DEFAULT_IDS = new Set([
  "cf_trinh_do",
  "cf_chung_chi",
  "cf_ngay_vao_nganh",
  "cf_dia_diem",
  "cf_hotline",
  "cf_email_phong",
]);

export function getCustomFields(target: CustomFieldTarget): CustomFieldDefinition[] {
  if (typeof window === "undefined") {
    return target === "staff" ? DEFAULT_STAFF_CUSTOM_FIELDS : DEFAULT_TEAM_CUSTOM_FIELDS;
  }

  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${target}`);
    if (!raw) {
      const defaultFields = target === "staff" ? DEFAULT_STAFF_CUSTOM_FIELDS : DEFAULT_TEAM_CUSTOM_FIELDS;
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${target}`, JSON.stringify(defaultFields));
      return defaultFields;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Lọc bỏ các trường mẫu mặc định cũ, trường rác hoặc trường thử nghiệm (như fdsaf)
    const filtered = parsed
      .filter((f) => !LEGACY_DEFAULT_IDS.has(f.id))
      .filter((f) => f.label !== "Ngày bắt đầu" && f.name !== "ngay_bat_dau")
      .filter((f) => !/fdsaf/i.test(f.label) && !/fdsaf/i.test(f.name));
    if (filtered.length !== parsed.length) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${target}`, JSON.stringify(filtered));
    }
    return filtered;
  } catch (err) {
    console.error(`Lỗi đọc trường tùy biến cho ${target}:`, err);
    return target === "staff" ? DEFAULT_STAFF_CUSTOM_FIELDS : DEFAULT_TEAM_CUSTOM_FIELDS;
  }
}

export function saveCustomFields(target: CustomFieldTarget, fields: CustomFieldDefinition[]): void {
  if (typeof window === "undefined") return;

  try {
    // Luôn loại trừ trường thử nghiệm fdsaf
    const cleanFields = fields.filter((f) => !/fdsaf/i.test(f.label) && !/fdsaf/i.test(f.name));
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${target}`, JSON.stringify(cleanFields));
    window.dispatchEvent(
      new CustomEvent(CHANGE_EVENT_NAME, { detail: { target, fields: cleanFields } })
    );
  } catch (err) {
    console.error(`Lỗi lưu trường tùy biến cho ${target}:`, err);
  }
}

export function subscribeCustomFieldsChange(
  callback: (target: CustomFieldTarget, fields: CustomFieldDefinition[]) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<{ target: CustomFieldTarget; fields: CustomFieldDefinition[] }>;
    if (customEvent.detail) {
      callback(customEvent.detail.target, customEvent.detail.fields);
    }
  };

  window.addEventListener(CHANGE_EVENT_NAME, handler);
  return () => window.removeEventListener(CHANGE_EVENT_NAME, handler);
}
