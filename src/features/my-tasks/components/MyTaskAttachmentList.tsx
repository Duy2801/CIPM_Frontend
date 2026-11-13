"use client";

import { useState } from "react";
import { DeleteOutlined, FileTextOutlined } from "@ant-design/icons";
import { FilePreviewModal, Tooltip } from "@/components/ui";
import type { ProcedureDocument } from "@/shared/construction-procedures/types/procedure.types";
import { formatDateVi } from "@/utils/date";
import { storedFileUrl } from "@/utils/stored-file";
import { useMyTaskActions } from "../hooks/useMyTaskActions";
import { useMyTask, useMyTaskIdentity } from "@/shared/my-tasks/hooks/useMyTaskQueries";

interface MyTaskAttachmentListProps {
  projectId: string;
  stepId: string;
  editable?: boolean;
}

export default function MyTaskAttachmentList({ projectId, stepId, editable = false }: MyTaskAttachmentListProps) {
  const documents = useMyTask({ projectId, stepId })?.step.attachments ?? [];
  const { me } = useMyTaskIdentity();
  const { removeFile } = useMyTaskActions();
  const [previewing, setPreviewing] = useState<ProcedureDocument | null>(null);

  return (
    <div className="space-y-1.5">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50/70 px-2.5 py-2 hover:border-slate-200 hover:bg-slate-100/70"
        >
          <button
            type="button"
            onClick={() => setPreviewing(doc)}
            title={`Xem ${doc.fileName}`}
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 border-0 bg-transparent p-0 text-left"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-red-200 bg-red-50 text-[#DC2626]">
              <FileTextOutlined className="text-xs" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-slate-800 hover:text-[#DC2626]">{doc.fileName}</span>
              <span className="block text-[10px] text-slate-400">
                {doc.fileSize} · {doc.uploadedBy} · {doc.uploadedAt ? formatDateVi(doc.uploadedAt) : "—"}
              </span>
            </span>
          </button>
          {editable && doc.uploadedBy === me.name && (
            <Tooltip title="Gỡ hồ sơ">
              <button
                type="button"
                aria-label={`Gỡ ${doc.fileName}`}
                onClick={() => removeFile({ projectId, stepId }, doc)}
                className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded border-0 bg-transparent text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              >
                <DeleteOutlined className="text-xs" />
              </button>
            </Tooltip>
          )}
        </div>
      ))}
      {previewing && (
        <FilePreviewModal
          fileName={previewing.fileName}
          url={storedFileUrl(previewing)}
          fallback={
            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-500">
              Tệp mẫu (dữ liệu demo) hoặc tệp tải lên trước khi có chức năng xem — chưa có nội dung gốc để hiển thị.
            </div>
          }
          onClose={() => setPreviewing(null)}
        />
      )}
    </div>
  );
}
