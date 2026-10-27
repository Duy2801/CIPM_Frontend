"use client";

import { useMemo, type ReactNode } from "react";
import { SafetyCertificateOutlined } from "@ant-design/icons";
import { Input, Select } from "@/components/ui";
import { formatDateVi } from "@/utils/date";
import { COMMON_FIELDS, STATUS_META, STATUS_ORDER, getCategoryLabel } from "../constants/legal-labels";
import { useLegalDocuments } from "../hooks/useLegalQueries";
import type { LegalDocument, LegalDocumentStatus } from "../types/legal-ai.types";
import type { LegalDocumentField, LegalDocumentPatch } from "../utils/document-changes";
import { getCategoryKeys } from "../utils/legal-document-filters";
import DocumentInfoCell, { type CellEditorRender } from "./DocumentInfoCell";

const STATUS_OPTIONS = STATUS_ORDER.map((value) => ({ value, label: STATUS_META[value].label }));
const FIELD_OPTIONS = COMMON_FIELDS.map((f) => ({ value: f, label: f }));

/** Các trường nhập bằng ô chữ / ô ngày */
type TextField = "issuer" | "gazetteNumber" | "code" | "gazetteDate" | "signer" | "issueDate" | "expiredDate" | "effectiveDate";

const EMPTY = <span className="font-normal italic text-slate-400">Chưa có</span>;

interface DocumentInfoTableProps {
  document: LegalDocument;
  isChanged: (field: LegalDocumentField) => boolean;
  /** Ghi trường vừa sửa vào bản nháp; không truyền = chỉ xem */
  onChange?: (patch: LegalDocumentPatch) => void;
}

/** Bảng "Thông tin ban hành & hiệu lực": hai cặp ô mỗi hàng, bấm vào giá trị để sửa */
export default function DocumentInfoTable({ document, isChanged, onChange }: DocumentInfoTableProps) {
  const { data: documents = [] } = useLegalDocuments();
  const categoryOptions = useMemo(() => {
    const options = getCategoryKeys(documents).map((cat) => ({ value: cat, label: getCategoryLabel(cat) }));
    return options.some((o) => o.value === document.category)
      ? options
      : [...options, { value: document.category, label: getCategoryLabel(document.category) }];
  }, [documents, document.category]);

  // Ô chữ / ô ngày: gõ là ghi vào bản nháp, Enter / Esc / rời ô là xong
  const inputEditor = (
    field: TextField,
    opts: { placeholder?: string; type?: "date"; className?: string } = {},
  ): CellEditorRender => {
    const InputEditor: CellEditorRender = ({ autoFocus, onDone }) => (
      <Input
        autoFocus={autoFocus}
        size="small"
        type={opts.type}
        value={document[field] ?? ""}
        onChange={(e) => onChange?.({ [field]: e.target.value })}
        onBlur={onDone}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "Escape") onDone();
        }}
        placeholder={opts.placeholder}
        className={opts.className ?? "text-xs"}
      />
    );
    return InputEditor;
  };

  // Ô chọn: mở sẵn danh sách, chọn xong là xong
  const selectEditor = (
    value: string,
    options: { value: string; label: string }[],
    apply: (value: string) => void,
  ): CellEditorRender => {
    const SelectEditor: CellEditorRender = ({ autoFocus, onDone }) => (
      <Select
        autoFocus={autoFocus}
        defaultOpen={autoFocus}
        size="small"
        className="w-full text-xs"
        value={value}
        options={options}
        onChange={(val) => {
          apply(val);
          onDone();
        }}
        onBlur={onDone}
      />
    );
    return SelectEditor;
  };

  /** Chỉ trả về ô nhập khi được sửa */
  const editable = (editor: CellEditorRender) => (onChange ? editor : undefined);
  const dateText = (iso: string | undefined, empty: ReactNode = EMPTY) =>
    iso ? <span className="tabular-nums font-medium text-slate-900">{formatDateVi(iso)}</span> : empty;

  const statusInfo = STATUS_META[document.status];

  return (
    <>
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
              <DocumentInfoCell
                side="left"
                label="Cơ quan ban hành"
                display={<span className="font-medium text-slate-900">{document.issuer}</span>}
                changed={isChanged("issuer")}
                editor={editable(inputEditor("issuer", { placeholder: "VD: Quốc hội" }))}
              />
              <DocumentInfoCell
                side="right"
                label="Số công báo"
                infoTooltip="Số hiệu công báo đăng tải văn bản"
                display={
                  document.gazetteNumber ? (
                    <span className="tabular-nums font-medium text-slate-800">{document.gazetteNumber}</span>
                  ) : (
                    EMPTY
                  )
                }
                changed={isChanged("gazetteNumber")}
                editor={editable(inputEditor("gazetteNumber", { placeholder: "VD: 693&694/2014" }))}
              />
            </tr>

            {/* Hàng 2: Số hiệu | Ngày đăng công báo */}
            <tr className="border-b border-slate-200">
              <DocumentInfoCell
                side="left"
                label="Số hiệu"
                display={<span className="font-bold text-slate-900 tabular-nums">{document.code}</span>}
                changed={isChanged("code")}
                editor={editable(inputEditor("code", { placeholder: "VD: 50/2014/QH13", className: "text-xs font-semibold" }))}
              />
              <DocumentInfoCell
                side="right"
                label="Ngày đăng công báo"
                display={dateText(document.gazetteDate)}
                changed={isChanged("gazetteDate")}
                editor={editable(inputEditor("gazetteDate", { type: "date" }))}
              />
            </tr>

            {/* Hàng 3: Loại văn bản | Người ký */}
            <tr className="border-b border-slate-200">
              <DocumentInfoCell
                side="left"
                label="Loại văn bản"
                display={<span className="font-semibold text-slate-900">{getCategoryLabel(document.category)}</span>}
                changed={isChanged("category")}
                editor={editable(selectEditor(document.category, categoryOptions, (category) => onChange?.({ category })))}
              />
              <DocumentInfoCell
                side="right"
                label="Người ký"
                display={document.signer ? <span className="font-medium text-slate-900">{document.signer}</span> : EMPTY}
                changed={isChanged("signer")}
                editor={editable(inputEditor("signer", { placeholder: "VD: Nguyễn Sinh Hùng" }))}
              />
            </tr>

            {/* Hàng 4: Ngày ban hành | Ngày hết hiệu lực */}
            <tr className="border-b border-slate-200">
              <DocumentInfoCell
                side="left"
                label="Ngày ban hành"
                infoTooltip="Ngày cơ quan nhà nước có thẩm quyền ký ban hành văn bản"
                display={dateText(document.issueDate)}
                changed={isChanged("issueDate")}
                editor={editable(inputEditor("issueDate", { type: "date" }))}
              />
              <DocumentInfoCell
                side="right"
                label="Ngày hết hiệu lực"
                infoTooltip="Thời điểm văn bản chính thức chấm dứt hiệu lực thi hành"
                display={dateText(
                  document.expiredDate,
                  // Chưa có ngày: có quyền sửa thì hiện sẵn ô chọn ngày
                  onChange ? (
                    <Input
                      size="small"
                      type="date"
                      value=""
                      onChange={(e) => onChange({ expiredDate: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs h-7 w-full max-w-[150px]"
                    />
                  ) : (
                    <span className="font-normal italic text-slate-400">Chưa xác định</span>
                  ),
                )}
                changed={isChanged("expiredDate")}
                editor={editable(inputEditor("expiredDate", { type: "date" }))}
              />
            </tr>

            {/* Hàng 5: Ngày áp dụng | Tình trạng hiệu lực */}
            <tr className="border-b border-slate-200">
              <DocumentInfoCell
                side="left"
                label="Ngày áp dụng"
                infoTooltip="Ngày văn bản bắt đầu có hiệu lực thi hành"
                display={dateText(document.effectiveDate)}
                changed={isChanged("effectiveDate")}
                editor={editable(inputEditor("effectiveDate", { type: "date" }))}
              />
              <DocumentInfoCell
                side="right"
                label="Tình trạng hiệu lực"
                infoTooltip="Tình trạng hiệu lực pháp lý hiện tại của văn bản"
                display={
                  <span className={`inline-flex items-center gap-1.5 font-semibold ${statusInfo.textClass}`}>
                    <span className={`h-2.5 w-2.5 rounded-full ${statusInfo.dotClass}`} aria-hidden />
                    {statusInfo.label}
                  </span>
                }
                changed={isChanged("status")}
                editor={editable(
                  selectEditor(document.status, STATUS_OPTIONS, (status) =>
                    onChange?.({ status: status as LegalDocumentStatus }),
                  ),
                )}
              />
            </tr>

            {/* Hàng 6: Lĩnh vực */}
            <tr>
              <DocumentInfoCell
                side="left"
                label="Lĩnh vực"
                display={
                  document.field ? (
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800 border border-slate-200/80">
                      {document.field}
                    </span>
                  ) : (
                    EMPTY
                  )
                }
                changed={isChanged("field")}
                editor={editable(selectEditor(document.field ?? "", FIELD_OPTIONS, (field) => onChange?.({ field })))}
              />
              <td colSpan={2} className="border border-slate-200 bg-slate-50/40" />
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
