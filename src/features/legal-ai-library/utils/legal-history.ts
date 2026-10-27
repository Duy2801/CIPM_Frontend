import type { ActivityEntry } from "../../personnel-assignment/utils/activity-log.ts";
import { LEGAL_LOG_MODULE, STATUS_META, getCategoryLabel } from "../constants/legal-labels.ts";
import type { LegalDocument } from "../types/legal-ai.types.ts";

/**
 * Lịch sử của một văn bản, mới nhất lên đầu. Văn bản mẫu chưa có dòng "Thêm" trong nhật ký
 * thì bổ sung một dòng "Tiếp nhận & đưa vào thư viện" theo ngày ban hành.
 */
export function getDocumentHistory(entries: ActivityEntry[], document: LegalDocument): ActivityEntry[] {
  const own = entries.filter(
    (e) =>
      e.module === LEGAL_LOG_MODULE &&
      (e.targetId === document.id ||
        e.targetId === document.code ||
        (document.code && e.action.includes(document.code))),
  );

  const hasCreation = own.some(
    (e) => e.action.includes("Thêm") || e.action.includes("Ban hành") || e.action.includes("tiếp nhận"),
  );

  const initialEntry: ActivityEntry = {
    id: `INIT-${document.id}`,
    at: `${document.issueDate || "2024-01-01"}T08:00:00+07:00`,
    actorName: document.signer || "Ban QLDA Đầu tư Xây dựng",
    actorRole: document.issuer || "Cơ quan ban hành",
    module: LEGAL_LOG_MODULE,
    action: `Tiếp nhận & đưa vào thư viện: ${document.code}`,
    targetId: document.id,
    targetName: document.title || document.code,
    changes: [
      { label: "Cơ quan ban hành", to: document.issuer },
      { label: "Loại văn bản", to: getCategoryLabel(document.category) },
      { label: "Tình trạng", to: STATUS_META[document.status]?.label ?? "Còn hiệu lực" },
      ...(document.signer ? [{ label: "Người ký", to: document.signer }] : []),
      ...(document.field ? [{ label: "Lĩnh vực", to: document.field }] : []),
    ],
  };

  const combined = hasCreation ? own : [...own, initialEntry];
  return combined.sort((a, b) => b.at.localeCompare(a.at));
}
