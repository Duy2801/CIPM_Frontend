export const FUNDING_STORAGE_KEY = "cipm_custom_funding_sources";
export const NATURE_STORAGE_KEY = "cipm_custom_project_natures";

export const DROPDOWN_LIST_HEIGHT = 5 * 32;

export const sameText = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export function loadCustomOptions(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function saveCustomOptions(key: string, list: string[]): string[] {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
  }
  return list;
}
