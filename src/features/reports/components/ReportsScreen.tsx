"use client";

import { useEffect, useMemo, useState } from "react";
import { App } from "antd";
import { useAuthStore } from "@/stores/auth.store";
import { reportStorage } from "../services/report-storage";
import { DEFAULT_REPORT_TYPES, addReportType, loadReportTypes, removeReportType } from "../services/report-types";
import type { ReportFile, ReportType } from "../types/report.types";
import { countSheets, reportTypeOf } from "../utils/report-format";
import ReportDetail from "./ReportDetail";
import ReportTypeGrid, { type ReportTypeSummary } from "./ReportTypeGrid";

/** Đang xem: lưới loại báo cáo, hoặc báo cáo của một loại (`reportId` trống = bản mới nhất) */
type View = { level: "types" } | { level: "report"; typeId: string; reportId?: string };

/** Báo cáo: Loại báo cáo → bấm vào là mở thẳng báo cáo (bản mới nhất) với nhập / xuất Excel và bảng dữ liệu */
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

  // Trang có bảng rộng cuộn ngang: tắt cử chỉ vuốt ngang "quay lại trang trước" của trình duyệt khi ở trang này
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.overscrollBehaviorX;
    root.style.overscrollBehaviorX = "none";
    return () => {
      root.style.overscrollBehaviorX = previous;
    };
  }, []);

  const summaries = useMemo<ReportTypeSummary[]>(
    () =>
      types.map((type) => {
        const own = reports.filter((r) => reportTypeOf(r) === type.id);
        return { type, count: own.length, lastAt: own[0]?.uploadedAt };
      }),
    [types, reports],
  );

  // Nhập Excel: thêm một bản mới cho loại báo cáo, rồi xem luôn bản đó
  const importFile = async (file: File, typeId: string) => {
    setBusy(true);
    try {
      const report: ReportFile = {
        id: `RP-${Date.now()}`,
        typeId,
        name: file.name,
        size: file.size,
        sheetCount: await countSheets(file),
        uploadedAt: Date.now(),
        uploadedBy: user?.displayName || user?.name || "Không rõ",
        blob: file,
      };
      await reportStorage.save(report);
      // Mỗi loại chỉ giữ một báo cáo: bản mới thay bản cũ (xóa bản cũ cho nhẹ bộ nhớ)
      const old = reports.filter((r) => reportTypeOf(r) === typeId);
      await Promise.all(old.map((r) => reportStorage.remove(r.id)));
      setReports((prev) => [report, ...prev.filter((r) => reportTypeOf(r) !== typeId)]);
      setView({ level: "report", typeId });
      message.success("Đã nhập báo cáo.");
    } catch {
      message.error("Không lưu được tệp. Có thể bộ nhớ trình duyệt đã đầy.");
    } finally {
      setBusy(false);
    }
  };

  const currentType = view.level === "report" ? types.find((t) => t.id === view.typeId) : undefined;

  return (
    <div className="mx-auto flex w-full max-w-[2560px] flex-col gap-4">
      {view.level === "report" && currentType ? (
        <ReportDetail
          type={currentType}
          reports={reports.filter((r) => reportTypeOf(r) === currentType.id)}
          currentId={view.reportId}
          importing={busy}
          onBack={() => setView({ level: "types" })}
          onImport={(file) => void importFile(file, currentType.id)}
        />
      ) : (
        <ReportTypeGrid
          summaries={loading ? types.map((type) => ({ type, count: 0 })) : summaries}
          onOpen={(typeId) => setView({ level: "report", typeId })}
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
