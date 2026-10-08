"use client";

import { useCallback, useState } from "react";
import { toast } from "@/components/ui";

export interface ActionFeedback {
  type: "success" | "error";
  text: string;
}

/**
 * Chạy một thao tác bất đồng bộ và ghi lại thông báo thành công / lỗi
 * để hiển thị cho người dùng qua Toast từ bên phải màn hình.
 * Trả về true khi thao tác thành công.
 */
export function useActionFeedback(onSuccess?: () => Promise<void>) {
  const [feedback, setFeedback] = useState<ActionFeedback | null>(null);

  const run = useCallback(async (action: () => Promise<unknown>, successText: string) => {
    try {
      setFeedback(null);
      await action();
      await onSuccess?.();
      setFeedback({ type: "success", text: successText });
      toast.success(successText);
      return true;
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Không thể hoàn tất thao tác, vui lòng thử lại.";
      setFeedback({
        type: "error",
        text: errorMsg,
      });
      toast.error(errorMsg);
      return false;
    }
  }, [onSuccess]);

  const clearFeedback = useCallback(() => setFeedback(null), []);

  return { feedback, run, clearFeedback, setFeedback };
}
