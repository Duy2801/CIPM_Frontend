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
