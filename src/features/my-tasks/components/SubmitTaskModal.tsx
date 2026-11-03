"use client";

import { useState } from "react";
import { SendOutlined } from "@ant-design/icons";
import { Button, Input, Modal, StandardFileUpload, type UploadedAttachment } from "@/components/ui";
import type { ProcedureDocument } from "@/features/construction-procedures/types/procedure.types";
import type { MyTask } from "../utils/my-tasks";

interface SubmitTaskModalProps {
  task: MyTask | null;
  submitterName: string;
  onClose: () => void;
  onSubmit: (task: MyTask, input: { note?: string; documents: ProcedureDocument[] }) => void;
}

const FILE_TYPES: Record<string, ProcedureDocument["fileType"]> = {
  PDF: "pdf",
  DOCX: "docx",
  EXCEL: "xlsx",
};

/** Nộp kết quả một bước: ghi chú + hồ sơ đính kèm (bắt buộc có ít nhất một trong hai) */
export default function SubmitTaskModal({ task, submitterName, onClose, onSubmit }: SubmitTaskModalProps) {
  return (
    <Modal
      open={Boolean(task)}
      onCancel={onClose}
      footer={null}
      centered
      width={560}
      destroyOnHidden
      title={task?.flow === "RETURNED" ? "Nộp lại kết quả" : "Nộp kết quả chờ duyệt"}
    >
      {task && <SubmitForm key={task.step.id} task={task} submitterName={submitterName} onClose={onClose} onSubmit={onSubmit} />}
    </Modal>
  );
}

function SubmitForm({ task, submitterName, onClose, onSubmit }: Omit<SubmitTaskModalProps, "task"> & { task: MyTask }) {
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<UploadedAttachment[]>([]);
  const [error, setError] = useState<string>();

  const submit = () => {
    if (!note.trim() && files.length === 0) {
      setError("Nhập ghi chú kết quả hoặc đính kèm ít nhất một hồ sơ.");
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    onSubmit(task, {
      note: note.trim() || undefined,
      documents: files.map((f) => ({
        id: f.id,
        documentCode: "",
        title: f.name,
        issuer: "",
        issueDate: today,
        fileName: f.name,
        fileSize: f.size,
        uploadedAt: today,
        uploadedBy: submitterName,
        fileType: FILE_TYPES[f.type],
      })),
    });
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
        <div className="font-semibold text-slate-900">
          <span className="font-mono text-slate-500">{task.step.code}</span> · {task.step.name}
        </div>
        <div className="mt-0.5 text-slate-500">
          {task.projectName} · {task.procedureName}
        </div>
      </div>

      {task.flow === "RETURNED" && task.step.rejectionReason && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          <strong>Lý do bị từ chối:</strong> {task.step.rejectionReason}
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-700">Ghi chú kết quả</label>
        <Input.TextArea
          rows={3}
          value={note}
          maxLength={1000}
          showCount
          placeholder="Tóm tắt kết quả đã làm, những gì đã bổ sung so với lần trước..."
          onChange={(e) => {
            setNote(e.target.value);
            setError(undefined);
          }}
        />
      </div>

      <StandardFileUpload
        title="Hồ sơ kết quả"
        subTitle="PDF, DOCX, XLSX, ảnh · chọn được nhiều tệp"
        value={files}
        onChange={(next) => {
          setFiles(next);
          setError(undefined);
        }}
      />

      {error && <p className="m-0 text-xs text-rose-600">{error}</p>}

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
        <Button intent="outline" scale="sm" onClick={onClose} className="px-4">
          Hủy
        </Button>
        <Button
          intent="primary"
          scale="sm"
          icon={<SendOutlined />}
          onClick={submit}
          className="!border-[#DC2626] !bg-[#DC2626] px-4 font-semibold hover:!bg-[#B91C1C]"
        >
          Nộp chờ duyệt
        </Button>
      </div>
    </div>
  );
}
