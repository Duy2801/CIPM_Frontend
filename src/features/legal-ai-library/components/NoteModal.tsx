"use client";

import { useState } from "react";
import { EditOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Input, Modal } from "@/components/ui";
import { App } from "antd";

interface NoteModalProps {
  open: boolean;
  onClose: () => void;
  documentTitle: string;
  initialTarget?: string;
}

export default function NoteModal({
  open,
  onClose,
  documentTitle,
  initialTarget,
}: NoteModalProps) {
  const { message } = App.useApp();
  const [noteContent, setNoteContent] = useState("");
  const [scope, setScope] = useState("Cá nhân");

  const handleSave = () => {
    if (!noteContent.trim()) {
      message.warning("Vui lòng nhập nội dung ghi chú.");
      return;
    }
    message.success("Đã lưu ghi chú cho văn bản pháp luật!");
    setNoteContent("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <EditOutlined className="text-[#DC2626]" />
          <span className="text-base font-bold text-slate-800">
            Thêm ghi chú nghiệp vụ văn bản
          </span>
        </div>
      }
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button intent="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            intent="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            className="!bg-[#DC2626] !border-[#DC2626] text-white"
          >
            Lưu ghi chú
          </Button>
        </div>
      }
      width={520}
      centered
    >
      <div className="py-2 space-y-3.5 text-xs">
        <div className="rounded bg-slate-50 p-2.5 border border-slate-200 text-slate-700">
          <strong>Văn bản:</strong> {documentTitle}
          {initialTarget && (
            <div className="mt-1 text-blue-700">
              <strong>Đối tượng ghi chú:</strong> {initialTarget}
            </div>
          )}
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Phạm vi áp dụng ghi chú:
          </label>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="w-full rounded border border-slate-300 p-2 text-xs"
          >
            <option value="Cá nhân">Chỉ mình tôi (Ghi chú cá nhân)</option>
            <option value="Phòng ban">Toàn phòng / Tổ công tác chuyên môn</option>
            <option value="Toàn ban">Công khai toàn Ban QLDA (CIPM)</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Nội dung ghi chú & lưu ý khi áp dụng vào dự án:
          </label>
          <Input.TextArea
            rows={4}
            placeholder="Ví dụ: Lưu ý áp dụng khoản 2 Điều này cho các gói thầu thi công xây lắp đợt 2 của dự án..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
