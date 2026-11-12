"use client";

import { Button, Tooltip } from "@/components/ui";
import { useMyTaskActions } from "../hooks/useMyTaskActions";
import { useMyTaskAccess } from "../hooks/useMyTaskQueries";

const NOT_APPLICABLE = "Chưa áp dụng ở trạng thái này";

interface MyTaskDrawerHeaderActionsProps {
  projectId: string;
  stepId: string;
}

export default function MyTaskDrawerHeaderActions({ projectId, stepId }: MyTaskDrawerHeaderActionsProps) {
  const ref = { projectId, stepId };
  const { canReportIncident, canReview, canDecline } = useMyTaskAccess(ref);
  const { openReason } = useMyTaskActions();
  const canRefuse = canReview || canDecline;
  const refuseHint = canReview
    ? "Trả kết quả về cho người thực hiện làm lại"
    : canDecline
      ? "Không làm việc này, trả về Tổ trưởng để giao người khác (giữ ghi chú và hồ sơ)"
      : NOT_APPLICABLE;

  return (
    <div className="ml-auto flex shrink-0 items-center gap-2">
      <Tooltip title={canReportIncident ? undefined : NOT_APPLICABLE}>
        <span>
          <Button
            intent="outline"
            scale="sm"
            disabled={!canReportIncident}
            onClick={() => openReason(ref, "incident")}
            className={canReportIncident ? "!border-orange-300 !text-orange-600 hover:!bg-orange-50" : ""}
          >
            Báo cáo sự cố
          </Button>
        </span>
      </Tooltip>
      <Tooltip title={refuseHint}>
        <span>
          <Button
            intent="outline"
            scale="sm"
            disabled={!canRefuse}
            onClick={() => openReason(ref, canReview ? "reject" : "decline")}
            className={canRefuse ? "!border-rose-300 !text-rose-600 hover:!bg-rose-50" : ""}
          >
            Từ chối
          </Button>
        </span>
      </Tooltip>
    </div>
  );
}
