"use client";

import { useCallback, useMemo, useState } from "react";
import { useCatalog } from "@/features/catalogs";
import {
  DEFAULT_DISBURSEMENT_CATEGORIES,
  loadCustomCategories,
  loadProjectDisbursements,
  saveCustomCategories,
  saveProjectDisbursements,
  summarizeDisbursements,
  type DisbursementEntry,
} from "../utils/project-disbursement";

export type NewDisbursement = Pick<DisbursementEntry, "kind" | "category" | "amount" | "content" | "attachments">;

/** Giải ngân của một dự án: danh sách đợt, tổng hợp theo danh mục, thêm / xóa đợt, thêm danh mục */
export function useProjectDisbursements(
  projectId: string,
  operatorName: string,
  headings?: readonly string[],
) {
  // Tab chỉ hiện sau khi người dùng bấm vào (chạy trên trình duyệt) nên đọc thẳng lúc khởi tạo
  const [entries, setEntries] = useState<DisbursementEntry[]>(() => loadProjectDisbursements(projectId));
  const [customCategories, setCustomCategories] = useState<string[]>(loadCustomCategories);

  // Danh mục chi phí: danh mục backend (EXPENSE_TYPE) nếu có, không thì danh sách mặc định; cộng các danh mục tự thêm
  const { items: catalog, add: addToCatalog } = useCatalog("EXPENSE_TYPE");
  // Khóa ổn định cho useMemo (mảng đầu mục tạo mới mỗi lần render)
  const headingKey = JSON.stringify(headings ?? []);
  const categories = useMemo(() => {
    // Dự án đã có đầu mục (tên tab quy trình) thì giải ngân theo các đầu mục đó
    const list = JSON.parse(headingKey) as string[];
    if (list.length > 0) return list;
    const base = catalog.length > 0 ? catalog.map((c) => c.name) : [...DEFAULT_DISBURSEMENT_CATEGORIES];
    return [...base, ...customCategories.filter((c) => !base.includes(c))];
  }, [catalog, customCategories, headingKey]);

  const summary = useMemo(() => summarizeDisbursements(entries, categories), [entries, categories]);

  const commit = useCallback(
    (next: DisbursementEntry[]) => {
      setEntries(next);
      saveProjectDisbursements(projectId, next);
    },
    [projectId],
  );

  const add = useCallback(
    (input: NewDisbursement) => {
      const now = new Date();
      const entry: DisbursementEntry = {
        ...input,
        id: `GN-${now.getTime()}`,
        // Ngày giải ngân = ngày thực hiện
        date: now.toISOString().slice(0, 10),
        createdBy: operatorName,
        createdAt: now.toISOString(),
      };
      commit([entry, ...entries]);
      return entry;
    },
    [entries, commit, operatorName],
  );

  const remove = useCallback((id: string) => commit(entries.filter((e) => e.id !== id)), [entries, commit]);

  /** Thêm danh mục mới (gõ trong ô chọn danh mục) */
  const addCategory = useCallback(
    (name: string) => {
      if (categories.includes(name)) return;
      const next = [...customCategories, name];
      setCustomCategories(next);
      saveCustomCategories(next);
      void addToCatalog(name);
    },
    [categories, customCategories, addToCatalog],
  );

  return { entries, categories, summary, add, remove, addCategory };
}
