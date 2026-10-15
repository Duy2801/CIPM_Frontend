"use client";

import { useEffect, useState } from "react";
import {
  CalendarOutlined,
  DeleteOutlined,
  FileDoneOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FileWordOutlined,
  FolderOpenOutlined,
  InboxOutlined,
  PaperClipOutlined,
  SafetyCertificateOutlined,
  TagOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Input, Select, Text } from "@/components/ui";
import { todayIso } from "@/utils/date";
import { CATEGORY_LABELS } from "../constants/legal-mock-data";
import type {
  AttachedDocumentFile,
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

function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

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
  const [tagsStr, setTagsStr] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedDocumentFile[]>([]);
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
      setTagsStr(editingDocument.tags.join(", "));
      if (editingDocument.files && editingDocument.files.length > 0) {
        setAttachedFiles(editingDocument.files);
      } else if (editingDocument.code) {
        setAttachedFiles([
          {
            id: `doc-file-init-${editingDocument.id}`,
            name: `${editingDocument.code}.${editingDocument.fileType === "PDF" ? "pdf" : "docx"}`,
            size: editingDocument.fileSize || "1.8 MB",
            type: editingDocument.fileType || "PDF",
          },
        ]);
      } else {
        setAttachedFiles([]);
      }
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
      setTagsStr("");
      setAttachedFiles([]);
      setErrorText("");
    }
  }, [editingDocument, open]);

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newItems: AttachedDocumentFile[] = Array.from(files).map((f, idx) => {
      const isDoc = f.name.toLowerCase().endsWith(".docx") || f.name.toLowerCase().endsWith(".doc");
      return {
        id: `file-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
        name: f.name,
        size: formatFileSize(f.size),
        type: isDoc ? "DOCX" : "PDF",
      };
    });
    setAttachedFiles((prev) => [...prev, ...newItems]);
    setErrorText("");
  };

  const handleRemoveFile = (id: string) => {
    setAttachedFiles((prev) => prev.filter((item) => item.id !== id));
  };

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

    const primaryType: "PDF" | "DOCX" = attachedFiles.length > 0 ? attachedFiles[0].type : "PDF";
    const totalSizeStr =
      attachedFiles.length === 1
        ? attachedFiles[0].size
        : attachedFiles.length > 1
        ? `${attachedFiles.length} tệp`
        : editingDocument?.fileSize || "2.4 MB";

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
      fileType: primaryType,
      fileSize: totalSizeStr,
      downloads: editingDocument?.downloads ?? 0,
      tags: tags.length > 0 ? tags : ["Pháp lý", "Quy chuẩn", "Ban QLDA"],
      files: attachedFiles,
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
            <SafetyCertificateOutlined className="text-[#DC2626]" />
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
            className="!border-[#DC2626] !bg-[#DC2626] px-5 text-xs font-semibold !text-white shadow-sm hover:!bg-[#B91C1C]"
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
            <FileTextOutlined className="text-[#DC2626]" />
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
            className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
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
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <UploadOutlined className="text-[#DC2626]" />
              Đính kèm tệp văn bản số hóa (PDF, DOCX)
            </span>
            {attachedFiles.length > 0 && (
              <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                Đã chọn {attachedFiles.length} tệp
              </span>
            )}
          </div>

          <label
            htmlFor="legal-files-input"
            className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 bg-white rounded-xl cursor-pointer hover:border-red-400 hover:bg-red-50/20 transition-all text-center group"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 group-hover:bg-red-50 text-slate-500 group-hover:text-red-500 transition-colors mb-1.5">
              <InboxOutlined className="text-2xl" />
            </div>
            <span className="text-xs font-semibold text-slate-800 group-hover:text-red-600 transition-colors">
              Nhấn hoặc kéo thả để tải lên tệp tài liệu số hóa
            </span>
            <span className="text-[11px] text-slate-500 mt-1">
              Tự động nhận diện cả .pdf, .docx, .doc · Hỗ trợ chọn nhiều tệp cùng lúc (Tối đa 50MB/tệp)
            </span>
            <input
              id="legal-files-input"
              type="file"
              multiple
              accept=".pdf,.docx,.doc"
              className="hidden"
              onChange={(e) => {
                handleFilesSelected(e.target.files);
                e.target.value = "";
              }}
            />
          </label>

          {/* Danh sách các tệp đã thêm */}
          {attachedFiles.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                <PaperClipOutlined /> Danh sách tệp đính kèm ({attachedFiles.length}):
              </div>
              <div className="max-h-48 overflow-y-auto pr-1 flex flex-col gap-1.5">
                {attachedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors shadow-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      {file.type === "PDF" ? (
                        <FilePdfOutlined className="text-lg text-rose-500 shrink-0" />
                      ) : (
                        <FileWordOutlined className="text-lg text-blue-600 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-800 truncate" title={file.name}>
                          {file.name}
                        </div>
                        <div className="text-[10.5px] text-slate-500 flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.2 rounded font-semibold text-[9.5px] ${
                              file.type === "PDF"
                                ? "bg-rose-50 text-rose-600 border border-rose-200"
                                : "bg-blue-50 text-blue-600 border border-blue-200"
                            }`}
                          >
                            {file.type}
                          </span>
                          <span>{file.size}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(file.id);
                      }}
                      title="Xóa tệp"
                      className="shrink-0 p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <DeleteOutlined className="text-sm" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </form>
    </Drawer>
  );
}
