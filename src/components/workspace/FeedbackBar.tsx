"use client";

import { CheckCircleFilled, CloseOutlined, ExclamationCircleFilled } from "@ant-design/icons";
import { Button, Flex, Text } from "@/components/ui";

interface FeedbackBarProps {
  type: "success" | "error";
  text: string;
  onClose: () => void;
}

export default function FeedbackBar({ type, text, onClose }: FeedbackBarProps) {
  const isSuccess = type === "success";
  return (
    <aside
      role={isSuccess ? "status" : "alert"}
      className={`rounded-xl border px-4 py-2.5 ${
        isSuccess ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"
      }`}
    >
      <Flex align="center" justify="space-between" gap="small">
        <Flex align="center" gap="small">
          {isSuccess ? (
            <CheckCircleFilled className="text-emerald-600" />
          ) : (
            <ExclamationCircleFilled className="text-rose-600" />
          )}
          <Text strong className={`text-[13px] ${isSuccess ? "text-emerald-900" : "text-rose-900"}`}>
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
