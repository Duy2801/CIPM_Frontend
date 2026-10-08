"use client";

import { useEffect, useState } from "react";
import {
  CalendarOutlined,
  FileDoneOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  InboxOutlined,
  SafetyCertificateOutlined,
  TagOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Input, Select, Text } from "@/components/ui";
import { todayIso } from "@/utils/date";
import { CATEGORY_LABELS } from "../constants/legal-mock-data";
import type {
  LegalDocument,
  LegalDocumentCategory,
  LegalDocumentStatus,
} from "../types/legal-ai.types";

interface CreateDocumentDrawerProps {
  open: boolean;
  editingDocument?: LegalDocument | null;
  onClose: () => void;
  onSubmit: (doc: LegalDocument) => void;
}

const CATEGORY_SELECT_OPTIONS = [
  { value: "LAW", label: "Luật (Quốc hội)" },
  { value: "DECREE", label: "Nghị định (Chính phủ)" },
  { value: "CIRCULAR", label: "Thông tư (Bộ ngành)" },
  { value: "LOCAL", label: "Văn bản địa phương (Kiên Giang / Hà Tiên)" },
  { value: "TEMPLATE", label: "Biểu mẫu chuẩn (BQL áp dụng nội bộ)" },
];

const STATUS_SELECT_OPTIONS: { value: LegalDocumentStatus; label: string }[] = [
  { value: "EFFECTIVE", label: "Còn hiệu lực" },
  { value: "PARTIAL", label: "Hết hiệu lực một phần" },
  { value: "EXPIRED", label: "Hết hiệu lực" },
];

const SCOPE_SUGGESTIONS = [
  "M2 – Quản lý dự án & tiến độ thi công",
  "M3 – Thủ tục XDCB & pháp lý dự án",
  "M4 – Giải ngân KBNN, tạm ứng & quyết toán",
  "M6 – Bồi thường, hỗ trợ & GPMB (16 bước)",
  "M7 – Quản lý đấu thầu qua mạng (9 bước)",
  "M8 – Bảo hành công trình & bảo lãnh hợp đồng",
  "Toàn bộ các phân hệ quản lý của Ban",
];

export default function CreateDocumentDrawer({
  open,
  editingDocument,
  onClose,
  onSubmit,
}: CreateDocumentDrawerProps) {
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Exclude<LegalDocumentCategory, "ALL">>("DECREE");
  const [issuer, setIssuer] = useState("");
  const [issueDate, setIssueDate] = useState(todayIso());
  const [effectiveDate, setEffectiveDate] = useState(todayIso());
  const [status, setStatus] = useState<LegalDocumentStatus>("EFFECTIVE");
  const [scope, setScope] = useState(SCOPE_SUGGESTIONS[0]);
  const [summary, setSummary] = useState("");
  const [fileType, setFileType] = useState<"PDF" | "DOCX">("PDF");
  const [tagsStr, setTagsStr] = useState("");
  const [fileName, setFileName] = useState("");
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    if (editingDocument) {
      setCode(editingDocument.code);
      setTitle(editingDocument.title);
      setCategory(editingDocument.category);
      setIssuer(editingDocument.issuer);
      setIssueDate(editingDocument.issueDate);
      setEffectiveDate(editingDocument.effectiveDate);
      setStatus(editingDocument.status);
      setScope(editingDocument.scope);
      setSummary(editingDocument.summary);
      setFileType(editingDocument.fileType);
      setTagsStr(editingDocument.tags.join(", "));
      setFileName(`${editingDocument.code}.${editingDocument.fileType.toLowerCase()}`);
      setErrorText("");
    } else {
      setCode("");
      setTitle("");
      setCategory("DECREE");
      setIssuer("Chính phủ");
      setIssueDate(todayIso());
      setEffectiveDate(todayIso());
      setStatus("EFFECTIVE");
      setScope(SCOPE_SUGGESTIONS[0]);
      setSummary("");
      setFileType("PDF");
      setTagsStr("");
      setFileName("");
      setErrorText("");
    }
  }, [editingDocument, open]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!code.trim()) {
      setErrorText("Vui lòng nhập số hiệu văn bản hoặc mã biểu mẫu.");
      return;
    }
    if (!title.trim()) {
      setErrorText("Vui lòng nhập trích yếu nội dung hoặc tên biểu mẫu.");
      return;
    }
    if (!issuer.trim()) {
      setErrorText("Vui lòng nhập cơ quan ban hành.");
      return;
    }

    const tags = tagsStr
      .split(/[,;\n]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newDoc: LegalDocument = {
      id: editingDocument ? editingDocument.id : `DOC-${Date.now().toString().slice(-4)}`,
      code: code.trim(),
      title: title.trim(),
      category,
      issuer: issuer.trim(),
      issueDate,
      effectiveDate,
      status,
      scope: scope.trim(),
      summary: summary.trim() || `Văn bản quy định về ${title.trim()} áp dụng trong hoạt động của Ban.`,
      fileType,
      fileSize: editingDocument?.fileSize || (fileType === "PDF" ? "2.4 MB" : "450 KB"),
      downloads: editingDocument?.downloads ?? 0,
      tags: tags.length > 0 ? tags : ["Pháp lý", "Quy chuẩn", "Ban QLDA"],
    };

    onSubmit(newDoc);
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="min(680px, 100vw)"
      title={
        <div className="py-1">
          <div className="flex items-center gap-2 text-base font-bold text-slate-800">
            <SafetyCertificateOutlined className="text-[#007A78]" />
            {editingDocument ? "Cập nhật văn bản / biểu mẫu" : "Thêm mới văn bản pháp lý / biểu mẫu"}
          </div>
          <div className="mt-0.5 text-xs font-normal text-slate-500">
            {editingDocument
              ? "Chỉnh sửa số hiệu, trích yếu, phạm vi áp dụng và tệp tài liệu số hóa"
              : "Bổ sung luật, nghị định, thông tư hoặc biểu mẫu phục vụ tra cứu và AI kết xuất"}
          </div>
        </div>
      }
      footer={
        <div className="flex w-full items-center justify-end gap-2.5 py-2">
          <Button
            intent="primary"
            scale="sm"
            onClick={handleSubmit}
            className="!border-[#007A78] !bg-[#007A78] px-5 text-xs font-semibold !text-white shadow-sm hover:!bg-[#006361]"
          >
            {editingDocument ? "Cập nhật văn bản" : "Lưu vào thư viện"}
          </Button>
          <Button intent="outline" scale="sm" onClick={onClose} className="px-4 text-xs font-medium">
            Đóng
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-slate-800">
        {errorText && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
            {errorText}
          </div>
        )}

        {/* 1. Nhóm văn bản & Số hiệu */}
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4 flex flex-col gap-3">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <FileTextOutlined className="text-[#007A78]" />
            Phân loại & Số hiệu văn bản
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nhóm văn bản <span className="text-rose-500">*</span>
              </label>
              <Select
                aria-label="Nhóm văn bản"
                value={category}
                onChange={(val) => setCategory(val as Exclude<LegalDocumentCategory, "ALL">)}
                className="w-full text-xs [&_.ant-select-selector]:!rounded-lg"
                options={CATEGORY_SELECT_OPTIONS}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số hiệu / Ký hiệu văn bản <span className="text-rose-500">*</span>
              </label>
              <Input
                intent="clean"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="VD: 10/2021/NĐ-CP hoặc Mẫu 04-GPMB"
                className="w-full text-xs h-8"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Trích yếu nội dung / Tên biểu mẫu <span className="text-rose-500">*</span>
            </label>
            <Input
              intent="clean"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Nghị định về quản lý chi phí đầu tư xây dựng..."
              className="w-full text-xs h-8"
            />
          </div>
        </div>

        {/* 2. Cơ quan & Ngày ban hành / Hiệu lực */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cơ quan ban hành <span className="text-rose-500">*</span>
            </label>
            <Input
              intent="clean"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              placeholder="VD: Quốc hội, Chính phủ, Bộ Xây dựng, UBND Kiên Giang"
              className="w-full text-xs h-8"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Trạng thái hiệu lực
            </label>
            <Select
              aria-label="Trạng thái hiệu lực"
              value={status}
              onChange={(val) => setStatus(val as LegalDocumentStatus)}
              className="w-full text-xs [&_.ant-select-selector]:!rounded-lg"
              options={STATUS_SELECT_OPTIONS}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ngày ban hành
            </label>
            <Input
              type="date"
              intent="clean"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full text-xs h-8"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ngày có hiệu lực
            </label>
            <Input
              type="date"
              intent="clean"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className="w-full text-xs h-8"
            />
          </div>
        </div>

        {/* 3. Phạm vi áp dụng trong BQL */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Phạm vi áp dụng trong Ban QLDA
          </label>
          <Select
            aria-label="Phạm vi áp dụng"
            value={scope}
            onChange={setScope}
            className="w-full text-xs [&_.ant-select-selector]:!rounded-lg"
            options={SCOPE_SUGGESTIONS.map((s) => ({ value: s, label: s }))}
          />
        </div>

        {/* 4. Tóm tắt nội dung & Hướng dẫn */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Tóm tắt nội dung cốt lõi & Hướng dẫn áp dụng
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            placeholder="Tóm tắt các điều khoản quan trọng, thời hạn bắt buộc, thủ tục quy định..."
            className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
          />
        </div>

        {/* 5. Từ khóa tra cứu */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Từ khóa tra cứu (Tags - phân cách bằng dấu phẩy)
          </label>
          <Input
            intent="clean"
            value={tagsStr}
            onChange={(e) => setTagsStr(e.target.value)}
            placeholder="VD: Quản lý chi phí, Dự toán, Định mức, BQL Hà Tiên"
            className="w-full text-xs h-8"
          />
        </div>

        {/* 6. Tập tin đính kèm */}
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <UploadOutlined className="text-[#007A78]" />
              Đính kèm tệp văn bản số hóa (PDF hoặc DOCX)
            </span>
            <div className="flex items-center gap-2 text-xs">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="fileType"
                  checked={fileType === "PDF"}
                  onChange={() => setFileType("PDF")}
                  className="text-teal-700"
                />
                PDF
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="fileType"
                  checked={fileType === "DOCX"}
                  onChange={() => setFileType("DOCX")}
                  className="text-teal-700"
                />
                DOCX
              </label>
            </div>
          </div>

          <label className="flex flex-col items-center justify-center p-3 border border-dashed border-teal-300 bg-teal-50/30 rounded-lg cursor-pointer hover:bg-teal-50/60 transition-colors">
            <InboxOutlined className="text-2xl text-teal-700 mb-1" />
            <span className="text-xs font-medium text-teal-800">
              {fileName ? `Đã chọn: ${fileName}` : "Nhấn để tải lên tệp tài liệu số hóa"}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5">
              Chấp nhận .pdf, .docx, .doc (Tối đa 50MB)
            </span>
            <input
              type="file"
              accept=".pdf,.docx,.doc"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setFileName(file.name);
                  if (file.name.endsWith(".docx") || file.name.endsWith(".doc")) {
                    setFileType("DOCX");
                  } else {
                    setFileType("PDF");
                  }
                }
              }}
            />
          </label>
        </div>
      </form>
    </Drawer>
  );
}
