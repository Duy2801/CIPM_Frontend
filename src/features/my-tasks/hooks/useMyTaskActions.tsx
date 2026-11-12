"use client";

import { App } from "antd";
import { useQueryClient } from "@tanstack/react-query";
import type { UploadedAttachment } from "@/components/ui";
import type { ProcedureDocument } from "@/features/construction-procedures/types/procedure.types";
import * as myTasksApi from "../services/my-tasks.api";
import { taskKey, type TaskRef } from "../utils/my-task-data";
import { myTaskKeys, useMyTaskData, useMyTaskIdentity } from "./useMyTaskQueries";
import { useMyTaskStore, type MyTaskReasonKind } from "./useMyTaskStore";

const REASON_SUCCESS: Record<MyTaskReasonKind, (code: string) => string> = {
  reject: (code) => `Đã từ chối bước ${code}, người thực hiện sẽ làm lại.`,
  incident: (code) => `Đã báo sự cố ở bước ${code}, chờ Tổ trưởng xử lý.`,
  decline: (code) => `Đã từ chối bước ${code}, việc được trả về Tổ trưởng.`,
  return: (code) => `Đã hoàn trả bước ${code}, việc quay lại Đang xử lý.`,
};

export function useMyTaskActions() {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const { tasks } = useMyTaskData();
  const { actor, canReview } = useMyTaskIdentity();
  const { openTask, closeTask, openReason, closeReason } = useMyTaskStore.getState();

  const codeOf = (ref: TaskRef) => tasks.get(taskKey(ref))?.step.code ?? "";

  const run = async (action: () => Promise<unknown>, success?: string, close = true) => {
    try {
      await action();
      await queryClient.invalidateQueries({ queryKey: myTaskKeys.all });
      if (success) message.success(success);
      if (close) closeTask();
      return true;
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Không thể hoàn tất thao tác, vui lòng thử lại.");
      return false;
    }
  };

  const accept = (ref: TaskRef) =>
    run(() => myTasksApi.acceptStep(ref, actor), `Đã chuyển bước ${codeOf(ref)} sang Đang xử lý.`);

  const submit = async (ref: TaskRef) => {
    try {
      if ((await myTasksApi.submitStep(ref, actor)) === "empty") {
        message.warning("Thêm ghi chú hoặc hồ sơ kết quả trước khi nộp.");
        openTask(ref);
        return;
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Không thể nộp kết quả.");
      return;
    }
    await run(async () => undefined, `Đã nộp kết quả bước ${codeOf(ref)}, chờ Tổ trưởng duyệt.`);
  };

  const approve = (ref: TaskRef) => {
    const task = tasks.get(taskKey(ref));
    if (!task) return;
    modal.confirm({
      centered: true,
      title: "Duyệt hoàn thành bước?",
      content: (
        <p className="m-0 text-xs text-slate-600">
          Xác nhận kết quả bước{" "}
          <strong>
            {task.step.code} · {task.step.name}
          </strong>
          {task.step.assignedTo ? ` của ${task.step.assignedTo}` : ""} đã đạt yêu cầu.
        </p>
      ),
      okText: "Duyệt",
      cancelText: "Hủy",
      onOk: () => run(() => myTasksApi.approveStep(ref, actor), `Đã duyệt bước ${task.step.code}.`),
    });
  };

  const resolveIncident = (ref: TaskRef) => {
    const task = tasks.get(taskKey(ref));
    if (!task) return;
    if (!canReview(task.reviewDepartment)) {
      message.warning("Chỉ Tổ trưởng của phòng ban mới đánh dấu đã xử lý sự cố.");
      return;
    }
    modal.confirm({
      centered: true,
      title: "Đã xử lý xong sự cố?",
      content: (
        <p className="m-0 text-xs text-slate-600">
          Bước{" "}
          <strong>
            {task.step.code} · {task.step.name}
          </strong>{" "}
          trở lại Đang xử lý để {task.step.assignedTo || "người thực hiện"} làm tiếp.
        </p>
      ),
      okText: "Đã xử lý",
      cancelText: "Hủy",
      onOk: () => run(() => myTasksApi.resolveStepIncident(ref, actor), `Đã xử lý sự cố ở bước ${task.step.code}.`),
    });
  };

  const confirmReason = async (ref: TaskRef, kind: MyTaskReasonKind, reason: string) => {
    const action = {
      reject: () => myTasksApi.rejectStep(ref, reason, actor),
      incident: () => myTasksApi.reportStepIncident(ref, reason, actor),
      decline: () => myTasksApi.declineStep(ref, reason, actor),
      return: () => myTasksApi.giveBackStep(ref, reason, actor),
    }[kind];
    const ok = await run(action, REASON_SUCCESS[kind](codeOf(ref)));
    if (ok) closeReason();
    return ok;
  };

  const removeFile = (ref: TaskRef, doc: ProcedureDocument) =>
    modal.confirm({
      centered: true,
      title: "Gỡ hồ sơ?",
      content: (
        <p className="m-0 text-xs text-slate-600">
          Gỡ tệp <strong>{doc.fileName}</strong> khỏi bước {codeOf(ref)}.
        </p>
      ),
      okText: "Gỡ",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: () => run(() => myTasksApi.removeStepDocument(ref, doc.id, actor), undefined, false),
    });

  return {
    accept,
    submit,
    approve,
    resolveIncident,
    confirmReason,
    openReason,
    saveNote: (ref: TaskRef, note: string) => run(() => myTasksApi.saveStepNote(ref, note), undefined, false),
    addFiles: async (ref: TaskRef, files: UploadedAttachment[]) =>
      run(() => myTasksApi.addStepFiles(ref, files, actor), `Đã thêm ${files.length} hồ sơ.`, false),
    removeFile,
  };
}
