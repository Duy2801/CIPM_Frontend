import type { ProcedureHistoryLog } from "@/shared/construction-procedures/types/procedure.types.ts";
import type { ActivityEntry } from "@/shared/personnel-assignment/utils/activity-log.ts";

const HANDBACK_LABELS: Record<string, { from: string; to: string; reason: string }> = {
  "Hoàn trả việc": { from: "Chờ duyệt", to: "Đang xử lý", reason: "Lý do hoàn trả" },
  "Từ chối nhận việc": { from: "Chờ tiếp nhận", to: "Trả về Tổ trưởng", reason: "Lý do từ chối" },
};

export function toIsoTimestamp(value: string): string {
  if (/T.*(Z|[+-]\d{2}:?\d{2})$/.test(value)) return value;
  const local = value.includes("T") ? value : value.length > 10 ? value.replace(" ", "T") : `${value}T00:00`;
  const d = new Date(`${local.slice(0, 16)}:00+07:00`);
  return Number.isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString();
}

export function toTaskActivityEntry(log: ProcedureHistoryLog): ActivityEntry {
  const handback = HANDBACK_LABELS[log.actionLabel];
  if (handback) {
    return {
      id: log.id,
      at: toIsoTimestamp(log.timestamp),
      actorName: log.performedBy,
      actorRole: "Người thực hiện",
      module: "Quy trình",
      action: `Người thực hiện ${log.actionLabel.toLowerCase()}`,
      changes: [
        { label: "Trạng thái", from: handback.from, to: handback.to },
        { label: handback.reason, to: log.reason || "Không ghi lý do" },
      ],
    };
  }
  return {
    id: log.id,
    at: toIsoTimestamp(log.timestamp),
    actorName: log.performedBy,
    actorRole: log.role,
    module: "Quy trình",
    action: log.actionLabel,
    note:
      [log.details, log.reason && !log.details?.includes(log.reason) ? `Lý do: ${log.reason}` : undefined]
        .filter(Boolean)
        .join(" · ") || undefined,
  };
}
