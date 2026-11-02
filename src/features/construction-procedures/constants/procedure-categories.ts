export const PROCEDURE_CATEGORY = {
  XDCB: "Thủ tục đầu tư XDCB",
  GPMB: "Bồi thường – GPMB",
  BIDDING: "Đấu thầu",
  FINANCE: "Tài chính & Quyết toán",
  WARRANTY: "Bảo hành & Bảo trì",
} as const;

export const DEFAULT_PROCEDURE_CATEGORIES: string[] = Object.values(PROCEDURE_CATEGORY);

export const TEMPLATE_CATEGORY: Record<string, string> = {
  "template-khkt": PROCEDURE_CATEGORY.XDCB,
  "template-dauthau": PROCEDURE_CATEGORY.BIDDING,
  "template-gskt": PROCEDURE_CATEGORY.XDCB,
  "template-quy-hoach": PROCEDURE_CATEGORY.XDCB,
};

const CATEGORY_STORAGE_KEY = "cipm_procedure_categories";

function loadAddedCategories(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(CATEGORY_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((c): c is string => typeof c === "string") : [];
  } catch {
    return [];
  }
}

export function getProcedureCategories(): string[] {
  return [...new Set([...DEFAULT_PROCEDURE_CATEGORIES, ...loadAddedCategories()])];
}

export function addProcedureCategory(name: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify([...new Set([...loadAddedCategories(), name])]));
  } catch (e) {
    console.error("Failed to save procedure category", e);
  }
}
