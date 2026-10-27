"use client";

import { useMemo } from "react";
import { HistoryOutlined } from "@ant-design/icons";
import ActivityTimeline from "@/features/personnel-assignment/components/ActivityTimeline";
import { useActivityLogVersion } from "@/features/personnel-assignment/hooks/useActivityLogVersion";
import { getPersonnelActivities } from "@/features/personnel-assignment/utils/activity-log";
import type { LegalDocument } from "../types/legal-ai.types";
import { getDocumentHistory } from "../utils/legal-history";

/** Lịch sử thực hiện trên một văn bản (theo bản đã lưu, không theo bản nháp đang sửa) */
export default function DocumentHistorySection({ document }: { document: LegalDocument }) {
  const logVersion = useActivityLogVersion();
  const entries = useMemo(
    () => getDocumentHistory(getPersonnelActivities(), document),
    // đọc lại khi nhật ký có dòng mới
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [document, logVersion],
  );

  return (
    <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4">
      <div className="mb-2.5 flex items-center justify-between gap-2 text-xs font-bold text-slate-700">
        <span className="flex items-center gap-1.5">
          <HistoryOutlined className="text-[#DC2626]" />
          Lịch sử thực hiện ({entries.length})
        </span>
      </div>
      <ActivityTimeline
        entries={entries}
        emptyText="Chưa có lịch sử thực hiện nào được ghi nhận cho văn bản này."
        pageSize={5}
      />
    </div>
  );
}
