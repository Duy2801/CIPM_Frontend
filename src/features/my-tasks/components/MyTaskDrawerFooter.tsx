"use client";

import { Button, Tooltip } from "@/components/ui";
import { useMyTaskActions } from "../hooks/useMyTaskActions";
import { useMyTask, useMyTaskAccess } from "../hooks/useMyTaskQueries";

const PRIMARY_RED = "!border-[#DC2626] !bg-[#DC2626] font-semibold hover:!bg-[#B91C1C]";
const PRIMARY_GREEN = "!border-emerald-600 !bg-emerald-600 font-semibold hover:!bg-emerald-700";

interface MyTaskDrawerFooterProps {
  projectId: string;
  stepId: string;
}

export default function MyTaskDrawerFooter({ projectId, stepId }: MyTaskDrawerFooterProps) {
  const ref = { projectId, stepId };
  const task = useMyTask(ref);
  const access = useMyTaskAccess(ref);
  const actions = useMyTaskActions();

  return (
    <div className="flex flex-wrap gap-2">
      {access.canAccept && (
        <Button intent="primary" scale="sm" onClick={() => actions.accept(ref)} className={PRIMARY_RED}>
          Thực hiện
        </Button>
      )}
      {access.canResolveIncident && (
        <Button intent="primary" scale="sm" onClick={() => actions.resolveIncident(ref)} className={PRIMARY_GREEN}>
          Đã xử lý sự cố
        </Button>
      )}
      {access.canSubmit && (
        <Button intent="primary" scale="sm" onClick={() => actions.submit(ref)} className={PRIMARY_RED}>
          {task?.flow === "RETURNED" ? "Nộp lại kết quả" : "Nộp kết quả"}
        </Button>
      )}
      {access.canReview && (
        <Button intent="primary" scale="sm" onClick={() => actions.approve(ref)} className={PRIMARY_GREEN}>
          Duyệt hoàn thành
        </Button>
      )}
      {access.canGiveBack && (
        <Tooltip title="Rút kết quả đã nộp, đưa việc về Đang xử lý để làm tiếp (giữ ghi chú và hồ sơ)">
          <Button
            intent="outline"
            scale="sm"
            onClick={() => actions.openReason(ref, "return")}
            className="!border-slate-300 !text-slate-600 hover:!bg-slate-50"
          >
            Hoàn trả
          </Button>
        </Tooltip>
      )}
    </div>
  );
}
