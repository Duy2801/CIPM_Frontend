"use client";

import { useState } from "react";
import { PlusOutlined, UserAddOutlined } from "@ant-design/icons";
import {
  Button,
  Input,
  Modal,
  Text,
  Title,
  toast,
} from "@/components/ui";

interface AddRoleModalProps {
  open: boolean;
  onClose: () => void;
  onAddRole: (roleData: {
    name: string;
    shortName: string;
    group: "lead" | "member" | "special";
    description: string;
    initialPermissions: string[];
  }) => void;
}

export default function AddRoleModal({
  open,
  onClose,
  onAddRole,
}: AddRoleModalProps) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    if (submitting) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.warning("Vui lòng nhập tên chức vụ / vai trò.");
      return;
    }

    setSubmitting(true);
    try {
      onAddRole({
        name: trimmedName,
        shortName: trimmedName,
        group: "member",
        description: `Vị trí chức danh ${trimmedName} trong hệ thống`,
        initialPermissions: [],
      });

      setName("");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={460}
      className="[&_.ant-modal-content]:!p-0 [&_.ant-modal-content]:!rounded-2xl overflow-hidden shadow-2xl"
    >
      <div className="bg-white text-slate-900">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-[#DC2626] border border-red-200">
              <UserAddOutlined className="text-xl" />
            </div>
            <div>
              <Title level={4} className="!m-0 text-slate-900 font-bold text-base">
                Thêm vai trò mới
              </Title>
              <Text className="text-xs text-slate-500">
                Thêm chức danh vào hệ thống phân quyền BQL ĐTXD
              </Text>
            </div>
          </div>
        </div>

        {/* Nội dung: Chỉ nhập tên vai trò / chức vụ */}
        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tên chức vụ / Vai trò <span className="text-red-500">*</span>
            </label>
            <Input
              autoFocus
              intent="clean"
              placeholder="VD: Cán bộ Pháp chế, Tổ phó Kỹ thuật, Giám sát viên..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              className="w-full text-xs h-9 bg-white"
            />
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-[11.5px] text-slate-600 leading-relaxed">
            💡 Sau khi thêm, chức danh này sẽ xuất hiện ngay thành một cột trên bảng ma trận. Bạn có thể tích chọn cấp quyền trực tiếp cho vai trò đó trên ma trận và bấm <strong>Lưu cấu hình</strong>.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
          <Button
            intent="outline"
            className="!border-slate-300 text-xs h-8.5 rounded-lg text-slate-700"
            onClick={onClose}
          >
            Hủy
          </Button>
          <Button
            intent="primary"
            icon={<PlusOutlined />}
            loading={submitting}
            disabled={submitting || !name.trim()}
            className="h-8.5 text-xs font-semibold bg-[#DC2626] hover:bg-red-700 text-white rounded-lg shadow-xs disabled:opacity-50"
            onClick={handleSubmit}
          >
            Thêm vai trò
          </Button>
        </div>
      </div>
    </Modal>
  );
}
