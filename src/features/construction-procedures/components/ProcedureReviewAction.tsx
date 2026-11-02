"use client";

import { CheckOutlined, SendOutlined } from "@ant-design/icons";
import { App } from "antd";
import { Button, toast, Tooltip } from "@/components/ui";
import { approveProcedure, submitProcedure, type ProcedureLibraryItem } from "../utils/procedure-library";

interface ProcedureReviewActionProps {
  procedure: ProcedureLibraryItem;
  actorName: string;
  canApprove: boolean;
  onChanged: () => void;
}

export default function ProcedureReviewAction({ procedure, actorName, canApprove, onChanged }: ProcedureReviewActionProps) {
  const { modal } = App.useApp();

  if (procedure.status === "PROCESSING") {
    const empty = procedure.steps.length === 0;
    const confirmSubmit = () =>
      modal.confirm({
        title: "Nộp quy trình?",
        content: `Quy trình "${procedure.name}" sẽ chuyển sang trạng thái Chờ duyệt.`,
        okText: "Nộp",
        cancelText: "Hủy",
        onOk: () => {
          submitProcedure(procedure.id, actorName);
          onChanged();
          toast.success("Đã nộp quy trình", `Quy trình "${procedure.name}" đang chờ duyệt.`);
        },
      });
    return (
      <Tooltip title={empty ? "Quy trình chưa có bước nào" : undefined}>
        <Button intent="primary" icon={<SendOutlined />} disabled={empty} onClick={confirmSubmit}>
          Nộp quy trình
        </Button>
      </Tooltip>
    );
  }

  if (procedure.status === "PENDING_APPROVAL" && canApprove) {
    const confirmApprove = () =>
      modal.confirm({
        title: "Duyệt quy trình?",
        content: `Quy trình "${procedure.name}" sẽ chuyển sang trạng thái Đang áp dụng, người duyệt: ${actorName}.`,
        okText: "Duyệt",
        cancelText: "Hủy",
        onOk: () => {
          approveProcedure(procedure.id, actorName);
          onChanged();
          toast.success("Đã duyệt quy trình", `Quy trình "${procedure.name}" đang được áp dụng.`);
        },
      });
    return (
      <Button intent="primary" icon={<CheckOutlined />} onClick={confirmApprove}>
        Duyệt quy trình
      </Button>
    );
  }

  return null;
}
