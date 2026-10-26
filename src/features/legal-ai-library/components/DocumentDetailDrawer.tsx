"use client";

import { useRef, useState } from "react";
import { App } from "antd";
import {
  ClockCircleOutlined,
  DownloadOutlined,
  EditOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FileWordOutlined,
  InfoCircleOutlined,
  PaperClipOutlined,
  SafetyCertificateOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Input, Select, Tooltip } from "@/components/ui";
import { formatDateVi } from "@/utils/date";
import { COMMON_FIELDS, STATUS_META, STATUS_ORDER, getCategoryLabel } from "../constants/legal-mock-data";
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
  /** Lưu các trường đã sửa khi bấm "Lưu thay đổi"; không truyền = chỉ xem */
  onUpdate?: (docId: string, patch: LegalDocumentPatch) => void;
  /** Danh sách loại văn bản để chọn khi sửa "Phân loại văn bản" */
  categoryOptions?: { value: string; label: string }[];
}


interface TableCellEditorProps {
  label: string;
  infoTooltip?: string;
  changed?: boolean;
  display: React.ReactNode;
  editorRender?: (props: { autoFocus?: boolean; onDone: () => void }) => React.ReactNode;
  labelWidth?: string;
  valueWidth?: string;
  editable?: boolean;
}

function TableCellEditor({
  label,
  infoTooltip,
  changed,
  display,
  editorRender,
  labelWidth = "w-[18%]",
  valueWidth = "w-[32%]",
  editable = true,
}: TableCellEditorProps) {
  const [isCellEditing, setIsCellEditing] = useState(false);
  const active = isCellEditing;
  const canEdit = editable && Boolean(editorRender);

  const startEdit = () => {
    if (canEdit && !active) {
      setIsCellEditing(true);
    }
  };

  const handleDone = () => {
    setIsCellEditing(false);
  };

  return (
    <>
      <td
        className={`${labelWidth} border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-[13px] font-semibold text-slate-600 align-middle select-none`}
      >
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span>{label}:</span>
          {infoTooltip && (
            <Tooltip title={infoTooltip}>
              <InfoCircleOutlined className="text-slate-400 text-[11px] cursor-help hover:text-slate-600 transition-colors" />
            </Tooltip>
          )}
        </div>
      </td>
      <td
        onClick={startEdit}
        className={`${valueWidth} border border-slate-200 bg-white px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-[13px] text-slate-900 align-middle transition-colors ${
          !active && canEdit
            ? "group cursor-pointer hover:bg-amber-50/30 hover:border-amber-300"
            : ""
        }`}
        title={!active && canEdit ? `Nhấp để chỉnh sửa ${label.toLowerCase()}` : undefined}
      >
        <div className="flex items-center justify-between gap-1.5 min-h-[22px]">
          <div className="min-w-0 flex-1">
            {active && editorRender ? (
              <div onClick={(e) => e.stopPropagation()}>
                {editorRender({ autoFocus: isCellEditing, onDone: handleDone })}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1 font-medium">{display}</div>
                {canEdit && (
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-slate-200/80 bg-slate-50 text-slate-400 shadow-2xs transition-all group-hover:border-[#DC2626]/50 group-hover:bg-red-50 group-hover:text-[#DC2626]"
                    title={`Nhấp để sửa ${label.toLowerCase()}`}
                  >
                    <EditOutlined className="text-[11px]" />
                  </span>
                )}
              </div>
            )}
          </div>
          {changed && !active && (
            <span className="rounded bg-amber-100 px-1 py-px text-[9px] font-semibold text-amber-800 shrink-0 ml-1.5">
              Đã sửa
            </span>
          )}
        </div>
      </td>
    </>
  );
}

export default function DocumentDetailDrawer({
  open,
  document: originalDocument,
  onClose,
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
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  // Mã tệp vừa mới thêm vào văn bản
  const [recentFileId, setRecentFileId] = useState<{ docId: string; fileId: string } | null>(null);

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
    setIsEditingTitle(false);
    setRecentFileId(null);
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
        setIsEditingTitle(false);
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

  // Tệp được thêm gần đây nhất (tệp vừa tải lên hoặc tệp cuối cùng trong danh sách nếu có nhiều hơn 1 tệp)
  const activeRecentId = recentFileId?.docId === document.id ? recentFileId.fileId : null;
  const latestFileId =
    activeRecentId ?? (displayFiles.length > 1 ? displayFiles[displayFiles.length - 1]?.id : null);

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
    if (fileTarget === NEW_FILE_TARGET) {
      setRecentFileId({ docId: document.id, fileId: nextFile.id });
    }
    saveFiles(
      fileTarget === NEW_FILE_TARGET
        ? [...displayFiles, nextFile]
        : displayFiles.map((file) => (file.id === fileTarget ? nextFile : file)),
    );
    setFileTarget(null);
  };

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
      width="min(760px, 100vw)"
      title={
        <div className="py-1">
          <div className="flex items-center gap-2 text-base font-bold text-slate-800">
            <SafetyCertificateOutlined className="text-[#DC2626]" />
            <span>Cập nhật văn bản pháp luật</span>
          </div>
          <div className="mt-0.5 text-xs font-normal text-slate-500">
            Chỉnh sửa số hiệu, cơ quan ban hành, hiệu lực pháp lý và tệp tài liệu số hóa
          </div>
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
            <Button intent="outline" scale="sm" onClick={handleClose} className="px-5 text-xs font-medium">
              Đóng
            </Button>
          )}
        </div>
      }
    >
      <div key={document.id} className="flex flex-col gap-4 text-slate-800">
        {/* Tên văn bản / Trích yếu nội dung đưa lên đầu */}
        <div
          onClick={() => {
            if (saveField && !isEditingTitle) setIsEditingTitle(true);
          }}
          className={`rounded-xl border border-slate-200/90 bg-gradient-to-br from-slate-50/90 via-white to-slate-50/50 p-4 shadow-2xs transition-all ${
            saveField && !isEditingTitle ? "cursor-pointer hover:border-slate-300 hover:bg-slate-50/80" : ""
          }`}
          title={saveField && !isEditingTitle ? "Nhấp để chỉnh sửa tên văn bản" : undefined}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <FileTextOutlined className="text-[#DC2626]" />
              Tên văn bản / Trích yếu nội dung
            </span>
            {saveField && (
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-slate-200/80 bg-white text-slate-400 shadow-2xs transition-all group-hover:border-[#DC2626]/50 group-hover:bg-red-50 group-hover:text-[#DC2626]"
                title="Nhấp để sửa tên văn bản"
              >
                <EditOutlined className="text-[11px]" />
              </span>
            )}
          </div>
          {isEditingTitle ? (
            <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
              <Input.TextArea
                autoFocus
                rows={3}
                value={document.title}
                onChange={(e) => saveField?.({ title: e.target.value })}
                onBlur={() => setIsEditingTitle(false)}
                placeholder="Nhập tên / trích yếu văn bản..."
                className="text-sm font-normal text-slate-800"
              />
            </div>
          ) : (
            <span className="text-sm font-normal text-slate-700 leading-relaxed block">
              {document.title || <span className="italic text-slate-400">Chưa có tên văn bản</span>}
            </span>
          )}
        </div>

        {/* BẢNG THÔNG TIN VĂN BẢN — THIẾT KẾ CÂN ĐỐI, RÕ RÀNG */}
        <div className="flex items-center justify-between px-0.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
            <SafetyCertificateOutlined className="text-[#DC2626]" />
            Thông tin ban hành &amp; hiệu lực
          </span>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
          <table className="w-full border-collapse text-left">
            <tbody>
              {/* Hàng 1: Cơ quan ban hành | Số công báo */}
              <tr className="border-b border-slate-200">
                <TableCellEditor
                  label="Cơ quan ban hành"
                  labelWidth="w-[18%]"
                  valueWidth="w-[30%]"
                  display={<span className="font-medium text-slate-900">{document.issuer}</span>}
                  changed={isChanged("issuer")}
                  editable={Boolean(saveField)}
                  editorRender={({ autoFocus, onDone }) => (
                    <Input
                      autoFocus={autoFocus}
                      size="small"
                      value={document.issuer}
                      onChange={(e) => saveField?.({ issuer: e.target.value })}
                      onBlur={onDone}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === "Escape") onDone();
                      }}
                      placeholder="VD: Quốc hội"
                      className="text-xs"
                    />
                  )}
                />
                <TableCellEditor
                  label="Số công báo"
                  labelWidth="w-[24%]"
                  valueWidth="w-[28%]"
                  infoTooltip="Số hiệu công báo đăng tải văn bản"
                  display={
                    document.gazetteNumber ? (
                      <span className="tabular-nums font-medium text-slate-800">{document.gazetteNumber}</span>
                    ) : (
                      <span className="font-normal italic text-slate-400">Chưa có</span>
                    )
                  }
                  changed={isChanged("gazetteNumber")}
                  editable={Boolean(saveField)}
                  editorRender={({ autoFocus, onDone }) => (
                    <Input
                      autoFocus={autoFocus}
                      size="small"
                      value={document.gazetteNumber ?? ""}
                      onChange={(e) => saveField?.({ gazetteNumber: e.target.value })}
                      onBlur={onDone}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === "Escape") onDone();
                      }}
                      placeholder="VD: 693&694/2014"
                      className="text-xs"
                    />
                  )}
                />
              </tr>

              {/* Hàng 2: Số hiệu | Ngày đăng công báo */}
              <tr className="border-b border-slate-200">
                <TableCellEditor
                  label="Số hiệu"
                  labelWidth="w-[18%]"
                  valueWidth="w-[30%]"
                  display={<span className="font-bold text-slate-900 tabular-nums">{document.code}</span>}
                  changed={isChanged("code")}
                  editable={Boolean(saveField)}
                  editorRender={({ autoFocus, onDone }) => (
                    <Input
                      autoFocus={autoFocus}
                      size="small"
                      value={document.code}
                      onChange={(e) => saveField?.({ code: e.target.value })}
                      onBlur={onDone}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === "Escape") onDone();
                      }}
                      placeholder="VD: 50/2014/QH13"
                      className="text-xs font-semibold"
                    />
                  )}
                />
                <TableCellEditor
                  label="Ngày đăng công báo"
                  labelWidth="w-[24%]"
                  valueWidth="w-[28%]"
                  display={
                    document.gazetteDate ? (
                      <span className="tabular-nums font-medium text-slate-800">{formatDateVi(document.gazetteDate)}</span>
                    ) : (
                      <span className="font-normal italic text-slate-400">Chưa có</span>
                    )
                  }
                  changed={isChanged("gazetteDate")}
                  editable={Boolean(saveField)}
                  editorRender={({ autoFocus, onDone }) => (
                    <Input
                      autoFocus={autoFocus}
                      size="small"
                      type="date"
                      value={document.gazetteDate ?? ""}
                      onChange={(e) => saveField?.({ gazetteDate: e.target.value })}
                      onBlur={onDone}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === "Escape") onDone();
                      }}
                      className="text-xs"
                    />
                  )}
                />
              </tr>

              {/* Hàng 3: Loại văn bản | Người ký */}
              <tr className="border-b border-slate-200">
                <TableCellEditor
                  label="Loại văn bản"
                  labelWidth="w-[18%]"
                  valueWidth="w-[30%]"
                  display={<span className="font-semibold text-slate-900">{getCategoryLabel(document.category)}</span>}
                  changed={isChanged("category")}
                  editable={Boolean(saveField)}
                  editorRender={({ autoFocus, onDone }) => (
                    <Select
                      autoFocus={autoFocus}
                      defaultOpen={autoFocus}
                      size="small"
                      className="w-full text-xs"
                      value={document.category}
                      options={
                        categoryOptions.some((o) => o.value === document.category)
                          ? categoryOptions
                          : [...categoryOptions, { value: document.category, label: getCategoryLabel(document.category) }]
                      }
                      onChange={(val) => {
                        saveField?.({ category: val });
                        onDone();
                      }}
                      onBlur={onDone}
                    />
                  )}
                />
                <TableCellEditor
                  label="Người ký"
                  labelWidth="w-[24%]"
                  valueWidth="w-[28%]"
                  display={
                    document.signer ? (
                      <span className="font-medium text-slate-900">{document.signer}</span>
                    ) : (
                      <span className="font-normal italic text-slate-400">Chưa có</span>
                    )
                  }
                  changed={isChanged("signer")}
                  editable={Boolean(saveField)}
                  editorRender={({ autoFocus, onDone }) => (
                    <Input
                      autoFocus={autoFocus}
                      size="small"
                      value={document.signer ?? ""}
                      onChange={(e) => saveField?.({ signer: e.target.value })}
                      onBlur={onDone}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === "Escape") onDone();
                      }}
                      placeholder="VD: Nguyễn Sinh Hùng"
                      className="text-xs"
                    />
                  )}
                />
              </tr>

              {/* Hàng 4: Ngày ban hành | Ngày hết hiệu lực */}
              <tr className="border-b border-slate-200">
                <TableCellEditor
                  label="Ngày ban hành"
                  labelWidth="w-[18%]"
                  valueWidth="w-[30%]"
                  infoTooltip="Ngày cơ quan nhà nước có thẩm quyền ký ban hành văn bản"
                  display={<span className="tabular-nums font-medium text-slate-900">{formatDateVi(document.issueDate)}</span>}
                  changed={isChanged("issueDate")}
                  editable={Boolean(saveField)}
                  editorRender={({ autoFocus, onDone }) => (
                    <Input
                      autoFocus={autoFocus}
                      size="small"
                      type="date"
                      value={document.issueDate}
                      onChange={(e) => saveField?.({ issueDate: e.target.value })}
                      onBlur={onDone}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === "Escape") onDone();
                      }}
                      className="text-xs"
                    />
                  )}
                />
                <TableCellEditor
                  label="Ngày hết hiệu lực"
                  labelWidth="w-[24%]"
                  valueWidth="w-[28%]"
                  infoTooltip="Thời điểm văn bản chính thức chấm dứt hiệu lực thi hành"
                  display={
                    document.expiredDate ? (
                      <span className="tabular-nums font-medium text-slate-900">{formatDateVi(document.expiredDate)}</span>
                    ) : saveField ? (
                      <Input
                        size="small"
                        type="date"
                        value=""
                        onChange={(e) => saveField?.({ expiredDate: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs h-7 w-full max-w-[150px]"
                      />
                    ) : (
                      <span className="font-normal italic text-slate-400">Chưa xác định</span>
                    )
                  }
                  changed={isChanged("expiredDate")}
                  editable={Boolean(saveField)}
                  editorRender={({ autoFocus, onDone }) => (
                    <Input
                      autoFocus={autoFocus}
                      size="small"
                      type="date"
                      value={document.expiredDate ?? ""}
                      onChange={(e) => saveField?.({ expiredDate: e.target.value })}
                      onBlur={onDone}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === "Escape") onDone();
                      }}
                      className="text-xs"
                    />
                  )}
                />
              </tr>

              {/* Hàng 5: Ngày áp dụng | Tình trạng hiệu lực */}
              <tr className="border-b border-slate-200">
                <TableCellEditor
                  label="Ngày áp dụng"
                  labelWidth="w-[18%]"
                  valueWidth="w-[30%]"
                  infoTooltip="Ngày văn bản bắt đầu có hiệu lực thi hành"
                  display={<span className="tabular-nums font-medium text-slate-900">{formatDateVi(document.effectiveDate)}</span>}
                  changed={isChanged("effectiveDate")}
                  editable={Boolean(saveField)}
                  editorRender={({ autoFocus, onDone }) => (
                    <Input
                      autoFocus={autoFocus}
                      size="small"
                      type="date"
                      value={document.effectiveDate}
                      onChange={(e) => saveField?.({ effectiveDate: e.target.value })}
                      onBlur={onDone}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === "Escape") onDone();
                      }}
                      className="text-xs"
                    />
                  )}
                />
                <TableCellEditor
                  label="Tình trạng hiệu lực"
                  labelWidth="w-[24%]"
                  valueWidth="w-[28%]"
                  infoTooltip="Tình trạng hiệu lực pháp lý hiện tại của văn bản"
                  display={
                    <span className={`inline-flex items-center gap-1.5 font-semibold ${statusInfo.textClass}`}>
                      <span className={`h-2.5 w-2.5 rounded-full ${statusInfo.dotClass}`} aria-hidden />
                      {statusInfo.label}
                    </span>
                  }
                  changed={isChanged("status")}
                  editable={Boolean(saveField)}
                  editorRender={({ autoFocus, onDone }) => (
                    <Select
                      autoFocus={autoFocus}
                      defaultOpen={autoFocus}
                      size="small"
                      className="w-full text-xs"
                      value={document.status}
                      options={STATUS_OPTIONS}
                      onChange={(val) => {
                        saveField?.({ status: val as LegalDocumentStatus });
                        onDone();
                      }}
                      onBlur={onDone}
                    />
                  )}
                />
              </tr>

              {/* Hàng 6: Lĩnh vực */}
              <tr>
                <TableCellEditor
                  label="Lĩnh vực"
                  labelWidth="w-[18%]"
                  valueWidth="w-[30%]"
                  display={
                    document.field ? (
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800 border border-slate-200/80">
                        {document.field}
                      </span>
                    ) : (
                      <span className="font-normal italic text-slate-400">Chưa có</span>
                    )
                  }
                  changed={isChanged("field")}
                  editable={Boolean(saveField)}
                  editorRender={({ autoFocus, onDone }) => (
                    <Select
                      autoFocus={autoFocus}
                      defaultOpen={autoFocus}
                      size="small"
                      className="w-full text-xs"
                      value={document.field ?? ""}
                      options={COMMON_FIELDS.map((f) => ({ value: f, label: f }))}
                      onChange={(val) => {
                        saveField?.({ field: val });
                        onDone();
                      }}
                      onBlur={onDone}
                    />
                  )}
                />
                <td colSpan={2} className="border border-slate-200 bg-slate-50/40" />
              </tr>
            </tbody>
          </table>
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

        {/* File đính kèm — có quyền sửa: thêm tệp */}
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
              <Tooltip title="Thêm tệp đính kèm">
                <button
                  type="button"
                  onClick={() => pickFile(NEW_FILE_TARGET)}
                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-slate-200/90 bg-white text-slate-500 shadow-2xs transition-colors hover:border-[#DC2626] hover:bg-red-50 hover:text-[#DC2626]"
                  aria-label="Thêm tệp đính kèm"
                >
                  <EditOutlined className="text-xs" />
                </button>
              </Tooltip>
            )}
          </div>

          {displayFiles.length > 0 ? (
            <div className="flex flex-col gap-2">
              {displayFiles.map((file) => {
                const isPreviewing = previewFileId === file.id;
                const isLatest = file.id === latestFileId;
                return (
                  <div
                    key={file.id}
                    className={`flex items-center justify-between gap-2 rounded-lg bg-white p-2.5 shadow-xs transition-colors ${
                      isLatest
                        ? "border-2 border-[#DC2626] bg-red-50/15 shadow-2xs"
                        : isPreviewing
                        ? "border border-[#DC2626]/40"
                        : "border border-slate-200 hover:border-slate-300"
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
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span
                            className="block truncate text-xs font-bold text-slate-800 hover:text-[#DC2626]"
                            title={file.name}
                          >
                            {file.name}
                          </span>
                          {isLatest && (
                            <span className="shrink-0 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-[#DC2626]">
                              Vừa thêm
                            </span>
                          )}
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

        {/* Thông tin ngày cập nhật cuối cùng, chuyển xuống mé bên phải ở cuối form */}
        <div className="flex items-center justify-between border-t border-slate-200/80 pt-2.5 text-xs text-slate-500">
          {isDirty ? (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
              Có {changes.length} thay đổi chưa lưu
            </span>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-1.5 font-medium text-slate-600 ml-auto">
            <ClockCircleOutlined className="text-slate-400" />
            <span>Ngày cập nhật cuối cùng:</span>
            <strong className="text-slate-800">
              {document.updatedAt ? formatDateVi(document.updatedAt) : "26/10/2026"}
            </strong>
          </div>
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
