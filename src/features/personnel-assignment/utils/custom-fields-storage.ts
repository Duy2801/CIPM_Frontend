import type { CustomFieldDefinition, CustomFieldTarget } from "../types/custom-fields.types";

const STORAGE_KEY_PREFIX = "cipm_custom_fields_";
const CHANGE_EVENT_NAME = "cipm-custom-fields-changed";
const DATASET_STORAGE_KEY = "cipm_personnel_dataset_v1";

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

/**
 * Xóa hoàn toàn một trường tùy biến đã bị gỡ khỏi cấu hình ra khỏi dữ liệu thực tế (các phòng ban hoặc nhân sự)
 */
export function purgeCustomFieldFromDataset(target: CustomFieldTarget, fieldName: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(DATASET_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    let changed = false;

    if (target === "team" && parsed.teams) {
      parsed.teams.forEach((t: any) => {
        if (t.customFields) {
          if (t.customFields[fieldName] !== undefined) {
            delete t.customFields[fieldName];
            changed = true;
          }
          // Dọn dẹp trường rác fdsaf nếu còn tồn đọng
          for (const k of Object.keys(t.customFields)) {
            if (/fdsaf/i.test(k)) {
              delete t.customFields[k];
              changed = true;
            }
          }
        }
      });
    } else if (target === "staff" && parsed.staff) {
      parsed.staff.forEach((s: any) => {
        if (s.customFields) {
          if (s.customFields[fieldName] !== undefined) {
            delete s.customFields[fieldName];
            changed = true;
          }
          for (const k of Object.keys(s.customFields)) {
            if (/fdsaf/i.test(k)) {
              delete s.customFields[k];
              changed = true;
            }
          }
        }
      });
    }

    if (changed) {
      localStorage.setItem(DATASET_STORAGE_KEY, JSON.stringify(parsed));
      window.dispatchEvent(new Event("cipm-personnel-dataset-changed"));
    }
  } catch (err) {
    console.error("Lỗi xóa trường dữ liệu khỏi dataset:", err);
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
