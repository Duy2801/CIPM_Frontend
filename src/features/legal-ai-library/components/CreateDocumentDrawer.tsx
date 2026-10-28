"use client";

import { useMemo, useState } from "react";
import {
  BookOutlined,
  CalendarOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Input, Select, StandardFileUpload, STANDARD_DRAWER_WIDTH } from "@/components/ui";
import type { UploadedAttachment } from "@/components/ui/standard-file-upload";
import { normalizeSearchText } from "@/utils/search-text";
import {
  CATEGORY_DISPLAY_ORDER,
  COMMON_FIELDS,
  COMMON_ISSUERS,
  DEFAULT_ISSUER_BY_CATEGORY,
  STATUS_META,
  STATUS_ORDER,
  getCategoryLabel,
} from "../constants/legal-labels";
import { useCreateLegalDocument } from "../hooks/useLegalMutations";
import { useLegalDocuments } from "../hooks/useLegalQueries";
import type { BuiltInDocumentCategory, LegalDocument, LegalDocumentStatus } from "../types/legal-ai.types";
import { getCustomCategories } from "../utils/legal-document-filters";
import {
  buildLegalDocument,
  createEmptyLegalForm,
  validateLegalForm,
  type LegalDocumentFormValues,
} from "../utils/legal-document-form";
import { LegalFormField, LegalFormSection } from "./LegalFormSection";
import { SelectWithAddOption } from "@/components/workspace";

/** Loại văn bản chọn được khi thêm (biểu mẫu chuẩn không thêm ở đây) */
const CREATABLE_CATEGORIES = CATEGORY_DISPLAY_ORDER.filter((cat) => cat !== "TEMPLATE");
const DEFAULT_ISSUERS = new Set(Object.values(DEFAULT_ISSUER_BY_CATEGORY));

const STATUS_SELECT_OPTIONS = STATUS_ORDER.map((value) => ({
  value,
  label: (
    <div className="flex items-center gap-2">
      <span className={`inline-block h-2 w-2 rounded-full ${STATUS_META[value].dotClass}`} />
      <span>{STATUS_META[value].label}</span>
    </div>
  ),
}));

/** Lựa chọn không trùng tên (so sánh không phân biệt hoa/thường và dấu), bỏ tên trống */
function uniqueOptions(values: string[], toLabel: (value: string) => string = (v) => v) {
  const seen = new Set<string>();
  const options: { value: string; label: string }[] = [];
  for (const value of values) {
    const label = toLabel(value).trim();
    const key = normalizeSearchText(label);
    if (!label || seen.has(key)) continue;
    seen.add(key);
    options.push({ value: value.trim(), label });
  }
  return options;
}

const INPUT_CLASS = "w-full text-xs h-8";

interface CreateDocumentDrawerProps {
  onClose: () => void;
  /** Đã lưu văn bản vào thư viện */
  onCreated: (document: LegalDocument) => void;
}

/** Drawer "Thêm văn bản pháp luật": mỗi lần mở là một form trống */
export default function CreateDocumentDrawer({ onClose, onCreated }: CreateDocumentDrawerProps) {
  const { data: documents = [] } = useLegalDocuments();
  const createDocument = useCreateLegalDocument();

  const [values, setValues] = useState<LegalDocumentFormValues>(createEmptyLegalForm);
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  // Lựa chọn người dùng vừa tự thêm trong form
  const [addedCategories, setAddedCategories] = useState<string[]>([]);
  const [addedIssuers, setAddedIssuers] = useState<string[]>([]);
  const [addedFields, setAddedFields] = useState<string[]>([]);
  const [errorText, setErrorText] = useState("");

  const update = (patch: Partial<LegalDocumentFormValues>) => setValues((prev) => ({ ...prev, ...patch }));

  const categoryOptions = useMemo(
    () =>
      uniqueOptions(
        [...CREATABLE_CATEGORIES, ...getCustomCategories(documents), ...addedCategories, values.category],
        getCategoryLabel,
      ),
    [documents, addedCategories, values.category],
  );
  const issuerOptions = useMemo(
    () => uniqueOptions([...COMMON_ISSUERS, ...documents.map((doc) => doc.issuer), ...addedIssuers, values.issuer]),
    [documents, addedIssuers, values.issuer],
  );
  const fieldOptions = useMemo(() => uniqueOptions([...COMMON_FIELDS, ...addedFields]), [addedFields]);

  // Đổi loại văn bản: cơ quan ban hành đang trống / đang là gợi ý mặc định thì đổi theo loại mới
  const changeCategory = (category: string) => {
    const issuer = values.issuer.trim();
    update(
      !issuer || DEFAULT_ISSUERS.has(issuer)
        ? { category, issuer: DEFAULT_ISSUER_BY_CATEGORY[category as BuiltInDocumentCategory] ?? "" }
        : { category },
    );
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const error = validateLegalForm(values);
    setErrorText(error ?? "");
    if (error) return;

    const files = attachments.map((f) => ({
      id: f.id,
      name: f.name,
      size: f.size,
      type: f.type === "DOCX" ? ("DOCX" as const) : ("PDF" as const),
      rawFile: f.rawFile,
      url: f.url,
    }));
    const created = await createDocument.run(buildLegalDocument(values, files));
    if (created) onCreated(created);
  };

  return (
    <Drawer
      open
      onClose={onClose}
      width={STANDARD_DRAWER_WIDTH}
      title={
        <div className="py-1">
          <div className="flex items-center gap-2 text-base font-bold text-slate-800">
            <SafetyCertificateOutlined className="text-[#DC2626]" />
            Thêm văn bản pháp luật
          </div>
          <div className="mt-0.5 text-xs font-normal text-slate-500">
            Bổ sung luật, nghị định, thông tư, nghị quyết, quyết định vào thư viện tra cứu
          </div>
        </div>
      }
      footer={
        <div className="flex w-full items-center justify-start gap-2.5 py-2">
          <Button
            intent="primary"
            scale="sm"
            loading={createDocument.isPending}
            onClick={handleSubmit}
            className="!border-[#DC2626] !bg-[#DC2626] px-5 text-xs font-semibold !text-white shadow-sm hover:!bg-[#B91C1C]"
          >
            Lưu vào thư viện
          </Button>
          <Button intent="outline" scale="sm" onClick={onClose} className="px-4 text-xs font-medium">
            Đóng
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-slate-800">
        {errorText && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">{errorText}</div>
        )}

        {/* 1. Phân loại, số hiệu & cơ quan ban hành */}
        <LegalFormSection icon={<FileTextOutlined />} title="Thông tin định danh & Phân loại văn bản">
          <LegalFormField label="Tên văn bản / Trích yếu nội dung" required>
            <Input
              intent="clean"
              value={values.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="VD: Bộ luật Lao động năm 2019 về hoạt động lao động, tiền lương và chế độ nghỉ ngơi"
              className={INPUT_CLASS}
            />
          </LegalFormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <LegalFormField label="Loại văn bản" required>
              <SelectWithAddOption
                aria-label="Loại văn bản"
                value={values.category}
                options={categoryOptions}
                onChange={changeCategory}
                onAdd={(name) => {
                  setAddedCategories((prev) => [...prev, name]);
                  changeCategory(name);
                }}
                addPlaceholder="Nhập loại văn bản mới..."
              />
            </LegalFormField>
            <LegalFormField label="Số hiệu / Ký hiệu văn bản" required>
              <Input
                intent="clean"
                value={values.code}
                onChange={(e) => update({ code: e.target.value })}
                placeholder="VD: 45/2019/QH14"
                className={INPUT_CLASS}
              />
            </LegalFormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <LegalFormField label="Lĩnh vực áp dụng">
              <SelectWithAddOption
                aria-label="Lĩnh vực áp dụng"
                value={values.field}
                options={fieldOptions}
                onChange={(field) => update({ field })}
                onAdd={(name) => {
                  setAddedFields((prev) => [...prev, name]);
                  update({ field: name });
                }}
                addPlaceholder="Nhập lĩnh vực mới..."
              />
            </LegalFormField>
            <LegalFormField label="Cơ quan ban hành" required>
              <SelectWithAddOption
                aria-label="Cơ quan ban hành"
                placeholder="Chọn cơ quan ban hành..."
                value={values.issuer || undefined}
                options={issuerOptions}
                filterByQuery
                onChange={(issuer) => update({ issuer })}
                onAdd={(name) => {
                  setAddedIssuers((prev) => [...prev, name]);
                  update({ issuer: name });
                }}
                addPlaceholder="Tìm hoặc nhập cơ quan mới..."
                notFoundContent={<div className="py-1 text-xs text-slate-400">Chưa có cơ quan này trong danh sách.</div>}
              />
            </LegalFormField>
          </div>
        </LegalFormSection>

        {/* 2. Công báo & người ký */}
        <LegalFormSection icon={<BookOutlined />} title="Thông tin công báo & Người ký">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <LegalFormField label="Số công báo">
              <Input
                intent="clean"
                value={values.gazetteNumber}
                onChange={(e) => update({ gazetteNumber: e.target.value })}
                placeholder="VD: 993&994-12/2019"
                className={INPUT_CLASS}
              />
            </LegalFormField>
            <LegalFormField label="Ngày đăng công báo">
              <Input
                type="date"
                intent="clean"
                value={values.gazetteDate}
                onChange={(e) => update({ gazetteDate: e.target.value })}
                className={INPUT_CLASS}
              />
            </LegalFormField>
            <LegalFormField label="Người ký" className="sm:col-span-2">
              <Input
                intent="clean"
                value={values.signer}
                onChange={(e) => update({ signer: e.target.value })}
                placeholder="VD: Nguyễn Thị Kim Ngân"
                className={INPUT_CLASS}
              />
            </LegalFormField>
          </div>
        </LegalFormSection>

        {/* 3. Mốc thời gian & tình trạng hiệu lực */}
        <LegalFormSection icon={<CalendarOutlined />} title="Mốc thời gian & Tình trạng hiệu lực">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <LegalFormField label="Ngày ban hành">
              <Input
                type="date"
                intent="clean"
                value={values.issueDate}
                onChange={(e) => update({ issueDate: e.target.value })}
                className={INPUT_CLASS}
              />
            </LegalFormField>
            <LegalFormField label="Ngày áp dụng (có hiệu lực)">
              <Input
                type="date"
                intent="clean"
                value={values.effectiveDate}
                onChange={(e) => update({ effectiveDate: e.target.value })}
                className={INPUT_CLASS}
              />
            </LegalFormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <LegalFormField label="Ngày hết hiệu lực" hint="(để trống nếu chưa xác định)">
              <Input
                type="date"
                intent="clean"
                value={values.expiredDate}
                onChange={(e) => update({ expiredDate: e.target.value })}
                className={INPUT_CLASS}
              />
            </LegalFormField>
            <LegalFormField label="Tình trạng hiệu lực">
              <Select
                aria-label="Tình trạng hiệu lực"
                value={values.status}
                onChange={(status) => update({ status: status as LegalDocumentStatus })}
                className="w-full text-xs [&_.ant-select-selector]:!rounded-lg"
                options={STATUS_SELECT_OPTIONS}
              />
            </LegalFormField>
          </div>
        </LegalFormSection>

        {/* 4. Từ khóa tra cứu & tệp đính kèm */}
        <LegalFormSection icon={<TagOutlined />} title="Từ khóa tra cứu & Tệp tài liệu số hóa">
          <LegalFormField label="Từ khóa tra cứu (Tags - phân cách bằng dấu phẩy)">
            <Input
              intent="clean"
              value={values.tags}
              onChange={(e) => update({ tags: e.target.value })}
              placeholder="VD: Quản lý dự án, Đấu thầu, Nghiệm thu, Lao động, Ban QLDA"
              className={INPUT_CLASS}
            />
          </LegalFormField>
          <LegalFormField label="Đính kèm tệp văn bản số hóa (PDF, DOCX)">
            <StandardFileUpload value={attachments} onChange={setAttachments} accept=".pdf,.docx,.doc" />
          </LegalFormField>
        </LegalFormSection>
      </form>
    </Drawer>
  );
}
