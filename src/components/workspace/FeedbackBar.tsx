"use client";

import { CheckCircleFilled, CloseOutlined, ExclamationCircleFilled } from "@ant-design/icons";
import { Button, Flex, Text } from "@/components/ui";

interface FeedbackBarProps {
  type: "success" | "error";
  text: string;
  onClose: () => void;
}

export default function FeedbackBar({ type, text, onClose }: FeedbackBarProps) {
  // Đã có toast notification thông báo kết quả, ẩn thanh banner xanh thành công
  if (type === "success") return null;

  return (
    <aside
      role="alert"
      className="rounded-xl border px-4 py-2.5 border-rose-200 bg-rose-50"
    >
      <Flex align="center" justify="space-between" gap="small">
        <Flex align="center" gap="small">
          <ExclamationCircleFilled className="text-rose-600" />
          <Text strong className="text-[13px] text-rose-900">
            {text}
          </Text>
        </Flex>
        <Button
          intent="link"
          aria-label="Đóng thông báo"
          icon={<CloseOutlined className="text-xs" />}
          onClick={onClose}
        />
      </Flex>
    </aside>
  );
}
