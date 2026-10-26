"use client";

import { useRef, useState } from "react";
import { App } from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  PaperClipOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  SwapOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Tooltip } from "@/components/ui";
import { formatDateVi } from "@/utils/date";
import { STATUS_META, STATUS_ORDER, getCategoryLabel } from "../constants/legal-mock-data";
import type { AttachedDocumentFile, LegalDocument, LegalDocumentStatus } from "../types/legal-ai.types";
import FilePreviewModal from "./FilePreviewModal";
import { InlineEditField } from "@/components/workspace";
import {
  describeLegalChanges,
  isSameFieldValue,
  type LegalDocumentField,
  type LegalDocumentPatch,
} from "../utils/document-changes";

const STATUS_OPTIONS = STATUS_ORDER.map((value) => ({ value, label: STATUS_META[value].label }));

/** Mã tệp ảo cho văn bản mẫu chưa khai báo danh sách tệp */
const ORIGINAL_FILE_ID = "__original__";
/** Đích của ô chọn tệp khi bấm "Thêm tệp" (khác với thay một tệp có sẵn) */
const NEW_FILE_TARGET = "__new__";

/** Mã duy nhất cho tệp vừa chọn (gọi trong xử lý sự kiện, không gọi khi render) */
const createFileId = () => `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(1))} ${units[i]}`;
}

interface DocumentDetailDrawerProps {
  open: boolean;
  document: LegalDocument | null;
  onClose: () => void;
  onEdit?: (doc: LegalDocument) => void;
  /** Lưu các trường đã sửa khi bấm "Lưu thay đổi"; không truyền = chỉ xem */
  onUpdate?: (docId: string, patch: LegalDocumentPatch) => void;
  /** Danh sách loại văn bản để chọn khi sửa "Phân loại văn bản" */
  categoryOptions?: { value: string; label: string }[];
}

export default function DocumentDetailDrawer({
  open,
  document: originalDocument,
  onClose,
  onEdit,
  onUpdate,
  categoryOptions = [],
}: DocumentDetailDrawerProps) {
  // Tệp đang xem, gắn với mã văn bản để đổi văn bản là tự đóng xem
  const [preview, setPreview] = useState<{ docId: string; fileId: string } | null>(null);
  const { modal, message } = App.useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Tệp đang được thay (mã tệp) hoặc NEW_FILE_TARGET khi thêm tệp mới
  const [fileTarget, setFileTarget] = useState<string | null>(null);
  // Các trường đã sửa bằng bút chì nhưng chưa lưu (gắn với mã văn bản: đổi văn bản là bỏ)
  const [pending, setPending] = useState<{ docId: string; patch: LegalDocumentPatch } | null>(null);

  if (!originalDocument) return null;

  const pendingPatch = pending?.docId === originalDocument.id ? pending.patch : {};
  const changes = describeLegalChanges(originalDocument, pendingPatch);
  const isDirty = changes.length > 0;
  const isChanged = (field: LegalDocumentField) => field in pendingPatch;
  // Văn bản đang hiển thị = bản gốc + các trường đang sửa
  const document: LegalDocument = { ...originalDocument, ...pendingPatch };

  const previewFileId = preview?.docId === document.id ? preview.fileId : null;
  const openPreview = (fileId: string) => setPreview({ docId: document.id, fileId });
  const previewFile = document.files?.find((f) => f.id === previewFileId);

  const statusInfo = STATUS_META[document.status];
  // Ghi nhận trường vừa sửa vào danh sách chờ lưu; sửa về đúng giá trị cũ thì bỏ khỏi danh sách (undefined = chỉ xem)
  const saveField = onUpdate
    ? (patch: LegalDocumentPatch) => {
        const next: LegalDocumentPatch = { ...pendingPatch, ...patch };
        for (const field of Object.keys(patch) as LegalDocumentField[]) {
          if (isSameFieldValue(next[field], originalDocument[field])) delete next[field];
        }
        setPending({ docId: originalDocument.id, patch: next });
      }
    : undefined;

  const discardChanges = () => {
    setPending(null);
    setPreview(null);
  };

  // Bấm "Lưu thay đổi": liệt kê đúng những gì sẽ đổi, đồng ý mới lưu
  const confirmSave = () =>
    modal.confirm({
      centered: true,
      width: 480,
      title: "Xác nhận thay đổi văn bản",
      content: (
        <div className="space-y-2.5 text-xs">
          <p className="m-0 text-slate-600">
            Bạn có đồng ý cập nhật {changes.length} thông tin sau cho văn bản{" "}
            <strong className="text-slate-900">{originalDocument.code}</strong>?
          </p>
          <div className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50/70 p-2.5">
            {changes.map((c) => (
              <div key={c.field} className="flex flex-wrap items-baseline gap-x-1.5">
                <span className="font-semibold text-slate-700">{c.label}:</span>
                <span className="text-slate-500 line-through">{c.from || "Trống"}</span>
                <span className="text-slate-400">→</span>
                <span className="font-semibold text-[#DC2626]">{c.to || "Trống"}</span>
              </div>
            ))}
          </div>
        </div>
      ),
      okText: "Đồng ý lưu",
      cancelText: "Xem lại",
      okButtonProps: { className: "!bg-[#DC2626] !border-[#DC2626] hover:!bg-[#B91C1C]" },
      onOk: () => {
        onUpdate?.(originalDocument.id, pendingPatch);
        setPending(null);
        message.success(`Đã lưu ${changes.length} thay đổi của văn bản ${originalDocument.code}.`);
      },
    });

  // Đóng khi còn thay đổi chưa lưu: hỏi trước để không mất dữ liệu
  const handleClose = () => {
    if (!isDirty) {
      onClose();
      return;
    }
    modal.confirm({
      centered: true,
      width: 420,
      title: "Bỏ các thay đổi chưa lưu?",
      content: (
        <p className="m-0 text-xs text-slate-600">
          Có {changes.length} thay đổi chưa lưu. Đóng lại sẽ bỏ các thay đổi này.
        </p>
      ),
      okText: "Bỏ thay đổi",
      cancelText: "Tiếp tục sửa",
      okButtonProps: { danger: true },
      onOk: () => {
        discardChanges();
        onClose();
      },
    });
  };

  // Danh sách tệp hiển thị: văn bản mẫu chưa khai báo tệp thì coi tệp gốc là một tệp đính kèm
  const displayFiles: AttachedDocumentFile[] = document.files ?? [
    {
      id: ORIGINAL_FILE_ID,
      name: document.title ? `${document.code} - ${document.title}` : document.code,
      size: document.fileSize,
      type: document.fileType,
    },
  ];

  const saveFiles = (files: AttachedDocumentFile[]) => {
    setPreview(null);
    saveField?.({ files });
  };

  const pickFile = (target: string) => {
    setFileTarget(target);
    fileInputRef.current?.click();
  };

  const handleFilePicked = (picked: File | undefined) => {
    if (!picked || !fileTarget) return;
    const lowerName = picked.name.toLowerCase();
    const isWord = lowerName.endsWith(".doc") || lowerName.endsWith(".docx");
    if (!isWord && !lowerName.endsWith(".pdf")) {
      message.error("Chỉ hỗ trợ tệp PDF hoặc Word (.doc, .docx).");
      return;
    }
    const nextFile: AttachedDocumentFile = {
      id: createFileId(),
      name: picked.name,
      size: formatFileSize(picked.size),
      type: isWord ? "DOCX" : "PDF",
      rawFile: picked,
    };
    saveFiles(
      fileTarget === NEW_FILE_TARGET
        ? [...displayFiles, nextFile]
        : displayFiles.map((file) => (file.id === fileTarget ? nextFile : file)),
    );
    setFileTarget(null);
  };

  const confirmRemoveFile = (file: AttachedDocumentFile) =>
    modal.confirm({
      centered: true,
      width: 440,
      title: "Xóa tệp đính kèm?",
      content: (
        <p className="m-0 text-xs leading-relaxed text-slate-600">
          Tệp <strong className="text-slate-800">{file.name}</strong> sẽ bị gỡ khỏi văn bản này.
        </p>
      ),
      okText: "Xóa tệp",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: () => saveFiles(displayFiles.filter((item) => item.id !== file.id)),
    });

  const handleDownload = () => {
    // Giả lập download file thực tế
    const safeCode = document.code.replace(/[\/\\?%*:|"<>]/g, "_");
    const fileName = document.title ? `${safeCode}_${document.title.slice(0, 30)}.pdf` : `${safeCode}.pdf`;
    const element = window.document.createElement("a");
    const file = new Blob([`Tập tin văn bản pháp lý / biểu mẫu chuẩn: ${document.title}\nSố hiệu: ${document.code}\nCơ quan ban hành: ${document.issuer}\nNội dung tóm tắt:\n${document.summary}`], {
      type: "text/plain",
    });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    window.document.body.appendChild(element);
    element.click();
    window.document.body.removeChild(element);
  };

  const handleDownloadFile = (attached: AttachedDocumentFile) => {
    if (attached.rawFile || attached.url) {
      const href = attached.rawFile ? URL.createObjectURL(attached.rawFile) : attached.url!;
      const link = window.document.createElement("a");
      link.href = href;
      link.download = attached.name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      if (attached.rawFile) URL.revokeObjectURL(href);
      return;
    }
    handleDownloadSampleFile(attached.name, attached.type);
  };

  const handleDownloadSampleFile = (fileNameToDownload: string, fileTypeToDownload: "PDF" | "DOCX") => {
    const ext = fileTypeToDownload === "PDF" ? "pdf" : "docx";
    const safeName =
      fileNameToDownload.endsWith(".pdf") ||
      fileNameToDownload.endsWith(".docx") ||
      fileNameToDownload.endsWith(".doc")
        ? fileNameToDownload
        : `${fileNameToDownload}.${ext}`;
    const element = window.document.createElement("a");
    const file = new Blob(
      [
        `Tập tin văn bản pháp lý / biểu mẫu chuẩn: ${document.title}\nTên tệp: ${safeName}\nSố hiệu: ${document.code}\nCơ quan ban hành: ${document.issuer}\nNội dung tóm tắt:\n${document.summary}`,
      ],
      { type: "text/plain;charset=utf-8" }
    );
    element.href = URL.createObjectURL(file);
    element.download = safeName;
    window.document.body.appendChild(element);
    element.click();
    window.document.body.removeChild(element);
  };

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      width="min(680px, 100vw)"
      title={
        <div className="py-1">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-800">
              {document.code}
            </span>
            <span
              className={`ml-2 inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${statusInfo.badge}`}
            >
              {statusInfo.label}
            </span>
          </div>
          {document.title && (
            <div className="mt-1 line-clamp-2 text-xs font-medium text-slate-600">
              {document.title}
            </div>
          )}
        </div>
      }
      footer={
        // Có thay đổi chưa lưu: "Lưu thay đổi" · "Hủy thay đổi" thay chỗ nút Đóng; lưu/hủy xong thì Đóng hiện lại
        <div className="flex flex-wrap items-center gap-2.5 py-1">
          {isDirty ? (
            <>
              <Button
                intent="primary"
                scale="sm"
                onClick={confirmSave}
                className="!bg-[#DC2626] !border-[#DC2626] hover:!bg-[#B91C1C] px-5 text-xs font-semibold"
              >
                Lưu thay đổi
              </Button>
              <Button intent="outline" scale="sm" onClick={discardChanges} className="px-5 text-xs font-medium">
                Hủy thay đổi
              </Button>
            </>
          ) : (
            <>
              <Button intent="outline" scale="sm" onClick={handleClose} className="px-5 text-xs font-medium">
                Đóng
              </Button>
              {onEdit && (
                <Button
                  intent="outline"
                  scale="sm"
                  icon={<EditOutlined />}
                  onClick={() => {
                    onClose();
                    onEdit(document);
                  }}
                  className="text-xs font-medium text-slate-700"
                >
                  Chỉnh sửa
                </Button>
              )}
            </>
          )}
        </div>
      }
    >
      <div key={document.id} className="flex flex-col gap-4 text-slate-800">
        {/* Thuộc tính cơ bản */}
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4">
          <div className="mb-3 flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <SafetyCertificateOutlined className="text-[#DC2626]" />
            Thông tin ban hành
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InlineEditField
              label="Số hiệu"
              changed={isChanged("code")}
              value={document.code}
              display={document.code}
              editor={{ kind: "text", placeholder: "VD: 10/2021/NĐ-CP" }}
              onSave={saveField && ((code) => saveField({ code }))}
            />

            <InlineEditField
              label="Tình trạng hiệu lực"
              changed={isChanged("status")}
              value={document.status}
              display={
                <span className="inline-flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${statusInfo.dotClass}`} aria-hidden />
                  {statusInfo.label}
                </span>
              }
              editor={{ kind: "select", options: STATUS_OPTIONS }}
              onSave={saveField && ((status) => saveField({ status: status as LegalDocumentStatus }))}
            />

            <InlineEditField
              className="sm:col-span-2"
              label="Tên văn bản"
              changed={isChanged("title")}
              value={document.title}
              display={document.title || <span className="font-normal italic text-slate-400">Chưa có</span>}
              editor={{ kind: "text", placeholder: "Tên / trích yếu văn bản" }}
              onSave={saveField && ((title) => saveField({ title }))}
            />

            <InlineEditField
              label="Phân loại văn bản"
              changed={isChanged("category")}
              value={document.category}
              display={getCategoryLabel(document.category)}
              editor={{
                kind: "select",
                options: categoryOptions.some((o) => o.value === document.category)
                  ? categoryOptions
                  : [...categoryOptions, { value: document.category, label: getCategoryLabel(document.category) }],
              }}
              onSave={saveField && ((category) => saveField({ category }))}
            />

            <InlineEditField
              label="Cơ quan ban hành"
              changed={isChanged("issuer")}
              value={document.issuer}
              display={document.issuer}
              editor={{ kind: "text", placeholder: "VD: Chính phủ" }}
              onSave={saveField && ((issuer) => saveField({ issuer }))}
            />

            <InlineEditField
              label="Người ký"
              changed={isChanged("signer")}
              value={document.signer ?? ""}
              display={document.signer || <span className="font-normal italic text-slate-400">Chưa có</span>}
              editor={{ kind: "text", placeholder: "VD: Nguyễn Thị Kim Ngân" }}
              onSave={saveField && ((signer) => saveField({ signer }))}
            />

            <InlineEditField
              label="Ngày ban hành"
              changed={isChanged("issueDate")}
              value={document.issueDate}
              display={
                <span className="flex items-center gap-1.5">
                  <CalendarOutlined className="text-slate-400" />
                  {formatDateVi(document.issueDate)}
                </span>
              }
              editor={{ kind: "date" }}
              validate={(next) =>
                document.effectiveDate && next > document.effectiveDate
                  ? "Ngày ban hành không được sau ngày bắt đầu hiệu lực."
                  : undefined
              }
              onSave={saveField && ((issueDate) => saveField({ issueDate }))}
            />

            <InlineEditField
              label="Ngày áp dụng (hiệu lực)"
              changed={isChanged("effectiveDate")}
              value={document.effectiveDate}
              display={
                <span className="flex items-center gap-1.5">
                  <CheckCircleOutlined className="text-slate-400" />
                  {formatDateVi(document.effectiveDate)}
                </span>
              }
              editor={{ kind: "date" }}
              validate={(next) =>
                document.issueDate && next < document.issueDate
                  ? "Ngày hiệu lực không được trước ngày ban hành."
                  : undefined
              }
              onSave={saveField && ((effectiveDate) => saveField({ effectiveDate }))}
            />

            <InlineEditField
              label="Ngày hết hiệu lực"
              changed={isChanged("expiredDate")}
              value={document.expiredDate ?? ""}
              display={
                document.expiredDate ? (
                  <span className="flex items-center gap-1.5">
                    <CalendarOutlined className="text-slate-400" />
                    {formatDateVi(document.expiredDate)}
                  </span>
                ) : (
                  <span className="font-normal italic text-slate-400">Đang cập nhật</span>
                )
              }
              editor={{ kind: "date" }}
              onSave={saveField && ((expiredDate) => saveField({ expiredDate }))}
            />
          </div>
        </div>

        {/* Từ khóa tra cứu (cùng kiểu nhãn với danh sách) — sửa dạng "từ khóa 1, từ khóa 2" */}
        {(document.tags.length > 0 || saveField) && (
          <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4">
            <InlineEditField
              label="Từ khóa tra cứu"
              changed={isChanged("tags")}
              labelNode={
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <TagOutlined className="text-[#DC2626]" />
                  Từ khóa tra cứu
                </span>
              }
              allowEmpty
              value={document.tags.join(", ")}
              editor={{ kind: "text", placeholder: "Các từ khóa, cách nhau bằng dấu phẩy" }}
              display={
                document.tags.length > 0 ? (
                  <ul className="m-0 mt-2 flex list-none flex-wrap gap-1.5 p-0 font-normal">
                    {document.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs text-slate-600"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="mt-1 block font-normal italic text-slate-400">Chưa có từ khóa.</span>
                )
              }
              onSave={
                saveField &&
                ((next) =>
                  saveField({
                    tags: [
                      ...new Set(
                        next
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean),
                      ),
                    ],
                  }))
              }
            />
          </div>
        )}

        {/* File đính kèm — có quyền sửa: thêm, thay tệp, xóa tệp */}
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4">
          <div className="mb-2.5 flex items-center justify-between gap-2 text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <PaperClipOutlined className="text-[#DC2626]" />
              Tệp văn bản đính kèm ({displayFiles.length})
              {isChanged("files") && (
                <span className="rounded bg-amber-100 px-1.5 py-px text-[10px] font-semibold text-amber-800">Đã sửa</span>
              )}
            </span>
            {saveField && (
              <Button
                htmlType="button"
                intent="outline"
                scale="xs"
                icon={<PlusOutlined />}
                onClick={() => pickFile(NEW_FILE_TARGET)}
                className="text-xs font-medium"
              >
                Thêm tệp
              </Button>
            )}
          </div>

          {displayFiles.length > 0 ? (
            <div className="flex flex-col gap-2">
              {displayFiles.map((file) => {
                const isPreviewing = previewFileId === file.id;
                return (
                  <div
                    key={file.id}
                    className={`flex items-center justify-between gap-2 rounded-lg border bg-white p-2.5 shadow-xs transition-colors ${
                      isPreviewing ? "border-[#DC2626]/40" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => openPreview(file.id)}
                      className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 border-0 bg-transparent p-0 pr-2 text-left"
                    >
                      {file.type === "PDF" ? (
                        <FilePdfOutlined className="shrink-0 text-xl text-rose-500" />
                      ) : (
                        <FileWordOutlined className="shrink-0 text-xl text-blue-600" />
                      )}
                      <span className="min-w-0">
                        <span
                          className="block line-clamp-2 text-xs font-bold text-slate-800 hover:text-[#DC2626]"
                          title={file.name}
                        >
                          {file.name}
                        </span>
                        <span className="block text-[11px] text-slate-500">
                          {file.type} · {file.size}
                        </span>
                      </span>
                    </button>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Tooltip title="Tải về">
                        <Button
                          intent="outline"
                          scale="xs"
                          icon={<DownloadOutlined />}
                          aria-label={`Tải về ${file.name}`}
                          onClick={() => (file.id === ORIGINAL_FILE_ID ? handleDownload() : handleDownloadFile(file))}
                          className="text-xs"
                        />
                      </Tooltip>
                      {saveField && (
                        <>
                          <Tooltip title="Thay tệp khác">
                            <Button
                              intent="outline"
                              scale="xs"
                              icon={<SwapOutlined />}
                              aria-label={`Thay tệp ${file.name}`}
                              onClick={() => pickFile(file.id)}
                              className="text-xs"
                            />
                          </Tooltip>
                          <Tooltip title="Xóa tệp">
                            <Button
                              intent="outline"
                              scale="xs"
                              icon={<DeleteOutlined />}
                              aria-label={`Xóa tệp ${file.name}`}
                              onClick={() => confirmRemoveFile(file)}
                              className="text-xs text-rose-600! hover:border-rose-300! hover:bg-rose-50!"
                            />
                          </Tooltip>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="m-0 text-xs italic text-slate-400">Chưa có tệp đính kèm.</p>
          )}

          {/* Ô chọn tệp ẩn: dùng chung cho "Thêm tệp" và "Thay tệp" */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => {
              handleFilePicked(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <FilePreviewModal
        open={Boolean(previewFileId)}
        document={document}
        file={previewFile}
        onDownload={() => (previewFile ? handleDownloadFile(previewFile) : handleDownload())}
        onClose={() => setPreview(null)}
      />
    </Drawer>
  );
}
