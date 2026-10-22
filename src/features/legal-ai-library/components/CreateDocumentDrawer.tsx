"use client";

import { useEffect, useMemo, useState } from "react";
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
  PlusOutlined,
  SafetyCertificateOutlined,
  TagOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Button, Divider, Drawer, Input, Select, StandardFileUpload, Text, STANDARD_DRAWER_WIDTH } from "@/components/ui";
import type { UploadedAttachment } from "@/components/ui/standard-file-upload";
import { todayIso } from "@/utils/date";
import { normalizeSearchText } from "@/utils/search-text";
import {
  COMMON_ISSUERS,
  DEFAULT_ISSUER_BY_CATEGORY,
  STATUS_META,
  STATUS_ORDER,
  getCategoryLabel,
} from "../constants/legal-mock-data";
import type {
  AttachedDocumentFile,
  BuiltInDocumentCategory,
  DocumentCategoryKey,
  LegalDocument,
  LegalDocumentStatus,
} from "../types/legal-ai.types";

interface CreateDocumentDrawerProps {
  open: boolean;
  editingDocument?: LegalDocument | null;
  onClose: () => void;
  onSubmit: (doc: LegalDocument) => void;
  /** Cơ quan ban hành của các văn bản đã có trong thư viện (bổ sung vào danh sách gợi ý) */
  knownIssuers?: string[];
  /** Loại văn bản người dùng đã tự thêm trước đó (bổ sung vào danh sách chọn) */
  knownCategories?: string[];
}

const BUILT_IN_CATEGORIES: BuiltInDocumentCategory[] = ["LAW", "DECREE", "CIRCULAR", "RESOLUTION", "DECISION", "LOCAL"];

const STATUS_SELECT_OPTIONS = STATUS_ORDER.map((value) => ({ value, label: STATUS_META[value].label }));

const DEFAULT_ISSUERS = new Set(Object.values(DEFAULT_ISSUER_BY_CATEGORY));

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
  knownIssuers = [],
  knownCategories = [],
}: CreateDocumentDrawerProps) {
  const [code, setCode] = useState("");
  const [category, setCategory] = useState<DocumentCategoryKey>("DECREE");
  const [categoryQuery, setCategoryQuery] = useState("");
  const [addedCategories, setAddedCategories] = useState<string[]>([]);
  const [issuer, setIssuer] = useState("");
  const [issuerQuery, setIssuerQuery] = useState("");
  const [addedIssuers, setAddedIssuers] = useState<string[]>([]);
  const [issueDate, setIssueDate] = useState(todayIso());
  const [effectiveDate, setEffectiveDate] = useState(todayIso());
  const [status, setStatus] = useState<LegalDocumentStatus>("EFFECTIVE");
  const [tagsStr, setTagsStr] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<UploadedAttachment[]>([]);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    if (editingDocument) {
      setCode(editingDocument.code);
      setCategory(editingDocument.category);
      setIssuer(editingDocument.issuer);
      setIssueDate(editingDocument.issueDate);
      setEffectiveDate(editingDocument.effectiveDate);
      setStatus(editingDocument.status);
      setTagsStr(editingDocument.tags.join(", "));
      if (editingDocument.files && editingDocument.files.length > 0) {
        setAttachedFiles(
          editingDocument.files.map((f) => ({
            id: f.id,
            name: f.name,
            size: f.size,
            type: f.type,
          }))
        );
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
      setCategory("DECREE");
      setIssuer(DEFAULT_ISSUER_BY_CATEGORY.DECREE ?? "");
      setIssueDate(todayIso());
      setEffectiveDate(todayIso());
      setStatus("EFFECTIVE");
      setTagsStr("");
      setAttachedFiles([]);
      setErrorText("");
    }
    setIssuerQuery("");
    setCategoryQuery("");
  }, [editingDocument, open]);

  const issuerOptions = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const name of [...COMMON_ISSUERS, ...knownIssuers, ...addedIssuers, issuer]) {
      const trimmed = name.trim();
      const key = normalizeSearchText(trimmed);
      if (!trimmed || seen.has(key)) continue;
      seen.add(key);
      list.push(trimmed);
    }
    return list.map((name) => ({ value: name, label: name }));
  }, [knownIssuers, addedIssuers, issuer]);

  // Ô nhập cuối danh sách vừa lọc (không phân biệt hoa/thường và dấu) vừa dùng để thêm cơ quan mới
  const filteredIssuerOptions = useMemo(() => {
    const query = normalizeSearchText(issuerQuery.trim());
    return query ? issuerOptions.filter((opt) => normalizeSearchText(opt.value).includes(query)) : issuerOptions;
  }, [issuerOptions, issuerQuery]);

  const issuerQueryTrimmed = issuerQuery.trim();
  const canAddIssuer =
    Boolean(issuerQueryTrimmed) &&
    !issuerOptions.some((opt) => normalizeSearchText(opt.value) === normalizeSearchText(issuerQueryTrimmed));

  const handleAddIssuer = () => {
    if (!canAddIssuer) return;
    setAddedIssuers((prev) => [...prev, issuerQueryTrimmed]);
    setIssuer(issuerQueryTrimmed);
    setIssuerQuery("");
  };

  // Loại có sẵn + loại đã thêm trong thư viện + loại vừa thêm trong form (khóa của loại tự thêm là chính tên loại)
  const categoryOptions = useMemo(() => {
    const seen = new Set<string>();
    const list: { value: string; label: string }[] = [];
    for (const value of [...BUILT_IN_CATEGORIES, ...knownCategories, ...addedCategories, category]) {
      const label = getCategoryLabel(value).trim();
      const key = normalizeSearchText(label);
      if (!label || seen.has(key)) continue;
      seen.add(key);
      list.push({ value, label });
    }
    return list;
  }, [knownCategories, addedCategories, category]);

  const categoryQueryTrimmed = categoryQuery.trim();
  const canAddCategory =
    Boolean(categoryQueryTrimmed) &&
    !categoryOptions.some((opt) => normalizeSearchText(opt.label) === normalizeSearchText(categoryQueryTrimmed));

  const handleCategoryChange = (next: DocumentCategoryKey) => {
    setCategory(next);
    setCategoryQuery("");
    if (!issuer.trim() || DEFAULT_ISSUERS.has(issuer.trim())) {
      setIssuer(DEFAULT_ISSUER_BY_CATEGORY[next as BuiltInDocumentCategory] ?? "");
    }
  };

  const handleAddCategory = () => {
    if (!canAddCategory) return;
    setAddedCategories((prev) => [...prev, categoryQueryTrimmed]);
    handleCategoryChange(categoryQueryTrimmed);
  };

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
      setErrorText("Vui lòng nhập số hiệu văn bản.");
      return;
    }
    if (!issuer.trim()) {
      setErrorText("Vui lòng nhập cơ quan ban hành.");
      return;
    }
    if (issueDate && effectiveDate && effectiveDate < issueDate) {
      setErrorText("Ngày có hiệu lực không được trước ngày ban hành.");
      return;
    }

    const tags = tagsStr
      .split(/[,;\n]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const primaryType: "PDF" | "DOCX" =
      attachedFiles.length > 0 && attachedFiles[0].type === "DOCX" ? "DOCX" : "PDF";
    const totalSizeStr =
      attachedFiles.length === 1
        ? attachedFiles[0].size
        : attachedFiles.length > 1
        ? `${attachedFiles.length} tệp`
        : editingDocument?.fileSize || "2.4 MB";

    const newDoc: LegalDocument = {
      id: editingDocument ? editingDocument.id : `DOC-${Date.now().toString().slice(-4)}`,
      code: code.trim(),
      // Form không nhập trích yếu / phạm vi nữa; giữ giá trị cũ khi cập nhật văn bản đã có
      title: editingDocument?.title ?? "",
      category,
      issuer: issuer.trim(),
      issueDate,
      effectiveDate,
      status,
      scope: editingDocument?.scope ?? "",
      // Form không nhập tóm tắt nữa; giữ tóm tắt cũ khi cập nhật văn bản đã có
      summary: editingDocument?.summary ?? "",
      fileType: primaryType,
      fileSize: totalSizeStr,
      downloads: editingDocument?.downloads ?? 0,
      tags: tags.length > 0 ? tags : ["Pháp lý", "Quy chuẩn", "Ban QLDA"],
      files: attachedFiles.map((f) => ({
        id: f.id,
        name: f.name,
        size: f.size,
        type: f.type === "DOCX" ? "DOCX" : "PDF",
        rawFile: f.rawFile,
        url: f.url,
      })),
    };

    onSubmit(newDoc);
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={STANDARD_DRAWER_WIDTH}
      title={
        <div className="py-1">
          <div className="flex items-center gap-2 text-base font-bold text-slate-800">
            <SafetyCertificateOutlined className="text-[#DC2626]" />
            {editingDocument ? "Cập nhật văn bản pháp luật" : "Thêm văn bản pháp luật"}
          </div>
          <div className="mt-0.5 text-xs font-normal text-slate-500">
            {editingDocument
              ? "Chỉnh sửa số hiệu, cơ quan ban hành, hiệu lực và tệp tài liệu số hóa"
              : "Bổ sung luật, nghị định, thông tư, nghị quyết, quyết định vào thư viện tra cứu"}
          </div>
        </div>
      }
      footer={
        <div className="flex w-full items-center justify-start gap-2.5 py-2">
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
                options={categoryOptions}
                onChange={(val) => handleCategoryChange(val)}
                className="w-full text-xs [&_.ant-select-selector]:!rounded-lg"
                popupRender={(menu) => (
                  <>
                    {menu}
                    <Divider style={{ margin: "6px 0" }} />
                    <div className="flex items-center gap-2 px-2 pb-1.5" onMouseDown={(e) => e.stopPropagation()}>
                      <Input
                        intent="clean"
                        value={categoryQuery}
                        onChange={(e) => setCategoryQuery(e.target.value)}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCategory();
                          }
                        }}
                        placeholder="Nhập nhóm văn bản mới..."
                        className="h-7 flex-1 text-xs"
                      />
                      <Button
                        htmlType="button"
                        intent="primary"
                        scale="xs"
                        icon={<PlusOutlined />}
                        disabled={!canAddCategory}
                        onClick={handleAddCategory}
                        className="text-xs"
                      >
                        Thêm
                      </Button>
                    </div>
                  </>
                )}
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
                placeholder="VD: 10/2021/NĐ-CP"
                className="w-full text-xs h-8"
              />
            </div>
          </div>
        </div>

        {/* 2. Cơ quan & Ngày ban hành / Hiệu lực */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cơ quan ban hành <span className="text-rose-500">*</span>
            </label>
            <Select
              aria-label="Cơ quan ban hành"
              placeholder="Chọn cơ quan ban hành..."
              value={issuer || undefined}
              options={filteredIssuerOptions}
              onChange={(val) => {
                setIssuer(val);
                setIssuerQuery("");
              }}
              notFoundContent={
                <div className="py-1 text-xs text-slate-400">Chưa có cơ quan này trong danh sách.</div>
              }
              className="w-full text-xs [&_.ant-select-selector]:!rounded-lg"
              popupRender={(menu) => (
                <>
                  {menu}
                  <Divider style={{ margin: "6px 0" }} />
                  <div className="flex items-center gap-2 px-2 pb-1.5" onMouseDown={(e) => e.stopPropagation()}>
                    <Input
                      intent="clean"
                      value={issuerQuery}
                      onChange={(e) => setIssuerQuery(e.target.value)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddIssuer();
                        }
                      }}
                      placeholder="Tìm hoặc nhập cơ quan mới..."
                      className="h-7 flex-1 text-xs"
                    />
                    <Button
                      htmlType="button"
                      intent="primary"
                      scale="xs"
                      icon={<PlusOutlined />}
                      disabled={!canAddIssuer}
                      onClick={handleAddIssuer}
                      className="text-xs"
                    >
                      Thêm
                    </Button>
                  </div>
                </>
              )}
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

        {/* 3. Từ khóa tra cứu */}
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

        {/* 4. Tập tin đính kèm */}
        <StandardFileUpload
          value={attachedFiles}
          onChange={setAttachedFiles}
          accept=".pdf,.docx,.doc"
        />
      </form>
    </Drawer>
  );
}
