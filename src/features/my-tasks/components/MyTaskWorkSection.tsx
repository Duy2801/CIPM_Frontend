"use client";

import { useState } from "react";
import { Input, StandardFileUpload } from "@/components/ui";
import { useMyTaskActions } from "../hooks/useMyTaskActions";
import { useMyTask } from "@/shared/my-tasks/hooks/useMyTaskQueries";
import MyTaskAttachmentList from "./MyTaskAttachmentList";
import { MyTaskHeading } from "./MyTaskSection";

interface MyTaskWorkSectionProps {
  projectId: string;
  stepId: string;
}

export default function MyTaskWorkSection({ projectId, stepId }: MyTaskWorkSectionProps) {
  const ref = { projectId, stepId };
  const step = useMyTask(ref)?.step;
  const { saveNote: save, addFiles } = useMyTaskActions();
  const saved = step?.submissionNote ?? "";
  const [note, setNote] = useState(saved);
  const [justSaved, setJustSaved] = useState(false);
  const dirty = note.trim() !== saved.trim();
  const noteId = `note-${stepId}`;
  if (!step) return null;

  const saveNote = async () => {
    if (dirty && (await save(ref, note))) setJustSaved(true);
  };

  return (
    <section className="space-y-3 rounded-lg border border-slate-200 p-3">
      <MyTaskHeading>Kết quả thực hiện</MyTaskHeading>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700" htmlFor={noteId}>
            Ghi chú
          </label>
          <span className="text-[11px] text-slate-400">{dirty ? "Chưa lưu" : justSaved ? "Đã lưu" : "Tự lưu khi rời ô"}</span>
        </div>
        <Input.TextArea
          id={noteId}
          rows={3}
          value={note}
          maxLength={1000}
          showCount
          placeholder="Ghi lại tiến độ, nội dung đã làm, vướng mắc..."
          onChange={(e) => {
            setNote(e.target.value);
            setJustSaved(false);
          }}
          onBlur={saveNote}
        />
      </div>

      <div>
        <div className="mb-1 text-xs font-semibold text-slate-700">
          Hồ sơ{step.attachments.length > 0 && ` (${step.attachments.length})`}
        </div>
        {step.attachments.length > 0 && (
          <div className="mb-2">
            <MyTaskAttachmentList projectId={projectId} stepId={stepId} editable />
          </div>
        )}
        <StandardFileUpload
          hideHeader
          promptText="Nhấn hoặc kéo thả để thêm hồ sơ"
          value={[]}
          onChange={(files) => addFiles(ref, files)}
        />
      </div>
    </section>
  );
}
