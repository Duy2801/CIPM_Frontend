"use client";

import { useEffect, useMemo, useState } from "react";
import { App } from "antd";
import { useAuthStore } from "@/stores/auth.store";
import { reportStorage } from "../services/report-storage";
import { DEFAULT_REPORT_TYPES, addReportType, loadReportTypes, removeReportType } from "../services/report-types";
import type { ReportFile, ReportType } from "../types/report.types";
import { countSheets, isReportFile, reportTypeOf } from "../utils/report-format";
import ReportDetail from "./ReportDetail";
import ReportList from "./ReportList";
import ReportTypeGrid, { type ReportTypeSummary } from "./ReportTypeGrid";

type View = { level: "types" } | { level: "list"; typeId: string } | { level: "detail"; typeId: string; reportId: string };

/** Báo cáo: Loại báo cáo → Danh sách báo cáo → Chi tiết (nhập / xuất Excel, bảng dữ liệu) */
export default function ReportsScreen() {
  const { message } = App.useApp();
  const user = useAuthStore((s) => s.user);
  // Loại mặc định khi dựng trang; loại tự thêm (lưu trên máy) nạp sau khi trang chạy trên trình duyệt
  const [types, setTypes] = useState<ReportType[]>(DEFAULT_REPORT_TYPES);
  const [reports, setReports] = useState<ReportFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<View>({ level: "types" });

  useEffect(() => {
    reportStorage
      .list()
      .then((list) => {
        setTypes(loadReportTypes());
        setReports(list);
      })
      .catch(() => message.error("Không tải được danh sách báo cáo."))
      .finally(() => setLoading(false));
  }, [message]);

  const summaries = useMemo<ReportTypeSummary[]>(
    () =>
      types.map((type) => {
        const own = reports.filter((r) => reportTypeOf(r) === type.id);
        return { type, count: own.length, lastAt: own[0]?.uploadedAt };
      }),
    [types, reports],
  );

  const uploader = () => user?.displayName || user?.name || "Không rõ";

  const importFiles = async (files: File[], typeId: string) => {
    const valid = files.filter((f) => isReportFile(f.name));
    if (valid.length < files.length) message.warning("Chỉ nhận tệp Excel (.xlsx, .xlsm, .xls, .xlsb) hoặc .csv.");
    if (!valid.length) return;
    setBusy(true);
    try {
      const added: ReportFile[] = [];
      for (const [i, file] of valid.entries()) {
        const report: ReportFile = {
          id: `RP-${Date.now()}-${i}`,
          typeId,
          name: file.name,
          size: file.size,
          sheetCount: await countSheets(file),
          uploadedAt: Date.now() + i,
          uploadedBy: uploader(),
          blob: file,
        };
        await reportStorage.save(report);
        added.push(report);
      }
      setReports((prev) => [...added.reverse(), ...prev]);
      message.success(`Đã nhập ${added.length} báo cáo.`);
    } catch {
      message.error("Không lưu được tệp. Có thể bộ nhớ trình duyệt đã đầy.");
    } finally {
      setBusy(false);
    }
  };

  // Nhập Excel trong trang chi tiết: thay dữ liệu báo cáo bằng tệp mới (giữ loại và tên báo cáo)
  const replaceFile = async (report: ReportFile, file: File) => {
    setBusy(true);
    try {
      const next: ReportFile = {
        ...report,
        title: report.title || undefined,
        name: file.name,
        size: file.size,
        sheetCount: await countSheets(file),
        uploadedAt: Date.now(),
        uploadedBy: uploader(),
        blob: file,
      };
      await reportStorage.save(next);
      setReports((prev) => [next, ...prev.filter((r) => r.id !== report.id)]);
      message.success("Đã cập nhật báo cáo.");
    } catch {
      message.error("Không lưu được tệp. Có thể bộ nhớ trình duyệt đã đầy.");
    } finally {
      setBusy(false);
    }
  };

  const currentType = view.level !== "types" ? types.find((t) => t.id === view.typeId) : undefined;
  const currentReport = view.level === "detail" ? reports.find((r) => r.id === view.reportId) : undefined;

  return (
    <div className="mx-auto flex w-full max-w-[2560px] flex-col gap-4">
      {view.level === "detail" && currentType && currentReport ? (
        <ReportDetail
          type={currentType}
          report={currentReport}
          replacing={busy}
          onBack={() => setView({ level: "list", typeId: currentType.id })}
          onReplace={(file) => void replaceFile(currentReport, file)}
        />
      ) : view.level !== "types" && currentType ? (
        <ReportList
          key={currentType.id}
          type={currentType}
          reports={reports.filter((r) => reportTypeOf(r) === currentType.id)}
          importing={busy}
          onBack={() => setView({ level: "types" })}
          onImport={(files) => void importFiles(files, currentType.id)}
          onOpen={(r) => setView({ level: "detail", typeId: currentType.id, reportId: r.id })}
        />
      ) : (
        <ReportTypeGrid
          summaries={loading ? types.map((type) => ({ type, count: 0 })) : summaries}
          onOpen={(typeId) => setView({ level: "list", typeId })}
          onAddType={(name) => {
            const type = addReportType(name);
            setTypes(loadReportTypes());
            message.success(`Đã thêm loại "${type.name}".`);
          }}
          onRemoveType={(type) => {
            removeReportType(type.id);
            setTypes(loadReportTypes());
          }}
        />
      )}
    </div>
  );
}
