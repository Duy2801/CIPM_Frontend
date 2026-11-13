import apiClient from "@/config";

export interface ApiAuditLog {
  id: string;
  at: string;
  actorName?: string | null;
  actorRole?: string | null;
  module: string;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  targetName?: string | null;
  changes?: { label: string; from?: string; to?: string }[];
  note?: string | null;
}

export interface AuditLogQuery {
  module?: string;
  targetId?: string;
  date?: string;
}

export async function getAuditLogsApi(query: AuditLogQuery = {}): Promise<ApiAuditLog[]> {
  return (await apiClient.get<ApiAuditLog[]>("audit-logs", { params: query })).data;
}
