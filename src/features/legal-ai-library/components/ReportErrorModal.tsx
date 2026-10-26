"use client";

import { useState } from "react";
import { WarningOutlined } from "@ant-design/icons";
import { Button, Input, Modal } from "@/components/ui";
import { App } from "antd";

interface ReportErrorModalProps {
  open: boolean;
  onClose: () => void;
  documentTitle: string;
}

export default function ReportErrorModal({
  open,
  onClose,
  documentTitle,
}: ReportErrorModalProps) {
  const { message } = App.useApp();
  const [errorType, setErrorType] = useState("Hiệu lực chưa chính xác");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!description.trim()) {
      message.warning("Vui lòng mô tả chi tiết lỗi hoặc đề xuất cập nhật.");
      return;
    }
    message.success("Cảm ơn bạn! Đã gửi phản ánh tới Ban Biên tập Pháp lý CIPM.");
    setDescription("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <WarningOutlined className="text-amber-600" />
          <span className="text-base font-bold text-slate-800">
            Báo lỗi / Đề xuất cập nhật văn bản
          </span>
        </div>
      }
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button intent="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button intent="primary" onClick={handleSubmit}>
            Gửi phản ánh
          </Button>
        </div>
      }
      width={520}
      centered
    >
      <div className="py-2 space-y-3.5 text-xs">
        <div className="rounded bg-slate-50 p-2.5 border border-slate-200 text-slate-700">
          <strong>Văn bản phản ánh:</strong> {documentTitle}
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Loại lỗi cần phản ánh:</label>
          <select
            value={errorType}
            onChange={(e) => setErrorType(e.target.value)}
            className="w-full rounded border border-slate-300 p-2 text-xs"
          >
            <option value="Hiệu lực chưa chính xác">Tình trạng hiệu lực chưa cập nhật chính xác</option>
            <option value="Sai lỗi chính tả / nội dung">Sai lỗi chính tả hoặc thiếu sót điều khoản</option>
            <option value="Thiếu văn bản liên quan">Thiếu văn bản sửa đổi / hướng dẫn thi hành mới</option>
            <option value="Lỗi tệp đính kèm">Tệp PDF/Word bị lỗi không mở được</option>
            <option value="Khác">Lỗi hoặc góp ý khác</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Mô tả chi tiết nội dung sai sót:</label>
          <Input.TextArea
            rows={4}
            placeholder="Mô tả cụ thể điều khoản, nội dung sai lệch hoặc văn bản mới cần bổ sung..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
