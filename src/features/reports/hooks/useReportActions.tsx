"use client";

import { App } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { downloadBlob } from "@/utils/xlsx-writer";
import * as reportApi from "../services/report.api";
import { isReportFile, reportTypeOf } from "../utils/report-format";
import { reportKeys, useReportFiles, useReportTypes } from "./useReportQueries";

const errorText = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback);

export function useReportActions() {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const types = useReportTypes();
  const { data: files = [] } = useReportFiles();
  const refresh = () => queryClient.invalidateQueries({ queryKey: reportKeys.all });

  const importMutation = useMutation({
    mutationKey: reportKeys.import(),
    mutationFn: ({ typeId, file }: { typeId: string; file: File }) => reportApi.uploadReport(typeId, file, user),
  });

  const importReport = async (typeId: string, file?: File) => {
    if (!file) return;
    if (!isReportFile(file.name)) {
      message.warning("Chỉ nhận tệp Excel (.xlsx, .xlsm, .xls, .xlsb) hoặc .csv.");
      return;
    }
    try {
      await importMutation.mutateAsync({ typeId, file });
      await refresh();
      message.success("Đã nhập báo cáo.");
    } catch (error) {
      message.error(errorText(error, "Không lưu được tệp. Có thể bộ nhớ trình duyệt đã đầy."));
    }
  };

  const exportReport = async (typeId: string) => {
    const report = files.find((r) => reportTypeOf(r) === typeId);
    if (!report) return;
    try {
      downloadBlob(await reportApi.downloadReport(report.id, user), report.name);
      await queryClient.invalidateQueries({ queryKey: reportKeys.history() });
    } catch (error) {
      message.error(errorText(error, "Không tải được tệp báo cáo."));
    }
  };

  const addType = async (name: string) => {
    try {
      const type = await reportApi.addReportType(name, user);
      await refresh();
      message.success(`Đã thêm loại "${type.name}".`);
    } catch (error) {
      message.error(errorText(error, "Không thêm được loại báo cáo."));
    }
  };

  const removeType = (typeId: string) => {
    const name = types.find((t) => t.id === typeId)?.name ?? "";
    modal.confirm({
      title: "Xóa loại báo cáo?",
      content: `Loại "${name}" sẽ bị xóa.`,
      okText: "Xóa",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await reportApi.removeReportType(typeId, user);
          await refresh();
        } catch (error) {
          message.error(errorText(error, "Không xóa được loại báo cáo."));
        }
      },
    });
  };

  return { importReport, exportReport, addType, removeType };
}
