"use client";

import { useEffect, useState } from "react";
import {
  CheckCircleOutlined,
  CopyOutlined,
  DatabaseOutlined,
  DownloadOutlined,
  EditOutlined,
  FileDoneOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  LoadingOutlined,
  RedoOutlined,
  RobotOutlined,
  SendOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { Button, Card, Flex, Input, Select, Tag, Text } from "@/components/ui";
import { SectionIntro } from "@/components/workspace";
import { REPORT_TYPE_OPTIONS } from "../constants/legal-mock-data";
import type { GeneratedReport, ReportType } from "../types/legal-ai.types";
import { generateAiReport } from "../utils/report-generator";

interface AiReportGeneratorTabProps {
  onOpenAssistant: () => void;
}

export default function AiReportGeneratorTab({
  onOpenAssistant,
}: AiReportGeneratorTabProps) {
  const [selectedType, setSelectedType] = useState<ReportType>("WEEKLY");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");
  const [period, setPeriod] = useState("Tuần 39 - Tháng 09/2026");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [report, setReport] = useState<GeneratedReport>(() =>
    generateAiReport("WEEKLY", "ALL", "Tuần 39 - Tháng 09/2026"),
  );
  const [editableContent, setEditableContent] = useState(report.content);

  // Cập nhật khi report mới được tạo
  useEffect(() => {
    setEditableContent(report.content);
  }, [report]);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const newReport = generateAiReport(selectedType, selectedProjectId, period);
      setReport(newReport);
      setEditableContent(newReport.content);
      setIsGenerating(false);
    }, 600);
  };

  const handleApplyAiPrompt = (promptType: "FORMAL" | "CONCISE" | "FOCUS_GPMB" | "RECOMMENDATIONS") => {
    setIsGenerating(true);
    setTimeout(() => {
      let updated = editableContent;
      if (promptType === "FORMAL") {
        updated = updated.replace(/Kính gửi: Thường trực/g, "KÍNH GỬI: THƯỜNG TRỰC");
        updated = `[ĐÃ TỐI ƯU VĂN PHONG HÀNH CHÍNH CHUẨN THÔNG TƯ 01/2011/TT-BNV]\n\n` + updated;
      } else if (promptType === "CONCISE") {
        const lines = updated.split("\n");
        // Giữ lại các tiêu đề và ý quan trọng
        const condensed = lines
          .filter((l) => l.startsWith("#") || l.startsWith("-") || l.includes(":") || l.trim().length === 0)
          .join("\n");
        updated = `[BẢN TÓM TẮT TRỌNG TÂM 1 TRANG CHO LÃNH ĐẠO]\n\n` + (condensed || updated);
      } else if (promptType === "FOCUS_GPMB") {
        updated += `\n\n### BỔ SUNG ĐẶC BIỆT VỀ ĐIỂM NÓNG GPMB (AI TỔNG HỢP):\n- Tuyến đường số 6 (Pháo Đài): Đề nghị UBND TP Hà Tiên ban hành Quyết định cưỡng chế thu hồi đất đối với 02 hộ dân cố tình chây ỳ sau khi đã niêm yết đủ 10 ngày theo Điều 87 Luật Đất đai 2024.\n- Khu tái định cư Tô Châu: Khẩn trương bàn giao 14 lô nền thực địa trong tuần tới để người dân bắt đầu xây dựng nhà ở.`;
      } else if (promptType === "RECOMMENDATIONS") {
        updated += `\n\n### KIẾN NGHỊ VÀ ĐỀ XUẤT CỤ THỂ VỚI SỞ XÂY DỰNG & KHO BẠC:\n1. Kính đề nghị Kho bạc Nhà nước khu vực Kiên Giang ưu tiên kiểm soát chi và giải ngân trong 24 giờ đối với hồ sơ thanh toán khối lượng hoàn thành đã qua cổng DVC trực tuyến.\n2. Kính đề nghị Sở Xây dựng sớm có ý kiến thẩm định dự toán điều chỉnh gói thầu XL-01 đường số 6 để không làm gián đoạn tiến độ thi công trước mùa mưa.`;
      }
      setEditableContent(updated);
      setIsGenerating(false);
    }, 500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editableContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportDocx = () => {
    const fileName = `${report.title.replace(/[\/\\?%*:|"<>]/g, "_")}_${period}.doc`;
    const element = window.document.createElement("a");
    const file = new Blob([editableContent], { type: "application/msword;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    window.document.body.appendChild(element);
    element.click();
    window.document.body.removeChild(element);
  };

  const handleExportPdf = () => {
    const fileName = `${report.title.replace(/[\/\\?%*:|"<>]/g, "_")}_${period}.txt`;
    const element = window.document.createElement("a");
    const file = new Blob([editableContent], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    window.document.body.appendChild(element);
    element.click();
    window.document.body.removeChild(element);
  };

  const wordCount = editableContent.trim().split(/\s+/).filter(Boolean).length;
  const charCount = editableContent.length;

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Thanh điều khiển Cấu hình AI Tổng hợp */}
      <Card
        surface="flat"
        padding="md"
        rounded="lg"
        className="border-slate-200 shadow-xs bg-slate-50/60"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#007A78] text-white text-xs">
                <RobotOutlined />
              </span>
              <span>Cấu hình AI kết xuất báo cáo lời tự động</span>
            </div>
            <p className="text-xs text-slate-500">
              AI tự động kết nối và trích xuất dữ liệu thực tế từ M2 (Tiến độ), M4 (Giải ngân KBNN), M6 (GPMB 16 bước), M7 (Đấu thầu) và M8 (Bảo hành).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-56">
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                Loại báo cáo chuẩn
              </label>
              <Select
                aria-label="Loại báo cáo"
                value={selectedType}
                onChange={(val) => setSelectedType(val as ReportType)}
                className="w-full text-xs [&_.ant-select-selector]:!rounded-lg"
                options={REPORT_TYPE_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                }))}
              />
            </div>

            <div className="w-48">
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                Dự án áp dụng
              </label>
              <Select
                aria-label="Chọn dự án"
                value={selectedProjectId}
                onChange={setSelectedProjectId}
                className="w-full text-xs [&_.ant-select-selector]:!rounded-lg"
                options={[
                  { value: "ALL", label: "Tất cả dự án trọng điểm" },
                  { value: "PRJ-101", label: "Đường số 6 Pháo Đài" },
                  { value: "PRJ-102", label: "Kè biển Mũi Nai" },
                  { value: "PRJ-103", label: "Khu dân cư Tô Châu" },
                  { value: "PRJ-104", label: "Quảng trường Chiêu Anh Các" },
                ]}
              />
            </div>

            <div className="w-44">
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                Kỳ báo cáo
              </label>
              <Input
                intent="clean"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="VD: Tuần 39 - Tháng 09/2026"
                className="w-full text-xs h-8"
              />
            </div>

            <div className="pt-4">
              <Button
                intent="primary"
                scale="sm"
                icon={isGenerating ? <LoadingOutlined /> : <ThunderboltOutlined />}
                disabled={isGenerating}
                onClick={handleGenerate}
                className="!bg-[#007A78] !border-[#007A78] hover:!bg-[#006361] !text-white h-8 text-xs font-semibold rounded-lg shadow-xs"
              >
                {isGenerating ? "AI đang tổng hợp..." : "AI Tổng hợp báo cáo"}
              </Button>
            </div>
          </div>
        </div>

        {/* Nguồn dữ liệu đã kết nối */}
        <div className="mt-3 pt-3 border-t border-slate-200/80 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
            <DatabaseOutlined className="text-teal-700" />
            Nguồn dữ liệu thực tế tích hợp:
          </span>
          <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200 shadow-2xs">
            <CheckCircleOutlined className="text-emerald-600" />
            M2 Tiến độ thi công (4 dự án)
          </span>
          <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200 shadow-2xs">
            <CheckCircleOutlined className="text-emerald-600" />
            M4 Giải ngân KBNN (126.8 tỷ - 58.7%)
          </span>
          <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200 shadow-2xs">
            <CheckCircleOutlined className="text-emerald-600" />
            M6 Bồi thường GPMB (Bàn giao 84.8%)
          </span>
          <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200 shadow-2xs">
            <CheckCircleOutlined className="text-emerald-600" />
            M7 Đấu thầu (4 gói thầu)
          </span>
          <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200 shadow-2xs">
            <CheckCircleOutlined className="text-emerald-600" />
            M8 Bảo hành & Bảo lãnh
          </span>
        </div>
      </Card>

      {/* 2. Studio biên tập và xem trước văn bản báo cáo */}
      <Card
        surface="flat"
        padding="none"
        rounded="lg"
        className="border-slate-200 shadow-xs overflow-hidden"
      >
        {/* Header Toolbar */}
        <div className="border-b border-slate-200 bg-slate-50/90 px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-slate-800">
              {report.title}
            </span>
            <Tag intent="warning">Bản thảo AI tổng hợp (DRAFT)</Tag>
            <span className="text-xs text-slate-400">· {period}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              scale="sm"
              intent="outline"
              icon={<CopyOutlined />}
              onClick={handleCopy}
              className="text-xs text-slate-700 font-medium h-8"
            >
              {copied ? "Đã sao chép!" : "Sao chép"}
            </Button>
            <Button
              scale="sm"
              intent="outline"
              icon={<FileWordOutlined className="text-blue-600" />}
              onClick={handleExportDocx}
              className="text-xs text-slate-700 font-semibold h-8"
            >
              Xuất Word (.doc)
            </Button>
            <Button
              scale="sm"
              intent="primary"
              icon={<FilePdfOutlined />}
              onClick={handleExportPdf}
              className="!bg-[#007A78] !border-[#007A78] hover:!bg-[#006361] !text-white text-xs font-semibold h-8 shadow-xs"
            >
              Tải tệp văn bản
            </Button>
          </div>
        </div>

        {/* Thanh công cụ Prompt AI tinh chỉnh nhanh */}
        <div className="border-b border-slate-200/80 bg-white px-4 py-2 flex flex-wrap items-center gap-2">
          <span className="text-[11.5px] font-bold text-teal-800 flex items-center gap-1">
            <RobotOutlined />
            Tinh chỉnh AI nhanh:
          </span>
          <button
            type="button"
            onClick={() => handleApplyAiPrompt("FORMAL")}
            disabled={isGenerating}
            className="cursor-pointer rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-teal-500 hover:bg-teal-50/70 transition-colors"
          >
            ✨ Chuẩn hóa thể thức hành chính
          </button>
          <button
            type="button"
            onClick={() => handleApplyAiPrompt("CONCISE")}
            disabled={isGenerating}
            className="cursor-pointer rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-teal-500 hover:bg-teal-50/70 transition-colors"
          >
            ✂️ Rút gọn còn 1 trang tóm tắt
          </button>
          <button
            type="button"
            onClick={() => handleApplyAiPrompt("FOCUS_GPMB")}
            disabled={isGenerating}
            className="cursor-pointer rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-teal-500 hover:bg-teal-50/70 transition-colors"
          >
            ⚠️ Nhấn mạnh điểm nghẽn GPMB
          </button>
          <button
            type="button"
            onClick={() => handleApplyAiPrompt("RECOMMENDATIONS")}
            disabled={isGenerating}
            className="cursor-pointer rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-teal-500 hover:bg-teal-50/70 transition-colors"
          >
            📋 Bổ sung đề xuất chỉ đạo Sở/KBNN
          </button>
        </div>

        {/* Khung soạn thảo văn bản */}
        <div className="p-4 bg-slate-100/50">
          <div className="max-w-[920px] mx-auto bg-white rounded-lg border border-slate-200/90 shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
              <span>Biên tập trực tiếp khung văn bản chuẩn BQL Hà Tiên</span>
              <span>{wordCount} từ · {charCount} ký tự</span>
            </div>

            <textarea
              value={editableContent}
              onChange={(e) => setEditableContent(e.target.value)}
              rows={24}
              className="w-full resize-y font-sans text-xs sm:text-[13px] leading-relaxed text-slate-900 border-none outline-none focus:ring-0 p-0"
              placeholder="Nội dung báo cáo tự động được điền ở đây..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-white px-4 py-2.5 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <CheckCircleOutlined className="text-emerald-600" />
            Khung mẫu tuân thủ thể thức văn bản hành chính Nghị định 30/2020/NĐ-CP
          </span>
          <span className="font-medium text-teal-800">
            Trích xuất từ 5 phân hệ thực tế: M2, M4, M6, M7, M8
          </span>
        </div>
      </Card>
    </div>
  );
}
