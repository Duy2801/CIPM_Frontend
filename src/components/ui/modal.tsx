import React from "react";
import AntModal from "antd/es/modal";
import type { ModalProps as AntModalProps } from "antd/es/modal";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";
import { getDestroyOnHidden } from "./modal-props";

export const modalVariants = cva(
  "[&_.ant-modal-footer]:!flex [&_.ant-modal-footer]:!flex-row [&_.ant-modal-footer]:!justify-start [&_.ant-modal-footer]:!items-center [&_.ant-modal-footer]:!gap-2.5",
  {
    variants: {
      intent: {
        default: "",
        portal:
          "[&_.ant-modal-content]:!rounded-2xl [&_.ant-modal-content]:!p-6 [&_.ant-modal-header]:!mb-4",
      },
    },
    defaultVariants: {
      intent: "default",
    },
  },
);

/**
 * Kích thước popup lớn dùng chung (VD: Quản lý chức danh, Cấu hình quy trình thủ tục):
 * rộng tối đa 1600px, cả khung popup cao min(92vh, 1000px) — tính cả tiêu đề, thân và thanh nút.
 * Thân popup tự giãn lấp phần còn lại.
 */
export const LARGE_MODAL_PROPS = {
  width: "min(1600px, calc(100vw - 32px))",
  style: { maxWidth: 1600, top: 0, paddingBottom: 0 },
  wrapClassName: "cipm-centered-modal-wrap",
  centered: true,
} as const;

export const LARGE_MODAL_CONTAINER_STYLE: React.CSSProperties = {
  height: "min(92vh, 1000px)",
  maxHeight: "calc(100vh - 48px)",
  display: "flex",
  flexDirection: "column",
};

export const LARGE_MODAL_BODY_STYLE: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
};

export interface ModalProps
  extends
    Omit<AntModalProps, "destroyOnClose">,
    VariantProps<typeof modalVariants> {
  /** @deprecated Use `destroyOnHidden` for new callers. */
  destroyOnClose?: boolean;
}

export const Modal: React.FC<ModalProps> & {
  info: typeof AntModal.info;
  success: typeof AntModal.success;
  error: typeof AntModal.error;
  warning: typeof AntModal.warning;
  confirm: typeof AntModal.confirm;
  useModal: typeof AntModal.useModal;
} = ({
  intent,
  className,
  wrapClassName,
  destroyOnClose,
  destroyOnHidden,
  centered = true,
  closable = false,
  closeIcon = null,
  zIndex = 1300,
  ...props
}) => {
  React.useEffect(() => {
    if (props.open) {
      const prevHtmlOverflow = document.documentElement.style.overflow;
      const prevBodyOverflow = document.body.style.overflow;
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      return () => {
        document.documentElement.style.overflow = prevHtmlOverflow;
        document.body.style.overflow = prevBodyOverflow;
      };
    }
  }, [props.open]);

  return (
    <AntModal
      centered={centered}
      wrapClassName={wrapClassName}
      className={cn(modalVariants({ intent }), className)}
      destroyOnHidden={getDestroyOnHidden(destroyOnHidden, destroyOnClose)}
      closable={closable}
      closeIcon={closable ? closeIcon : null}
      zIndex={zIndex}
      {...props}
    />
  );
};

Modal.info = AntModal.info;
Modal.success = AntModal.success;
Modal.error = AntModal.error;
Modal.warning = AntModal.warning;
Modal.confirm = AntModal.confirm;
Modal.useModal = AntModal.useModal;
Modal.displayName = "Modal";
